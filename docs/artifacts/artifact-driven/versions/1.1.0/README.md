# Implementation task DAG

Baseline: established 1.0.0. This change makes implementation prerequisites explicit and supports a derived task graph for each change. Retain valid baseline knowledge and historical task evidence.

## Scope

ADD owns task metadata, graph validation, plan membership, and delivered bundle guidance. Artifact Plane owns visualization in a separate dependent change.

## Proposed knowledge

- Requirements
- Task graph specification
- [Implementation plan](tasks/README.md)
- Task metadata decision

## Proposed release

ADD 1.1.0 adds the task DAG contract and preserves legacy plans. The user confirmed this version after implementation validation. The full snapshot and publication declarations remain proposed until team merge. Artifact Plane consumes this contract in a separately prepared change; it has not been implemented.

## Knowledge snapshot

This record was converted from the legacy snapshot layout. Its knowledge is `docs/artifacts/artifact-driven/versions/1.1.0/` in the tree of the first-parent commit on main that introduced this README: `git log --first-parent --diff-filter=A main -- docs/artifacts/artifact-driven/versions/1.1.0/README.md`.
