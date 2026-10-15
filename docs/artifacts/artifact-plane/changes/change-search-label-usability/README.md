# Consistent search and readable graph labels

The user reported that searching a flow title leaves the results apparently unchanged, that Unit of Work and Flow search interactions differ, and that nodes hide edge text. The user also requested an Artifact filter in Flows and automatic artifact selection from Find participating flows.

The root declares 1.11.0. This change starts with its complete knowledge and incorporates the merged 1.12.0 contracts from PR #24 as explicit supplemental knowledge. It excludes historical tasks and delivered provenance. Existing versions and originating changes remain unchanged. The package is 1.12.0; a compatible patch 1.12.1 is proposed after validation and review. No lifecycle repair is inferred.

Source inspection confirms that UnitList filters title/ID immediately, while Flows submits a separate search state and receives ranked discovery candidates. Flow labels use default smoothstep midpoints and Dagre layout without label dimensions or node-collision checks. Dependency labels also use default edge rendering. The screenshot could not be decoded by the available viewer; its exact graph and geometry are not independently verified.

- [Requirements](requirements/search-label-usability.md)

## Requirement self-check

Scope includes all three user reports. Normal title/ID filtering and behavior discovery have distinct purposes. Existing HTTP/MCP discovery, graph semantics, read-only guards, prior fixes and historical evidence remain required. The sole owner is Artifact Plane; ADD 2.1.0 remains its existing supplier. KISS uses current search and graph boundaries. STE separates code evidence from the unverified screenshot. No Requirement blocker remains for Specification.

- [Search and label contract](specifications/search-label-usability.md)
- [Presentation decision](decisions/010-search-and-label-presentation.md)

## Specification self-check

The contract covers filtering before paging, compatible discovery, shared controls, async isolation and node-aware readable labels. The existing ADD 2.1.0 supplier is unchanged. Full model and source guards remain. No implementation is authorized by this preparation.

- [Concrete implementation plan](tasks/README.md)

## Plan self-check

Four tasks cover service matching, graph labels, common controls and combined validation. Three prerequisite edges resolve with no cycle. The same capable session completed Specification and Plan sequentially. No implementation files were changed. The concrete plan awaits explicit user approval.

## Additional discovery

RecordedPicker reads stored capture contexts and opens a captured implementation graph with observed attempts. It is implemented, not a planned placeholder. The default local runtime query returned an available store with zero contexts and zero attempts; a differently configured server store can differ. This question does not add observer or history redesign to the search outcome.

Find participating flows currently enters reverse-relationship discovery with an artifact/element selector, but exposes no Artifact dropdown in Flows. The new filter preserves explicit participation across flow owners; it must not become a filter only on flow.artifact.

## Approved delivery

The user explicitly approved the updated four-task plan, including Artifact filtering and contextual entry. Implementation proceeded on a dedicated branch after ADD 2.1.0 was verified on main. Earlier self-checks record phase boundaries, not current implementation blockers. The proposed patch awaits integrated validation and team review.
