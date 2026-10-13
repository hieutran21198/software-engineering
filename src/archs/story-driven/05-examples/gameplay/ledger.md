# Ledger: Gameplay Treatment

## Identity and constraints

Link the [original ledger](../world/ledger.md), [access rules](../core/setting-rules.md) and [supported game actions](../core/game-design-foundation.md). This record owns behavior, not a second history of the object.

## Interaction

Inspect requires authorization_signed. Successful inspection sets original_seen and displays authenticated record contents. Compare requires original_seen and notice_read, then sets evidence_compared. Certification requires evidence_compared and the custodian's separate signature, then sets copy_certified.

The original cannot be acquired, consumed, duplicated or used as a supernatural truth detector. The certified copy is a disclosure instrument; its two outcome uses are specified by the [quest](../narrative/game.md). Invalid attempts explain the missing condition without destroying progress.

## Review

Fictional capability and playable behavior agree. No unsupported verb or move ability is introduced. Real interaction usability remains untested until downstream implementation.
