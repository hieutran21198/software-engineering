# Support a curated icon set that readers bundle

## Context

Issue 60 asks for recognizable icons for actors, applications, data stores, queues and cloud services, including AWS. Icons must not carry the only meaning, and diagrams must load no arbitrary remote resource. Mermaid 11 draws icons from packs that a reader registers, and it draws an unknown-icon mark for a name that no pack supplies. GitHub and the documentation website register no pack. Iconify `logos` 1.2.18 (CC0-1.0) has 65 AWS names; its complete pack is 2.9 MB compressed, and the AWS names are 47 KB. On 27 October 2026 the owner selected a curated bundled set.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Curated bundled set | The AWS names of Iconify `logos` and a short list of generic `lucide` icons. Readers bundle the subset. | Covers AWS and generic roles at a small size. Readers that register no pack still show the labels. Selected. |
| B. Built-in icons only | `cloud`, `database`, `disk`, `internet` and `server`. | Renders in every Mermaid 11 reader, but only in `architecture-beta`, and has no AWS service and no person icon. Rejected by the owner. |
| C. Complete Iconify packs | Bundle the full `logos` and a full generic pack. | Every name works, but the chunk is about 3 MB compressed and the set has no defined limit. Rejected. |
| D. Packs from a CDN | Register loaders that fetch the packs from a public host. | Loads remote resources, breaks loopback readers and their Content-Security-Policy. Rejected. |
| E. Official AWS Architecture Icons | Bundle the icon package that AWS publishes. | The download needs acceptance of separate AWS terms, which this change did not review for redistribution in a tool. The package also covers no generic role. Rejected. |

## Decision

Adopt option A with the names, versions and licenses that the diagram scopes contract lists. The owner's selection also named Mermaid's built-in icons. They resolve only in `architecture-beta`, which the contract does not recommend, so the `lucide` list carries their five equivalents instead. Prefixes stay `logos` and `lucide`, so a reader that registers the full Iconify packs shows the same icons.

## Consequences

The Plane bundles the subset and keeps the ISC notice of `lucide`. GitHub and the website show the unknown-icon mark beside the label of a subset icon; the text and the owner table keep the facts readable. A new icon name needs an ADD change that amends the list.
