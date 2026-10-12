---
name: asd-ste-100
description: Write new English documents or rewrite existing documents using Simplified Technical English principles. Use for technical documentation, instructions, explanations, and requests to remove AI slop or improve readability. Preserves technical meaning and flags missing or ambiguous information; does not certify ASD-STE100 compliance.
---

# STE-based writing and rewriting

Write or rewrite English so readers can understand the facts and actions on the first reading. Apply STE principles as a practical writing approach, without claiming formal ASD-STE100 compliance or an approved dictionary check.

## Choose the task

- **Write a new document:** Use the user's brief, requirements, notes, and available source material. Identify the intended audience, purpose, and document type from context. Ask only for missing information that materially affects the result; do not require an existing draft. Organize the document around what readers need to understand or do. Include supported facts and necessary explanations without inventing specifications, prerequisites, hazards, or guarantees. Flag essential information gaps rather than filling them with plausible details.
- **Rewrite an existing document:** Edit the supplied text or requested files, including documents that do not follow STE principles. Preserve technical meaning and useful structure. Reorganize dense passages when this improves understanding without changing scope, conditions, or dependencies.
- **Combine both:** When asked to extend an existing document, apply rewriting safeguards to existing content and new-writing safeguards to additions. Keep terms consistent throughout.

Apply the language and AI-slop guidance below in all modes. If the request does not make the task clear, ask whether the user wants a new document or a rewrite.

## Preserve meaning

- Keep facts, technical relationships, conditions, exceptions, uncertainty, and obligation levels. Do not change “may” to “will,” “should” to “must,” or a possibility into a guarantee.
- Preserve numbers, units, tolerances, identifiers, commands, code, links, and exact UI labels. Keep warnings and their severity, prerequisites, and required action order.
- Keep established technical terms when simpler substitutes would change meaning. Use the same term for the same thing; do not vary terms for style.
- Resolve ambiguous references only when the supplied context supports one interpretation. If the actor, object, condition, or meaning remains unclear, flag it with a focused question. Do not invent missing technical facts or turn vague guidance into an unsupported procedure.

## Make the language direct

- Prefer familiar, concrete words and verbs. Replace inflated phrases when the simpler wording preserves meaning: “utilize” → “use”; “in order to” → “to.” Treat these as editing examples, not an approved-word list.
- Give each sentence one main idea. Split long sentences at logical boundaries, while keeping conditions and exceptions attached to the correct action.
- Prefer active voice when the actor is known. Keep passive voice when the actor is unknown or irrelevant; do not invent one to satisfy a style rule.
- Name the object when a pronoun could refer to more than one thing. Unpack dense noun groups and nominalizations when their relationships are clear.
- Put a condition before the action it controls when this helps readers act correctly. Keep negation and limits explicit.
- For procedures, use imperative verbs and separate actions into steps. Preserve sequence and dependencies. For explanations, retain descriptive prose; do not convert facts into instructions.
- Use short sentences as a readability aid, not a rigid word-count test. Retain enough detail to explain the meaning accurately.

## Remove AI slop

When writing, avoid empty introductions, repeated conclusions, filler transitions, generic praise, unnecessary metaphors, and promotional adjectives that add no information. When rewriting, remove them. Use concrete statements supported by the brief or source material; do not invent details to replace vague abstractions.

Judge words in context. Do not apply a universal blacklist, erase useful nuance, make the text mechanical, or change the user's intended tone and audience without reason. Concision must not remove necessary information.

## Deliver and check

Return the new or rewritten document by default, or edit the requested files when the user asks for file changes. Use headings, lists, and formatting that suit the document; preserve useful existing structure when rewriting. Add a brief note only for unresolved ambiguity, essential missing information, or a material limitation. Provide explanations or before/after comparisons when requested.

Before returning the result, check facts, technical terms, quantities, conditions, negation, obligations, warnings, and action order against the available material. For new documents, check that the result serves the requested purpose and that claims and instructions are supported. For rewrites, compare with the original to confirm that no unsupported claim or instruction was introduced and no necessary information was lost.

For a rewrite, if the source text or file cannot be found, ask for it. For new writing, proceed from the brief when it provides enough information. If the user requests certified or strict compliance, explain that this skill applies principles only and that formal checking requires the applicable rules and dictionary.

## Source and scope

The official [ASD-STE100 FAQ](https://www.asd-ste100.org/STE_faq.html) explains that STE combines writing rules and a controlled dictionary, with consistent word meanings. This skill is a practical adaptation for writing and rewriting, not a reproduction of that standard. Applying these writing principles does not itself require browsing; verify subject-matter facts when the task requires it.
