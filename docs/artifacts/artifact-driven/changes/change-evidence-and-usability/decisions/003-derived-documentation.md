# Derived website and portable release assets

## Recovery basis

Observed choices are recovered from current sources. Historical reasoning and original approval are not inferred. The artifact boundary from ADR 001 is retained. These recovered choices remain applicable; the current evidence extension is recorded separately in ADR 009.

## Context

The repository maintains Markdown under src plus the overview; Docusaurus generates a website and CI builds embedded binaries.

## Decision

Retain observed generated website/.docs, strict-link build, existing GitHub Actions Pages conditions and six-target binary/checksum release packaging. Do not add a second maintained document tree or change deployment configuration.

## Alternatives considered during recovery

Maintaining website content separately would duplicate knowledge. Publishing project artifacts or replacing the build/release platform would change current delivery scope. Neither is required for the current evidence extension.

## Consequences

Builds validate sources but do not prove deployed availability. Project artifacts remain local Git knowledge under the current generator. Artifact versions and binary tags have separate establishment meanings.

## Evidence

Repository-relative source paths: website/scripts/prepare-docs.mjs; website/docusaurus.config.js; website/package.json; .github/workflows/ci.yml; repository README.md.
