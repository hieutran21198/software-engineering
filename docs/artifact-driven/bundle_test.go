package artifactdriven

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path"
	"regexp"
	"strings"
	"testing"
	"testing/fstest"
)

func TestBundleFilesystem(t *testing.T) {
	if err := fstest.TestFS(Bundle, "README.md", "required-skills/kiss/SKILL.md", "required-skills/asd-ste-100/SKILL.md"); err != nil {
		t.Fatal(err)
	}
}

// Exercise the copyable files as a small repository. The scaffold's front
// matter uses the JSON subset of YAML so the bundle test needs no new runtime
// or YAML dependency. Consumers may use the usual YAML syntax.
func TestMinimalChangeScaffold(t *testing.T) {
	guide, err := fs.ReadFile(Bundle, "06-guidelines/minimal-change.md")
	if err != nil {
		t.Fatal(err)
	}
	blocks := regexp.MustCompile(`(?m)^### (docs/artifacts/[^\n]+)\n\n~~~markdown\n([\s\S]*?)\n~~~`).FindAllSubmatch(guide, -1)
	if len(blocks) != 6 {
		t.Fatalf("want six copyable files, got %d", len(blocks))
	}
	files := fstest.MapFS{}
	for _, block := range blocks {
		name, body := string(block[1]), block[2]
		if !fs.ValidPath(name) || files[name] != nil {
			t.Fatalf("unsafe or duplicate scaffold path: %s", name)
		}
		files[name] = &fstest.MapFile{Data: body}
		if bytes.Contains(body, []byte("[x]")) || bytes.Contains(body, []byte(`"result": "passed"`)) {
			t.Fatalf("fresh scaffold contains completion evidence: %s", name)
		}
	}
	// Links must still resolve after copying the blocks out of the guide.
	links := regexp.MustCompile(`\[[^\]]+\]\(([^)]+)\)`)
	for name, file := range files {
		for _, link := range links.FindAllSubmatch(file.Data, -1) {
			target := path.Join(path.Dir(name), string(link[1]))
			if !fs.ValidPath(target) || files[target] == nil {
				t.Errorf("scaffold link %s -> %s does not resolve", name, target)
			}
		}
	}
	readMetadata := func(name string, value any) {
		t.Helper()
		body, err := fs.ReadFile(files, name)
		if err != nil {
			t.Fatal(err)
		}
		parts := strings.SplitN(string(body), "---\n", 3)
		if len(parts) != 3 || parts[0] != "" {
			t.Fatalf("missing front matter: %s", name)
		}
		if err := json.Unmarshal([]byte(parts[1]), value); err != nil {
			t.Fatalf("invalid JSON-compatible YAML in %s: %v", name, err)
		}
	}
	var unit struct {
		ID       string `json:"unit_of_work"`
		Changes  []struct{ Artifact, Change string }
		Flows    []any                            `json:"affected_flows"`
		Assess   string                           `json:"flow_assessment"`
		Accept   []struct{ ID, Criterion string } `json:"acceptance"`
		Evidence []any
	}
	readMetadata("docs/artifacts/units-of-work/small-update/README.md", &unit)
	if unit.ID != "small-update" || len(unit.Changes) != 1 || unit.Flows == nil || strings.TrimSpace(unit.Assess) == "" || len(unit.Accept) == 0 || unit.Evidence == nil || len(unit.Evidence) != 0 {
		t.Fatalf("incomplete unit or fabricated evidence: %+v", unit)
	}
	criteria := map[string]bool{}
	for _, criterion := range unit.Accept {
		if criterion.ID == "" || strings.TrimSpace(criterion.Criterion) == "" || criteria[criterion.ID] {
			t.Fatalf("invalid acceptance criterion: %+v", criterion)
		}
		criteria[criterion.ID] = true
	}
	// In-place layout: knowledge is edited under the artifact and the change
	// holds only its record and plan, so a new change copies no baseline.
	member := unit.Changes[0]
	artifact := path.Join("docs/artifacts", member.Artifact)
	base := path.Join(artifact, "changes", member.Change)
	for _, file := range []string{base + "/README.md", artifact + "/requirements/outcome.md", artifact + "/specifications/outcome.md"} {
		if files[file] == nil {
			t.Fatalf("unit member lacks %s", file)
		}
	}
	for name := range files {
		if strings.HasPrefix(name, base+"/") && !strings.HasPrefix(name, base+"/tasks/") && name != base+"/README.md" {
			t.Errorf("change copies knowledge instead of editing in place: %s", name)
		}
		if strings.Contains(name, "/versions/") {
			t.Errorf("fresh scaffold creates a version: %s", name)
		}
	}
	var plan struct{ Tasks []string }
	readMetadata(base+"/tasks/README.md", &plan)
	if len(plan.Tasks) != 1 || !fs.ValidPath(plan.Tasks[0]) || plan.Tasks[0] == "README.md" {
		t.Fatalf("invalid one-task plan: %+v", plan)
	}
	var task struct {
		ID       string
		Depends  []string `json:"depends_on"`
		Evidence []any    `json:"evidence_records"`
	}
	readMetadata(path.Join(base, "tasks", plan.Tasks[0]), &task)
	if task.ID == "" || task.Depends == nil || len(task.Depends) != 0 || task.Evidence == nil || len(task.Evidence) != 0 {
		t.Fatalf("invalid initial task or fabricated evidence: %+v", task)
	}
	body := string(files[path.Join(base, "tasks", plan.Tasks[0])].Data)
	for _, section := range []string{"## Scope and ownership", "## Governing knowledge", "## Prerequisites", "## Definition of Done", "## Evidence", "- [ ]"} {
		if !strings.Contains(body, section) {
			t.Errorf("task lacks %s", section)
		}
	}
}

// The adopted and published bundle must preserve the canonical method, including
// new guidance pages and their relative links, rather than omit them from embed.
func TestCanonicalBundleFidelity(t *testing.T) {
	canonical := os.DirFS(".")
	err := fs.WalkDir(canonical, ".", func(name string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() || path.Ext(name) == ".go" {
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

// One source: the embedded bundle holds no Go file, always holds the tools
// guide, and holds the validator exactly when the build supplied it.
func TestBundleContents(t *testing.T) {
	err := fs.WalkDir(Bundle, ".", func(name string, entry fs.DirEntry, err error) error {
		if err == nil && path.Ext(name) == ".go" {
			t.Errorf("bundle delivers a Go file: %s", name)
		}
		return err
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := fs.Stat(Bundle, "tools/README.md"); err != nil {
		t.Fatalf("bundle lacks the tools guide: %v", err)
	}
	_, built := os.Stat("tools/add-validate.mjs")
	_, embedded := fs.Stat(Bundle, "tools/add-validate.mjs")
	if (built == nil) != (embedded == nil) {
		t.Fatalf("validator presence differs: build %v, bundle %v", built, embedded)
	}
}
