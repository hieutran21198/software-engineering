package artifactdriven

import (
	"testing"
	"testing/fstest"
)

func TestBundleFilesystem(t *testing.T) {
	if err := fstest.TestFS(Bundle, "README.md", "required-skills/kiss/SKILL.md", "required-skills/asd-ste-100/SKILL.md"); err != nil {
		t.Fatal(err)
	}
}
