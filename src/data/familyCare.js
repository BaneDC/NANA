import { caregivers } from './carePlan';
import { SERVICE_FEE, money, serviceTitle, totalsFor } from './caregiverBoard';

// The family's side of NANA Prime: everyone who has cared for their mother, the
// terms each of them works under, and every visit and what it cost. It starts
// empty (see familyStart) and fills with what the family does, and with what the
// caregivers and the coordinator do, which this build only simulates (sim.js).
//
// A visit moves through the same states the billing prototype uses, in the
// family's words:
//   planned   — the plan is in and the money is set aside, not charged
//   awaiting  — the visit happened, the caregiver has not sent the work order
//   charging  — the work order is in; it is charged in 24 h unless queried
//   disputed  — the family queried the plan or the work order; nothing moves
//               until the coordinator has settled it (`resolution`)
//   paid      — charged
//   cancelled — called off, or did not happen; the money went back (unless
//               called off inside the last hour, `lateCharge`)
//
// A work order with more hours than were reserved charges only what was
// reserved; the rest is `extra`, which the family approves or declines.

export { money, serviceTitle, totalsFor, SERVICE_FEE };

// What the family is charged is the whole of it. The 10% is between the
// platform and the caregiver and is none of the family's business — showing
// them a "you receive" line would be showing them someone else's payslip.
export const chargedFor = (hours, rate) => totalsFor(hours, rate).charged;

// Finnish VAT, already inside that price (the agreement says "PDV uključen"):
// nothing is added on top. The work order says how much of its total it is, as
// a receipt does.
export const VAT = 0.255;
export const vatIn = (gross) => Math.round((gross - gross / (1 + VAT)) * 100) / 100;
export const vatText = `${(VAT * 100).toLocaleString('sr-RS')}%`;
// the agreed rate, wherever the terms are shown: the VAT is in it
export const rateText = (rate) => `${money(rate)} / h, PDV uključen`;

// Inside this, calling a visit off costs the whole visit: she has kept the time
// and can no longer fill it.
export const LATE_HOURS = 1;

export const MOOD_LABEL = { low: 'Loše', usual: 'Kao i obično', good: 'Dobro' };
export const AMOUNT_LABEL = { less: 'Manje nego obično', usual: 'Kao i obično', more: 'Više nego obično' };

// ── time ────────────────────────────────────────────────────────────────────
// The care state keeps its own clock, `now`: hours from midnight on the demo's
// first day, 11 August 2026, starting at 08:00. Nothing moves on its own; the
// simulation moves the clock, and with it every visit whose time has come.
// Dates are said the way people say them ("Danas", "Sutra", "10. avgusta").

export const START_HOUR = 8;
const EPOCH = new Date(2026, 7, 11);
const MONTHS = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
// "10. avgusta": the genitive, as a date is said
const GENITIVE = ['januara', 'februara', 'marta', 'aprila', 'maja', 'juna', 'jula', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra'];

const nowOf = (c) => c?.now ?? START_HOUR;
export const todayOf = (c) => Math.floor(nowOf(c) / 24);
const dateOfDay = (day) => new Date(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate() + day);
// the calendar date of a prototype day, and today's (for a date picker)
export const dateOfToday = (c) => dateOfDay(todayOf(c));
// a picked date, as it is said with its year: "1. novembra 2026" (no closing
// dot, so it can end a sentence)
export const longDate = (d) => `${d.getDate()}. ${GENITIVE[d.getMonth()]} ${d.getFullYear()}`;
export const dateText = (day) => {
  const d = dateOfDay(day);
  return `${d.getDate()}. ${GENITIVE[d.getMonth()]}`;
};
export function dayLabel(day, today) {
  const diff = day - today;
  if (diff === 0) return 'Danas';
  if (diff === 1) return 'Sutra';
  if (diff === -1) return 'Juče';
  return dateText(day);
}
export const hourText = (h) => {
  const t = ((h % 24) + 24) % 24;
  return `${String(Math.floor(t)).padStart(2, '0')}:${t % 1 ? '30' : '00'}`;
};
// when something happened, as the activity list says it: "danas u 08:00"
export const whenText = (at, now) => `${dayLabel(Math.floor(at / 24), Math.floor(now / 24)).toLowerCase()} u ${hourText(at % 24)}`;

// A date as written on a visit, read back into a day so visits can be ordered
// and grouped. `today` is the care state's day (`todayOf`).
export function dayOf(text, today = 0) {
  const t = String(text).trim().toLowerCase();
  const shift = { danas: 0, sutra: 1, juče: -1, upravo: 0 }[t];
  if (shift !== undefined) return dateOfDay(today + shift);
  const [d, m, y] = t.split(' ');
  const mi = GENITIVE.indexOf(m);
  return mi === -1 ? new Date(0) : new Date(y ? Number(y) : EPOCH.getFullYear(), mi, parseInt(d, 10));
}
export const monthOf = (text, today = 0) => {
  const d = dayOf(text, today);
  return Math.abs(d - dateOfDay(today)) <= 86400000 ? 'Ove nedelje' : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// ── reading it ──────────────────────────────────────────────────────────────

export const firstName = (name) => name.split(' ')[0];
export const nameOf = (c, caregiverId) =>
  arrangementOf(c, caregiverId)?.caregiver.name || caregivers.find((x) => x.id === caregiverId)?.name || '';

// A count with its noun in the right form: 1 usluga, 3 usluge, 5 usluga.
export function pl(n, one, few, many) {
  const d = n % 10;
  const h = n % 100;
  if (d === 1 && h !== 11) return `${n} ${one}`;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}
export const services = (n) => pl(n, 'usluga', 'usluge', 'usluga');

export const activeVersion = (a) => a.versions.find((v) => v.status === 'active') || null;
export const pendingVersion = (a) => a.versions.find((v) => v.status === 'sent') || null;
// what to show when nothing is in force or waiting: the last one there was
export const shownVersion = (a) => pendingVersion(a) || activeVersion(a) || a.versions[a.versions.length - 1] || null;
export const lastVersion = (a) => a.versions[a.versions.length - 1] || null;

export const arrangementOf = (c, caregiverId) => c.arrangements.find((a) => a.caregiver.id === caregiverId);

// every visit, with the caregiver it belongs to beside it
export const allVisits = (c) => c.arrangements.flatMap((a) => a.visits.map((v) => ({ ...v, caregiver: a.caregiver })));

export const findVisit = (c, id) => allVisits(c).find((v) => v.id === id);

// What a visit costs the family. A work order can say fewer hours than were
// reserved (only those are charged, the rest goes back) or more: only what was
// reserved is taken on its own, and the hours over it only once the family
// approves them.
export const workedHours = (v) => Math.min(v.report?.hours ?? v.hours, v.hours);
export const extraCharge = (v) => (v.extra?.status === 'approved' ? chargedFor(v.extra.hours, v.rate) : 0);
export const visitCharge = (v) => chargedFor(workedHours(v), v.rate) + extraCharge(v);
// what goes back to the card when she worked fewer hours than were reserved
export const returnedFor = (v) => (v.report && v.report.hours < v.hours ? chargedFor(v.hours - v.report.hours, v.rate) : 0);
export const chargingVisit = (c) => allVisits(c).find((v) => v.status === 'charging');

export const heldNow = (c) =>
  allVisits(c)
    .filter((v) => v.status === 'planned')
    .reduce((sum, v) => sum + chargedFor(v.hours, v.rate), 0);

// Her visits as her page lists them: anything still moving first, then
// everything settled, each with who she is on it.
export function herVisits(a) {
  const open = a.visits.filter((v) => v.status !== 'paid' && v.status !== 'cancelled');
  const rest = a.visits.filter((v) => !open.includes(v));
  return [...open, ...rest].map((v) => ({ ...v, caregiver: a.caregiver }));
}

// The newest paid visit, by its date.
export const lastVisit = (c) =>
  allVisits(c)
    .filter((v) => v.status === 'paid')
    .sort((x, y) => dayOf(y.date, todayOf(c)) - dayOf(x.date, todayOf(c)))[0];

// What is waiting on the family, in the order it blocks things: terms stop every
// visit behind them; a work order is the other way round and goes through on
// its own unless they say something; hours over the reserved ones wait for a
// yes or a no.
export function waitingOnYou(c) {
  const out = [];
  for (const a of c.arrangements) {
    const pen = pendingVersion(a);
    if (pen) out.push({ kind: 'terms', arrangement: a, version: pen });
  }
  for (const v of allVisits(c)) {
    if (v.status === 'charging') out.push({ kind: 'work-order', visit: v });
    else if (v.extra?.status === 'asked') out.push({ kind: 'extra', visit: v });
  }
  return out;
}

// Answers to the family's requests they have not looked at yet. A request
// they sent is not news; a yes or a no to it is, until they open "Moji upiti".
export const unseenAnswers = (c) => c.requests.filter((r) => r.status !== 'pending' && !r.seen).length;

export const seeAnswers = (c) =>
  unseenAnswers(c)
    ? { ...c, requests: c.requests.map((r) => (r.status !== 'pending' && !r.seen ? { ...r, seen: true } : r)) }
    : c;

// Requests are kept newest first, so the first one for her is the latest.
export const latestRequest = (c, caregiverId) => c.requests.find((r) => r.caregiverId === caregiverId) || null;

// Whether the family can write to her now. Not while a request waits for her
// answer, nor while she works for them; after a no, or after the cooperation
// ended, they can ask again.
export function canAsk(c, caregiverId) {
  const r = latestRequest(c, caregiverId);
  if (r?.status === 'pending') return false;
  const a = arrangementOf(c, caregiverId);
  if (a && !a.endedOn) return false;
  if (a?.endedOn && r?.again && r.status === 'accepted') return false;
  return true;
}

// Where the family stands with a caregiver, said as one pill wherever she is
// shown (Pronađi, the plan's caregivers, her profile): she comes, she came,
// her terms wait, or what became of the request. Nothing when they have never
// written to her. A request sent after a cooperation ended speaks for itself.
export function standingWith(c, caregiverId) {
  const a = arrangementOf(c, caregiverId);
  const r = latestRequest(c, caregiverId);
  if (a && !(a.endedOn && r?.again && r.status !== 'accepted')) {
    if (pendingVersion(a)) return { text: 'Ugovor čeka vas', pill: 'is-pending' };
    if (a.endedOn) return { text: 'Dolazila ranije', pill: 'is-muted' };
    if (activeVersion(a)) return { text: 'Već dolazi', pill: 'is-accepted' };
    if (lastVersion(a)?.status === 'declined') return { text: 'Uslovi odbijeni', pill: 'is-declined' };
    return { text: 'Prihvatila', pill: 'is-accepted' };
  }
  if (!r) return null;
  if (r.status === 'accepted') return { text: 'Prihvatila', pill: 'is-accepted' };
  if (r.status === 'declined') return { text: 'Odbila', pill: 'is-declined' };
  return { text: `Upit poslat ${r.requested}`, pill: 'is-pending' };
}

// Why an arrangement cannot be ended right now: a visit she has already made
// and not been paid for, or hours over the reserved ones still waiting on an answer.
export const unsettled = (a) =>
  a.visits.filter((v) => v.status === 'awaiting' || v.status === 'charging' || v.status === 'disputed' || v.extra?.status === 'asked');

// ── what happened ───────────────────────────────────────────────────────────
// Everything that happens to the family's care is written down as it happens,
// newest first, for "Šta se desilo": what it was, about whom, who did it, when.
//   kind: request | agreement | visit | money
//   by:   you | caregiver | coordinator
// The title never declines her name (Finnish names do not take Serbian cases):
// who it is about stands beside it.

export const LOG_KINDS = [
  { id: 'request', label: 'Upiti' },
  { id: 'agreement', label: 'Ugovor' },
  { id: 'visit', label: 'Posete' },
  { id: 'money', label: 'Novac' },
];

export function logged(c, ...entries) {
  const base = c.log?.length || 0;
  const added = entries.map((e, i) => ({ id: `l${base + i + 1}`, at: nowOf(c), ...e })).reverse();
  return { ...c, log: [...added, ...(c.log || [])] };
}

// ── changing it ─────────────────────────────────────────────────────────────
// Each takes the whole state and returns the next, so the screens can hand them
// straight to the setter.

export const mapArrangement = (c, caregiverId, fn) => ({
  ...c,
  arrangements: c.arrangements.map((a) => (a.caregiver.id === caregiverId ? fn(a) : a)),
});

export const mapVisit = (c, visitId, fn) => ({
  ...c,
  arrangements: c.arrangements.map((a) => ({
    ...a,
    visits: a.visits.map((v) => (v.id === visitId ? fn(v) : v)),
  })),
});

// Asking costs nothing and commits nobody; she answers from her own board. A
// family can ask again after a no, or after a cooperation ended.
export const askCaregiver = (caregiverId, message) => (c) => {
  if (!canAsk(c, caregiverId)) return c;
  const again = Boolean(latestRequest(c, caregiverId));
  const today = todayOf(c);
  return logged(
    {
      ...c,
      requests: [
        {
          id: `${caregiverId}-${c.requests.length + 1}`,
          caregiverId,
          status: 'pending',
          requestedDay: today,
          requested: dayLabel(today, today).toLowerCase(),
          detail: 'Još nije odgovorila. Javićemo vam u svakom slučaju.',
          message: message || 'Da li biste mogli da dolazite?',
          again,
        },
        ...c.requests,
      ],
    },
    { kind: 'request', caregiverId, by: 'you', title: again ? 'Ponovo ste joj pisali' : 'Poslali ste upit', detail: message }
  );
};

export const linkCard = (c) =>
  logged(
    { ...c, payment: { connected: true, brand: 'Visa', last4: '4242', connectedOn: dateText(todayOf(c)) } },
    { kind: 'money', by: 'you', title: 'Kartica je dodata', detail: 'Visa ···· 4242. Posete sada mogu da se rezervišu.' }
  );

// The proposed version takes over; the one it replaces is kept, marked replaced.
// Agreeing to terms after a cooperation ended starts it again: the earlier
// stretch is kept in `periods`.
export const agreeTerms = (caregiverId) => (c) => {
  const a = arrangementOf(c, caregiverId);
  const pen = a && pendingVersion(a);
  if (!pen) return c;
  const today = dateText(todayOf(c));
  const restart = Boolean(a.endedOn);
  return logged(
    mapArrangement(c, caregiverId, (x) => ({
      ...x,
      endedOn: null,
      periods: restart ? [...(x.periods || []), { since: x.since, endedOn: x.endedOn }] : x.periods,
      since: activeVersion(x) && !restart ? x.since : today,
      versions: x.versions.map((v) =>
        v.status === 'sent'
          ? { ...v, status: 'active', agreedOn: today }
          : v.status === 'active'
            ? { ...v, status: 'replaced' }
            : v
      ),
    })),
    {
      kind: 'agreement',
      caregiverId,
      by: 'you',
      title: `Prihvatili ste uslove, verzija ${pen.version}`,
      detail: restart ? 'Saradnja počinje ponovo.' : `${money(pen.rate)} na sat, ${services(pen.services.length)}.`,
    }
  );
};

export const declineTerms = (caregiverId) => (c) => {
  const pen = pendingVersion(arrangementOf(c, caregiverId));
  if (!pen) return c;
  return logged(
    mapArrangement(c, caregiverId, (a) => ({
      ...a,
      versions: a.versions.map((v) => (v.status === 'sent' ? { ...v, status: 'declined', declinedOn: dateText(todayOf(c)) } : v)),
    })),
    { kind: 'agreement', caregiverId, by: 'you', title: `Odbili ste uslove, verzija ${pen.version}`, detail: 'Koordinatorka će vas pozvati.' }
  );
};

// A visit plan the family has not said yes to yet. It arrives from the
// caregiver and waits at the top of the home; once confirmed it is one of the
// visits that are coming. Saying something is wrong with it, or calling the
// visit off, is done from the plan itself.
export const plansToConfirm = (c) => allVisits(c).filter((v) => v.status === 'planned' && !v.planOk);

export const confirmPlan = (visitId) => (c) => {
  const v = findVisit(c, visitId);
  return logged(mapVisit(c, visitId, (x) => ({ ...x, planOk: true })), {
    kind: 'visit',
    caregiverId: v.caregiver.id,
    by: 'you',
    title: 'Potvrdili ste plan posete',
    detail: `${v.date} · ${v.time}.`,
  });
};

// Saying it is fine only brings the charge forward. Silence does the same thing
// 24 hours later, which is the arrangement they signed up to.
export const confirmVisit = (visitId) => (c) => {
  const v = findVisit(c, visitId);
  const next = mapVisit(c, visitId, (x) => ({ ...x, status: 'paid', chargedOn: dateText(todayOf(c)), confirmed: 'you' }));
  return logged(next, {
    kind: 'money',
    caregiverId: v.caregiver.id,
    by: 'you',
    title: `Plaćeno ${money(visitCharge(v))}`,
    detail: `Radni nalog za ${v.date.toLowerCase()} je potvrđen.`,
  });
};

// A query on a plan or on a work order: nothing moves until the coordinator has
// looked at it, and the caregiver is told not to come in the meantime.
export const queryVisit = (visitId, reason) => (c) => {
  const v = findVisit(c, visitId);
  return logged(
    mapVisit(c, visitId, (x) => ({ ...x, status: 'disputed', queriedFrom: x.status, queryReason: reason })),
    {
      kind: 'visit',
      caregiverId: v.caregiver.id,
      by: 'you',
      title: v.status === 'planned' ? 'Prijavili ste problem sa planom posete' : 'Prijavili ste problem sa radnim nalogom',
      detail: reason,
    }
  );
};

export const callOffVisit = (visitId, reason) => (c) => {
  const v = findVisit(c, visitId);
  // inside the last hour she has held the time and cannot fill it
  const late = (v.dueInHours ?? Infinity) < LATE_HOURS;
  const held = chargedFor(v.hours, v.rate);
  return logged(
    mapVisit(c, visitId, (x) => ({
      ...x,
      // an earlier query settled on this plan is no longer what happened to it
      resolution: undefined,
      status: 'cancelled',
      cancelledBy: 'you',
      cancelReason: reason,
      lateCharge: late,
      chargedOn: late ? dateText(todayOf(c)) : undefined,
    })),
    late
      ? { kind: 'money', caregiverId: v.caregiver.id, by: 'you', title: `Otkazano u poslednjem satu, naplaćeno ${money(held)}`, detail: reason }
      : { kind: 'visit', caregiverId: v.caregiver.id, by: 'you', title: `Otkazali ste posetu, ${money(held)} vraćeno`, detail: `${v.date} · ${v.time}. ${reason}.` }
  );
};

// Hours a caregiver worked over the reserved ones are charged only with a yes.
export const answerExtra = (visitId, approve) => (c) => {
  const v = findVisit(c, visitId);
  if (v?.extra?.status !== 'asked') return c;
  const amount = chargedFor(v.extra.hours, v.rate);
  return logged(
    mapVisit(c, visitId, (x) => ({ ...x, extra: { ...x.extra, status: approve ? 'approved' : 'declined', answeredOn: dateText(todayOf(c)) } })),
    {
      kind: 'money',
      caregiverId: v.caregiver.id,
      by: 'you',
      title: approve ? `Odobrili ste dodatne sate, ${money(amount)}` : 'Odbili ste dodatne sate',
      detail: `${pl(v.extra.hours, 'sat', 'sata', 'sati')} preko rezervisanog, ${v.date.toLowerCase()}.`,
    }
  );
};

// Only once nothing is left unsettled. A booked visit is called off with it and
// its money goes back.
export const endArrangement = (caregiverId, by = 'you') => (c) =>
  logged(
    mapArrangement(c, caregiverId, (a) => ({
      ...a,
      endedOn: dateText(todayOf(c)),
      endedBy: by,
      versions: a.versions.map((v) =>
        v.status === 'active' ? { ...v, status: 'ended' } : v.status === 'sent' ? { ...v, status: 'withdrawn' } : v
      ),
      visits: a.visits.map((v) =>
        v.status === 'planned' ? { ...v, status: 'cancelled', cancelledBy: by, cancelReason: 'Saradnja je završena' } : v
      ),
    })),
    { kind: 'agreement', caregiverId, by, title: 'Saradnja je završena', detail: 'Sve što je izmireno ostaje u evidenciji.' }
  );

// ── the clock ───────────────────────────────────────────────────────────────

// Dates written relative to today ("Sutra") are said again for the new today;
// so are the hours left before a visit and before a work order is charged.
export function relabel(c) {
  const now = nowOf(c);
  const today = todayOf(c);
  return {
    ...c,
    requests: c.requests.map((r) => (r.requestedDay == null ? r : { ...r, requested: dayLabel(r.requestedDay, today).toLowerCase() })),
    arrangements: c.arrangements.map((a) => ({
      ...a,
      versions: a.versions.map((v) => (v.sentAt == null ? v : { ...v, sentOn: whenText(v.sentAt, now) })),
      visits: a.visits.map((v) => {
        if (v.day == null) return v;
        const next = { ...v, date: dayLabel(v.day, today), dueInHours: v.day * 24 + v.start - now };
        if (v.sentAt != null) next.sentOn = whenText(v.sentAt, now);
        if (v.reportAt != null) next.reportSentOn = whenText(v.reportAt, now);
        if (v.status === 'charging' && v.reportAt != null) next.chargesInHours = Math.max(0, v.reportAt + 24 - now);
        return next;
      }),
    })),
  };
}
