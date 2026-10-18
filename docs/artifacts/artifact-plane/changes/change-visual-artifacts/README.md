# Add visual representations and render Mermaid in document pages

## Reason and scope

On 18 October 2026 the user asked to improve the current artifacts with the representations that the ADD 2.7.0 guide selects, and to make the Plane show the diagrams. A survey found 25 high- and medium-priority candidates in 16 artifact-plane specifications. The Plane shows a fenced Mermaid block as a plain-text code panel today, so the change also adds Mermaid rendering to document pages. It belongs to the visual-artifacts unit.

## Baseline and ownership

The baseline is established Artifact Plane 1.18.0 on main at 89ed23a, which depends on ADD 2.8.0. Knowledge and code are edited on branch claude/visual-artifacts. This is the artifact's single active change.

- [Requirements](../../requirements/visual-artifacts.md)
- [Representation contract](../../specifications/visual-artifacts.md)
- [Rendering contract](../../specifications/diagram-rendering.md)
- [Decision 017](../../decisions/017-bundled-mermaid-rendering.md)
- [Plan](tasks/README.md)
