package artifactdriven

import (
	"bytes"
	"fmt"
	"io/fs"
	"os"
	"testing"
	"testing/fstest"
)

func TestBundleFilesystem(t *testing.T) {
	if err := fstest.TestFS(Bundle, "README.md", "required-skills/kiss/SKILL.md", "required-skills/asd-ste-100/SKILL.md"); err != nil {
		t.Fatal(err)
	}
}

// The adopted and published bundle must preserve the canonical method, including
// new guidance pages and their relative links, rather than omit them from embed.
func TestCanonicalBundleFidelity(t *testing.T) {
	canonical := os.DirFS("../../../docs/artifact-driven")
	err := fs.WalkDir(canonical, ".", func(name string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() {
			return nil
		}
		want, err := fs.ReadFile(canonical, name)
		if err != nil {
			return err
		}
		got, err := fs.ReadFile(Bundle, name)
		if err != nil {
			return fmt.Errorf("missing delivered file %s: %w", name, err)
		}
		if !bytes.Equal(got, want) {
			return fmt.Errorf("delivered file differs from canonical knowledge: %s", name)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
