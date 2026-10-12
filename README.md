# Software Engineering

A repository of knowledge, templates, and seed files for software project architecture.

## Overview

This repository helps software engineers document and organize project architecture. It stores reusable resources that teams can adapt to their projects.

The resources include ADD guidance and role skills, reusable patterns, a project README template, and agent skills for clear writing and simple solutions. The Go command `se-adopt` selects an architecture bundle and copies it into a consumer workspace. ADD is the first available architecture.

## Responsibilities

- Store knowledge about software project architecture.
- Provide reusable documentation templates and seed files.
- Organize resources by architecture approach and supporting utility.
- Provide agent skills that help create and maintain technical documents.

## Getting Started

To adopt ADD, build the command with Go 1.25 or later from this repository:

```sh
go build -o /tmp/se-adopt ./cmd/se-adopt
/tmp/se-adopt --project /path/to/consumer
```

Use `/tmp/se-adopt --list` to see available architectures, or add `--arch artifact-driven` to select ADD explicitly.

The default output is `docs/<architecture>` inside the consumer workspace, currently `docs/artifact-driven`. Use `--dry-run` to preview or `--output` to choose a different relative destination. See the [adoption guide](src/archs/artifact-driven/05-adoption/README.md) and [end-user guidelines](src/archs/artifact-driven/06-guidelines/README.md) for details.

For individual resources:

1. Find a resource in the [Documentation](#documentation) section.
2. Copy the template or seed file into your project, or read the relevant guidance.
3. Adapt the content to your project's requirements and architecture.
4. Remove sections that do not apply or that you cannot complete yet.

## Development

### Project Structure

```text
cmd/se-adopt/          # Adoption command
internal/adopt/        # Workspace copy logic
src/
├── archs/
│   └── artifact-driven/
│       ├── README.md
│       ├── 01-foundation/
│       ├── 02-methodology/
│       ├── 03-execution/
│       ├── 04-patterns/
│       ├── 05-adoption/
│       └── 06-guidelines/
└── utils/
    ├── agents/
    │   └── skills/
    │       ├── kiss/
    │       │   ├── SKILL.md
    │       │   └── agents/
    │       │       └── openai.yaml
    │       └── asd-ste-100/
    │           ├── SKILL.md
    │           └── agents/
    │               └── openai.yaml
    └── project/
        └── assets/
            └── templates/
                └── README.md
```

| Path | Purpose |
| --- | --- |
| `src/archs/` | Resources grouped by architecture approach. |
| `src/utils/project/assets/templates/` | Reusable project documentation templates. |
| `src/utils/agents/skills/` | Reusable agent skills that support software engineering work. |

### Commands

```sh
go test ./...
go vet ./...
go build -o /tmp/se-adopt ./cmd/se-adopt
```

### Documentation Website

The documentation site is [hieutran21198.github.io/software-engineering](https://hieutran21198.github.io/software-engineering/).

Use Node.js 24 to run it locally:

```sh
cd website
npm ci
npm start
```

Use `npm run build` to check the production site and `npm run serve` to preview it. The site reads this README and Markdown files under `src/`. Edit these sources; `website/.docs/` is generated. Mermaid diagrams render on the site.

GitHub Actions tests Go, builds `se-adopt` for Linux, macOS, and Windows on AMD64 and ARM64, and builds the site on pull requests and pushes to `main` or `master`. Download binaries and `SHA256SUMS` from the workflow's `se-adopt` artifact. To publish a versioned GitHub Release, push a tag such as `v1.0.0` for a reviewed commit. Tagged builds run the same checks and attach all six binaries and checksums to the release. Tag builds do not deploy the website.

Set **Settings → Pages → Build and deployment → Source** to **GitHub Actions** in the GitHub repository. Successful default-branch builds deploy after Go checks pass. Pull requests build without deploying. The workflow also supports manual runs. A custom domain can use `SITE_URL` and `SITE_BASE_URL` in the documentation build environment.

### Adding an Architecture

Keep its knowledge under `src/archs/<name>/` and expose an embedded `fs.FS` bundle, preserving relative links. Register its name, description, and bundle in `src/archs/catalog.go`. Rebuild `se-adopt`; selection and the `docs/<name>` destination then use the catalog without changes to the copy engine. Add CLI coverage for the new selection and validate its adopted links.

## Documentation

- [Artifact-Driven Development](src/archs/artifact-driven/README.md): Foundation, methodology, execution skills, and reusable patterns for coordinating artifact-centered work.
- [Project README template](src/utils/project/assets/templates/README.md): A starting structure for documenting a project's purpose, responsibilities, setup, and development workflow.
- [ASD-STE100 principles skill](src/utils/agents/skills/asd-ste-100/SKILL.md): Guidance for writing new documents or rewriting existing documents with Simplified Technical English principles. It improves readability and removes filler while preserving technical meaning. It does not certify compliance with ASD-STE100.

- [KISS skill](src/utils/agents/skills/kiss/SKILL.md): Choose simple solutions that meet current requirements and preserve necessary contracts and checks. KISS and ASD-STE100 principles are required skills for ADD and ship in its adopted bundle.
