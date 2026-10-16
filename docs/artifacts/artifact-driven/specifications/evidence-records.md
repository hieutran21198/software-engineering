# Structured validation and publication evidence

## Ownership and compatibility

Governs A1, A2 and A4. ADD owns these optional YAML fields in existing Markdown records. They describe recorded checks and publication reviews. They do not store workflow state or approval. Existing prose-only records remain readable through legacy rules. An explicitly present malformed field is invalid; consumers must not fall back to a favorable prose interpretation for that evidence category.

## Check records

A task or phase document may declare evidence_records, a list of objects with id, method, result and source. id is unique within that file and matches [a-z0-9][a-z0-9-]*. method is nonempty descriptive text. result is passed, failed or incomplete. source is a safe repository-relative Markdown path with an optional heading fragment, resolving to nonempty check details. It may target the same file's Evidence section. Reject traversal, absolute paths, backslashes, NUL, escaping symlinks, duplicate IDs or keys, wrong types, missing targets and empty sections. Source detail includes what was checked, the observed outcome and relevant implementation/test references. A bare marker or front matter is insufficient. Commands are inert text.

A phase document may additionally declare self_check with result and source under the same rules. A passed self_check means documented completion of that document's check only. It does not prove other phase documents, task DoD, approval, independent execution or publication. Tasks still require their applicable DoD criteria; a passed record cannot override an unchecked criterion or a failed/incomplete relevant record. Empty evidence_records supplies no positive completion evidence. Conflicting structured/prose results produce a diagnostic and no positive aggregate completion. Readers show exact evidence sources and distinguish recorded from independently executed checks.

## Publication records

An artifact root or owning unit brief may declare publication_reviews, a list of objects with artifact, version, source and required_changes. artifact is a safe artifact ID; version is an existing snapshot directory ID; source resolves to nonempty scoped review detail. required_changes is a nonempty list of objects with repository, scope and pull_request. repository is the repository's explicit HTTPS remote identity; scope is nonempty human-reviewed text defining required knowledge, implementation and retained-delivery changes; pull_request is a same-host, same-repository HTTPS PR URL. Reject credentials in URLs, duplicate repository/PR pairs, mismatched artifact/version ownership, missing/ambiguous provenance, invalid types and conflicting assertions. Records are claims about required merges, not a machine-derived complete code dependency inventory.

The source states that the listed required knowledge, implementation and retained-delivery changes landed on main/master and explains scope/exclusions. Readers must also verify exact snapshot and originating delivery path sets and bytes against local protected refs. Missing or conflicting refs, changed evidence, missing source or conflicting reviews keep establishment unknown/unverified. The Plane offline reader does not fetch PRs or trust a URL as proof. A coordinator verifies remote PR states and required repository refs during publication reconciliation and records the method and remaining limitations. Existing scoped prose review remains supported only when structured publication_reviews is absent.

## Reconciliation procedure

Inspect declared root version, candidate complete snapshots, source_change and delivery_tasks, current implementation, required PR merges and check outcomes. Verify knowledge and delivery path sets on protected refs; verify required implementation scopes against their owning repositories. Keep merged publication and passing validation separate: a failed CI run remains failed even after merge. Record the exact missing proof and smallest next action. Prepare root/dependency-index corrections on a dedicated branch only after the evidence supports them. Preserve established snapshots and originating task evidence. Do not select the largest version number automatically or assume a package version is the artifact version.

## Self-check

All fields have types, resolution, failure and compatibility rules. No approval field, state registry, automatic merge or new remote service is introduced. KISS reuses unit/task evidence and protected-ref checks. STE keeps claim and verification meanings explicit. Self-check: passed.
