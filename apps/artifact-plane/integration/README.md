# Observe Codex execution

Use Node 24 or later and a Codex version that supports lifecycle command hooks. The configuration contract was checked with codex-cli 0.160.1. Hooks observe activity; they do not launch agents or approve ADD implementation.

## Enable the observer

1. Copy the event entries from hooks.example.json into your chosen Codex hooks.json. Replace /absolute/path with the absolute installation path of this application. Merge entries with existing hooks; do not replace unrelated configuration.
2. Open /hooks in Codex. Review and trust the observer hook definitions. Project-local configuration also requires a trusted project. No trust bypass is needed.
3. Start or resume a session. SessionStart supplies the session identity and binding instructions as additional context. If hooks are disabled or unsupported, the session remains unobserved.
4. Bind the approved task explicitly using the CLI below. Binding records identity only; follow the approved task prerequisites separately. Bind every subagent separately with its agent ID.

The documented hook interface is https://learn.chatgpt.com/docs/hooks . This observer never parses session transcripts. Hooks use a three-second limit and fail open. An unavailable observer must not stop implementation.

## State location

The default is ~/.local/state/artifact-plane/runtime.sqlite, or XDG_STATE_HOME/artifact-plane/runtime.sqlite. Set ARTIFACT_PLANE_STATE_DIR to use another private directory outside every inspected repository and worktree. Set the same value in the environment of Codex and the Plane server, or add --state-dir to the hook command and CLI commands. Runtime paths inside a Git checkout, including symlink aliases, are rejected.

Hook processes write directly to SQLite, even when the web server is stopped. Codex retains its own conversation history; Plane retains allowlisted observations, session/task bindings, attempts, and graph labels/edges. Prompts, tool arguments/output, credentials, and transcripts are excluded.

## Bind and report

Run from the application directory. Replace the example values with your actual identities. Use the full listed task path or its path relative to tasks/. Omit --unit for an individual plan. The CLI prints repository/context/attempt IDs; retain the attempt ID for reporting.

```sh
node server/runtime-cli.js bind --root /path/to/checkout --unit my-outcome --artifact my-artifact --change change-feature --task 21-task.md --session SESSION_ID
node server/runtime-cli.js bind --root /path/to/worker --unit my-outcome --artifact my-artifact --change change-feature --task 22-task.md --session PARENT_SESSION_ID --agent CHILD_AGENT_ID
node server/runtime-cli.js report --attempt ATTEMPT_ID --state execution-returned
node server/runtime-cli.js report --attempt ATTEMPT_ID --state validated --root /path/to/checkout --method 'Run behavior suite' --source docs/artifacts/my-artifact/changes/change-feature/tasks/21-task.md#evidence
node server/runtime-cli.js report --attempt ATTEMPT_ID --state failed --reason 'Behavior check failed'
node server/runtime-cli.js query --root /path/to/checkout
```

Use blocked reports for known intervention waits. Done (reported) requires a validation method and nonempty Markdown evidence. A reported result is not independent verification. Stop/SubagentStop means execution returned, with DoD pending. Checklist counts and version establishment remain separate evidence.

## Read the graph and history

Open a remaining checkout in Plane. Individual and unit implementation nodes display artifact/change ownership and matching execution attempts. Select Recorded executions to inspect captured graphs independently of current worktree availability. Captures show revision/digest and capture time; archived gates remain Unknown because runtime history does not verify merges. A modified task does not inherit an older attempt merely because its path matches.

Multiple blue nodes represent observed concurrent execution. Waiting means no matching observation, not permission or readiness. Ten minutes without fresh activity changes active observations to Unknown while retaining the last observed state. Long tools can therefore appear Unknown until their next hook. A server restart also requires fresh activity before claiming Processing; no continuous harness heartbeat is implemented. SSE reconnect refetches durable observations and missed events. A disconnected browser shows Unknown for active attempts.

## Verification limits

Fixture acceptance can test the complete hook-to-store-to-browser flow without model inference. Actual Codex hook activation requires your /hooks trust step. Configuration parsing and hook-list checks alone do not prove a live model executed a task. Keep live, fixture, reported-validation, and establishment evidence distinct.
