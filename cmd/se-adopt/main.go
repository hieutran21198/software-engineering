package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"software-engineering/internal/adopt"
	"software-engineering/src/archs"
)

// errReported marks a failure that was already written as a JSON result.
var errReported = errors.New("failure reported as JSON")

func main() {
	if err := run(os.Args[1:], os.Stdout, os.Stderr); err != nil {
		if !errors.Is(err, errReported) {
			fmt.Fprintln(os.Stderr, "se-adopt:", err)
		}
		os.Exit(1)
	}
}

func run(args []string, stdout, stderr io.Writer) error {
	jsonOutput, jsonErr := jsonRequested(args)
	flags := flag.NewFlagSet("se-adopt", flag.ContinueOnError)
	project := flags.String("project", ".", "existing consumer workspace directory")
	architectureName := flags.String("arch", archs.Default, "architecture to adopt; use --list to see available bundles")
	output := flags.String("output", "", "workspace-relative destination (default docs/<architecture>)")
	list := flags.Bool("list", false, "list bundled architectures without writing")
	dryRun := flags.Bool("dry-run", false, "check conflicts and preview adoption without writing")
	flags.Bool("json", false, "write one se-adopt.result.v1 JSON object to stdout instead of human text")
	usage := func() {
		fmt.Fprintln(stderr, "Usage: se-adopt [--arch name] [--project directory] [--output relative-path] [--dry-run] [--json]")
		fmt.Fprintln(stderr, "       se-adopt --list [--json]")
		fmt.Fprintln(stderr, "Copy a bundled knowledge architecture into a consumer workspace.")
		flags.SetOutput(stderr)
		flags.PrintDefaults()
	}
	flags.SetOutput(stderr)
	flags.Usage = usage
	if jsonOutput {
		// Parse errors become the JSON result; help stays human usage.
		flags.SetOutput(io.Discard)
		flags.Usage = func() {}
	}
	parseErr := flags.Parse(args)
	if errors.Is(parseErr, flag.ErrHelp) {
		if jsonOutput {
			usage()
		}
		return nil
	}
	report := reporter{json: jsonOutput, stdout: stdout, result: newResult(*list, *dryRun)}
	if parseErr == nil {
		parseErr = jsonErr
	}
	if parseErr == nil && flags.NArg() != 0 {
		parseErr = fmt.Errorf("unexpected arguments: %v", flags.Args())
	}
	if parseErr != nil {
		return report.fail("invalid-arguments", parseErr, "run se-adopt --help to see supported flags")
	}
	if *list {
		if report.json {
			for _, architecture := range archs.Available() {
				report.result.Architectures = append(report.result.Architectures, catalogEntry{architecture.Name, architecture.Description})
			}
			report.result.OK, report.result.Complete = true, true
			return report.write()
		}
		for _, architecture := range archs.Available() {
			fmt.Fprintf(stdout, "%s\t%s\n", architecture.Name, architecture.Description)
		}
		return nil
	}
	architecture, found := archs.Lookup(*architectureName)
	if !found {
		var names []string
		for _, available := range archs.Available() {
			names = append(names, available.Name)
		}
		err := fmt.Errorf("unsupported architecture %q; available: %s", *architectureName, strings.Join(names, ", "))
		return report.fail("unsupported-architecture", err, "run se-adopt --list and pass a listed name with --arch")
	}
	destination := filepath.Join("docs", architecture.Name)
	flags.Visit(func(f *flag.Flag) {
		if f.Name == "output" {
			destination = *output
		}
	})
	report.result.Architecture = &architecture.Name
	result, err := adopt.Copy(architecture.Bundle, *project, destination, *dryRun)
	if result.Destination != "" {
		report.result.Destination = &result.Destination
	}
	report.result.Unchanged = result.Unchanged
	report.result.Complete = result.Complete
	if result.Diagnostics != nil {
		report.result.Diagnostics = result.Diagnostics
	}
	if err != nil {
		return report.copyFailure(err, result)
	}
	if report.json {
		report.result.OK = true
		report.result.Created = result.Created
		return report.write()
	}
	verb := "Adopted"
	if *dryRun {
		verb = "Would adopt"
	}
	fmt.Fprintf(stdout, "%s %s into %s (%d new files, %d unchanged).\n",
		verb, architecture.Description, result.Destination, result.Created, result.Unchanged)
	fmt.Fprintf(stdout, "Start with %s\n", filepath.Join(result.Destination, "README.md"))
	return nil
}

// jsonRequested reads --json forms before flag parsing, so that parse errors
// before or after the flag also use the requested rendering. It follows the
// flag package: parsing stops at the first non-flag argument or "--", and
// value flags without "=" consume the next argument.
func jsonRequested(args []string) (bool, error) {
	requested, forms := false, 0
	var invalid error
	for i := 0; i < len(args); i++ {
		arg := args[i]
		if arg == "--" || arg == "-" || !strings.HasPrefix(arg, "-") {
			break
		}
		name, value, hasValue := strings.Cut(strings.TrimPrefix(arg[1:], "-"), "=")
		switch name {
		case "project", "arch", "output":
			if !hasValue {
				i++
			}
		case "json":
			forms++
			enabled := true
			if hasValue {
				parsed, err := strconv.ParseBool(value)
				if err != nil {
					// An invalid value still shows that a machine reader is waiting.
					parsed, invalid = true, fmt.Errorf("invalid --json value %q", value)
				}
				enabled = parsed
			}
			requested = requested || enabled
		}
	}
	if forms > 1 {
		return requested, errors.New("--json is given more than once; pass it once")
	}
	return requested, invalid
}

// jsonResult is schema se-adopt.result.v1. Fields may be added; existing field
// meanings change only with a new schema version.
type jsonResult struct {
	Schema        string             `json:"schema"`
	Operation     string             `json:"operation"`
	OK            bool               `json:"ok"`
	Architecture  *string            `json:"architecture"`
	Destination   *string            `json:"destination"`
	Created       int                `json:"created"`
	Unchanged     int                `json:"unchanged"`
	Diagnostics   []adopt.Diagnostic `json:"diagnostics"`
	Complete      bool               `json:"complete"`
	Error         *jsonError         `json:"error"`
	Architectures []catalogEntry     `json:"architectures,omitempty"`
}

type jsonError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Action  string `json:"action"`
}

type catalogEntry struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func newResult(list, dryRun bool) jsonResult {
	operation := "adopt"
	switch {
	case list:
		operation = "list"
	case dryRun:
		operation = "preview"
	}
	return jsonResult{Schema: "se-adopt.result.v1", Operation: operation, Diagnostics: []adopt.Diagnostic{}}
}

type reporter struct {
	json   bool
	stdout io.Writer
	result jsonResult
}

func (r *reporter) write() error {
	encoder := json.NewEncoder(r.stdout)
	encoder.SetIndent("", "  ")
	return encoder.Encode(r.result)
}

// fail renders an error. A failed result never reports created files.
func (r *reporter) fail(code string, err error, action string) error {
	if !r.json {
		return err
	}
	r.result.OK, r.result.Created = false, 0
	r.result.Error = &jsonError{Code: code, Message: err.Error(), Action: action}
	if writeErr := r.write(); writeErr != nil {
		return writeErr
	}
	return errReported
}

func (r *reporter) copyFailure(err error, result adopt.Result) error {
	var conflicts *adopt.ConflictError
	code, action := "preflight-failed", "correct the reported input or path, then run again; no files were written"
	switch {
	case errors.As(err, &conflicts):
		code, action = "destination-conflict", "resolve every listed diagnostic, then run again; no files were written"
	case errors.Is(err, adopt.ErrWrite):
		code, action = "write-failed", "files created by this run were removed where possible; created directories can remain and removal errors are ignored, so inspect the destination before you run again"
	}
	if r.json {
		return r.fail(code, err, action)
	}
	if len(result.Diagnostics) == 0 {
		return err
	}
	var details strings.Builder
	for _, diagnostic := range result.Diagnostics {
		fmt.Fprintf(&details, "\n  %s: %s: %s\n    action: %s", diagnostic.Code, diagnostic.Path, diagnostic.Message, diagnostic.Action)
	}
	if !result.Complete {
		details.WriteString("\n  inventory incomplete: more conflicts can exist after the error above is corrected")
	}
	return fmt.Errorf("%w%s", err, details.String())
}
