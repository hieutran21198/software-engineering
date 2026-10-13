# Software Engineering

A repository of knowledge, templates, and seed files for software and creative project architecture.

## Overview

This repository helps engineers and creators document and organize project knowledge. It stores reusable resources that teams can adapt to their projects.

The resources include ADD guidance and role skills, a story knowledge architecture for novels and games, reusable patterns, a project README template, and agent skills for clear writing and simple solutions. The Go command `se-adopt` selects an architecture bundle and copies it into a consumer workspace. Available architectures are Artifact-Driven Development (`artifact-driven`) and the Story-Driven Knowledge Framework (`story-driven`). ADD remains the default.

## Responsibilities

- Store knowledge about software project architecture and story-driven creative projects.
- Provide reusable documentation templates and seed files.
- Organize resources by architecture approach and supporting utility.
- Provide agent skills that help create and maintain technical documents.

## Getting Started

Download the binary for your operating system and processor, plus `SHA256SUMS`, from [GitHub Releases](https://github.com/hieutran21198/software-engineering/releases). Follow the [download and checksum instructions](src/archs/artifact-driven/05-adoption/README.md#download-the-binary), then run:

```sh
./se-adopt --project /path/to/consumer
```

Go and a source checkout are not required. On Windows, use `.\se-adopt.exe` and your consumer workspace path. Use `./se-adopt --list` to see available architectures, or add `--arch artifact-driven` to select ADD explicitly.

The default output is `docs/<architecture>` inside the consumer workspace: `docs/artifact-driven` for ADD or `docs/story-driven` for story knowledge. Use `--dry-run` to preview or `--output` to choose a different relative destination. See the [adoption guide](src/archs/artifact-driven/05-adoption/README.md) and [end-user guidelines](src/archs/artifact-driven/06-guidelines/README.md) for details.

To adopt story knowledge guidance and skills:

```sh
./se-adopt --arch story-driven --project /path/to/consumer
```

See the [Story-Driven Knowledge Framework](src/archs/story-driven/README.md) for domain guidance, novel/game workflows, templates, and the shared example. Keep authored knowledge separate from the reusable bundle.

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
│   ├── artifact-driven/
│   │   ├── README.md
│   │   ├── 01-foundation/
│   │   ├── 02-methodology/
│   │   ├── 03-execution/
│   │   ├── 04-patterns/
│   │   ├── 05-adoption/
│   │   └── 06-guidelines/
│   └── story-driven/    # Story knowledge, workflow, skills, templates, and examples
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

- [ADD project artifact](https://github.com/hieutran21198/software-engineering/blob/main/docs/artifacts/artifact-driven/README.md): Recovered ADD requirements, contracts, decisions, and validation evidence for future changes.

- [Artifact-Driven Development](src/archs/artifact-driven/README.md): Foundation, methodology, execution skills, and reusable patterns for coordinating artifact-centered work.
- [Story-Driven Knowledge Framework](src/archs/story-driven/README.md): Shared Core and Content, creative assistance, and novel/game story skeletons.
- [Project README template](src/utils/project/assets/templates/README.md): A starting structure for documenting a project's purpose, responsibilities, setup, and development workflow.
- [ASD-STE100 principles skill](src/utils/agents/skills/asd-ste-100/SKILL.md): Guidance for writing new documents or rewriting existing documents with Simplified Technical English principles. It improves readability and removes filler while preserving technical meaning. It does not certify compliance with ASD-STE100.

- [KISS skill](src/utils/agents/skills/kiss/SKILL.md): Choose simple solutions that meet current requirements and preserve necessary contracts and checks. KISS and ASD-STE100 principles are required skills for ADD and ship in its adopted bundle.
