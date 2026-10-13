# Game Quest Skeleton: The Sealed Archive

## Work brief

A paper investigation quest offering consequential information/disclosure agency, not combat or traversal. Use the [arc](arc.md), [narrative rules](../core/narrative-foundation.md), [game contract](../core/game-design-foundation.md) and shared [event](../world/flood.md). Final engine, art and navigation implementation are downstream.

## Conditions and actions

| Beat | Required input/action | State and feedback |
| --- | --- | --- |
| Public allegation | Inspect the [notice](notice.md). | notice_read becomes true; show the allegation and source. |
| Permission | Question [Iven](../world/iven.md); request inspection. | Explain risks and available evidence. authorization_signed becomes true when he signs. Refusal dialogue can be revisited. |
| Original evidence | Inspect the [ledger treatment](../gameplay/ledger.md) with authorization. | original_seen becomes true; show the written order without inventing private motives. |
| Compare and certify | Compare both accounts, then request a certified copy. | evidence_compared and copy_certified become true in that order; explain the signature's exposure risk. |
| Optional recollection | Ask Iven why he signed the notice, before or after comparison. | recollection_heard becomes true; add personal context, never unlock mandatory evidence. |
| Consequential decision | Choose disclosure after comparison and certification, using the [encounter](../level/confrontation.md). | Commit one disclosure_outcome and show its local consequences. |

The notice and permission can occur in either order; comparison requires both sources. Trying to inspect without permission or disclose early explains the missing input and leaves state unchanged. No mandatory clue is concealed behind optional dialogue. After comparison the player can request certification regardless of whether recollection was heard.

## Local outcomes

- **public_release:** Mara releases the certified copy. The public now sees the order and challenges the old allegation; Iven's signature is exposed and his post is threatened. No court verdict is asserted.
- **restricted_inquiry:** Mara petitions the independent court with the copy under seal. An inquiry opens; the public allegation remains uncorrected pending investigation, while Iven's signature is not publicly exposed.

These are authored possibilities scoped to this work/playthrough, not simultaneous shared facts. Neither changes the past or establishes unknown motives. The player can preview the risks before committing; the disclosure decision then ends the slice.

## Handoff and review

Implement the supported flags, guards, comparison and observable consequences. Keep the physical original in archive custody. Test real interface clarity and recovery downstream; this outline only establishes the knowledge contract. Art/Level rules become prerequisites if production adds visual signals or traversable geometry.
