package adopt

import (
	"errors"
	"fmt"
	"io/fs"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
	"testing/fstest"

	artifactdriven "software-engineering/docs/artifact-driven"
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

func TestAdoptFullBundlePreservesKnowledge(t *testing.T) {
	workspace := t.TempDir()
	result, err := Copy(artifactdriven.Bundle, workspace, DefaultOutput, false)
	if err != nil {
		t.Fatal(err)
	}
	err = fs.WalkDir(artifactdriven.Bundle, ".", func(name string, entry fs.DirEntry, err error) error {
		if err != nil || entry.IsDir() {
			return err
		}
		want, err := fs.ReadFile(artifactdriven.Bundle, name)
		if err != nil {
			return err
		}
		got, err := os.ReadFile(filepath.Join(result.Destination, filepath.FromSlash(name)))
		if err != nil {
			return err
		}
		if string(got) != string(want) {
			t.Errorf("adoption changed knowledge: %s", name)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	// Grouping is project knowledge, never a generated artifact or state store.
	if _, err := os.Stat(filepath.Join(workspace, "docs/artifacts")); !os.IsNotExist(err) {
		t.Fatalf("adoption created project knowledge: %v", err)
	}
}

func writeFile(t testing.TB, name, data string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(name), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(name, []byte(data), 0o644); err != nil {
		t.Fatal(err)
	}
}

// snapshot records every workspace entry so tests can prove nothing changed.
func snapshot(t testing.TB, dir string) map[string]string {
	t.Helper()
	entries := map[string]string{}
	err := filepath.WalkDir(dir, func(name string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		relative, _ := filepath.Rel(dir, name)
		switch {
		case entry.Type()&fs.ModeSymlink != 0:
			target, err := os.Readlink(name)
			entries[relative] = "link:" + target
			return err
		case entry.IsDir():
			entries[relative] = "dir"
		default:
			data, err := os.ReadFile(name)
			entries[relative] = "file:" + string(data)
			return err
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	return entries
}

func codesAndPaths(diagnostics []Diagnostic) []string {
	var got []string
	for _, diagnostic := range diagnostics {
		got = append(got, diagnostic.Code+" "+diagnostic.Path)
	}
	return got
}

func TestPreflightReportsAllConflictsDeterministically(t *testing.T) {
	bundle := fstest.MapFS{
		"a.md": {Data: []byte("bundle a")},
		"b.md": {Data: []byte("bundle b")},
		"c.md": {Data: []byte("same")},
		"d.md": {Data: []byte("missing")},
	}
	workspace := t.TempDir()
	dest := filepath.Join(workspace, DefaultOutput)
	writeFile(t, filepath.Join(dest, "b.md"), "consumer edits b")
	writeFile(t, filepath.Join(dest, "a.md"), "consumer edits a")
	writeFile(t, filepath.Join(dest, "c.md"), "same")
	before := snapshot(t, workspace)

	var first []Diagnostic
	for attempt := range 2 {
		result, err := Copy(bundle, workspace, DefaultOutput, false)
		var conflicts *ConflictError
		if !errors.As(err, &conflicts) || !result.Complete || result.Created != 0 || result.Unchanged != 1 {
			t.Fatalf("attempt %d: %+v, %v", attempt, result, err)
		}
		want := []string{"content-conflict docs/artifact-driven/a.md", "content-conflict docs/artifact-driven/b.md"}
		if got := codesAndPaths(result.Diagnostics); !slices.Equal(got, want) {
			t.Fatalf("diagnostics: %v", got)
		}
		if !slices.Equal(conflicts.Diagnostics, result.Diagnostics) {
			t.Fatal("error and result disagree")
		}
		for _, diagnostic := range result.Diagnostics {
			if diagnostic.Message == "" || diagnostic.Action == "" || strings.Contains(diagnostic.Message+diagnostic.Action, "consumer edits") {
				t.Fatalf("diagnostic lacks text or exposes contents: %+v", diagnostic)
			}
		}
		if first != nil && !slices.Equal(first, result.Diagnostics) {
			t.Fatal("repeated preflight changed diagnostics")
		}
		first = result.Diagnostics
	}
	if after := snapshot(t, workspace); !maps.Equal(before, after) {
		t.Fatalf("preflight changed the workspace: %v", after)
	}
}

func TestPreflightCombinesTypeConflictsAndBlockedParents(t *testing.T) {
	bundle := fstest.MapFS{
		"README.md":         {Data: []byte("overview")},
		"guide/one.md":      {Data: []byte("one")},
		"guide/two.md":      {Data: []byte("two")},
		"guide/deep/x.md":   {Data: []byte("x")},
		"patterns/p.md":     {Data: []byte("pattern")},
		"skills/a/SKILL.md": {Data: []byte("skill")},
	}
	workspace := t.TempDir()
	dest := filepath.Join(workspace, DefaultOutput)
	writeFile(t, filepath.Join(dest, "README.md"), "consumer")
	writeFile(t, filepath.Join(dest, "guide"), "a file where a directory belongs")
	if err := os.MkdirAll(filepath.Join(dest, "patterns/p.md"), 0o755); err != nil {
		t.Fatal(err)
	}
	before := snapshot(t, workspace)
	result, err := Copy(bundle, workspace, DefaultOutput, true)
	var conflicts *ConflictError
	if !errors.As(err, &conflicts) || !result.Complete {
		t.Fatalf("%+v, %v", result, err)
	}
	want := []string{
		"content-conflict docs/artifact-driven/README.md",
		"parent-type docs/artifact-driven/guide",
		"destination-type docs/artifact-driven/patterns/p.md",
	}
	if got := codesAndPaths(result.Diagnostics); !slices.Equal(got, want) {
		t.Fatalf("diagnostics: %v", got)
	}
	if after := snapshot(t, workspace); !maps.Equal(before, after) {
		t.Fatalf("preflight changed the workspace: %v", after)
	}
}

func TestPreflightDoesNotFollowSymlinks(t *testing.T) {
	bundle := fstest.MapFS{
		"README.md":    {Data: []byte("overview")},
		"guide/one.md": {Data: []byte("one")},
	}
	workspace, outside := t.TempDir(), t.TempDir()
	writeFile(t, filepath.Join(outside, "one.md"), "outside edits")
	writeFile(t, filepath.Join(outside, "README.md"), "overview")
	dest := filepath.Join(workspace, DefaultOutput)
	if err := os.MkdirAll(dest, 0o755); err != nil {
		t.Fatal(err)
	}
	// Identical content behind a symlink is still a type conflict.
	if err := os.Symlink(filepath.Join(outside, "README.md"), filepath.Join(dest, "README.md")); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	if err := os.Symlink(outside, filepath.Join(dest, "guide")); err != nil {
		t.Fatal(err)
	}
	before, outsideBefore := snapshot(t, workspace), snapshot(t, outside)
	result, err := Copy(bundle, workspace, DefaultOutput, false)
	want := []string{"destination-type docs/artifact-driven/README.md", "parent-type docs/artifact-driven/guide"}
	if got := codesAndPaths(result.Diagnostics); err == nil || !slices.Equal(got, want) {
		t.Fatalf("diagnostics: %v, %v", got, err)
	}
	if !maps.Equal(before, snapshot(t, workspace)) || !maps.Equal(outsideBefore, snapshot(t, outside)) {
		t.Fatal("preflight changed files or followed a symlink")
	}
}

// failingFS makes one bundle file unreadable.
type failingFS struct {
	fs.FS
	name string
}

func (f failingFS) Open(name string) (fs.File, error) {
	if name == f.name {
		return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrPermission}
	}
	return f.FS.Open(name)
}

func TestFatalPreflightErrorsKeepCollectedDiagnostics(t *testing.T) {
	base := fstest.MapFS{
		"a.md": {Data: []byte("bundle a")},
		"b.md": {Data: []byte("missing b")},
		"c.md": {Data: []byte("c")},
	}
	invalid := fstest.MapFS{"z.md": {Data: []byte("target"), Mode: fs.ModeSymlink}}
	for name, entry := range base {
		invalid[name] = entry
	}
	cases := map[string]fs.FS{
		"invalid bundle entry":    invalid,
		"unreadable bundle input": failingFS{base, "c.md"},
	}
	for name, bundle := range cases {
		t.Run(name, func(t *testing.T) {
			workspace := t.TempDir()
			writeFile(t, filepath.Join(workspace, DefaultOutput, "a.md"), "consumer a")
			before := snapshot(t, workspace)
			result, err := Copy(bundle, workspace, DefaultOutput, false)
			var conflicts *ConflictError
			if err == nil || errors.As(err, &conflicts) || result.Complete || result.Created != 0 {
				t.Fatalf("want fatal incomplete inventory: %+v, %v", result, err)
			}
			if got := codesAndPaths(result.Diagnostics); !slices.Equal(got, []string{"content-conflict docs/artifact-driven/a.md"}) {
				t.Fatalf("collected diagnostics: %v", got)
			}
			if !maps.Equal(before, snapshot(t, workspace)) {
				t.Fatal("fatal preflight wrote files")
			}
		})
	}
	t.Run("unreadable destination", func(t *testing.T) {
		if os.Geteuid() == 0 {
			t.Skip("permissions are not enforced for root")
		}
		workspace := t.TempDir()
		blocked := filepath.Join(workspace, DefaultOutput, "c.md")
		writeFile(t, filepath.Join(workspace, DefaultOutput, "a.md"), "consumer a")
		writeFile(t, blocked, "consumer c")
		if err := os.Chmod(blocked, 0); err != nil {
			t.Fatal(err)
		}
		defer os.Chmod(blocked, 0o644)
		result, err := Copy(base, workspace, DefaultOutput, false)
		if err == nil || result.Complete || len(result.Diagnostics) != 1 {
			t.Fatalf("want fatal incomplete inventory: %+v, %v", result, err)
		}
		if _, err := os.Lstat(filepath.Join(workspace, DefaultOutput, "b.md")); !os.IsNotExist(err) {
			t.Fatalf("fatal preflight created a file: %v", err)
		}
	})
}

// conflictWorkspace creates n differing destination files for an n-file bundle.
func conflictWorkspace(t testing.TB, n int) (fs.FS, string) {
	bundle := fstest.MapFS{}
	workspace := t.TempDir()
	for i := range n {
		name := fmt.Sprintf("section-%03d/file.md", i)
		bundle[name] = &fstest.MapFile{Data: []byte("bundle")}
		writeFile(t, filepath.Join(workspace, DefaultOutput, filepath.FromSlash(name)), "consumer")
	}
	bundle["README.md"] = &fstest.MapFile{Data: []byte("overview")}
	return bundle, workspace
}

// attempts counts runs until adoption succeeds when each run repairs the
// first `repairs` reported conflicts. One repair per run models the earlier
// first-conflict behavior.
func attempts(t *testing.T, n, repairs int) int {
	bundle, workspace := conflictWorkspace(t, n)
	for count := 1; ; count++ {
		result, err := Copy(bundle, workspace, DefaultOutput, false)
		if err == nil {
			return count
		}
		if len(result.Diagnostics) == 0 || count > n+1 {
			t.Fatalf("no progress: %+v, %v", result, err)
		}
		for _, diagnostic := range result.Diagnostics[:min(repairs, len(result.Diagnostics))] {
			if err := os.Remove(filepath.Join(workspace, filepath.FromSlash(diagnostic.Path))); err != nil {
				t.Fatal(err)
			}
		}
	}
}

func TestOneInventoryReportsIndependentConflicts(t *testing.T) {
	for _, n := range []int{1, 10, 100} {
		bundle, workspace := conflictWorkspace(t, n)
		result, err := Copy(bundle, workspace, DefaultOutput, true)
		if err == nil || len(result.Diagnostics) != n || !result.Complete {
			t.Fatalf("n=%d: %d diagnostics, %v", n, len(result.Diagnostics), err)
		}
		aggregate, firstConflict := attempts(t, n, n), attempts(t, n, 1)
		if aggregate != 2 || firstConflict != n+1 {
			t.Fatalf("n=%d: aggregate %d, first-conflict %d attempts", n, aggregate, firstConflict)
		}
		t.Logf("n=%d conflicts: aggregate discovery needs %d runs, first-conflict discovery needs %d", n, aggregate, firstConflict)
	}
}

func BenchmarkPreflightConflicts(b *testing.B) {
	for _, n := range []int{1, 10, 100} {
		b.Run(fmt.Sprintf("conflicts=%d", n), func(b *testing.B) {
			bundle, workspace := conflictWorkspace(b, n)
			b.ReportAllocs()
			for b.Loop() {
				result, err := Copy(bundle, workspace, DefaultOutput, true)
				if err == nil || len(result.Diagnostics) != n {
					b.Fatalf("%d diagnostics, %v", len(result.Diagnostics), err)
				}
			}
		})
	}
}

func TestWriteFailureIsMarkedAfterPreflight(t *testing.T) {
	if os.Geteuid() == 0 {
		t.Skip("permissions are not enforced for root")
	}
	workspace := t.TempDir()
	dest := filepath.Join(workspace, DefaultOutput)
	if err := os.MkdirAll(dest, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(dest, 0o555); err != nil {
		t.Fatal(err)
	}
	defer os.Chmod(dest, 0o755)
	result, err := Copy(fixture(), workspace, DefaultOutput, false)
	if !errors.Is(err, ErrWrite) || !result.Complete || len(result.Diagnostics) != 0 {
		t.Fatalf("want marked write failure: %+v, %v", result, err)
	}
	if entries, err := os.ReadDir(dest); err != nil || len(entries) != 0 {
		t.Fatalf("write failure left files: %v, %v", entries, err)
	}
}

// The release may add the validator to tools/; adoption copies it when present
// and succeeds without it.
func TestAdoptOptionalValidator(t *testing.T) {
	for _, withValidator := range []bool{false, true} {
		bundle := fstest.MapFS{
			"README.md":       {Data: []byte("overview")},
			"tools/README.md": {Data: []byte("tools")},
		}
		if withValidator {
			bundle["tools/add-validate.mjs"] = &fstest.MapFile{Data: []byte("export {}")}
		}
		workspace := t.TempDir()
		result, err := Copy(bundle, workspace, DefaultOutput, false)
		if err != nil || result.Created != len(bundle) {
			t.Fatalf("validator %v: %+v, %v", withValidator, result, err)
		}
		_, err = os.Stat(filepath.Join(result.Destination, "tools/add-validate.mjs"))
		if (err == nil) != withValidator {
			t.Fatalf("validator %v: copied file state %v", withValidator, err)
		}
	}
}
