package artifactdriven

import (
	"fmt"
	"io/fs"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
	"testing/fstest"
)

var openCodeRoles = []string{"add-coordinator", "add-product-owner", "add-technical-lead", "add-implementer"}

func TestOpenCodeSkillRegistrations(t *testing.T) {
	root := filepath.Join("..", "..")
	entries, err := os.ReadDir(filepath.Join(root, ".agents/skills"))
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 6 {
		t.Fatalf("want exactly six canonical registrations, got %d", len(entries))
	}
	for _, id := range append(append([]string{}, openCodeRoles...), "kiss", "asd-ste-100") {
		directory := "03-execution/skills/" + id
		if id == "kiss" || id == "asd-ste-100" {
			directory = "required-skills/" + id
		}
		if err := checkOpenCodeRegistration(root, id, "../../docs/artifact-driven/"+directory); err != nil {
			t.Error(err)
		}
	}
	if _, err := os.Lstat(filepath.Join(root, ".opencode/skills")); !os.IsNotExist(err) {
		t.Fatalf("want no duplicate .opencode/skills registration directory, got %v", err)
	}
}

func checkOpenCodeRegistration(root, id, want string) error {
	entry := filepath.Join(root, ".agents/skills", id)
	got, err := os.Readlink(entry)
	if err != nil {
		return fmt.Errorf("%s: expected canonical symlink: %w", id, err)
	}
	if got != want {
		return fmt.Errorf("%s: symlink target %q, want %q", id, got, want)
	}
	data, err := os.ReadFile(filepath.Join(entry, "SKILL.md"))
	if err != nil || len(data) == 0 {
		return fmt.Errorf("%s: canonical skill missing or empty: %v", id, err)
	}
	return nil
}

func TestOpenCodeRegistrationRejectsMalformedEntries(t *testing.T) {
	for _, kind := range []string{"valid", "missing", "wrong target", "regular directory", "dangling"} {
		t.Run(kind, func(t *testing.T) {
			root := t.TempDir()
			entry := filepath.Join(root, ".agents/skills/add-implementer")
			if err := os.MkdirAll(filepath.Dir(entry), 0755); err != nil {
				t.Fatal(err)
			}
			want := "../../docs/artifact-driven/03-execution/skills/add-implementer"
			target := filepath.Join(filepath.Dir(entry), want)
			if kind != "dangling" {
				if err := os.MkdirAll(target, 0755); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(filepath.Join(target, "SKILL.md"), []byte("skill"), 0644); err != nil {
					t.Fatal(err)
				}
			}
			switch kind {
			case "missing":
			case "regular directory":
				if err := os.Mkdir(entry, 0755); err != nil {
					t.Fatal(err)
				}
			default:
				link := want
				if kind == "wrong target" {
					link += "-wrong"
				}
				if err := os.Symlink(link, entry); err != nil {
					t.Fatal(err)
				}
			}
			if err := checkOpenCodeRegistration(root, "add-implementer", want); (err == nil) != (kind == "valid") {
				t.Fatalf("unexpected registration result: %v", err)
			}
		})
	}
}

func TestOpenCodeNativeProfiles(t *testing.T) {
	files, err := filepath.Glob("../../.opencode/agents/add-*.md")
	if err != nil || len(files) != len(openCodeRoles) {
		t.Fatalf("want four native ADD profiles, got %v: %v", files, err)
	}
	for _, role := range openCodeRoles {
		data, err := os.ReadFile("../../.opencode/agents/" + role + ".md")
		if err != nil {
			t.Fatal(err)
		}
		if err := checkOpenCodeProfile(string(data), role); err != nil {
			t.Errorf("%s: %v", role, err)
		}
	}
}

// These thin repository profiles deliberately support only two plain scalar
// fields. Reject other YAML shapes rather than approximate a general parser.
func checkOpenCodeProfile(data, role string) error {
	parts := strings.SplitN(data, "---\n", 3)
	if len(parts) != 3 || parts[0] != "" {
		return fmt.Errorf("missing or malformed front matter")
	}
	fields := map[string]string{}
	for _, line := range strings.Split(strings.TrimSuffix(parts[1], "\n"), "\n") {
		key, value, ok := strings.Cut(line, ": ")
		if !ok || (key != "description" && key != "mode") || fields[key] != "" || strings.TrimSpace(value) == "" {
			return fmt.Errorf("unsupported, empty or duplicate front-matter field: %q", line)
		}
		if strings.ContainsAny(value[:1], "|>\"'[{&*!") || strings.Contains(value, ": ") {
			return fmt.Errorf("expected plain scalar: %q", line)
		}
		fields[key] = value
	}
	if fields["description"] == "" || fields["mode"] != "all" {
		return fmt.Errorf("profile requires description and mode: all")
	}
	for _, required := range []string{
		"Before acting, load `docs/artifact-driven/03-execution/skills/" + role + "/SKILL.md`",
		"Resolve its references from that skill directory", "keep the full bundle available",
		"KISS and STE checklist", "docs/artifact-driven/required-skills/kiss/SKILL.md",
		"docs/artifact-driven/required-skills/asd-ste-100/SKILL.md",
		"plan approval", "small-tier approval rule", "renewed approval", "upstream", "establish",
		"current model and permissions",
		"Never commit to protected branches", "team review and merge",
	} {
		if !strings.Contains(parts[2], required) {
			return fmt.Errorf("missing role-loading instruction or boundary: %q", required)
		}
	}
	return nil
}

func TestOpenCodeProfileRejectsMalformedDefinitions(t *testing.T) {
	data, err := os.ReadFile("../../.opencode/agents/add-implementer.md")
	if err != nil {
		t.Fatal(err)
	}
	valid := string(data)
	if err := checkOpenCodeProfile(valid, "add-implementer"); err != nil {
		t.Fatal(err)
	}
	mutations := map[string]string{
		"no front matter": strings.TrimPrefix(valid, "---\n"),
		"wrong role":      strings.ReplaceAll(valid, "skills/add-implementer/", "skills/add-coordinator/"),
	}
	for _, field := range []string{"model: provider/model", "provider: other", "permission: allow", "permissions: []", "mode: all", "description: duplicate", "description: |", "  mode: all"} {
		mutations[field] = strings.Replace(valid, "mode: all\n", "mode: all\n"+field+"\n", 1)
	}
	for _, missing := range []string{"mode: all\n", "description: Execute an assigned approved ADD task and return commits and Definition of Done evidence.", "required-skills/kiss/SKILL.md", "required-skills/asd-ste-100/SKILL.md", "plan approval", "upstream", "Never commit to protected branches", "team review and merge"} {
		mutations["missing "+missing] = strings.ReplaceAll(valid, missing, "")
	}
	mutations["wrong mode"] = strings.Replace(valid, "mode: all", "mode: primary", 1)
	mutations["empty description"] = regexp.MustCompile(`(?m)^description: .*`).ReplaceAllString(valid, "description: ")
	for name, mutated := range mutations {
		t.Run(name, func(t *testing.T) {
			if err := checkOpenCodeProfile(mutated, "add-implementer"); err == nil {
				t.Fatal("accepted malformed profile")
			}
		})
	}
}

func TestOpenCodeGuidanceLinks(t *testing.T) {
	for _, source := range []string{"05-adoption/README.md", "06-guidelines/adopting-from-git.md", "06-guidelines/working-with-ai.md"} {
		if err := checkOpenCodeGuidanceLinks(Bundle, source); err != nil {
			t.Errorf("%s: %v", source, err)
		}
	}
}

// Match the inline links used by these three guides. External references are
// syntax-checked only; tests must not depend on network availability.
func checkOpenCodeGuidanceLinks(files fs.FS, source string) error {
	data, err := fs.ReadFile(files, source)
	if err != nil {
		return err
	}
	for _, match := range regexp.MustCompile(`\[[^\]]+\]\(([^)]+)\)`).FindAllSubmatch(data, -1) {
		reference, err := url.Parse(string(match[1]))
		if err != nil {
			return err
		}
		if reference.Scheme == "https" || reference.Scheme == "http" || reference.Scheme == "mailto" {
			continue
		}
		if reference.Scheme != "" || reference.Host != "" || strings.HasPrefix(reference.Path, "/") {
			return fmt.Errorf("nonportable link: %s", match[1])
		}
		target := source
		if reference.Path != "" {
			target = path.Join(path.Dir(source), reference.Path)
		}
		body, err := fs.ReadFile(files, target)
		if err != nil {
			return fmt.Errorf("unresolved link %s: %w", match[1], err)
		}
		if source != target && path.Base(target) == "README.md" {
			directory := path.Dir(target)
			if directory == "." || path.Dir(source) == directory || strings.HasPrefix(path.Dir(source), directory+"/") {
				return fmt.Errorf("link to ancestor: %s", target)
			}
		}
		if reference.Fragment != "" {
			found := false
			for _, heading := range regexp.MustCompile(`(?m)^#{1,6} (.+)$`).FindAllSubmatch(body, -1) {
				slug := regexp.MustCompile(`[^a-z0-9 _-]`).ReplaceAllString(strings.ToLower(string(heading[1])), "")
				if strings.ReplaceAll(slug, " ", "-") == reference.Fragment {
					found = true
				}
			}
			if !found {
				return fmt.Errorf("unresolved anchor: %s", match[1])
			}
		}
	}
	return nil
}

func TestOpenCodeGuidanceRejectsBrokenLinks(t *testing.T) {
	for _, target := range []string{"../README.md", "README.md", "missing.md", "sibling.md#missing", "../../README.md"} {
		t.Run(target, func(t *testing.T) {
			files := fstest.MapFS{
				"README.md":        {Data: []byte("# Root")},
				"guide/README.md":  {Data: []byte("# Guide")},
				"guide/sibling.md": {Data: []byte("# Sibling")},
				"guide/child.md":   {Data: []byte("[link](" + target + ")")},
				"other/README.md":  {Data: []byte("# Other")},
			}
			if err := checkOpenCodeGuidanceLinks(files, "guide/child.md"); err == nil {
				t.Fatal("accepted broken or ancestor link")
			}
			// A ../ path to a sibling directory is not an ancestor reference.
			files["guide/child.md"].Data = []byte("[link](../other/README.md#other)")
			if err := checkOpenCodeGuidanceLinks(files, "guide/child.md"); err != nil {
				t.Fatal(err)
			}
		})
	}
}
