// Package adopt copies knowledge assets without replacing consumer changes.
package adopt

import (
	"bytes"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

type Result struct {
	Destination string
	Created     int
	Unchanged   int
}

type asset struct {
	name string
	data []byte
}

// Copy checks all destination paths before writing. Existing identical files
// are retained; conflicts abort adoption. Output must stay inside project.
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
		if err := checkParents(root, destination); err != nil {
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
			return fmt.Errorf("destination is not a regular file: %s", destination)
		}
		existing, err := root.ReadFile(destination)
		if err != nil {
			return err
		}
		if !bytes.Equal(existing, data) {
			return fmt.Errorf("existing file differs: %s; choose another output directory or reconcile it manually", destination)
		}
		result.Unchanged++
		return nil
	})
	if err != nil {
		return result, err
	}
	if len(pending)+result.Unchanged == 0 {
		return result, fmt.Errorf("knowledge bundle is empty")
	}
	result.Created = len(pending)
	if dryRun {
		return result, nil
	}

	var created []string
	rollback := func() {
		for _, name := range created {
			_ = root.Remove(name)
		}
	}
	for _, file := range pending {
		if err := root.MkdirAll(filepath.Dir(file.name), 0o755); err != nil {
			rollback()
			return result, err
		}
		// Exclusive creation also protects files appearing after the preflight.
		f, err := root.OpenFile(file.name, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
		if err != nil {
			rollback()
			return result, err
		}
		created = append(created, file.name)
		_, writeErr := f.Write(file.data)
		closeErr := f.Close()
		if err := errors.Join(writeErr, closeErr); err != nil {
			rollback()
			return result, err
		}
	}
	return result, nil
}

func checkParents(root *os.Root, name string) error {
	for parent := filepath.Dir(name); parent != "."; parent = filepath.Dir(parent) {
		info, err := root.Lstat(parent)
		if errors.Is(err, fs.ErrNotExist) {
			continue
		}
		if err != nil {
			return err
		}
		if !info.IsDir() {
			return fmt.Errorf("destination parent is not a directory (symlinks are not followed): %s", parent)
		}
	}
	return nil
}
