# Game Design Foundation: Paper Investigation

## Applicability

Game only, informed by the [direction](creative-direction.md), [access rules](setting-rules.md) and [narrative promise](narrative-foundation.md).

## Actions and state

The loop is inspect an account → question a witness → compare authenticated evidence → choose disclosure → observe consequences. Supported verbs are inspect, question, compare, request certification and disclose. There is no movement, stealth or combat requirement in this paper slice.

State meanings: notice_read, original_seen, authorization_signed, evidence_compared, copy_certified, recollection_heard and disclosure_outcome. Outcomes are unset, public_release or restricted_inquiry. Information flags record discovery, not objective truth.

## Conditions and recovery

Inspection of the sealed original requires authorization; the public notice can be inspected without it. Comparison needs notice_read and original_seen. Final disclosure needs evidence_compared and copy_certified; requesting certification follows comparison. Optional recollection never gates progress. Premature decisions return clear missing-evidence feedback and leave state unchanged. Disagreement can be revisited; the slice has no permanent investigative dead end. A committed disclosure ends this local decision sequence.

## Check

Each consequential action changes supported state and produces feedback. Never call an impossible or purely cosmetic response an alternative outcome. Implemented usability and balance remain downstream tests.
