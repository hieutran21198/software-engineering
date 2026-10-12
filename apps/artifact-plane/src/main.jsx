import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  Handle,
  Position,
} from "@xyflow/react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { relationships } from "./graph.js";
import { canvasGraph } from "./canvas.js";
import { elementGroups, typeKey } from "./elements.js";
import "@xyflow/react/dist/style.css";
import "./style.css";

function Handles() {
  return (
    <>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </>
  );
}
function ArtifactNode({ data, selected }) {
  const a = data.artifact;
  return (
    <div
      className={`artifact-node ${data.open ? "expanded" : ""} ${selected ? "selected" : ""}`}
    >
      <Handles />
      <div className="node-head">
        <span className="eyebrow">Artifact</span>
        <button
          className="node-expand nodrag nopan"
          aria-label={`${data.open ? "Collapse" : "Expand"} ${a.title}`}
          onClick={(e) => {
            e.stopPropagation();
            data.toggle(a.id);
          }}
        >
          {data.open ? "−" : "+"}
        </button>
      </div>
      <strong title={a.title}>{a.title}</strong>
      <div className="node-meta">
        <span>
          {a.currentVersion ? `v${a.currentVersion}` : "No established version"}
        </span>
        <span>{a.elements.length} elements</span>
      </div>
      {data.open &&
        data.groups.map((group) => (
          <React.Fragment key={group.type}>
            <button
              className="type-toggle canvas-type nodrag nopan"
              style={{ top: group.y }}
              aria-label={group.label + " in " + a.title}
              aria-expanded={group.open}
              onClick={(event) => {
                event.stopPropagation();
                data.toggleType(a.id, group.type);
              }}
            >
              <span>
                {group.open ? "▾" : "▸"} {group.label}
              </span>
              <span className="type-count">{group.count}</span>
            </button>
            {group.headings.map((heading) => (
              <div
                className="canvas-source-heading"
                key={heading.label}
                style={{ top: heading.y }}
              >
                {heading.label}
              </div>
            ))}
          </React.Fragment>
        ))}
      {data.open && a.elements.length === 0 && (
        <p className="empty-node">No knowledge elements found.</p>
      )}
    </div>
  );
}
function ElementNode({ data, selected }) {
  const e = data.element;
  return (
    <div className={`element-node ${selected ? "selected" : ""}`}>
      <Handles />
      <span
        className={`source-tag ${e.source.startsWith("change:") ? "proposed" : ""}`}
      >
        {e.source.replace(":", " · ")}
      </span>
      <strong title={e.path}>{e.path}</strong>
    </div>
  );
}
function MissingNode({ data }) {
  return (
    <div className="missing-node">
      <Handles />
      <span className="eyebrow">Unresolved target</span>
      <strong>{data.label}</strong>
    </div>
  );
}
const nodeTypes = {
  artifact: ArtifactNode,
  element: ElementNode,
  missing: MissingNode,
};

function Markdown({ text }) {
  const html = useMemo(() => {
    const content = text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
    return DOMPurify.sanitize(marked.parse(content), {
      // Details have no external resources or navigation; references use UI buttons.
      FORBID_TAGS: [
        "img",
        "svg",
        "math",
        "iframe",
        "form",
        "input",
        "button",
        "style",
      ],
      FORBID_ATTR: ["href", "src", "style", "id", "name", "target"],
    });
  }, [text]);
  return (
    <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
function DependencyList({ title, value, onSelect }) {
  return (
    <div className="relationship">
      <h4>{title}</h4>
      <p className="tiny">Direct</p>
      <div className="chips">
        {value.direct.length ? (
          value.direct.map((id) => (
            <button key={id} onClick={() => onSelect(id)}>
              {id}
            </button>
          ))
        ) : (
          <span className="muted">None</span>
        )}
      </div>
      <p className="tiny">All reachable</p>
      <div className="chips">
        {value.transitive.length ? (
          value.transitive.map((id) => (
            <button key={id} onClick={() => onSelect(id)}>
              {id}
            </button>
          ))
        ) : (
          <span className="muted">None</span>
        )}
      </div>
    </div>
  );
}
function ReferenceList({ references, onTarget }) {
  return (
    <div className="references">
      {references.length === 0 ? (
        <p className="muted">No element references.</p>
      ) : (
        references.map((r) => (
          <div className="reference" key={r.id}>
            <span
              className={`source-tag ${r.status === "proposed" ? "proposed" : ""}`}
            >
              {r.status} · {r.resolved ? "resolved" : "unresolved"}
            </span>
            <button
              className="reference-target"
              disabled={!r.resolved}
              onClick={() => onTarget(r)}
            >
              {r.artifact} / {r.element}
            </button>
            <p>{r.reason}</p>
            <small>{r.targetSource || "No declared target source"}</small>
            {r.diagnostic && <p className="error-text">{r.diagnostic}</p>}
          </div>
        ))
      )}
    </div>
  );
}
function App() {
  const [path, setPath] = useState(""),
    [snapshot, setSnapshot] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [expanded, setExpanded] = useState(new Set()),
    [selection, setSelection] = useState(null),
    [planning, setPlanning] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState(new Set());
  const [filter, setFilter] = useState("");
  const workspaceRef = useRef(null);
  const [panelWidth, setPanelWidth] = useState(340),
    [panelMax, setPanelMax] = useState(640);
  useEffect(() => {
    const workspace = workspaceRef.current;
    const measure = () => {
      const width = workspace.getBoundingClientRect().width;
      if (width <= 800) return;
      const sidebar = workspace
        .querySelector(".sidebar")
        .getBoundingClientRect().width;
      const max = Math.max(
        240,
        Math.min(640, Math.floor(width - sidebar - 300)),
      );
      setPanelMax(max);
      setPanelWidth((current) => Math.max(240, Math.min(max, current)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(workspace);
    measure();
    return () => observer.disconnect();
  }, []);
  const resizePanel = (width) =>
    setPanelWidth(Math.max(240, Math.min(panelMax, width)));
  function dragPanel(event) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    resizePanel(
      workspaceRef.current.getBoundingClientRect().right - event.clientX,
    );
  }
  function resizeWithKeyboard(event) {
    const widths = {
      ArrowLeft: panelWidth + 20,
      ArrowRight: panelWidth - 20,
      Home: 240,
      End: panelMax,
    };
    if (Object.hasOwn(widths, event.key)) {
      event.preventDefault();
      resizePanel(widths[event.key]);
    }
  }
  async function open(repositoryPath, refresh = false) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: repositoryPath }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error || "Repository could not be opened.");
      setSnapshot(result);
      setPath(result.repository.path);
      if (!refresh) {
        setExpanded(new Set());
        setExpandedTypes(new Set());
        setSelection(null);
        setFilter("");
        setPlanning(false);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const toggle = useCallback(
    (id) =>
      setExpanded((current) => {
        const next = new Set(current);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    [],
  );
  const toggleType = useCallback((artifactId, type) => {
    setExpanded((current) => new Set([...current, artifactId]));
    setExpandedTypes((current) => {
      const next = new Set(current),
        key = typeKey(artifactId, type);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);
  const graph = useMemo(() => {
    if (!snapshot) return { nodes: [], edges: [] };
    const result = canvasGraph(snapshot, expanded, planning, expandedTypes);
    result.nodes = result.nodes.map((n) => ({
      ...n,
      selected:
        n.type === "artifact"
          ? selection?.artifact === n.data.artifact.id && !selection?.element
          : n.type === "element" && selection?.element === n.data.element.id,
      data: { ...n.data, toggle, toggleType },
    }));
    return result;
  }, [
    snapshot,
    expanded,
    expandedTypes,
    planning,
    selection,
    toggle,
    toggleType,
  ]);
  const artifact = snapshot?.artifacts.find(
    (a) => a.id === selection?.artifact,
  );
  const element = artifact?.elements.find((e) => e.id === selection?.element);
  const refs =
    snapshot?.references.filter((r) =>
      element ? r.consumer === element.id : r.consumerArtifact === artifact?.id,
    ) || [];
  const reachability =
    artifact && relationships(artifact.id, snapshot.edges, planning);
  const selectArtifact = (id) => setSelection({ artifact: id });
  function revealElement(artifactId, elementId) {
    const record = snapshot.artifacts
      .find((a) => a.id === artifactId)
      ?.elements.find((e) => e.id === elementId);
    if (!record) return;
    setExpanded((current) => new Set([...current, artifactId]));
    setExpandedTypes(
      (current) =>
        new Set([...current, typeKey(artifactId, record.path.split("/")[0])]),
    );
    setSelection({ artifact: artifactId, element: elementId });
  }
  function selectTarget(ref) {
    revealElement(ref.artifact, ref.targetId);
  }
  const onNodeClick = (_, node) => {
    if (node.type === "artifact") selectArtifact(node.data.artifact.id);
    else if (node.type === "element")
      setSelection({
        artifact: node.data.element.artifact,
        element: node.data.element.id,
      });
  };
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">⌘</span>
          <div>
            <h1>Artifact Plane</h1>
            <span>Local repository explorer</span>
          </div>
        </div>
        <span className="read-only">
          <i />
          Read-only
        </span>
      </header>
      <form
        className="open-bar"
        onSubmit={(e) => {
          e.preventDefault();
          open(path);
        }}
      >
        <label htmlFor="repository-path">Repository path</label>
        <input
          id="repository-path"
          placeholder="/absolute/path/to/add-repository"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          required
          disabled={busy}
          autoComplete="off"
          spellCheck={false}
        />
        <button className="primary" disabled={busy}>
          {busy ? "Reading…" : "Open repository"}
        </button>
        <button
          type="button"
          disabled={!snapshot || busy}
          onClick={() => open(snapshot.repository.path, true)}
        >
          Refresh
        </button>
      </form>
      {error && (
        <div role="alert" className="error-banner">
          {error}
        </div>
      )}
      <div
        className="workspace"
        ref={workspaceRef}
        style={{ "--inspector-width": panelWidth + "px" }}
      >
        <aside className="sidebar">
          <div className="sidebar-title">
            <span className="eyebrow">Repository</span>
            {snapshot && (
              <span className="count">{snapshot.artifacts.length}</span>
            )}
          </div>
          {snapshot ? (
            <>
              <div className="repo-info">
                <strong title={snapshot.repository.path}>
                  {snapshot.repository.path.split("/").at(-1)}
                </strong>
                <span>
                  {snapshot.repository.branch} ·{" "}
                  {snapshot.repository.head?.slice(0, 7) || "No commits"}
                </span>
                <small>
                  {snapshot.repository.dirty
                    ? "Working tree has changes"
                    : "Working tree is clean"}
                </small>
              </div>
              <label className="sr-only" htmlFor="artifact-filter">
                Filter artifacts
              </label>
              <input
                id="artifact-filter"
                className="filter"
                placeholder="Filter artifacts…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <nav aria-label="Artifacts">
                {snapshot.artifacts
                  .filter((a) =>
                    `${a.id} ${a.title}`
                      .toLowerCase()
                      .includes(filter.toLowerCase()),
                  )
                  .map((a) => (
                    <button
                      className={`artifact-list-item ${artifact?.id === a.id ? "active" : ""}`}
                      key={a.id}
                      onClick={() => selectArtifact(a.id)}
                    >
                      <span>{a.title}</span>
                      <small>
                        {a.currentVersion ? `v${a.currentVersion}` : "Initial"}{" "}
                        · {a.elements.length} elements
                      </small>
                    </button>
                  ))}
              </nav>
            </>
          ) : (
            <p className="muted sidebar-help">
              Open a local ADD repository to discover its artifacts.
            </p>
          )}
          <div className="sidebar-footer">
            Git + Markdown
            <br />
            <span>Source of truth</span>
          </div>
        </aside>
        <main className="canvas-area">
          <div className="canvas-toolbar">
            <div>
              <strong>Dependency canvas</strong>
              <small>Upstream → downstream</small>
            </div>
            {snapshot && (
              <div
                className="view-toggle"
                role="group"
                aria-label="Dependency view"
              >
                <button
                  aria-pressed={!planning}
                  className={!planning ? "active" : ""}
                  onClick={() => setPlanning(false)}
                >
                  Established
                </button>
                <button
                  aria-pressed={planning}
                  className={planning ? "active" : ""}
                  onClick={() => setPlanning(true)}
                >
                  Planning
                </button>
              </div>
            )}
          </div>
          {!snapshot || snapshot.artifacts.length === 0 ? (
            <div className="empty-canvas">
              <div className="empty-symbol">◇ → ◇</div>
              <h2>
                {snapshot
                  ? "No artifacts found"
                  : "Explore the knowledge behind your code"}
              </h2>
              <p>
                {snapshot
                  ? "Add artifact root READMEs under docs/artifacts in your repository."
                  : "Open an ADD repository to see its dependencies. Expand an artifact to follow the element references."}
              </p>
            </div>
          ) : (
            <div className="canvas-surface">
              <ReactFlow
                key={snapshot.repository.path}
                nodes={graph.nodes}
                edges={graph.edges}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                fitView
                fitViewOptions={{ padding: 0.18 }}
                nodesDraggable={false}
                nodesConnectable={false}
                edgesReconnectable={false}
                deleteKeyCode={null}
                selectionOnDrag={false}
                minZoom={0.1}
                maxZoom={2}
                colorMode="dark"
                proOptions={{}}
              >
                <Background color="#334059" gap={24} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
          )}
          {snapshot && snapshot.artifacts.length > 0 && (
            <div className="canvas-legend">
              <span>
                <i className="line established" />
                Established
              </span>
              <span>
                <i className="line added" />
                Proposed addition
              </span>
              <span>
                <i className="line removed" />
                Proposed removal
              </span>
              <span>
                <i className="line reference-line" />
                Element reference
              </span>
            </div>
          )}
          {snapshot?.diagnostics.length > 0 && (
            <details className="diagnostics">
              <summary>
                {snapshot.diagnostics.length} repository diagnostic
                {snapshot.diagnostics.length === 1 ? "" : "s"}
              </summary>
              <div>
                {snapshot.diagnostics.map((d, i) => (
                  <p key={i}>
                    <strong>{d.code}</strong>
                    <span>{d.path}</span>
                    {d.message}
                  </p>
                ))}
              </div>
            </details>
          )}
        </main>
        <div
          className="inspector-divider"
          role="separator"
          aria-label="Resize details panel"
          aria-orientation="vertical"
          aria-valuemin={240}
          aria-valuemax={panelMax}
          aria-valuenow={panelWidth}
          aria-controls="details-panel"
          tabIndex={0}
          onKeyDown={resizeWithKeyboard}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={dragPanel}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
          }}
        />
        <aside
          id="details-panel"
          className="details-panel"
          aria-label="Selection details"
        >
          {artifact ? (
            <>
              <div className="details-heading">
                <span className="eyebrow">
                  {element ? "Element details" : "Artifact details"}
                </span>
                <button
                  aria-label="Clear selection"
                  onClick={() => setSelection(null)}
                >
                  ×
                </button>
              </div>
              <h2>{element ? element.path : artifact.title}</h2>
              <div className="details-meta">
                <span>
                  {element
                    ? element.source
                    : artifact.currentVersion
                      ? `Established v${artifact.currentVersion}`
                      : "No established version"}
                </span>
                {!element && (
                  <span>
                    Active change:{" "}
                    {artifact.activeChange ||
                      (artifact.changes.length ? "Ambiguous" : "None")}
                  </span>
                )}
              </div>
              {!element && (
                <>
                  <button
                    className="expand-details"
                    onClick={() => toggle(artifact.id)}
                  >
                    {expanded.has(artifact.id) ? "Collapse" : "Expand"} elements
                    on canvas
                  </button>
                  {artifact.changes.length > 0 && (
                    <details>
                      <summary>
                        {artifact.changes.length} change candidate
                        {artifact.changes.length === 1 ? "" : "s"}
                      </summary>
                      {artifact.changes.map((c) => (
                        <div key={c.name}>
                          <h4>{c.name}</h4>
                          <Markdown text={c.readme} />
                        </div>
                      ))}
                    </details>
                  )}
                  <section className="relationships">
                    <h3>
                      {planning ? "Planning" : "Established"} dependencies
                    </h3>
                    <DependencyList
                      title="Upstream"
                      value={reachability.upstream}
                      onSelect={selectArtifact}
                    />
                    <DependencyList
                      title="Downstream"
                      value={reachability.downstream}
                      onSelect={selectArtifact}
                    />
                  </section>
                  <section>
                    <h3>Knowledge elements</h3>
                    {artifact.elements.length ? (
                      elementGroups(artifact).map((group) => {
                        const open = expandedTypes.has(
                          typeKey(artifact.id, group.type),
                        );
                        return (
                          <div className="knowledge-type" key={group.type}>
                            <button
                              className="type-toggle inspector-type"
                              aria-label={group.label + " in inspector"}
                              aria-expanded={open}
                              onClick={() =>
                                toggleType(artifact.id, group.type)
                              }
                            >
                              <span>
                                {open ? "▾" : "▸"} {group.label}
                              </span>
                              <span className="type-count">{group.count}</span>
                            </button>
                            {open &&
                              group.sources.map((source) => (
                                <div
                                  className="knowledge-source"
                                  key={source.source}
                                >
                                  <h4>{source.label}</h4>
                                  {source.elements.map((e) => (
                                    <button
                                      className="element-list-item"
                                      key={e.id}
                                      onClick={() =>
                                        revealElement(artifact.id, e.id)
                                      }
                                    >
                                      <span>{e.path}</span>
                                      <small>{e.source}</small>
                                    </button>
                                  ))}
                                </div>
                              ))}
                          </div>
                        );
                      })
                    ) : (
                      <p className="muted">No elements found.</p>
                    )}
                  </section>
                </>
              )}
              <section>
                <h3>References</h3>
                <ReferenceList references={refs} onTarget={selectTarget} />
              </section>
              <section>
                <h3>{element ? "Content" : "Overview"}</h3>
                <Markdown text={element?.markdown || artifact.readme} />
              </section>
            </>
          ) : (
            <div className="empty-details">
              <span className="eyebrow">Inspector</span>
              <h2>Follow a dependency</h2>
              <p>
                Select an artifact or element on the canvas to inspect its
                knowledge and relationships.
              </p>
            </div>
          )}
        </aside>
      </div>
      <footer className="statusbar">
        <span>
          {busy
            ? "Reading repository…"
            : snapshot
              ? `${snapshot.artifacts.length} artifacts · ${snapshot.references.length} element references`
              : "Ready to open a repository"}
        </span>
        <span>Local files · explicit refresh · no writes</span>
      </footer>
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>,
);
