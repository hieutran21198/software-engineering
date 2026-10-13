package storydriven

import (
	"bytes"
	"io/fs"
	"net/url"
	"os"
	"path"
	"regexp"
	"strings"
	"testing"
	"testing/fstest"
	"unicode"

	"software-engineering/src/utils/agents/skills"
)

func TestBundleFilesystemAndSourceFidelity(t *testing.T) {
	if err := fstest.TestFS(Bundle, "README.md", "06-adoption/README.md", "required-skills/kiss/SKILL.md", "required-skills/asd-ste-100/SKILL.md"); err != nil {
		t.Fatal(err)
	}
	// Every authored knowledge file is delivered, while source code stays out.
	if err := fs.WalkDir(os.DirFS("."), ".", func(name string, entry fs.DirEntry, err error) error {
		if err != nil || entry.IsDir() {
			return err
		}
		if !strings.HasSuffix(name, ".md") {
			return nil
		}
		want, err := os.ReadFile(name)
		if err != nil {
			return err
		}
		got, err := fs.ReadFile(Bundle, name)
		if err != nil {
			return err
		}
		if !bytes.Equal(got, want) {
			t.Errorf("bundle differs from source: %s", name)
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	if _, err := fs.Stat(Bundle, "bundle.go"); !os.IsNotExist(err) {
		t.Fatalf("implementation leaked into bundle: %v", err)
	}
	if err := fs.WalkDir(skills.Bundle, ".", func(name string, entry fs.DirEntry, err error) error {
		if err != nil || entry.IsDir() {
			return err
		}
		want, err := fs.ReadFile(skills.Bundle, name)
		if err != nil {
			return err
		}
		got, err := fs.ReadFile(Bundle, "required-skills/"+name)
		if err != nil {
			return err
		}
		if !bytes.Equal(got, want) {
			t.Errorf("supporting skill differs: %s", name)
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}
}

var markdownLink = regexp.MustCompile(`\[[^\]\n]+\]\(([^)\n]+)\)`)
var heading = regexp.MustCompile(`(?m)^#{1,6} +(.+)$`)

func headingSlug(text string) string {
	var result strings.Builder
	for _, char := range strings.ToLower(text) {
		if unicode.IsLetter(char) || unicode.IsDigit(char) || char == '-' || char == '_' {
			result.WriteRune(char)
		} else if char == ' ' {
			result.WriteByte('-')
		}
	}
	return result.String()
}

func TestBundleLinksAndDownwardNavigation(t *testing.T) {
	if err := fs.WalkDir(Bundle, ".", func(source string, entry fs.DirEntry, err error) error {
		if err != nil || entry.IsDir() || !strings.HasSuffix(source, ".md") {
			return err
		}
		content, err := fs.ReadFile(Bundle, source)
		if err != nil {
			return err
		}
		for _, match := range markdownLink.FindAllSubmatch(content, -1) {
			reference, err := url.Parse(string(match[1]))
			if err != nil {
				t.Errorf("%s: invalid reference %s", source, match[1])
				continue
			}
			if reference.Scheme == "http" || reference.Scheme == "https" || reference.Scheme == "mailto" {
				continue
			}
			if reference.Scheme != "" || reference.Host != "" || strings.HasPrefix(reference.Path, "/") {
				t.Errorf("%s: nonportable reference %s", source, match[1])
				continue
			}
			target := source
			if reference.Path != "" {
				target = path.Join(path.Dir(source), reference.Path)
			}
			data, err := fs.ReadFile(Bundle, target)
			if err != nil {
				t.Errorf("%s: unresolved target %s: %v", source, target, err)
				continue
			}
			if source != target && path.Base(target) == "README.md" {
				directory := path.Dir(target)
				if directory == "." || path.Dir(source) == directory || strings.HasPrefix(path.Dir(source), directory+"/") {
					t.Errorf("%s links to ancestor %s", source, target)
				}
			}
			if reference.Fragment != "" {
				found := false
				for _, title := range heading.FindAllSubmatch(data, -1) {
					if headingSlug(string(title[1])) == reference.Fragment {
						found = true
					}
				}
				if !found {
					t.Errorf("%s: unresolved anchor %s#%s", source, target, reference.Fragment)
				}
			}
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}
}

func TestCreativeSkillDiscoveryAndSupportingResources(t *testing.T) {
	for _, role := range []string{"coordinator", "architect", "author"} {
		name := "story-driven-" + role
		source := "03-execution/skills/" + name + "/SKILL.md"
		data, err := fs.ReadFile(Bundle, source)
		if err != nil {
			t.Fatal(err)
		}
		parts := strings.SplitN(string(data), "---\n", 3)
		if len(parts) != 3 || parts[0] != "" {
			t.Fatalf("%s: no front matter", source)
		}
		fields := map[string]string{}
		for _, line := range strings.Split(strings.TrimSpace(parts[1]), "\n") {
			key, value, ok := strings.Cut(line, ": ")
			if !ok || fields[key] != "" {
				t.Fatalf("%s: malformed discovery field %q", source, line)
			}
			fields[key] = value
		}
		if fields["name"] != name || strings.TrimSpace(fields["description"]) == "" {
			t.Errorf("%s: invalid discovery name/description", source)
		}
		for _, utility := range []string{"kiss", "asd-ste-100"} {
			relative := "../../../required-skills/" + utility + "/SKILL.md"
			if !strings.Contains(parts[2], relative) {
				t.Errorf("%s: missing required skill reference", source)
			}
			if _, err := fs.ReadFile(Bundle, path.Join(path.Dir(source), relative)); err != nil {
				t.Errorf("%s: supporting resource missing: %v", source, err)
			}
		}
	}
}
