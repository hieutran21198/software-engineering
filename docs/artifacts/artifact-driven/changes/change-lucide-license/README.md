---
tier: small
---

# Name the MIT part of the Lucide license

## Reason and scope

ADD 3.4.0 lists the license of the `lucide` icon set as ISC only. The Lucide license file also has an MIT notice for the icons that Lucide derives from Feather, and five of the 24 supported names are on that list: `database`, `lock`, `monitor`, `server` and `smartphone`. The Artifact Plane member of the diagram-scopes unit found this when it bundled the license file. On 27 October 2026 the owner asked for this patch. The change amends DS11, the icon table of the diagram scopes contract and of the visual representation guide, and the consequence sentence of decision 019. The icon names, the packaging and every other rule stay the same.

## Plan

One task updates the guide and validates the knowledge. It covers DS11 in requirements/diagram-scopes.md. Compatibility: patch, because the guide only corrects a license statement.

## Tier decisions

The change uses this repository only. No impact tool runs on this branch, so this is the coordinator's assessment: the changed text is the license cell of one table row in the ADD guide and in the ADD contract, one sentence of decision 019 and DS11. The Artifact Plane specification already describes the same two license parts and bundles the whole license file, so no Plane knowledge or code changes. The change-delivery flow and its supports do not change. No other artifact references these sentences. The license file was read from the Lucide repository on 27 October 2026.

- [Requirements](../../requirements/diagram-scopes.md)
- [Specification](../../specifications/diagram-scopes.md)
- [Task](tasks/01-license.md)
