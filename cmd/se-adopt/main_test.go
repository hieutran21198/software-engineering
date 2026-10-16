package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
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

// runJSON runs the command and decodes exactly one JSON result from stdout.
func runJSON(t *testing.T, args ...string) (jsonResult, string, error) {
	t.Helper()
	var stdout, stderr bytes.Buffer
	err := run(args, &stdout, &stderr)
	if stderr.Len() != 0 {
		t.Fatalf("JSON mode wrote stderr: %q", stderr.String())
	}
	if !bytes.Contains(stdout.Bytes(), []byte(`"diagnostics": [`)) || !bytes.Contains(stdout.Bytes(), []byte(`"error": `)) {
		t.Fatalf("result lacks required fields: %s", stdout.String())
	}
	decoder := json.NewDecoder(&stdout)
	var result jsonResult
	if decodeErr := decoder.Decode(&result); decodeErr != nil {
		t.Fatalf("stdout is not one JSON object: %v", decodeErr)
	}
	if _, extra := decoder.Token(); extra != io.EOF {
		t.Fatal("stdout contains more than one JSON value")
	}
	if result.Schema != "se-adopt.result.v1" {
		t.Fatalf("schema: %q", result.Schema)
	}
	if err != nil && (!errors.Is(err, errReported) || result.OK || result.Error == nil || result.Created != 0) {
		t.Fatalf("failure is not reported as a failed result: %+v, %v", result, err)
	}
	if err == nil && (!result.OK || result.Error != nil) {
		t.Fatalf("success is not reported as ok: %+v", result)
	}
	return result, stdout.String(), err
}

func TestJSONSuccessPreviewAndList(t *testing.T) {
	workspace := t.TempDir()
	preview, _, err := runJSON(t, "--project", workspace, "--dry-run", "--json")
	if err != nil || preview.Operation != "preview" || preview.Created == 0 || !preview.Complete || *preview.Architecture != "artifact-driven" {
		t.Fatalf("preview: %+v, %v", preview, err)
	}
	if entries, err := os.ReadDir(workspace); err != nil || len(entries) != 0 {
		t.Fatalf("preview wrote files: %v, %v", entries, err)
	}
	adopted, _, err := runJSON(t, "--json=true", "--project", workspace)
	want := filepath.Join(workspace, "docs/artifact-driven")
	if err != nil || adopted.Operation != "adopt" || adopted.Created != preview.Created || *adopted.Destination != want || len(adopted.Diagnostics) != 0 {
		t.Fatalf("adopt: %+v, %v", adopted, err)
	}
	repeat, _, err := runJSON(t, "--project", workspace, "--json")
	if err != nil || repeat.Created != 0 || repeat.Unchanged != preview.Created {
		t.Fatalf("repeat: %+v, %v", repeat, err)
	}
	catalog, _, err := runJSON(t, "--json", "--list")
	if err != nil || catalog.Operation != "list" || catalog.Architecture != nil || catalog.Destination != nil || len(catalog.Architectures) < 2 {
		t.Fatalf("list: %+v, %v", catalog, err)
	}
	names := map[string]bool{}
	for _, entry := range catalog.Architectures {
		names[entry.Name] = entry.Description != ""
	}
	if !names["artifact-driven"] || !names["story-driven"] {
		t.Fatalf("catalog: %+v", catalog.Architectures)
	}
}

func TestJSONConflictsMatchHumanErrors(t *testing.T) {
	workspace := t.TempDir()
	for _, name := range []string{"README.md", "06-guidelines/working-with-ai.md"} {
		file := filepath.Join(workspace, "docs/artifact-driven", name)
		if err := os.MkdirAll(filepath.Dir(file), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(file, []byte("consumer edits"), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	result, raw, err := runJSON(t, "--project", workspace, "--json")
	if err == nil || result.Error.Code != "destination-conflict" || !result.Complete || len(result.Diagnostics) != 2 {
		t.Fatalf("conflicts: %+v, %v", result, err)
	}
	if strings.Contains(raw, "consumer edits") {
		t.Fatal("result exposes consumer contents")
	}
	var stdout, stderr bytes.Buffer
	err = run([]string{"--project", workspace}, &stdout, &stderr)
	if err == nil || errors.Is(err, errReported) || stdout.Len() != 0 {
		t.Fatalf("human conflict: %v, %q", err, stdout.String())
	}
	for _, diagnostic := range result.Diagnostics {
		for _, fact := range []string{diagnostic.Code, diagnostic.Path, diagnostic.Action} {
			if !strings.Contains(err.Error(), fact) {
				t.Errorf("human error lacks %q:\n%v", fact, err)
			}
		}
	}
	if entries, err := os.ReadDir(filepath.Join(workspace, "docs/artifact-driven")); err != nil || len(entries) != 2 {
		t.Fatalf("failed preflight wrote files: %v, %v", entries, err)
	}
}

func TestJSONArgumentErrorsAndFlagForms(t *testing.T) {
	workspace := t.TempDir()
	cases := map[string]struct {
		args []string
		code string
	}{
		"unknown flag before":   {[]string{"--unknown", "--json"}, "invalid-arguments"},
		"unknown flag after":    {[]string{"--json", "--unknown"}, "invalid-arguments"},
		"explicit true":         {[]string{"-json=true", "--bogus"}, "invalid-arguments"},
		"positional":            {[]string{"--json", "unexpected"}, "invalid-arguments"},
		"repeated":              {[]string{"--json", "--project", workspace, "--json"}, "invalid-arguments"},
		"conflicting repeat":    {[]string{"--json=false", "--json"}, "invalid-arguments"},
		"invalid value":         {[]string{"--json=maybe"}, "invalid-arguments"},
		"invalid architecture":  {[]string{"--json", "--arch", "unknown", "--project", workspace}, "unsupported-architecture"},
		"explicit empty output": {[]string{"--json", "--project", workspace, "--output", ""}, "preflight-failed"},
		"missing project":       {[]string{"--json", "--project", filepath.Join(workspace, "missing")}, "preflight-failed"},
	}
	for name, test := range cases {
		t.Run(name, func(t *testing.T) {
			result, _, err := runJSON(t, test.args...)
			if err == nil || result.Error.Code != test.code || result.Error.Message == "" || result.Error.Action == "" {
				t.Fatalf("%+v, %v", result, err)
			}
		})
	}
	if entries, err := os.ReadDir(workspace); err != nil || len(entries) != 0 {
		t.Fatalf("argument errors wrote files: %v, %v", entries, err)
	}
	// --json=false keeps human rendering, and a value flag consumes "--json".
	var stdout, stderr bytes.Buffer
	if err := run([]string{"--json=false", "--unknown"}, &stdout, &stderr); err == nil || errors.Is(err, errReported) || stdout.Len() != 0 {
		t.Fatalf("human error: %v, %q", err, stdout.String())
	}
	stdout.Reset()
	if err := run([]string{"--project", workspace, "--dry-run", "--output", "--json"}, &stdout, &stderr); err != nil || !strings.HasPrefix(stdout.String(), "Would adopt") {
		t.Fatalf("output value treated as flag: %v, %q", err, stdout.String())
	}
	if entries, err := os.ReadDir(workspace); err != nil || len(entries) != 0 {
		t.Fatalf("preview wrote files: %v, %v", entries, err)
	}
}

func TestJSONHelpRemainsHumanUsage(t *testing.T) {
	for _, args := range [][]string{{"--help", "--json"}, {"--json", "--help"}, {"--json=true", "-h"}} {
		var stdout, stderr bytes.Buffer
		if err := run(args, &stdout, &stderr); err != nil || stdout.Len() != 0 {
			t.Fatalf("%v: %v, %q", args, err, stdout.String())
		}
		if usage := stderr.String(); !strings.Contains(usage, "Usage: se-adopt") || !strings.Contains(usage, "-json") {
			t.Fatalf("%v: usage %q", args, usage)
		}
	}
}
