// Client of the settings routes of artifact-plane specifications/agent-orchestration.md
// (Commands). A refused request keeps its status and reply body (src/request.js).
import {postJSON} from './request.js';

// The query reads the version of each program with a 5-second limit.
export const querySettings = signal => postJSON('/api/settings/query', {}, signal, 60000);
export const saveSettings = (settings, digest) => postJSON('/api/settings/save', {settings, digest});
// A provider check stops after 120 seconds; the reply follows the stop of the program.
export const checkProvider = harness => postJSON('/api/settings/check', {harness}, undefined, 180000);
