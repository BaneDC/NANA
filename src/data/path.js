import { applicableQuestions, flowContext, questionById, steps } from './flow';
import { estimateFrailty } from './frailty';
import { market } from './market';

// Which way a family goes through Minna's conversation (decided 16. 11.,
// docs/superpowers/specs/2026-11-16-porodica-trziste-kraci-put-design.md):
// 'plan', every question, the care plan at the end (the default), or
// 'caregiver', five questions and a small plan, for someone sure they want
// only a caregiver (always so for a family abroad). The path says which
// questions are asked. Which plan is drawn is read from the answers
// (`isShortPlan`), so every screen that has the answers knows, the
// caregiver's too.

export const SHORT_PATH = ['about-person', 'about-you', 'care-needs', 'care-schedule', 'mobility'];

// the path of the person this tab is on, set by the app beside the market
let current = 'plan';
export const setPath = (path) => {
  current = path === 'caregiver' ? 'caregiver' : 'plan';
};
export const pathNow = () => current;

// a field of an `inputs` question that this market asks
export const fieldsOf = (q) => (q.fields || []).filter((f) => !f.market || f.market === market());

// Answered: a question of fields when every field that must be has a value
// (registration fills some of them: her municipality, your name and phone, and
// the rest is still to ask), any other when there is an answer.
export function answered(q, answer) {
  if (!answer) return false;
  if (q.type !== 'inputs') return true;
  // round the clock is the whole answer to when: no days or part of the day to ask
  if (q.id === 'care-schedule' && /24/.test(answer.values?.engagement || '')) return true;
  return fieldsOf(q).every((f) => f.optional || answer.values?.[f.id]?.trim());
}

// worked out when first asked for: flow.js, frailty.js and this file read one another
const stepOf = (id) => steps.find((s) => s.questions.some((q) => q.id === id))?.id;

// What is still to be asked, as { q, stepId }. On the full plan the support
// section, and what the caregiver is to do, wait until daily life is answered:
// a band from two answers is not one to branch on (see conversation.js).
export function openQuestions(answers, path = current) {
  if (path === 'caregiver')
    return SHORT_PATH.map((id) => ({ q: questionById[id], stepId: stepOf(id) })).filter(({ q }) => !answered(q, answers[q.id]));
  const ctx = flowContext(answers, estimateFrailty(answers), null);
  const settled = steps.find((s) => s.id === 'daily-life').questions.every((q) => answers[q.id]);
  return steps.flatMap((step) =>
    (step.id === 'support' || step.id === 'care') && !settled
      ? []
      : applicableQuestions(step, ctx)
          .filter((q) => !answered(q, answers[q.id]))
          .map((q) => ({ q, stepId: step.id }))
  );
}

// What the full plan still needs. When she is asked for is not part of it: a
// plan made before that question existed is whole without it.
export const fullRemaining = (answers) => openQuestions(answers, 'plan').filter(({ q }) => q.id !== 'care-schedule');

// Whole: every question the full plan asks of everyone is answered. Those the
// frailty band opens are not counted: a change in how she is can open new ones
// under any finished plan, and that does not unmake it.
export const isWhole = (answers) =>
  steps.every((step) => step.questions.every((q) => q.when || q.path || q.id === 'care-schedule' || answered(q, answers[q.id])));

// A small plan: made on the short path, and the full plan is not whole yet. It
// stays small until then (who answers half of the questions and leaves still
// has the small one), and is the full plan from then on, whatever changes.
export const isShortPlan = (answers) => Boolean(answers?.['care-needs']) && !isWhole(answers);

// Nothing answered yet but what registration filled in.
export const untouched = (answers) =>
  Object.entries(answers).every(
    ([id, a]) => id === 'about-you' || (id === 'about-person' && Object.keys(a?.values || {}).every((k) => k === 'city'))
  );
