// Client of the session routes of artifact-plane specifications/agent-orchestration.md
// (Commands). A refused request keeps its status and reply body (src/request.js), so a
// refused start shows its reason and its rule.
import {postJSON} from './request.js';

export const querySessions = (path, signal) => postJSON('/api/sessions/query', {path}, signal);
// A start waits for the runner and the agent (3 seconds for the runner, then the session start).
export const startSession = body => postJSON('/api/sessions/start', body, undefined, 90000);
// prompt, permission, cancel, resume, end and open-terminal.
export const sessionCommand = (command, body) => postJSON(`/api/sessions/${command}`, body, undefined, 60000);
export const sessionOutput = (session, signal) => postJSON('/api/sessions/output', {session}, signal);
export const sessionDiff = (session, path, signal) => postJSON('/api/sessions/diff', {session, path}, signal);
export const streamUrl = session => `/api/sessions/stream?session=${encodeURIComponent(session)}`;
// The embedded terminal of a terminal session (Embedded terminal): the trailing slash is the ttyd page.
export const terminalUrl = session => `/api/sessions/terminal/${session}/`;
