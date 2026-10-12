# Behavior-Driven Development

## Purpose and Applicability

BDD uses collaborative discovery and concrete examples to clarify behavior. It is not simply a test syntax. Use it when examples help distinguish business rules, edge cases, and acceptance outcomes.

## Inputs and Outputs in ADD

| Phase | Inputs | Outputs |
| --- | --- | --- |
| Requirement | User needs, rules, questions, and representative examples. | Acceptance criteria and agreed behavior examples. |
| Specification | Completed requirements and examples. | Precise behavior and contracts consistent with those outcomes. |
| Plan | Completed behavior and contracts. | Tasks that reference scenarios and specify meaningful checks. |
| Implementation | Approved tasks. | Automated behavior checks where useful, plus task evidence. |

## Apply

The PO gathers examples while interviewing the user and distinguishes agreed outcomes from open questions. The TL consumes the completed Requirement output. If an example exposes a missing business rule during Specification, return to Requirement; collaboration does not bypass phase gates.

Keep scenarios in the owning artifact's requirements. Specifications and tasks reference them rather than maintaining duplicate authoritative copies. Executable tests in implementation repositories trace back to the governing behavior.

Use Given/When/Then when it improves clarity. Cucumber and Gherkin tooling are optional. Prefer observable outcomes over incidental UI clicks or internal implementation details.

## Example

The following illustrative scenario assumes the PO has confirmed the membership rule:

```gherkin
Feature: Tenant-scoped login
  Scenario: A user has no active membership
    Given a user has valid credentials
    And the user has no active membership in the requested tenant
    When the user attempts to sign in to that tenant
    Then access to that tenant is denied
```

The TL specifies the actual protocol and response details. Those details do not replace the business outcome.

## Validation

Check that examples represent the agreed rules, including relevant successful and unsuccessful outcomes. Connect task checks to these scenarios and record results. Passing scenarios show evidence for the covered outcomes; they do not replace other contract, invariant, or integration checks.

## Research Basis

Cucumber documentation, *Introduction*, explains discovery, collaboration, and examples. This document maps that practice into ADD's existing role ownership and phase gates.
