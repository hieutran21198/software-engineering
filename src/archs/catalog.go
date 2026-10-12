// Package archs lists the architecture bundles supported by se-adopt.
package archs

import (
	"io/fs"

	artifactdriven "software-engineering/src/archs/artifact-driven"
)

const Default = "artifact-driven"

type Architecture struct {
	Name        string
	Description string
	Bundle      fs.FS
}

// Available returns a fresh catalog. Add future embedded bundles here; the
// command and adoption engine do not require architecture-specific branches.
func Available() []Architecture {
	return []Architecture{
		{Name: "artifact-driven", Description: "Artifact-Driven Development (ADD)", Bundle: artifactdriven.Bundle},
	}
}

func Lookup(name string) (Architecture, bool) {
	for _, architecture := range Available() {
		if architecture.Name == name {
			return architecture, true
		}
	}
	return Architecture{}, false
}
