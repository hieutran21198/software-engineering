# Edit launch profiles in the workbench through a provider catalog

## Context

The owner asked to configure launch profiles and providers in the workbench. The runner later runs the program of a profile. The workbench talks to the local server over HTTP with loopback, Host and Origin checks. A route that saves an arbitrary program would let any request that passes these checks choose the next program that the runner starts.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Read-only profiles | The person edits the settings file by hand; the workbench only shows it. | Simple, but the owner asked for configuration in the workbench. Rejected. |
| B. Free-form commands in the workbench | The editor saves any argument list as the profile command. | The HTTP server could define any program for the runner. Rejected. |
| C. Provider catalog with validated arguments | The editor selects a provider, a connection, a model and a reasoning level; Plane derives the program from a built-in catalog and adds validated extra arguments. | Covers the five harness tools, keeps the program set fixed and still allows flags. Selected. |
| D. Profiles in the runtime store | Keep profiles in SQLite beside the observations. | The person cannot read or edit them by hand, and configuration mixes with observations. Rejected. |

## Decision

Adopt option C as defined in specifications/agent-orchestration.md. A profile with `harness: other` and a full command stays possible in the file, but the workbench does not edit it.

## Consequences

A new harness tool needs a catalog entry in a later change. The settings file stays the only place for profiles and role defaults, and Plane writes it atomically with private permissions. Provider checks start agent programs without a prompt, so they can leave empty sessions in harness histories.
