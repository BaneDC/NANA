import { applicableQuestions, flowContext, questionById, steps } from './flow';
import { frailtyOf } from './frailty';
import { CFS_SR, srField, srOptionTitles, srShort } from './flow.sr';
import { reconcile } from './dependencies';

// Changing a care plan after the fact. The plan is not a document anyone types:
// it is built from the answers the family gave, so changing the plan means
// changing an answer and building it again. The manual editor and the assistant
// both go through here, so they can never disagree about what a change does.

export const STEP_TITLE = {
  'getting-to-know': 'Upoznavanje',
  'daily-life': 'Svakodnevica',
  support: 'Podrška',
  reason: 'Zašto sada',
};

// Every question that applies to this person now, section by section, with its
// current answer. The frailty band decides which support questions exist at all,
// so the list is worked out from the answers each time rather than kept.
export function planQuestions(answers) {
  const ctx = flowContext(answers, frailtyOf(answers)?.level);
  return steps
    .map((step) => ({
      id: step.id,
      title: STEP_TITLE[step.id] || step.id,
      questions: applicableQuestions(step, ctx).map((q) => ({ q, answer: answers[q.id] || null })),
    }))
    .filter((s) => s.questions.length);
}

// An answer as a line of text, the way the plan page reads it.
export function answerText(q, answer) {
  if (!answer) return 'Nije odgovoreno';
  if (q.type === 'inputs') {
    return q.fields
      .map((f) => answer.values?.[f.id])
      .filter(Boolean)
      .join(' · ') || 'Nije odgovoreno';
  }
  const titles = srOptionTitles(q, answer);
  if (q.type === 'multi' && !titles.length) return 'Ništa od ovoga';
  return titles.join(', ') || 'Nije odgovoreno';
}

export { srField };

// Apply a set of changes the way the flow does: each one reconciled, so a
// change that moves the frailty band also retires the questions that band no
// longer asks. Returns what was dropped on the way, so it can be said.
export function applyChanges(answers, changes) {
  let next = answers;
  const dropped = [];
  for (const { questionId, answer } of changes) {
    const r = reconcile(next, { ...next, [questionId]: answer });
    next = r.answers;
    // reconcile reports the questions themselves; the ids are what gets compared
    dropped.push(...(r.dropped || []).map((q) => q.id));
  }
  return { answers: next, dropped: [...new Set(dropped)] };
}

const levelLabel = (level) => (level ? `${level} · ${CFS_SR[level]?.label || ''}`.trim() : 'još nije poznat');

// What a set of changes would do, before anyone agrees to it: each answer as it
// is and as it would be, and the frailty level when it moves — the one change
// that reshapes the rest of the plan.
export function describeChanges(answers, changes) {
  const { answers: next, dropped } = applyChanges(answers, changes);
  const rows = changes.map(({ questionId, answer }) => {
    const q = questionById[questionId];
    const row = {
      questionId,
      title: srShort(q),
      before: answerText(q, answers[questionId]),
      after: answerText(q, answer),
    };
    // A list reads better as what came off it and what went on than as two long
    // lists side by side.
    if (q.type === 'multi') {
      const was = new Set(srOptionTitles(q, answers[questionId]));
      const now = new Set(srOptionTitles(q, answer));
      row.removed = [...was].filter((t) => !now.has(t));
      row.added = [...now].filter((t) => !was.has(t));
    }
    return row;
  });
  const was = frailtyOf(answers)?.level ?? null;
  const now = frailtyOf(next)?.level ?? null;
  return {
    rows,
    frailty: was !== now ? { before: levelLabel(was), after: levelLabel(now) } : null,
    dropped: dropped.map((id) => (questionById[id] ? srShort(questionById[id]) : id)),
  };
}

// Which parts of the plan came out different after a change — a recommendation
// rewritten, or the letter — so the plan can mark them where they are.
export function planDiff(before, after) {
  if (!before || !after) return { recs: [], letter: false, touched: [] };
  const byId = Object.fromEntries(before.recommendations.map((r) => [r.id, r]));
  const same = (a, b) => a && b && a.title === b.title && a.why === b.why && JSON.stringify(a.items) === JSON.stringify(b.items);
  const recs = after.recommendations.filter((r) => !same(byId[r.id], r)).map((r) => r.id);
  const letter = JSON.stringify(before.letter.paragraphs) !== JSON.stringify(after.letter.paragraphs);
  const touched = [
    ...(letter ? ['Jovanino pismo'] : []),
    ...after.recommendations.filter((r) => recs.includes(r.id)).map((r) => `„${r.title}“`),
  ];
  return { recs, letter, touched };
}
