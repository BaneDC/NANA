import { questionById, steps } from './flow';
import { srField, srShort } from './flow.sr';
import { answerText, applyChanges, describeChanges, planDiff, planQuestions } from './planEdits';
import { buildPlan, quoted } from './carePlan';
import { frailtyOf } from './frailty';
import { planOverview } from './carePlan.sr';
import { needFrom, scheduleText } from './familyStart';
import { known, localized, msg, t, tn } from '../i18n';
import { START_HOUR, allVisits, dayOf, firstName, longDate, todayOf } from './familyCare';

// The medical record: everything about the person being cared for, in one
// place, as a chart keeps it (docs/patterns.md §10a). The care plan is built
// for a moment and a need; the record is who she is, whatever the plan.
//
// Most of it is not kept twice. Who she is, how she moves and manages and what
// support she needs are the answers the family gave Minna,
// read here part by part; changing one is changing the answer, and the plan is
// built again from it. What a conversation never asked for a chart still
// holds: diagnoses, medicines, allergies and aids, kept here as entries.
//
// A chart is never overwritten. A change is written down beside what was
// there: what it was and what it is now, who wrote it and what it did to the
// plan. That is the history; nothing in it is ever removed, and an entry that
// no longer holds is closed, not deleted.
//
// Two ways in, by what the change is. Something happened to her (a fall, a
// stay in hospital, she manages less than she did): that is told to the
// assistant, which asks what it needs to know, proposes the answers that
// follow from it and, once the family agrees, writes the event here and the
// plan is built again (one plan, never versions of it: docs/plan-nege.md). The record was simply wrong (a
// misspelt name, the wrong option picked): that is corrected by hand, in the
// part's own dialog.

const stepIds = (id) => steps.find((s) => s.id === id).questions.map((q) => q.id);

// The parts of the chart read from the answers, in the order the page shows
// them. `support` holds whichever questions her frailty band asks. Titles are
// Serbian keys (msg), shown through t().
export const RECORD_PARTS = {
  daily: { id: 'daily', title: msg('Kretanje i samostalnost'), questions: stepIds('daily-life') },
  support: { id: 'support', title: msg('Podrška koja joj treba'), questions: stepIds('support') },
  person: { id: 'person', title: msg('Lični podaci'), questions: ['about-person', 'household', 'home-condition'] },
  contact: { id: 'contact', title: msg('Kontakt osoba'), questions: ['about-you'] },
};
// Why the family called, how it began and whether she was in hospital then are
// not parts of the chart: they say what brought the family to us, which is the
// plan's context, and stay with the plan (its overview shows them).

// Where she lives is not a line of "Lični podaci": a move has a flow of its
// own, so it is a card of its own.
const OWN_FLOW = { 'about-person': ['city'] };
export const fieldLocked = (questionId, fieldId) => Boolean(OWN_FLOW[questionId]?.includes(fieldId));

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
      return q.fields
        .filter((f) => !fieldLocked(q.id, f.id))
        .map((f) => ({ key: q.id + '.' + f.id, label: srField(q, f.id), value: known(answer?.values?.[f.id]?.trim() || '-') }));
    }
    return [{ key: q.id, label: srShort(q), value: answer ? answerText(q, answer) : '-' }];
  });
  return { rows, missing: rows.filter((r) => r.value === '-').length };
}

// ── what a conversation does not ask ────────────────────────────────────────
// Each list says what it holds, what it says when it is empty, and how an
// entry that no longer holds is said to have ended. Entries are written and
// closed by the assistant (`healthOps`), never by hand. The words are Serbian
// keys (msg), shown through t().

export const HEALTH = [
  {
    id: 'conditions',
    title: msg('Dijagnoze i stanja'),
    empty: msg('Nijedna dijagnoza nije upisana.'),
    end: msg('Više ne važi'),
  },
  {
    id: 'medications',
    title: msg('Lekovi'),
    // written as prescribed: this is a note of it, never our word on it
    empty: msg('Nijedan lek nije upisan.'),
    end: msg('Više ne uzima'),
  },
  {
    id: 'allergies',
    title: msg('Alergije'),
    empty: msg('Nijedna alergija nije upisana.'),
    end: msg('Više ne važi'),
  },
  {
    id: 'aids',
    title: msg('Pomagala'),
    empty: msg('Nijedno pomagalo nije upisano.'),
    end: msg('Više ne koristi'),
  },
];

export const healthList = (id) => HEALTH.find((h) => h.id === id);

// the line under an entry's name: what was noted, and from when. A note the
// demo wrote is a Serbian key; one the family gave stays as they wrote it.
export const entryLine = (e) =>
  [e.note && t(e.note), e.since && t('od {date}', { date: longDate(e.since) })].filter(Boolean).join(' · ');

const OPENED = {
  kind: 'opened',
  by: 'minna',
  title: msg('Karton je otvoren'),
  lines: [msg('Iz upoznavanja sa Minnom: lični podaci, svakodnevica i podrška.')],
};

// A history entry's title and lines are written in the language being read;
// the fixed ones are Serbian keys (msg), so the page reads them through t().

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
        { id: 'h1', name: msg('Povišen krvni pritisak'), note: msg('Pod kontrolom, uz terapiju') },
        { id: 'h2', name: msg('Osteoporoza'), note: msg('Kontrola jednom godišnje') },
      ],
      medications: [
        { id: 'h3', name: 'Amlodipin 5 mg', note: msg('Jednom dnevno, ujutru') },
        { id: 'h4', name: msg('Kalcijum i vitamin D'), note: msg('Uz doručak') },
      ],
      allergies: [{ id: 'h5', name: msg('Penicilin'), note: msg('Osip') }],
      aids: [{ id: 'h6', name: msg('Štap'), note: msg('Napolju i na stepenicama') }],
    },
    log: [
      {
        id: 'k2',
        at: opened + 25,
        kind: 'added',
        by: 'you',
        title: msg('Upisano zdravlje'),
        lines: [msg('Dijagnoze i stanja: 2 · Lekovi: 2 · Alergije: 1 · Pomagala: 1')],
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

  const bandWas = frailtyOf(answers)?.band ?? null;
  const bandNow = frailtyOf(next)?.band ?? null;

  return {
    rows,
    frailty: desc.frailty,
    // the kind of support she needs, when the level crosses into another band
    band: bandWas !== bandNow,
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
    ? `${r.title}: ${[
        r.removed.length && t('više ne: {items}', { items: r.removed.join(', ') }),
        r.added.length && t('sada i: {items}', { items: r.added.join(', ') }),
      ]
        .filter(Boolean)
        .join('; ')}`
    : `${r.title}: ${r.before} → ${r.after}`;

// what a change did to the plan, as one line of the history
const planLine = (impact) =>
  [
    impact.frailty && t('Nivo krhkosti: {before} → {after}.', impact.frailty),
    impact.touched.length ? t('U planu nege se promenilo: {parts}.', { parts: impact.touched.join(', ') }) : t('Plan nege je ostao isti.'),
  ]
    .filter(Boolean)
    .join(' ');

// What to do after a change, worked out from what it did, not written by the
// assistant: a different kind of support goes past the coordinator; a week of
// care that no longer matches what was agreed means new terms; questions the
// new level opens are still to be answered; something temporary is looked at
// again when it ends.
export function nextSteps({ impact, care, until }) {
  const working = (care?.arrangements || []).filter((a) => !a.endedOn);
  const names = working.map((a) => firstName(a.caregiver.name)).join(', ');
  return [
    impact?.band && t('Promenila se vrsta podrške koja joj treba. Pre novog dogovora neka koordinatorka pogleda plan.'),
    impact?.week &&
      (working.length
        ? t('Plan sada traži {week}, a dogovoreno je drugačije. Zatražite nove uslove ({names}).', { week: quoted(scheduleText(impact.week.after)), names })
        : t('Plan sada traži {week}. Novi upiti idu sa izmenjenim planom.', { week: quoted(scheduleText(impact.week.after)) })),
    impact?.opened.length > 0 &&
      t('Otvorila su se nova pitanja: {questions}. Asistent može da ih prođe sa vama.', { questions: impact.opened.join(', ') }),
    until && t('Privremeno je, do {date}. Tada javite asistentu kako je, da se plan vrati ili ostane.', { date: longDate(until) }),
  ].filter(Boolean);
}

// A day the assistant named, "2026-08-03", as a date; null when it is not one.
export function dayFrom(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

// What every list under "Zdravlje" is, said on the page and in each dialog:
// a note of what the family told us. NANA gives no medical advice, on
// medicines or anything else (docs/patterns.md §10a, §14).
export const NOTED_ONLY = msg('Ovo su beleške, upisane onako kako ste nam rekli. NANA ne daje medicinske savete: o lekovima, dijagnozama i terapiji odlučuje lekar.');

// What the assistant proposed for the lists (a medicine added, an aid no
// longer used), checked against the record: an entry to end has to be there.
export function healthOps(record, ops = []) {
  return ops
    .map((op) => {
      const list = healthList(op.list);
      const name = String(op.name || '').trim();
      if (!list || !name) return null;
      if (op.action === 'end') {
        // the assistant was told the name in the language being read (recordState)
        const entry = record.health[list.id].find((e) => [e.name, t(e.name)].some((n) => n.toLowerCase() === name.toLowerCase()));
        return entry ? { list: list.id, action: 'end', id: entry.id, name: entry.name } : null;
      }
      return { list: list.id, action: 'add', name, note: String(op.note || '').trim() };
    })
    .filter(Boolean);
}

// the same, as rows the proposal reads beside the answers
export const healthRows = (ops) =>
  ops.map((op, i) => ({
    questionId: `health-${i}`,
    title: t(healthList(op.list).title),
    before: op.action === 'end' ? t(op.name) : '-',
    after: op.action === 'end' ? t(healthList(op.list).end).toLowerCase() : [op.name, op.note].filter(Boolean).join(' · '),
  }));

const withHealth = (record, ops, since) => ({
  ...record,
  health: ops.reduce(
    (h, op, i) => ({
      ...h,
      [op.list]:
        op.action === 'end'
          ? h[op.list].filter((e) => e.id !== op.id)
          : [...h[op.list], { id: `h${record.log.length}-${i}`, name: op.name, note: op.note, since }],
    }),
    record.health
  ),
});

// Something that happened, written into the record once the family agreed to
// what the assistant proposed: what it was and from when, each answer and
// entry it moved, what it did to the plan, and what to do next.
export function writeEvent(record, at, { event, impact, impactFor, health = [], care, correction = false }) {
  // a proposal that is not an event (a correction, a plain change of the
  // plan) comes with none: `null`, which a default would not catch
  const what = String(event?.what || '').trim();
  const since = dayFrom(event?.since);
  const until = dayFrom(event?.until);
  // A history is read for years, in whatever language is chosen then: the
  // entry is written in every language (the impact worked out again in each,
  // `impactFor`, since what it names is in the language it was worked out in).
  // What the assistant wrote (`what`) stays as it wrote it.
  const entry = localized(() => {
    const said = impactFor ? impactFor() : impact;
    const rows = [...(said?.rows || []), ...healthRows(health)];
    return {
      title:
        what ||
        (rows.length === 1
          ? rowLine(rows[0])
          : `${correction ? t('Ispravka zapisa') : t('Promena stanja')}: ${tn(rows.length, 'izmena', 'izmene', 'izmena')}`),
      lines: [
        // one change with no event is its own title: not said twice
        ...(what || rows.length !== 1 ? rows.map(rowLine) : []),
        correction ? t('Ispravka zapisa.') : null,
        [since && t('Od {date}', { date: longDate(since) }), until && t('privremeno, do {date}', { date: longDate(until) })]
          .filter(Boolean)
          .join(', ') || null,
        said ? planLine(said) : t('Plan nege je ostao isti.'),
      ].filter(Boolean),
      next: nextSteps({ impact: said, care, until }),
    };
  });
  return written(withHealth(record, health, since), at, {
    // nothing happened to her: the record was wrong and is put right
    kind: correction ? 'correction' : 'state',
    by: 'you',
    via: 'assistant',
    ...entry,
  });
}

// What the assistant is told about the record, so it knows what is already
// written and does not ask for it again.
export function recordState(record, today) {
  return [
    `Today is ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.`,
    'Her medical record, the lists the plan is not built from:',
    JSON.stringify(Object.fromEntries(HEALTH.map((h) => [h.id, record.health[h.id].map((e) => ({ name: t(e.name), note: e.note ? t(e.note) : undefined }))]))),
  ].join('\n');
}

// ── reading it ──────────────────────────────────────────────────────────────

// What to watch for, at the top of the chart: the risks the plan names, and
// every allergy written down.
export function alertsOf(answers, record) {
  return [...planOverview(answers).risks, ...record.health.allergies.map((a) => t('Alergija: {name}', { name: t(a.name) }))];
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
      title: msg('Zapažanje sa posete'),
      // what she wrote, as she wrote it: the history says it (VisitNote in
      // MedicalRecord.jsx), what was off first
      report: v.report,
      lines: [],
    }));
}

// The history: every entry written here and every note from a visit, newest
// first.
export function recordHistory(record, care) {
  return [...record.log, ...(care ? visitNotes(care) : [])].sort((a, b) => b.at - a.at);
}

// The colour of an entry's badge (docs/patterns.md §10a), by what kind of
// entry it is and nothing else, so the list is not one grey: what changed
// about her is orange (attention), what was written green (done), the rest
// grey (routine, and most of the list). What a visit's note says is never in
// the badge: what was off is said in the note itself.
export const historyTone = (e) => (e.kind === 'state' ? 'default' : e.kind === 'added' ? 'success' : 'secondary');

// What a caregiver's note counts as off: low spirits, eating or moving less.
export const isOff = (value) => value === 'low' || value === 'less';

// What the history can be narrowed to, each a few kinds that read as one
// thing to a family. A chip shows only when there is something in it.
export const HISTORY_FILTERS = [
  { id: 'visit', label: msg('Sa poseta'), kinds: ['visit'] },
  { id: 'state', label: msg('Promene stanja'), kinds: ['state', 'ended'] },
  { id: 'correction', label: msg('Ispravke'), kinds: ['correction', 'undo'] },
  { id: 'added', label: msg('Upisano'), kinds: ['opened', 'added'] },
];

// Serbian keys (msg): shown through t()
export const HISTORY_KIND = {
  opened: msg('Otvoren'),
  added: msg('Upisano'),
  state: msg('Promena stanja'),
  correction: msg('Ispravka'),
  ended: msg('Zaključeno'),
  undo: msg('Poništeno'),
  visit: msg('Sa posete'),
};
