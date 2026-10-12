package adopt

import (
	"io/fs"
	"os"
	"path/filepath"
	"testing"
	"testing/fstest"
)

const DefaultOutput = "docs/artifact-driven"

func fixture() fs.FS {
	return fstest.MapFS{
		"README.md":              {Data: []byte("overview")},
		"03-execution/SKILL.md":  {Data: []byte("skill")},
		"04-patterns/pattern.md": {Data: []byte("pattern")},
	}
}

func TestCopyAndRepeat(t *testing.T) {
	workspace := t.TempDir()
	result, err := Copy(fixture(), workspace, DefaultOutput, false)
	if err != nil || result.Created != 3 || result.Unchanged != 0 {
		t.Fatalf("first copy: %+v, %v", result, err)
	}
	if got, err := os.ReadFile(filepath.Join(result.Destination, "03-execution/SKILL.md")); err != nil || string(got) != "skill" {
		t.Fatalf("nested asset: %q, %v", got, err)
	}
	result, err = Copy(fixture(), workspace, DefaultOutput, false)
	if err != nil || result.Created != 0 || result.Unchanged != 3 {
		t.Fatalf("repeat: %+v, %v", result, err)
	}
}

func TestConflictPreflightPreservesConsumer(t *testing.T) {
	workspace := t.TempDir()
	dest := filepath.Join(workspace, DefaultOutput)
	if err := os.MkdirAll(dest, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dest, "README.md"), []byte("consumer edits"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Copy(fixture(), workspace, DefaultOutput, false); err == nil {
		t.Fatal("expected conflict")
	}
	got, err := os.ReadFile(filepath.Join(dest, "README.md"))
	if err != nil || string(got) != "consumer edits" {
		t.Fatalf("consumer edits lost: %q, %v", got, err)
	}
	if _, err := os.Stat(filepath.Join(dest, "03-execution")); !os.IsNotExist(err) {
		t.Fatalf("preflight wrote files: %v", err)
	}
}

func TestDryRunAndCustomOutput(t *testing.T) {
	workspace := t.TempDir()
	result, err := Copy(fixture(), workspace, "custom/add", true)
	if err != nil || result.Created != 3 {
		t.Fatalf("preview: %+v, %v", result, err)
	}
	entries, err := os.ReadDir(workspace)
	if err != nil || len(entries) != 0 {
		t.Fatalf("dry run wrote entries: %v, %v", entries, err)
	}
	if _, err := Copy(fixture(), workspace, "custom/add", false); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(workspace, "custom/add/README.md")); err != nil {
		t.Fatal(err)
	}
}

func TestRejectEscapesAndSymlinks(t *testing.T) {
	workspace := t.TempDir()
	for _, output := range []string{"", ".", "../outside", filepath.Join(t.TempDir(), "absolute")} {
		if _, err := Copy(fixture(), workspace, output, false); err == nil {
			t.Errorf("accepted output %q", output)
		}
	}
	if err := os.Symlink(t.TempDir(), filepath.Join(workspace, "docs")); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	if _, err := Copy(fixture(), workspace, DefaultOutput, false); err == nil {
		t.Fatal("accepted symlink destination")
	}
}

func TestRejectFileAsParentAndDirectoryAsFile(t *testing.T) {
	for _, conflict := range []string{"docs", filepath.Join(DefaultOutput, "README.md")} {
		t.Run(conflict, func(t *testing.T) {
			workspace := t.TempDir()
			if conflict == "docs" {
				if err := os.WriteFile(filepath.Join(workspace, conflict), []byte("existing"), 0o644); err != nil {
					t.Fatal(err)
				}
			} else if err := os.MkdirAll(filepath.Join(workspace, conflict), 0o755); err != nil {
				t.Fatal(err)
			}
			if _, err := Copy(fixture(), workspace, DefaultOutput, false); err == nil {
				t.Fatal("accepted conflicting file type")
			}
		})
	}
}

func TestAddMissingFilePreservesUnrelatedFiles(t *testing.T) {
	workspace := t.TempDir()
	result, err := Copy(fixture(), workspace, DefaultOutput, false)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Remove(filepath.Join(result.Destination, "README.md")); err != nil {
		t.Fatal(err)
	}
	unrelated := filepath.Join(result.Destination, "notes.md")
	if err := os.WriteFile(unrelated, []byte("notes"), 0o644); err != nil {
		t.Fatal(err)
	}
	result, err = Copy(fixture(), workspace, DefaultOutput, false)
	if err != nil || result.Created != 1 || result.Unchanged != 2 {
		t.Fatalf("fill missing: %+v, %v", result, err)
	}
	if data, err := os.ReadFile(unrelated); err != nil || string(data) != "notes" {
		t.Fatalf("unrelated file changed: %q, %v", data, err)
	}
}
