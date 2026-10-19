// One status vocabulary and one glossary for every page
// (specifications/human-guidance.md, Status vocabulary and Glossary).
// Pages pass a status name; this module gives its family. A name outside the
// tables throws, so a page cannot show a status without an icon and a family.

// Status family: filled pill with a leading icon.
export const STATUS_FAMILIES = {
  done: {icon: 'check', members: ['Passed', 'pass', 'Complete', 'established', 'Delivered', 'verified']},
  waiting: {icon: 'clock', members: ['prepared', 'Ready for team review', 'Waiting for merge', 'Incomplete', 'Unchecked items']},
  active: {icon: 'dot', members: ['current phase', 'open']},
  problem: {icon: 'alert', members: ['Failed', 'fail', 'refuted', 'error']},
  neutral: {icon: 'info', members: ['coordinator', 'unresolved', 'Unknown', 'not loaded']},
};
// Difference family against the protected branch: outlined pill with a leading sign.
export const DIFFERENCES = {New: {family: 'new', sign: '+'}, Changed: {family: 'changed', sign: '~'}, Removed: {family: 'removed', sign: '−'}};
// Kind family: square tag, gray text, no icon.
export const KIND_TAGS = ['Decision', 'Assumption', 'Root cause', 'Risk', 'Unknown', 'Fact from Git', 'documented', 'static', 'observed'];

const key = name => String(name ?? '').trim().toLowerCase();
const STATUS = new Map(Object.entries(STATUS_FAMILIES).flatMap(([family, {members}]) => members.map(m => [key(m), family])));
const KINDS = new Map(KIND_TAGS.map(k => [key(k), k]));

// Family of a status name, case-insensitive. Throws for an unknown name.
export function statusFamily(name) {
  const family = STATUS.get(key(name));
  if (!family) throw new Error(`Unknown status name: ${name}`);
  return family;
}
// Family and sign of New, Changed or Removed. Throws for any other name.
export function difference(name) {
  const entry = DIFFERENCES[name];
  if (!entry) throw new Error(`Unknown difference name: ${name}`);
  return entry;
}
// Server document states to difference names; null when equal to main.
export const differenceOf = state => ({added: 'New', modified: 'Changed', removed: 'Removed'})[state] || null;
// The listed spelling of a kind name. Throws for an unknown name.
export function kindTag(name) {
  const kind = KINDS.get(key(name));
  if (!kind) throw new Error(`Unknown kind name: ${name}`);
  return kind;
}

// term, family (a status family, 'kind' or null) and a definition of at most 30 words.
export const GLOSSARY = [
  {term: 'documented', family: 'kind', definition: 'Basis of a support or claim: a document states it. No code reading or run showed it.'},
  {term: 'static', family: 'kind', definition: 'Basis of a support: reading the code shows the link, for example an import. No run showed it.'},
  {term: 'observed', family: 'kind', definition: 'Basis of a support or claim: a test or a run showed it. It is stronger than documented or static.'},
  {term: 'coordinator', family: 'neutral', definition: 'The coordinator decides this tier criterion, not a tool. The change README records the decision.'},
  {term: 'unresolved', family: 'neutral', definition: 'A tool answer was necessary but not available, or the answer did not decide. The result is unknown, not absent.'},
  {term: 'prepared', family: 'waiting', definition: 'The version record is on this branch only. The version becomes established when team review and the merge put it on the protected branch.'},
  {term: 'established', family: 'done', definition: 'The version record and all required knowledge and code are on the protected branch, main or master.'},
  {term: 'Delivered', family: 'done', definition: 'The version record of this change is on the protected branch. The change is complete.'},
  {term: 'Ready for team review', family: 'waiting', definition: 'The version record is on this branch and every DoD item is checked. Push the branch and open a pull request. The Plane never pushes.'},
  {term: 'Waiting for merge', family: 'waiting', definition: 'The pushed branch equals its upstream ref in local Git. Team review and the merge establish the version.'},
  {term: 'Unchecked items', family: 'waiting', definition: 'A version record exists, but a task of the plan has an unchecked DoD item. Check or explain it before team review.'},
  {term: 'Retained change', family: null, definition: 'A delivered change directory that stays in the repository because a version record or evidence refers to it.'},
  {term: 'Publication review', family: null, definition: 'A record that a person reviewed the merged version on the protected branch. It is possible only after the version record is there.'},
  {term: 'Declared evidence', family: null, definition: 'The self-check records and DoD items that a change writes in its files. The Plane reads phases from them; they do not prove a run.'},
  {term: 'verified by an agent', family: null, definition: 'An agent recorded the check of this claim. No person or second tool repeated it.'},
  {term: 'not independent', family: null, definition: 'The same agent or session that made the claim also checked it. Treat the result as documented, not proven.'},
  {term: 'Re-checked', family: null, definition: 'Someone ran the check of a claim again after it was first recorded, and recorded the new result.'},
  {term: 'reached', family: null, definition: 'The change impact found a relationship path from a changed file to this item: direct is one relationship away, transitive is more than one.'},
  {term: 'direct', family: null, definition: 'Reached by one relationship from a changed file.'},
  {term: 'transitive', family: null, definition: 'Reached by more than one relationship from a changed file.'},
  {term: 'undecided flow', family: null, definition: 'A flow that the change impact reaches, but neither the unit brief affected_flows nor a claim about list names it.'},
  {term: 'Fact from Git', family: 'kind', definition: 'Changed records and files, impact tiers and fields that the Plane read from Git. Nobody wrote it as a claim.'},
  {term: 'open claim', family: 'active', definition: 'A claim with status open: nobody has supported, refuted or verified it yet.'},
  {term: 'tier', family: null, definition: 'Size class of a change: small, medium or large. It sets the records, commits and human gates of the change.'},
  {term: 'small', family: null, definition: 'A change that passes every small-tier criterion. It has one knowledge commit, and the request is its plan approval.'},
  {term: 'medium', family: null, definition: 'The default tier. Each phase has its own commit, and the plan needs explicit user approval before implementation.'},
  {term: 'large', family: null, definition: 'A change with the medium-tier gates and a wide scope, for example several artifacts or repositories.'},
];
const TERMS = new Map(GLOSSARY.map(entry => [key(entry.term), entry]));
// The entry of a term, case-insensitive. Throws for an unknown term.
export function glossaryEntry(term) {
  const entry = TERMS.get(key(term));
  if (!entry) throw new Error(`Unknown glossary term: ${term}`);
  return entry;
}
export const words = text => text.trim().split(/\s+/).length;
