---
unit_of_work: story-driven-framework
changes:
  - artifact: story-driven
    change: change-initial
acceptance:
  - id: knowledge
    criterion: A self-contained framework separates Core and Content and supports coherent novel and game skeletons sharing authoritative knowledge.
  - id: delivery
    criterion: The architecture adopts safely with complete skills and portable documentation, and repository validation passes.
    integration: true
evidence:
  - criterion: knowledge
    method: Review domain ownership and independently exercise novel authoring and rule revision using adopted bundles.
    result: passed
    source: docs/artifacts/story-driven/changes/change-initial/tasks/05-validation.md#independent-novel-exercise
  - criterion: delivery
    method: Run Go checks, adoption and bundle tests, and documentation production build.
    result: passed
    source: docs/artifacts/story-driven/changes/change-initial/tasks/05-validation.md#integrated-commands
---

# Story-Driven Framework

## Deliverable outcome

A reusable knowledge architecture and assisted workflow for developing novel and game story skeletons.

## Included and excluded scope

Include the model, domain guidance, creative workflow, skills, templates, worked example, bundle selection, and website delivery. Exclude final manuscripts, engines, production assets, automatic story grading, and changes to existing artifact contracts.

## Combined checks

Go tests, vet, CLI build, all-bundle link/resource checks, safe adoption checks and the website production build passed. Two independent exercises used complete adopted bundles: novel authoring preserved supplied truth, false belief and intentional mystery; revision produced a scoped proposal without changing example canon. Detailed methods and observed results remain in the originating validation task.

Version 1.0.0 and these delivery records are proposed until required team merge. This brief does not claim establishment or completed publication on the protected branch. Membership creates no dependency or establishment gate.
