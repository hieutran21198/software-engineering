# Give system views an ordinary owner artifact and a front matter declaration

## Context

Issue 60 asks for diagrams of the whole system: context, logical architecture and deployment. Every ADD element belongs to one artifact, and a unit brief owns no knowledge. A system view crosses artifacts, so it needs an owner and a way for readers to find it. The [diagram scopes contract](../specifications/diagram-scopes.md) needs one rule for both. On 27 October 2026 the owner selected an ordinary artifact as the owner.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Ordinary owner artifact, document front matter `system_view: true` | The project picks an artifact that owns the system views. Each document with system views declares the key. Readers list the declared documents. | Uses the existing change, version and approval gates. The declaration is a structural fact in front matter, as the artifact model requires. One optional key; no registry. Selected. |
| B. Ordinary owner artifact, identity record key | The identity record of the owner artifact names the document that holds the system views. | Puts a document path into the identity record, which holds only version and dependency facts. A rename of the document breaks the record. Rejected. |
| C. Ordinary owner artifact, path convention | Readers treat a fixed path, such as `specifications/system/`, as system views. | Readers then derive a structural fact from a directory name. A project with another layout cannot use it. Rejected. |
| D. Repository overview page | A page outside every artifact holds the system views. | The page has no owner, change or version, so no ADD gate covers it. Rejected by the owner. |
| E. Views derived by a reader only | A reader composes a system picture from identity records, flows and models. | No record holds actors, external systems or infrastructure, so context and deployment views are not possible. Rejected by the owner. |

## Decision

Adopt option A as the diagram scopes contract specifies. The owner artifact is an ordinary artifact. A working requirement, specification or decision document declares `system_view: true`. Readers ignore other values and flow records.

## Consequences

Readers that know the key can show an entry for the system views, and other readers still show the documents as ordinary knowledge. A change that alters a fact of a system view in another artifact includes a change of the owner in its unit. A project without system views needs no change. The validator gets no rule for the key in this change.
