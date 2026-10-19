import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {DIFFERENCES, difference, differenceOf, GLOSSARY, glossaryEntry, KIND_TAGS, kindTag, STATUS_FAMILIES, statusFamily, words} from '../src/glossary.js';

// The lists of specifications/human-guidance.md, Status vocabulary and Glossary.
const SPEC_STATUS = {
  done: ['Passed', 'pass', 'Complete', 'established', 'Delivered', 'verified'],
  waiting: ['prepared', 'Ready for team review', 'Waiting for merge', 'Incomplete', 'Unchecked items'],
  active: ['current phase', 'open'],
  problem: ['Failed', 'fail', 'refuted', 'error'],
  neutral: ['coordinator', 'unresolved', 'Unknown', 'not loaded'],
};
const SPEC_KINDS = ['Decision', 'Assumption', 'Root cause', 'Risk', 'Unknown', 'Fact from Git', 'documented', 'static', 'observed'];
const SPEC_TERMS = ['documented', 'static', 'observed', 'coordinator', 'unresolved', 'prepared', 'established', 'Delivered', 'Ready for team review',
  'Waiting for merge', 'Unchecked items', 'Retained change', 'Publication review', 'Declared evidence', 'verified by an agent', 'not independent',
  'Re-checked', 'reached', 'direct', 'transitive', 'undecided flow', 'Fact from Git', 'open claim', 'tier', 'small', 'medium', 'large'];

test('every status name of the specification maps to its family, and an unknown name throws', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(STATUS_FAMILIES).map(([family, {members}]) => [family, members])), SPEC_STATUS);
  for (const [family, members] of Object.entries(SPEC_STATUS)) for (const name of members) {
    assert.equal(statusFamily(name), family, name);
    assert.equal(statusFamily(name.toUpperCase()), family, `${name} in capitals`);
  }
  assert.deepEqual(Object.values(STATUS_FAMILIES).map(f => f.icon), ['check', 'clock', 'dot', 'alert', 'info']);
  for (const name of ['green', 'Pending', '', undefined, 'passed!']) assert.throws(() => statusFamily(name), /Unknown status name/);
});

test('difference and kind families hold the specified members and reject other names', () => {
  assert.deepEqual(Object.entries(DIFFERENCES).map(([name, d]) => [name, d.sign]), [['New', '+'], ['Changed', '~'], ['Removed', '−']]);
  assert.deepEqual([differenceOf('added'), differenceOf('modified'), differenceOf('removed'), differenceOf('equal')], ['New', 'Changed', 'Removed', null]);
  assert.throws(() => difference('Moved'), /Unknown difference name/);
  assert.deepEqual(KIND_TAGS, SPEC_KINDS);
  for (const kind of SPEC_KINDS) assert.equal(kindTag(kind.toLowerCase()), kind);
  assert.throws(() => kindTag('Hypothesis'), /Unknown kind name/);
});

test('the glossary holds every listed term with a definition of at most 30 words and a known family', () => {
  const terms = GLOSSARY.map(e => e.term);
  assert.equal(new Set(terms.map(t => t.toLowerCase())).size, terms.length, 'no duplicate term');
  for (const term of SPEC_TERMS) assert.equal(glossaryEntry(term).term, term, term);
  for (const {term, family, definition} of GLOSSARY) {
    assert.ok(definition.trim().length > 0, term);
    assert.ok(words(definition) <= 30, `${term}: ${words(definition)} words`);
    assert.ok(family === null || family === 'kind' || family in STATUS_FAMILIES, `${term}: family ${family}`);
    if (family === 'kind') assert.equal(kindTag(term), term);
    const status = Object.values(STATUS_FAMILIES).some(f => f.members.some(m => m.toLowerCase() === term.toLowerCase()));
    if (status) assert.equal(statusFamily(term), family, `${term} has the family of its status`);
  }
  assert.throws(() => glossaryEntry('synergy'), /Unknown glossary term/);
});

// The JSX components render through the Vite SSR loader.
test('family components render an icon and a text for every member; the narrow stepper names the phase', async t => {
  const server = await createServer({root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, logLevel: 'silent', appType: 'custom',
    server: {middlewareMode: true, hmr: false, ws: false}, optimizeDeps: {noDiscovery: true, include: []}});
  t.after(() => server.close());
  const ui = await server.ssrLoadModule('/src/ui.jsx');
  const html = (component, props) => renderToStaticMarkup(React.createElement(component, props));
  for (const [family, {members}] of Object.entries(STATUS_FAMILIES)) for (const status of members) {
    const out = html(ui.StatusBadge, {status});
    assert.match(out, new RegExp(`^<span class="status-badge ${family}"`), status);
    assert.match(out, /<svg class="family-icon"[^>]*aria-hidden="true"/, `${status} has an icon`);
    assert.ok(out.includes(`<span>${status}</span>`), `${status} has a text`);
  }
  assert.ok(html(ui.StatusBadge, {status: 'established', children: '1.21.0 established'}).includes('<span>1.21.0 established</span>'));
  assert.throws(() => html(ui.StatusBadge, {status: 'green'}), /Unknown status name: green/);
  for (const [name, {family, sign}] of Object.entries(DIFFERENCES)) {
    const out = html(ui.DiffBadge, {name});
    assert.match(out, new RegExp(`^<span class="diff-badge ${family}">`), name);
    assert.ok(out.includes(`<span class="diff-sign" aria-hidden="true">${sign}</span><span>${name}</span>`), name);
  }
  assert.throws(() => html(ui.DiffBadge, {name: 'added'}), /Unknown difference name/);
  for (const kind of KIND_TAGS) assert.ok(html(ui.KindTag, {kind}).includes(`>${kind}</span>`), kind);
  assert.throws(() => html(ui.KindTag, {kind: 'Mood'}), /Unknown kind name/);
  const card = html(ui.StatusCard, {status: 'Unchecked items', next: 'Check or explain 1 unchecked DoD item before team review.', action: React.createElement('button', {className: 'primary'}, 'Open plan')});
  assert.match(card, /^<section class="status-card waiting" aria-label="Status">/);
  assert.match(card, /Unchecked items.*Check or explain.*<button class="primary">Open plan<\/button>/);
  const term = html(ui.Term, {term: 'prepared'});
  assert.match(term, /<button type="button" class="term" aria-expanded="false">prepared<\/button>/);
  assert.throws(() => html(ui.Term, {term: 'synergy'}), /Unknown glossary term/);
  const change = {layout: 'in-place', currentStep: 'Implementation', steps: []};
  assert.ok(html(ui.PhaseSteps, {change}).includes('<div class="phase-text small">Phase 4 of 5: Implementation</div>'));
  assert.ok(html(ui.PhaseSteps, {change: {layout: 'in-place', steps: [{name: 'Requirement', state: 'documented-complete'}]}, status: 'Ready for team review'}).includes('>Ready for team review</div>'));
});
