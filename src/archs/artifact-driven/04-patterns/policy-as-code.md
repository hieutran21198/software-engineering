# Policy as Code

## Purpose and Applicability

Express authorization or infrastructure rules as executable policies with repeatable checks. Use this pattern when rules need consistent enforcement across components or deployments. A policy engine is optional; use existing tools where they meet the requirement.

Executable policy implements governed rules. It does not become a competing source of requirements or architectural decisions.

## Inputs and Outputs in ADD

| Phase | Inputs | Outputs |
| --- | --- | --- |
| Requirement | Access rules, isolation needs, or infrastructure constraints. | Required allowed and denied outcomes. |
| Specification | Completed rules and consuming components. | Policy inputs, outputs, enforcement points, failure behavior, and applicable ADRs. |
| Plan | Completed policy contracts. | Implementation, enforcement, and policy-test tasks. |
| Implementation | Approved tasks. | Executable policies, integration code, tests, and evidence. |

## Apply

Keep policy knowledge under its owning artifact. Specify who supplies trusted identity and resource data, where decisions are enforced, and how missing inputs or evaluation failures are handled. Do not assume a particular failure policy without a requirement or explicit decision.

Test both permission grants and denials, including applicable tenant boundaries. Define the meanings of policy inputs so consumers do not make independent assumptions. Evaluate a necessary architectural choice in an ADR when multiple options exist.

If enforcement behavior changes, analyze its consumers and update contracts and tasks. A material change requires renewed plan approval before affected implementation. Select a policy language or engine through the normal Specification process, not merely to adopt this pattern.

## Validation

Check representative valid and invalid inputs, missing data, and applicable error outcomes. Test the enforcement integration as well as the policy function; a correct decision has no effect if callers ignore it. Record checks and results with tasks.

## Example

A confirmed tenant isolation rule allows a member to access resources only in their tenant. Policy tests cover same-tenant access and cross-tenant denial. Integration tests verify that the API actually enforces the returned decision and uses trusted tenant identity.

## Research Basis

Open Policy Agent documentation, *Policy Testing*, describes executable tests for policy behavior. OPA is one implementation option; artifact ownership and workflow guidance above are ADD conventions.
