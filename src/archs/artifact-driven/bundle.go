// Package artifactdriven supplies the self-contained ADD knowledge bundle.
package artifactdriven

import "embed"

// Bundle contains the documentation and role skills shipped with se-adopt.
//
//go:embed README.md 01-foundation 02-methodology 03-execution 04-patterns 05-adoption 06-guidelines
var Bundle embed.FS
