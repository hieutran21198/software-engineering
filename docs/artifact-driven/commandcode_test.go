package artifactdriven

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

var commandCodeRoles = []string{"add-coordinator", "add-product-owner", "add-technical-lead", "add-implementer"}

func TestCommandCodeRegistrations(t *testing.T) {
	root := filepath.Join("..", "..")
	entries, err := os.ReadDir(filepath.Join(root, ".agents/skills"))
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 6 {
		t.Fatalf("want exactly six canonical registrations, got %d", len(entries))
	}
	for _, id := range append(append([]string{}, commandCodeRoles...), "kiss", "asd-ste-100") {
		directory := "03-execution/skills/" + id
		if id == "kiss" || id == "asd-ste-100" {
			directory = "required-skills/" + id
		}
		if err := checkOpenCodeRegistration(root, id, "../../docs/artifact-driven/"+directory); err != nil {
			t.Error(err)
		}
	}
	if _, err := os.Lstat(filepath.Join(root, ".commandcode/skills")); !os.IsNotExist(err) {
		t.Fatalf("want no duplicate .commandcode/skills registration directory, got %v", err)
	}
}

func TestCommandCodeImplementerProfile(t *testing.T) {
	data, err := os.ReadFile("../../.commandcode/agents/add-implementer.md")
	if err != nil {
		t.Fatal(err)
	}
	if err := checkCommandCodeProfile(string(data)); err != nil {
		t.Fatal(err)
	}
}

// The profile supports a name, a description and one tools value only. Reject
// other fields rather than approximating the Command Code agent schema.
func checkCommandCodeProfile(data string) error {
	parts := strings.SplitN(data, "---\n", 3)
	if len(parts) != 3 || parts[0] != "" {
		return errors.New("missing or malformed front matter")
	}
	fields := map[string]string{}
	for _, line := range strings.Split(strings.TrimSuffix(parts[1], "\n"), "\n") {
		key, value, ok := strings.Cut(line, ": ")
		if !ok || (key != "name" && key != "description" && key != "tools") || fields[key] != "" || strings.TrimSpace(value) == "" {
			return errors.New("unsupported, empty or duplicate front-matter field: " + line)
		}
		fields[key] = value
	}
	if fields["name"] != "add-implementer" || fields["tools"] != `"*"` || fields["description"] == "" {
		return errors.New("profile requires name add-implementer, a description and tools \"*\"")
	}
	for _, required := range []string{
		"docs/artifact-driven/03-execution/skills/add-implementer/SKILL.md",
		"Resolve its references from that skill directory", "keep the full bundle available",
		"KISS and STE checklist", "docs/artifact-driven/required-skills/kiss/SKILL.md",
		"docs/artifact-driven/required-skills/asd-ste-100/SKILL.md",
		"upstream", "establish", "current model and permissions",
		"Never commit to protected branches", "team review and merge",
		"cannot ask the person a question",
	} {
		if !strings.Contains(parts[2], required) {
			return errors.New("missing role-loading instruction or boundary: " + required)
		}
	}
	return nil
}

func TestCommandCodeProfileRejectsChangedFields(t *testing.T) {
	data, err := os.ReadFile("../../.commandcode/agents/add-implementer.md")
	if err != nil {
		t.Fatal(err)
	}
	valid := string(data)
	if err := checkCommandCodeProfile(valid); err != nil {
		t.Fatal(err)
	}
	mutations := map[string]string{
		"model field":        strings.Replace(valid, "tools: \"*\"\n", "tools: \"*\"\nmodel: provider/model\n", 1),
		"permission field":   strings.Replace(valid, "tools: \"*\"\n", "tools: \"*\"\npermissionMode: yolo\n", 1),
		"wrong name":         strings.Replace(valid, "name: add-implementer", "name: add-coordinator", 1),
		"missing tools":      strings.Replace(valid, "tools: \"*\"\n", "", 1),
		"missing skill path": strings.ReplaceAll(valid, "skills/add-implementer/SKILL.md", "skills/add-coordinator/SKILL.md"),
		"no questions rule":  strings.Replace(valid, "cannot ask the person a question", "", 1),
		"no team review":     strings.Replace(valid, "team review and merge", "", 1),
	}
	for name, mutated := range mutations {
		t.Run(name, func(t *testing.T) {
			if err := checkCommandCodeProfile(mutated); err == nil {
				t.Fatal("accepted malformed profile")
			}
		})
	}
}

func TestCommandCodeGuidanceLinks(t *testing.T) {
	for _, source := range []string{"05-adoption/README.md", "06-guidelines/adopting-from-git.md", "06-guidelines/working-with-ai.md"} {
		if err := checkOpenCodeGuidanceLinks(Bundle, source); err != nil {
			t.Errorf("%s: %v", source, err)
		}
	}
}
