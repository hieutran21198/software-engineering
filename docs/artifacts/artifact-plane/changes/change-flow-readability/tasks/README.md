---
tasks:
  - 01-presentation.md
  - 02-navigation.md
---

# Flow readability plan

- [Presentation and validation](01-presentation.md)
- [Navigation consistency](02-navigation.md)

## Plan self-check

One task owns the related component and style changes plus focused browser validation. Its ID is unique, prerequisites are explicit and the task graph is acyclic. Requirements and specifications cover the screenshot symptoms. ADD 2.1.0 is already established; no new dependency is proposed. KISS avoids parallel work for this small change. STE keeps user notices concise and diagnostic facts available. Implementation waits for explicit approval of this new plan.

## Amendment self-check

The new task depends on the validated first task and stays in this same open change. Two unique IDs and one resolved dependency form an acyclic graph. Scope includes shared controls, session state and synchronized panels. Existing evidence is retained, with shared acceptance marked incomplete pending new checks. Execute sequentially after explicit approval of this amendment.

The pending second task also covers the user-requested lazy pages and newest-first ordering. Creation metadata is the only additive backend scope. Fresh pagination, date provenance and HTTP/MCP parity checks are required. No added task dependency or parallel worker is needed.
