import { steps } from './flow';
import { bandOf, estimateFrailty } from './frailty';

// Editing an answer is not always a local change. The daily-life answers feed the
// frailty estimate, the estimate picks the frailty band, and the band decides which
// questions the support section asks at all — so changing one of them can retire
// answers the user has already given and open questions they have never seen.
//
// Everything here is pure: the same function tells the review screen what would
// happen *before* an edit and prunes the answers *after* one, so the warning and
// the behaviour can never disagree.

// Every question the frailty estimate reads (see SCORES in frailty.js).
export const FRAILTY_INPUTS = [
  'mobility',
  'going-out',
  'daily-help',
  'self-care',
  'falls',
  'outdoors',
  'slowing',
  'overall',
];

export const isLoadBearing = (questionId) => FRAILTY_INPUTS.includes(questionId);

// The conditional questions, tagged with the step they belong to so a warning can
// name the section rather than just list titles.
const CONDITIONAL = steps.flatMap((step) =>
  step.questions.filter((q) => q.when).map((q) => ({ question: q, stepId: step.id }))
);

function bandLevel(answers) {
  const level = estimateFrailty(answers);
  return { level, band: level ? bandOf(level) : null };
}

const applies = (entry, band, level) => !!band && entry.question.when({ band, level });

// Applied after every answer: drops answers to questions the new band no longer
// asks, and reports what was dropped and what is now being asked instead.
export function reconcile(prevAnswers, nextAnswers) {
  const before = bandLevel(prevAnswers);
  const after = bandLevel(nextAnswers);

  const answers = { ...nextAnswers };
  const dropped = [];
  CONDITIONAL.forEach((entry) => {
    const id = entry.question.id;
    if (!answers[id]) return;
    if (!applies(entry, after.band, after.level)) {
      delete answers[id];
      dropped.push(entry.question);
    }
  });

  const added = CONDITIONAL.filter(
    (e) => applies(e, after.band, after.level) && !answers[e.question.id]
  ).map((e) => e.question);

  return {
    answers,
    dropped,
    added,
    level: after.level,
    previousLevel: before.level,
    band: after.band,
    previousBand: before.band,
  };
}

