import { buildPlan } from './carePlan';
import { describeChanges, planDiff } from './planEdits';

// What changed in the plan and when: one plan per person, never versions of it.
// An entry is written only when the plan says something different afterwards
// (a recommendation, Minna's letter, the frailty level); a phone number or a
// typo is not the plan's history. Entries are not opened or restored: the last
// change can be taken back with "Poništi" while it is fresh, nothing older.
//
// { id, at, kind: 'created' | 'changed', source, rows, frailty, touched, saved }

export const createdEntry = (at = Date.now()) => ({ id: `log-${at}`, at, kind: 'created', source: 'assistant' });

// The entry for going from one state to the next, or null when the plan reads
// the same afterwards.
export function changeEntry({ before, after, source, at = Date.now() }) {
  const changes = Object.keys({ ...before.answers, ...after.answers })
    .filter((id) => after.answers[id] && JSON.stringify(before.answers[id]) !== JSON.stringify(after.answers[id]))
    .map((id) => ({ questionId: id, answer: after.answers[id] }));
  const desc = describeChanges(before.answers, changes);
  const diff = planDiff(before.plan, after.plan);
  if (!diff.touched.length && !desc.frailty) return null;
  return {
    id: `log-${at}`,
    at,
    kind: 'changed',
    source,
    rows: desc.rows,
    frailty: desc.frailty,
    touched: diff.touched,
    saved: after.notes.filter((n) => !before.notes.includes(n)),
  };
}

// The demo's history: made five weeks ago, and changed once since, when she
// started walking with a stick.
export function demoLog(answers, notes) {
  const day = 86400000;
  const now = Date.now();
  const made = new Date(now - 37 * day).setHours(10, 12, 0, 0);
  const moved = new Date(now - 16 * day).setHours(18, 40, 0, 0);
  const before = { ...answers, mobility: { optionId: 'independent' } };
  const change = changeEntry({
    before: { answers: before, notes, plan: buildPlan(before, notes) },
    after: { answers, notes, plan: buildPlan(answers, notes) },
    source: 'assistant',
    at: moved,
  });
  return [change, createdEntry(made)].filter(Boolean);
}

// When each answer last changed, for "izmenjeno" beside it.
export function changedOn(log = []) {
  const on = {};
  for (const e of log) for (const r of e.rows || []) on[r.questionId] = Math.max(on[r.questionId] || 0, e.at);
  return on;
}

export const SOURCE = { assistant: 'u razgovoru sa Minnom', manual: 'ručno', both: 'ručno i sa Minnom' };

// "10. oktobra", or "Danas" / "Juče"; a date as it is said, in the genitive
const GENITIVE = ['januara', 'februara', 'marta', 'aprila', 'maja', 'juna', 'jula', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra'];
const midnight = (t) => new Date(t).setHours(0, 0, 0, 0);
export const dateOf = (at) => {
  const d = new Date(at);
  return `${d.getDate()}. ${GENITIVE[d.getMonth()]}`;
};
export function dayOf(at, now = Date.now()) {
  const diff = Math.round((midnight(now) - midnight(at)) / 86400000);
  if (diff === 0) return 'Danas';
  if (diff === 1) return 'Juče';
  return dateOf(at);
}
export const timeOf = (at) => {
  const d = new Date(at);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};
