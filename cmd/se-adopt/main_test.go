package main

import (
	"bytes"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"

	artifactdriven "software-engineering/src/archs/artifact-driven"
	storydriven "software-engineering/src/archs/story-driven"
)

func TestCommandCopiesCompleteEmbeddedBundle(t *testing.T) {
	workspace := t.TempDir()
	var stdout, stderr bytes.Buffer
	if err := run([]string{"--project", workspace}, &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	err := fs.WalkDir(artifactdriven.Bundle, ".", func(name string, entry fs.DirEntry, err error) error {
		if err != nil || entry.IsDir() {
			return err
		}
		want, err := artifactdriven.Bundle.ReadFile(name)
		if err != nil {
			return err
		}
		got, err := os.ReadFile(filepath.Join(workspace, "docs/artifact-driven", filepath.FromSlash(name)))
		if err != nil {
			return err
		}
		if !bytes.Equal(got, want) {
			t.Errorf("bundle file differs: %s", name)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if stdout.Len() == 0 {
		t.Fatal("missing adoption result")
	}
}

func TestArchitectureSelectionAndListing(t *testing.T) {
	workspace := t.TempDir()
	var stdout, stderr bytes.Buffer
	if err := run([]string{"--list", "--project", filepath.Join(workspace, "missing")}, &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(stdout.String(), "artifact-driven") {
		t.Fatal("ADD missing from catalog")
	}
	if entries, err := os.ReadDir(workspace); err != nil || len(entries) != 0 {
		t.Fatalf("listing wrote files: %v, %v", entries, err)
	}
	if err := run([]string{"--arch", "unknown", "--project", workspace}, &stdout, &stderr); err == nil {
		t.Fatal("accepted unsupported architecture")
	}
	if entries, err := os.ReadDir(workspace); err != nil || len(entries) != 0 {
		t.Fatalf("unknown architecture wrote files: %v, %v", entries, err)
	}
	if err := run([]string{"--arch", "artifact-driven", "--project", workspace, "--output", "custom/add"}, &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(workspace, "custom/add/06-guidelines/working-with-ai.md")); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(workspace, "docs")); !os.IsNotExist(err) {
		t.Fatalf("custom output also created default: %v", err)
	}
	if err := run([]string{"--project", workspace, "--output", ""}, &stdout, &stderr); err == nil {
		t.Fatal("accepted explicit empty output")
	}
}

func TestCommandHelpAndInvalidArguments(t *testing.T) {
	var out, errOut bytes.Buffer
	if err := run([]string{"--help"}, &out, &errOut); err != nil {
		t.Fatal(err)
	}
	if errOut.Len() == 0 {
		t.Fatal("missing usage")
	}
	for _, args := range [][]string{{"unexpected"}, {"--unknown"}, {"--project", filepath.Join(t.TempDir(), "missing")}} {
		if err := run(args, &out, &errOut); err == nil {
			t.Errorf("accepted invalid args: %v", args)
		}
	}
}

func TestAdoptionIncludesRequiredUtilitySkills(t *testing.T) {
	workspace := t.TempDir()
	var out bytes.Buffer
	if err := run([]string{"--project", workspace}, &out, &out); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"kiss", "asd-ste-100"} {
		for _, file := range []string{"SKILL.md", "agents/openai.yaml"} {
			relative := name + "/" + file
			want, err := os.ReadFile(filepath.Join("../../src/utils/agents/skills", relative))
			if err != nil {
				t.Fatal(err)
			}
			got, err := os.ReadFile(filepath.Join(workspace, "docs/artifact-driven/required-skills", relative))
			if err != nil {
				t.Fatal(err)
			}
			if !bytes.Equal(got, want) {
				t.Errorf("required skill differs from canonical source: %s", relative)
			}
		}
	}
}

func TestStoryDrivenAdoptionContract(t *testing.T) {
	workspace := t.TempDir()
	var stdout, stderr bytes.Buffer
	if err := run([]string{"--list"}, &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(stdout.String(), "story-driven") {
		t.Fatal("story-driven missing from catalog")
	}
	args := []string{"--arch", "story-driven", "--project", workspace}
	if err := run(append(append([]string{}, args...), "--dry-run"), &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if entries, err := os.ReadDir(workspace); err != nil || len(entries) != 0 {
		t.Fatalf("dry run wrote files: %v, %v", entries, err)
	}
	if err := run(args, &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	destination := filepath.Join(workspace, "docs/story-driven")
	if err := fs.WalkDir(storydriven.Bundle, ".", func(name string, entry fs.DirEntry, err error) error {
		if err != nil || entry.IsDir() {
			return err
		}
		want, err := fs.ReadFile(storydriven.Bundle, name)
		if err != nil {
			return err
		}
		got, err := os.ReadFile(filepath.Join(destination, filepath.FromSlash(name)))
		if err != nil {
			return err
		}
		if !bytes.Equal(got, want) {
			t.Errorf("adoption changed %s", name)
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	stdout.Reset()
	if err := run(args, &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(stdout.String(), "0 new files") {
		t.Fatal("repeat adoption is not idempotent")
	}
	// A partially populated destination with a consumer edit must not be filled.
	conflictWorkspace := t.TempDir()
	conflictFile := filepath.Join(conflictWorkspace, "docs/story-driven/README.md")
	if err := os.MkdirAll(filepath.Dir(conflictFile), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(conflictFile, []byte("creator edits"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := run([]string{"--arch", "story-driven", "--project", conflictWorkspace}, &stdout, &stderr); err == nil {
		t.Fatal("conflict was accepted")
	}
	if got, err := os.ReadFile(conflictFile); err != nil || string(got) != "creator edits" {
		t.Fatalf("creator edit changed: %q, %v", got, err)
	}
	if entries, err := os.ReadDir(filepath.Dir(conflictFile)); err != nil || len(entries) != 1 {
		t.Fatalf("conflict wrote new bundle files: %v, %v", entries, err)
	}
	customWorkspace := t.TempDir()
	if err := run([]string{"--arch", "story-driven", "--project", customWorkspace, "--output", "guidance/story"}, &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(customWorkspace, "guidance/story/05-examples/narrative/novel.md")); err != nil {
		t.Fatal(err)
	}
	for _, unexpected := range []string{"docs", ".agents", "AGENTS.md"} {
		if _, err := os.Stat(filepath.Join(customWorkspace, unexpected)); !os.IsNotExist(err) {
			t.Errorf("adoption created %s: %v", unexpected, err)
		}
	}
}
