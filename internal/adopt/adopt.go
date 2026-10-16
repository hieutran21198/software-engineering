// Package adopt copies knowledge assets without replacing consumer changes.
package adopt

import (
	"bytes"
	"cmp"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

// Diagnostic codes for destination conflicts found by the preflight.
const (
	ContentConflict = "content-conflict"
	DestinationType = "destination-type"
	ParentType      = "parent-type"
)

// ErrWrite marks a failure after a successful preflight. Files created by the
// call are removed where possible; created directories can remain.
var ErrWrite = errors.New("write failed after preflight")

type Result struct {
	Destination string
	Created     int
	Unchanged   int
	// Diagnostics lists destination conflicts sorted by path, then code.
	Diagnostics []Diagnostic
	// Complete is true when the preflight inspected every bundle destination.
	Complete bool
}

// Diagnostic describes one destination conflict. Path is workspace-relative
// with forward slashes. Consumer file contents are never included.
type Diagnostic struct {
	Code    string `json:"code"`
	Path    string `json:"path"`
	Message string `json:"message"`
	Action  string `json:"action"`
}

// ConflictError reports all conflicts of one complete preflight. No files are
// written when Copy returns it.
type ConflictError struct {
	Diagnostics []Diagnostic
}

func (e *ConflictError) Error() string {
	if len(e.Diagnostics) == 1 {
		return fmt.Sprintf("destination conflict at %s; no files were written", e.Diagnostics[0].Path)
	}
	return fmt.Sprintf("%d destination conflicts; no files were written", len(e.Diagnostics))
}

type asset struct {
	name string
	data []byte
}

// Copy checks all destination paths before writing. Existing identical files
// are retained; conflicts abort adoption after every independent destination
// is checked. Output must stay inside project.
func Copy(bundle fs.FS, project, output string, dryRun bool) (Result, error) {
	var result Result
	if strings.TrimSpace(output) == "" || !filepath.IsLocal(output) || filepath.Clean(output) == "." {
		return result, fmt.Errorf("output must be a relative directory inside the workspace")
	}
	output = filepath.Clean(output)
	projectPath, err := filepath.Abs(project)
	if err != nil {
		return result, err
	}
	root, err := os.OpenRoot(projectPath)
	if err != nil {
		return result, fmt.Errorf("open consumer workspace: %w", err)
	}
	defer root.Close()
	result.Destination = filepath.Join(projectPath, output)

	check := preflight{root: root, parents: map[string]parentState{}}
	var pending []asset
	err = fs.WalkDir(bundle, ".", func(name string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() {
			return nil
		}
		if !entry.Type().IsRegular() || !fs.ValidPath(name) {
			return fmt.Errorf("unsupported bundle entry: %s", name)
		}
		data, err := fs.ReadFile(bundle, name)
		if err != nil {
			return err
		}
		destination := filepath.Join(output, filepath.FromSlash(name))
		blocked, err := check.blockedParent(destination)
		if err != nil || blocked {
			return err
		}
		info, err := root.Lstat(destination)
		if errors.Is(err, fs.ErrNotExist) {
			pending = append(pending, asset{destination, data})
			return nil
		}
		if err != nil {
			return err
		}
		if !info.Mode().IsRegular() {
			check.add(DestinationType, destination)
			return nil
		}
		existing, err := root.ReadFile(destination)
		if err != nil {
			return err
		}
		if !bytes.Equal(existing, data) {
			check.add(ContentConflict, destination)
			return nil
		}
		result.Unchanged++
		return nil
	})
	result.Diagnostics = check.sorted()
	if err != nil {
		// Collected diagnostics are returned, but the inventory is incomplete.
		return result, err
	}
	result.Complete = true
	if len(result.Diagnostics) > 0 {
		return result, &ConflictError{Diagnostics: result.Diagnostics}
	}
	if len(pending)+result.Unchanged == 0 {
		return result, fmt.Errorf("knowledge bundle is empty")
	}
	result.Created = len(pending)
	if dryRun {
		return result, nil
	}

	var created []string
	fail := func(err error) (Result, error) {
		for _, name := range created {
			_ = root.Remove(name)
		}
		return result, fmt.Errorf("%w: %w", ErrWrite, err)
	}
	for _, file := range pending {
		if err := root.MkdirAll(filepath.Dir(file.name), 0o755); err != nil {
			return fail(err)
		}
		// Exclusive creation also protects files appearing after the preflight.
		f, err := root.OpenFile(file.name, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
		if err != nil {
			return fail(err)
		}
		created = append(created, file.name)
		_, writeErr := f.Write(file.data)
		closeErr := f.Close()
		if err := errors.Join(writeErr, closeErr); err != nil {
			return fail(err)
		}
	}
	return result, nil
}

type parentState int

const (
	parentDirectory parentState = iota
	parentMissing
	parentBlocked
)

// preflight collects conflicts and remembers inspected parent directories.
type preflight struct {
	root        *os.Root
	parents     map[string]parentState
	diagnostics []Diagnostic
}

// blockedParent inspects parents from the workspace root down. It stops at the
// first missing or non-directory entry, so it never resolves a path through a
// file or symlink. A blocked parent is reported once per preflight.
func (p *preflight) blockedParent(name string) (bool, error) {
	parent := ""
	for _, part := range strings.Split(filepath.Dir(name), string(filepath.Separator)) {
		parent = filepath.Join(parent, part)
		state, seen := p.parents[parent]
		if !seen {
			info, err := p.root.Lstat(parent)
			switch {
			case errors.Is(err, fs.ErrNotExist):
				state = parentMissing
			case err != nil:
				return false, err
			case info.IsDir():
				state = parentDirectory
			default:
				state = parentBlocked
				p.add(ParentType, parent)
			}
			p.parents[parent] = state
		}
		switch state {
		case parentMissing:
			return false, nil
		case parentBlocked:
			return true, nil
		}
	}
	return false, nil
}

func (p *preflight) add(code, name string) {
	diagnostic := Diagnostic{Code: code, Path: filepath.ToSlash(name)}
	switch code {
	case ContentConflict:
		diagnostic.Message = "existing file differs from the bundle"
		diagnostic.Action = "choose another output directory, or reconcile the file manually and run again"
	case DestinationType:
		diagnostic.Message = "destination exists but is not a regular file (symlinks are not followed)"
		diagnostic.Action = "move the existing entry or choose another output directory"
	case ParentType:
		diagnostic.Message = "destination parent exists but is not a directory (symlinks are not followed)"
		diagnostic.Action = "move the existing entry or choose another output directory"
	}
	p.diagnostics = append(p.diagnostics, diagnostic)
}

func (p *preflight) sorted() []Diagnostic {
	slices.SortFunc(p.diagnostics, func(a, b Diagnostic) int {
		return cmp.Or(strings.Compare(a.Path, b.Path), strings.Compare(a.Code, b.Code))
	})
	return p.diagnostics
}
