package main

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"software-engineering/internal/adopt"
	"software-engineering/src/archs"
)

func main() {
	if err := run(os.Args[1:], os.Stdout, os.Stderr); err != nil {
		fmt.Fprintln(os.Stderr, "se-adopt:", err)
		os.Exit(1)
	}
}

func run(args []string, stdout, stderr io.Writer) error {
	flags := flag.NewFlagSet("se-adopt", flag.ContinueOnError)
	flags.SetOutput(stderr)
	project := flags.String("project", ".", "existing consumer workspace directory")
	architectureName := flags.String("arch", archs.Default, "architecture to adopt; use --list to see available bundles")
	output := flags.String("output", "", "workspace-relative destination (default docs/<architecture>)")
	list := flags.Bool("list", false, "list bundled architectures without writing")
	dryRun := flags.Bool("dry-run", false, "check conflicts and preview adoption without writing")
	flags.Usage = func() {
		fmt.Fprintln(stderr, "Usage: se-adopt [--arch name] [--project directory] [--output relative-path] [--dry-run]")
		fmt.Fprintln(stderr, "       se-adopt --list")
		fmt.Fprintln(stderr, "Copy a bundled software architecture into a consumer workspace.")
		flags.PrintDefaults()
	}
	if err := flags.Parse(args); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return nil
		}
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("unexpected arguments: %v", flags.Args())
	}
	if *list {
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
		return fmt.Errorf("unsupported architecture %q; available: %s", *architectureName, strings.Join(names, ", "))
	}
	destination := filepath.Join("docs", architecture.Name)
	flags.Visit(func(f *flag.Flag) {
		if f.Name == "output" {
			destination = *output
		}
	})
	result, err := adopt.Copy(architecture.Bundle, *project, destination, *dryRun)
	if err != nil {
		return err
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
