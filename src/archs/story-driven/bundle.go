// Package storydriven supplies the self-contained story knowledge bundle.
package storydriven

import (
	"embed"
	"io"
	"io/fs"
	"sort"
	"strings"

	"software-engineering/src/utils/agents/skills"
)

//go:embed README.md 01-foundation 02-methodology 03-execution 04-templates 05-examples 06-adoption
var knowledge embed.FS

// Bundle mounts canonical utility skills inside the adopted story-driven directory.
// Skill sources remain in utils; no second maintained copy is required.
var Bundle bundleFS

type bundleFS struct{}

func (bundleFS) Open(name string) (fs.File, error) {
	if !fs.ValidPath(name) {
		return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrInvalid}
	}
	if name == "required-skills" {
		file, err := skills.Bundle.Open(".")
		if err != nil {
			return nil, err
		}
		return requiredSkillsFile{file}, nil
	}
	if strings.HasPrefix(name, "required-skills/") {
		return skills.Bundle.Open(strings.TrimPrefix(name, "required-skills/"))
	}
	file, err := knowledge.Open(name)
	if err != nil {
		return nil, err
	}
	if name == "." {
		return &rootFile{File: file}, nil
	}
	return file, nil
}

func (b bundleFS) ReadFile(name string) ([]byte, error) {
	file, err := b.Open(name)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	return io.ReadAll(file)
}

func (bundleFS) ReadDir(name string) ([]fs.DirEntry, error) {
	if !fs.ValidPath(name) {
		return nil, &fs.PathError{Op: "readdir", Path: name, Err: fs.ErrInvalid}
	}
	if name == "required-skills" {
		return skills.Bundle.ReadDir(".")
	}
	if strings.HasPrefix(name, "required-skills/") {
		return skills.Bundle.ReadDir(strings.TrimPrefix(name, "required-skills/"))
	}
	entries, err := knowledge.ReadDir(name)
	if err != nil || name != "." {
		return entries, err
	}
	info, err := fs.Stat(skills.Bundle, ".")
	if err != nil {
		return nil, err
	}
	entries = append(entries, fs.FileInfoToDirEntry(requiredSkillsInfo{info}))
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })
	return entries, nil
}

type requiredSkillsInfo struct{ fs.FileInfo }

func (requiredSkillsInfo) Name() string { return "required-skills" }

// Root directory reads include the mounted utility directory.
type rootFile struct {
	fs.File
	entries []fs.DirEntry
	offset  int
}

func (f *rootFile) ReadDir(n int) ([]fs.DirEntry, error) {
	if f.entries == nil {
		entries, err := Bundle.ReadDir(".")
		if err != nil {
			return nil, err
		}
		f.entries = entries
	}
	if n > 0 && f.offset >= len(f.entries) {
		return nil, io.EOF
	}
	end := len(f.entries)
	if n > 0 && f.offset+n < end {
		end = f.offset + n
	}
	entries := f.entries[f.offset:end]
	f.offset = end
	return entries, nil
}

type requiredSkillsFile struct{ fs.File }

func (f requiredSkillsFile) Stat() (fs.FileInfo, error) {
	info, err := f.File.Stat()
	if err != nil {
		return nil, err
	}
	return requiredSkillsInfo{info}, nil
}

func (f requiredSkillsFile) ReadDir(n int) ([]fs.DirEntry, error) {
	return f.File.(fs.ReadDirFile).ReadDir(n)
}
