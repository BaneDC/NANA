import { questionById, steps } from './flow';
import { srField, srShort } from './flow.sr';
import { answerText, applyChanges, describeChanges, planDiff, planQuestions } from './planEdits';
import { buildPlan } from './carePlan';
import { planOverview } from './carePlan.sr';
import { needFrom } from './familyStart';
import { AMOUNT_LABEL, MOOD_LABEL, START_HOUR, allVisits, dayOf, firstName, longDate, todayOf } from './familyCare';

// The medical record: everything about the person being cared for, in one
// place, as a chart keeps it (docs/patterns.md §10a). The care plan is built
// for a moment and a need; the record is who she is, whatever the plan.
//
// Most of it is not kept twice. Who she is, how she moves and manages, what
// support she needs and how it began are the answers the family gave Minna,
// read here part by part; changing one is changing the answer, and the plan is
// built again from it. What a conversation never asked for a chart still
// holds: diagnoses, medicines, allergies and aids, kept here as entries.
//
// A chart is never overwritten. A change is written down beside what was
// there: what it was and what it is now, whether her state changed (and from
// when) or the record was simply wrong, who wrote it and what it did to the
// plan. That is the history; nothing in it is ever removed, and an entry that
// no longer holds is closed, not deleted.

const stepIds = (id) => steps.find((s) => s.id === id).questions.map((q) => q.id);

// The parts of the chart read from the answers, in the order the page shows
// them. `support` holds whichever questions her frailty band asks.
export const RECORD_PARTS = {
  daily: { id: 'daily', title: 'Kretanje i samostalnost', questions: stepIds('daily-life') },
  support: { id: 'support', title: 'Podrška koja joj treba', questions: stepIds('support') },
  person: { id: 'person', title: 'Lični podaci', questions: ['about-person', 'household', 'home-condition'] },
  onset: { id: 'onset', title: 'Kako je počelo', questions: ['reason-for-contact', 'onset', 'hospitalisation'] },
};

// Where she lives is not changed here yet: a move has a flow of its own, in
// the profile (MoveDialog).
const READ_ONLY_FIELDS = { 'about-person': ['city'] };
export const fieldLocked = (questionId, fieldId) => Boolean(READ_ONLY_FIELDS[questionId]?.includes(fieldId));

// the questions that are asked of her now: the band decides the support ones
const askedNow = (answers) => planQuestions(answers).flatMap((s) => s.questions.map(({ q }) => q.id));

export function partQuestions(part, answers) {
  const asked = askedNow(answers);
  return part.questions.filter((id) => asked.includes(id)).map((id) => questionById[id]);
}

// A part as the page reads it: a label and a value per line, "-" where nothing
// is written yet, and how many of those there are.
export function partRows(part, answers) {
  const rows = partQuestions(part, answers).flatMap((q) => {
    const answer = answers[q.id];
    if (q.type === 'inputs') {
      return q.fields.map((f) => ({ key: `${q.id}.${f.id}`, label: srField(q, f.id), value: answer?.values?.[f.id]?.trim() || '-' }));
    }
    return [{ key: q.id, label: srShort(q), value: answer ? answerText(q, answer) : '-' }];
  });
  return { rows, missing: rows.filter((r) => r.value === '-').length };
}

// ── what a conversation does not ask ────────────────────────────────────────
// Each list says what it holds, how a new entry is asked for, and how an entry
// that no longer holds is said to have ended.

export const HEALTH = [
  {
    id: 'conditions',
    title: 'Dijagnoze i stanja',
    add: 'Dodaj dijagnozu ili stanje',
    name: 'Dijagnoza ili stanje',
    namePlaceholder: 'npr. povišen krvni pritisak',
    notePlaceholder: 'npr. pod kontrolom, uz terapiju',
    empty: 'Nijedna dijagnoza nije upisana.',
    end: 'Više ne važi',
  },
  {
    id: 'medications',
    title: 'Lekovi',
    add: 'Dodaj lek',
    name: 'Lek i doza',
    namePlaceholder: 'npr. Amlodipin 5 mg',
    notePlaceholder: 'npr. jednom dnevno, ujutru',
    empty: 'Nijedan lek nije upisan.',
    end: 'Više ne uzima',
  },
  {
    id: 'allergies',
    title: 'Alergije',
    add: 'Dodaj alergiju',
    name: 'Na šta je alergična',
    namePlaceholder: 'npr. penicilin',
    notePlaceholder: 'npr. osip i otok',
    empty: 'Nijedna alergija nije upisana.',
    end: 'Više ne važi',
  },
  {
    id: 'aids',
    title: 'Pomagala',
    add: 'Dodaj pomagalo',
    name: 'Pomagalo',
    namePlaceholder: 'npr. štap',
    notePlaceholder: 'npr. samo napolju',
    empty: 'Nijedno pomagalo nije upisano.',
    end: 'Više ne koristi',
  },
];

export const healthList = (id) => HEALTH.find((h) => h.id === id);

// the line under an entry's name: what was noted, and from when
export const entryLine = (e) => [e.note, e.since && `od ${longDate(e.since)}`].filter(Boolean).join(' · ');

const OPENED = {
  kind: 'opened',
  by: 'minna',
  title: 'Karton je otvoren',
  lines: ['Iz upoznavanja sa Minnom: lični podaci, svakodnevica, podrška i povod.'],
};

// The record as it starts: opened from the conversation, nothing else in it.
// The demo's case has been kept for three weeks, so its chart has entries.
export function startRecord(demo) {
  if (!demo) {
    return {
      health: { conditions: [], medications: [], allergies: [], aids: [] },
      log: [{ id: 'k1', at: START_HOUR, ...OPENED }],
    };
  }
  // hours before the demo's first day (11 August 2026): 19 and 20 July
  const opened = -23 * 24 + 11;
  return {
    health: {
      conditions: [
        { id: 'h1', name: 'Povišen krvni pritisak', note: 'Pod kontrolom, uz terapiju' },
        { id: 'h2', name: 'Osteoporoza', note: 'Kontrola jednom godišnje' },
      ],
      medications: [
        { id: 'h3', name: 'Amlodipin 5 mg', note: 'Jednom dnevno, ujutru' },
        { id: 'h4', name: 'Kalcijum i vitamin D', note: 'Uz doručak' },
      ],
      allergies: [{ id: 'h5', name: 'Penicilin', note: 'Osip' }],
      aids: [{ id: 'h6', name: 'Štap', note: 'Napolju i na stepenicama' }],
    },
    log: [
      {
        id: 'k2',
        at: opened + 25,
        kind: 'added',
        by: 'you',
        title: 'Upisano zdravlje',
        lines: ['Dijagnoze i stanja: 2 · Lekovi: 2 · Alergije: 1 · Pomagala: 1'],
      },
      { id: 'k1', at: opened, ...OPENED },
    ],
  };
}

// one more line in the history, newest first
export function written(record, at, entry) {
  return { ...record, log: [{ id: `k${record.log.length + 1}`, at, ...entry }, ...record.log] };
}

// ── a change to what the answers hold ───────────────────────────────────────

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// What the form holds (only the questions someone touched), as the answers
// that differ from the ones kept: an answer put back as it was is no change.
export function draftChanges(answers, draft) {
  return Object.keys(draft)
    .filter((id) => {
      const q = questionById[id];
      const was = answers[id];
      const now = draft[id];
      if (q.type === 'multi') return !was || !same([...(was.optionIds || [])].sort(), [...(now.optionIds || [])].sort());
      if (q.type === 'single') return now.optionId && now.optionId !== was?.optionId;
      return q.fields.some((f) => (now.values?.[f.id] || '').trim() !== (was?.values?.[f.id] || '').trim());
    })
    .map((id) => ({ questionId: id, answer: draft[id] }));
}

const short = (id) => srShort(questionById[id]);

// What a set of changes would do, before anyone agrees to it. The record and
// the plan are read off the same answers, so this is worked out, not guessed:
// the answers as they would be, the frailty level if it moves, the questions
// that level opens and retires, the parts of the plan that would be written
// again, the week of care the plan would ask for, and what there is to watch.
export function recordImpact({ answers, notes = [], plan, changes }) {
  const { answers: next } = applyChanges(answers, changes);
  const desc = describeChanges(answers, changes);
  // a card of several fields reads better field by field
  const rows = desc.rows.flatMap((r) => {
    const q = questionById[r.questionId];
    if (q.type !== 'inputs') return [r];
    return q.fields
      .filter((f) => (answers[q.id]?.values?.[f.id] || '').trim() !== (next[q.id]?.values?.[f.id] || '').trim())
      .map((f) => ({
        questionId: `${q.id}.${f.id}`,
        title: srField(q, f.id),
        before: answers[q.id]?.values?.[f.id]?.trim() || '-',
        after: next[q.id]?.values?.[f.id]?.trim() || '-',
      }));
  });

  const was = askedNow(answers);
  const now = askedNow(next);
  const weekWas = needFrom(answers).schedule;
  const weekNow = needFrom(next).schedule;
  const risksWas = planOverview(answers).risks;
  const risksNow = planOverview(next).risks;

  return {
    rows,
    frailty: desc.frailty,
    opened: now.filter((id) => !was.includes(id)).map(short),
    closed: was.filter((id) => !now.includes(id)).map(short),
    touched: plan ? planDiff(plan, buildPlan(next, notes)).touched : [],
    week: weekWas !== weekNow ? { before: weekWas, after: weekNow } : null,
    // only what is new to watch for: the plan names three risks at most, so
    // one that drops off its list has not necessarily gone
    risks: risksNow.filter((r) => !risksWas.includes(r)),
  };
}

// A row of a change, as one line of the history.
const rowLine = (r) =>
  r.added || r.removed
    ? `${r.title}: ${[r.removed.length && `više ne: ${r.removed.join(', ')}`, r.added.length && `sada i: ${r.added.join(', ')}`].filter(Boolean).join('; ')}`
    : `${r.title}: ${r.before} → ${r.after}`;

// The change as the history keeps it: what moved, whether her state changed or
// the record was corrected, and what it did to the plan.
export function changeEntry({ part, impact, kind, since }) {
  const one = impact.rows.length === 1;
  return {
    kind,
    by: 'you',
    title: one ? rowLine(impact.rows[0]) : `${part.title}: ${impact.rows.length} izmene`,
    lines: [
      ...(one ? [] : impact.rows.map(rowLine)),
      kind === 'correction' ? 'Ispravka zapisa.' : `Promena stanja${since ? ` od ${longDate(since)}` : ''}.`,
      [
        impact.frailty && `Nivo krhkosti: ${impact.frailty.before} → ${impact.frailty.after}.`,
        impact.touched.length ? `U planu nege se promenilo: ${impact.touched.join(', ')}.` : 'Plan nege je ostao isti.',
      ]
        .filter(Boolean)
        .join(' '),
    ],
  };
}

// ── reading it ──────────────────────────────────────────────────────────────

// What to watch for, at the top of the chart: the risks the plan names, and
// every allergy written down.
export function alertsOf(answers, record) {
  return [...planOverview(answers).risks, ...record.health.allergies.map((a) => `Alergija: ${a.name}`)];
}

// How she was on a visit, as the caregiver wrote it in the work order: the
// chart's notes from those who see her. Read from the visits, not kept twice.
function visitNotes(care) {
  const today = todayOf(care);
  const day0 = dayOf('danas', today);
  return allVisits(care)
    .filter((v) => v.report)
    .map((v) => ({
      id: `v-${v.id}`,
      // noon of its day, on the care state's clock
      at: (today + Math.round((dayOf(v.date, today) - day0) / 86400000)) * 24 + 12,
      kind: 'visit',
      by: 'caregiver',
      who: firstName(v.caregiver.name),
      day: v.date,
      title: 'Zapažanje sa posete',
      lines: [
        [
          v.report.mood && `Raspoloženje: ${MOOD_LABEL[v.report.mood].toLowerCase()}`,
          v.report.eating && `Ishrana: ${AMOUNT_LABEL[v.report.eating].toLowerCase()}`,
          v.report.moving && `Kretanje: ${AMOUNT_LABEL[v.report.moving].toLowerCase()}`,
        ]
          .filter(Boolean)
          .join(' · '),
        v.report.concern,
        v.report.note,
      ].filter(Boolean),
    }));
}

// The history: every entry written here and every note from a visit, newest
// first.
export function recordHistory(record, care) {
  return [...record.log, ...(care ? visitNotes(care) : [])].sort((a, b) => b.at - a.at);
}

export const HISTORY_KIND = {
  opened: 'Otvoren',
  added: 'Upisano',
  state: 'Promena stanja',
  correction: 'Ispravka',
  ended: 'Zaključeno',
  undo: 'Poništeno',
  visit: 'Sa posete',
};
