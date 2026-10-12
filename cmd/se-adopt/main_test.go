package main

import (
	"bytes"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"

	artifactdriven "software-engineering/src/archs/artifact-driven"
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
