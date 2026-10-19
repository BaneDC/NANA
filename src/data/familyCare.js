import { caregiverById } from './carePlan';
import { SERVICE_FEE, totalsFor } from './fees';
import { serviceTitle } from './serviceCatalog';
import { eur as money } from '../lib/money';
import { getLang, known, locale, msg, registerFormat, say, t, tn } from '../i18n';

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
export const vatText = () => `${(VAT * 100).toLocaleString(locale())}%`;
// the agreed rate, wherever the terms are shown: the VAT is in it
export const rateText = (rate) => t('{rate} / h, PDV uključen', { rate: money(rate) });

// Inside this, calling a visit off costs the whole visit: she has kept the time
// and can no longer fill it.
export const LATE_HOURS = 1;

// Serbian keys: shown through t()
export const MOOD_LABEL = { low: msg('Loše'), usual: msg('Kao i obično'), good: msg('Dobro') };
export const AMOUNT_LABEL = { less: msg('Manje nego obično'), usual: msg('Kao i obično'), more: msg('Više nego obično') };

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
// The same in English and Finnish ("10 August", "10. elokuuta"), so a date written
// in any of the three languages can be read back (`dayOf`).
const MONTHS_IN = {
  en: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
  fi: ['tammikuuta', 'helmikuuta', 'maaliskuuta', 'huhtikuuta', 'toukokuuta', 'kesäkuuta', 'heinäkuuta', 'elokuuta', 'syyskuuta', 'lokakuuta', 'marraskuuta', 'joulukuuta'],
};
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// the words for days near today, in every language, read back as a shift
const SHIFT = {
  danas: 0, sutra: 1, juče: -1, upravo: 0,
  today: 0, tomorrow: 1, yesterday: -1, 'just now': 0,
  'tänään': 0, huomenna: 1, eilen: -1, 'juuri nyt': 0,
};

const nowOf = (c) => c?.now ?? START_HOUR;
export const todayOf = (c) => Math.floor(nowOf(c) / 24);
const dateOfDay = (day) => new Date(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate() + day);
// the calendar date of a prototype day, and today's (for a date picker)
export const dateOfToday = (c) => dateOfDay(todayOf(c));
// day and month, as a date is said in the language of the moment
const dayMonth = (d) => {
  const lang = getLang();
  if (lang === 'en') return `${d.getDate()} ${EN_MONTHS[d.getMonth()]}`;
  if (lang === 'fi') return `${d.getDate()}. ${MONTHS_IN.fi[d.getMonth()]}`;
  return `${d.getDate()}. ${GENITIVE[d.getMonth()]}`;
};
// a picked date, as it is said with its year: "1. novembra 2026" (no closing
// dot, so it can end a sentence)
export const longDate = (d) => `${dayMonth(d)} ${d.getFullYear()}`;
export const dateText = (day) => dayMonth(dateOfDay(day));
export function dayLabel(day, today) {
  const diff = day - today;
  if (diff === 0) return t('Danas');
  if (diff === 1) return t('Sutra');
  if (diff === -1) return t('Juče');
  return dateText(day);
}
// A date said inside a sentence: "danas", but "10 August" keeps its capital.
export const lowerDate = (text) => (/^\d/.test(String(text)) ? String(text) : String(text).toLowerCase());
export const hourText = (h) => {
  const x = ((h % 24) + 24) % 24;
  return `${String(Math.floor(x)).padStart(2, '0')}:${x % 1 ? '30' : '00'}`;
};
// when something happened, as the activity list says it: "danas u 08:00"
export const whenText = (at, now) =>
  t('{day} u {time}', { day: lowerDate(dayLabel(Math.floor(at / 24), Math.floor(now / 24))), time: hourText(at % 24) });

// A date as written on a visit, read back into a day so visits can be ordered
// and grouped. `today` is the care state's day (`todayOf`). It reads the date in
// any of the languages, since one written before a switch is still in its own.
export function dayOf(text, today = 0) {
  const s = String(text).trim().toLowerCase();
  const shift = SHIFT[s];
  if (shift !== undefined) return dateOfDay(today + shift);
  const [d, m, y] = s.replace(/\./g, '').split(/\s+/);
  let mi = GENITIVE.indexOf(m);
  if (mi === -1) mi = MONTHS_IN.en.indexOf(m);
  if (mi === -1) mi = MONTHS_IN.fi.indexOf(m);
  return mi === -1 ? new Date(0) : new Date(y ? Number(y) : EPOCH.getFullYear(), mi, parseInt(d, 10));
}
// The month a long list groups by (docs/patterns.md §8a): "avgust 2026",
// for a date written as text (a visit) or a prototype day (an entry's `at` / 24)
export const monthOf = (text, today = 0) => monthName(dayOf(text, today));
export const monthOfDay = (day) => monthName(dateOfDay(day));
const monthName = (d) => {
  if (getLang() === 'sr') return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return d.toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
};
// A date written as text, said again in the language of the moment (after a
// switch); text that is not a date stays as it is.
const DAY_MS = 86400000;
export const redate = (text) => {
  if (!text || typeof text !== 'string') return text;
  const d = dayOf(text);
  if (d.getTime() === 0) return text;
  const day = Math.round((d - dateOfDay(0)) / DAY_MS);
  return /\d{4}$/.test(text.trim()) ? longDate(d) : dateText(day);
};

// ── dates and counts inside a stored sentence ──────────────────────────────
// A log entry or a message keeps its sentence as a key and its values (say), so
// it is read in the language of the moment. A date in it is kept as the day it
// was (or, for a visit with no day of its own, the date as written), said when
// it is read; so are the counted nouns.
const RELATIVE = { 0: msg('Danas'), 1: msg('Sutra'), [-1]: msg('Juče') };
// a date written as text, in the language of the moment: "Sutra" is still
// "Tomorrow", not the day it was when it was written
const retext = (text) => {
  const shift = SHIFT[String(text || '').trim().toLowerCase()];
  if (shift !== undefined && RELATIVE[shift]) return t(RELATIVE[shift]);
  const d = redate(text);
  // not a date: a key the gallery wrote ("juče u 13:10"), or text as it is
  return d === text ? known(text) : d || '';
};
registerFormat('date', ({ day, today, text, lower } = {}) => {
  const out = day != null ? (today == null ? dateText(day) : dayLabel(day, today)) : retext(text);
  return lower ? lowerDate(out) : out;
});
registerFormat('hours', (n) => tn(n, 'sat', 'sata', 'sati'));
registerFormat('services', (n) => tn(n, 'usluga', 'usluge', 'usluga'));
// a key said in lower case inside a sentence: "otkazala: bila sam bolesna"
registerFormat('lower', (key) => t(key).toLowerCase());

// A visit's date as a stored sentence keeps it: its day, said as it was on the
// day it was written ("Sutra"), or its written date.
export const dateSaid = (v, today, lower = false) =>
  v.day != null ? { $fmt: 'date', value: { day: v.day, today, lower } } : { $fmt: 'date', value: { text: v.date, lower } };
export const hoursSaid = (n) => ({ $fmt: 'hours', value: n });
export const servicesSaid = (n) => ({ $fmt: 'services', value: n });

// ── reading it ──────────────────────────────────────────────────────────────

export const firstName = (name) => name.split(' ')[0];
export const nameOf = (c, caregiverId) =>
  arrangementOf(c, caregiverId)?.caregiver.name || caregiverById(caregiverId)?.name || '';

// A count with its noun in the right form: 1 usluga, 3 usluge, 5 usluga. The
// same as `tn`, which says it in the language of the moment.
export const pl = (n, one, few, many) => tn(n, one, few, many);
export const services = (n) => tn(n, 'usluga', 'usluge', 'usluga');

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

// A visit that has been: its time is over, whether or not it is paid yet
// (waiting for its work order, being charged, reported, paid).
export const hasBeen = (v) => ['awaiting', 'charging', 'disputed', 'paid'].includes(v.status);

// The newest visit that has been, by its date.
export const lastVisit = (c) =>
  allVisits(c)
    .filter(hasBeen)
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
    if (pendingVersion(a)) return { text: t('Ugovor čeka vas'), pill: 'is-pending' };
    if (a.endedOn) return { text: t('Dolazila ranije'), pill: 'is-muted' };
    if (activeVersion(a)) return { text: t('Već dolazi'), pill: 'is-accepted' };
    if (lastVersion(a)?.status === 'declined') return { text: t('Uslovi odbijeni'), pill: 'is-declined' };
    return { text: t('Prihvatila'), pill: 'is-accepted' };
  }
  if (!r) return null;
  if (r.status === 'accepted') return { text: t('Prihvatila'), pill: 'is-accepted' };
  if (r.status === 'declined') return { text: t('Odbila'), pill: 'is-declined' };
  return { text: t('Upit poslat {when}', { when: lowerDate(r.requested) }), pill: 'is-pending' };
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
  { id: 'request', label: msg('Upiti') },
  { id: 'agreement', label: msg('Ugovor') },
  { id: 'visit', label: msg('Posete') },
  { id: 'money', label: msg('Novac') },
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
          requested: lowerDate(dayLabel(today, today)),
          detail: msg('Još nije odgovorila. Javićemo vam u svakom slučaju.'),
          // the family's own words, or none: the plan goes with it either way, and a
          // sentence they did not write would read as theirs in "Moji upiti"
          message: message || '',
          again,
        },
        ...c.requests,
      ],
    },
    { kind: 'request', caregiverId, by: 'you', title: again ? msg('Ponovo ste joj pisali') : msg('Poslali ste upit'), detail: message }
  );
};

// The family takes back a request nobody has answered yet: it goes from the
// list, and the log keeps that it was sent and taken back. One that has an
// answer stays as it is.
export const withdrawRequest = (caregiverId) => (c) => {
  const r = latestRequest(c, caregiverId);
  if (r?.status !== 'pending') return c;
  return logged({ ...c, requests: c.requests.filter((x) => x !== r) }, { kind: 'request', caregiverId, by: 'you', title: msg('Otkazali ste upit') });
};

// A new card replaces the old one whole, so a declined or expiring one leaves
// nothing behind. Stripe gives back the brand, the last four and when it
// expires (month/year); the number never reaches us.
export const linkCard = (c) =>
  logged(
    { ...c, payment: { connected: true, brand: 'Visa', last4: '4242', expires: '11/2028', connectedOn: dateText(todayOf(c)) } },
    { kind: 'money', by: 'you', title: msg('Kartica je dodata'), detail: msg('Visa ···· 4242. Posete sada mogu da se rezervišu.') }
  );

// What is wrong with the saved card, if anything, on the care's own clock:
// the last charge was declined, it has expired, or it expires this month or
// the next (so the next visit or renewal may fall on it).
export function cardTrouble(c) {
  const p = c.payment;
  if (!p?.connected) return null;
  if (p.declined) return 'declined';
  if (!p.expires) return null;
  const [m, y] = p.expires.split('/').map(Number);
  const d = dateOfToday(c);
  const left = y * 12 + m - (d.getFullYear() * 12 + d.getMonth() + 1);
  return left < 0 ? 'expired' : left <= 1 ? 'expiring' : null;
}

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
      title: say('Prihvatili ste uslove, verzija {version}', { version: pen.version }),
      detail: restart ? msg('Saradnja počinje ponovo.') : say('{rate} na sat, {services}.', { rate: { $eur: pen.rate }, services: servicesSaid(pen.services.length) }),
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
    { kind: 'agreement', caregiverId, by: 'you', title: say('Odbili ste uslove, verzija {version}', { version: pen.version }), detail: msg('Koordinatorka će vas pozvati.') }
  );
};

// A visit plan the family has not seen yet. It is booked as soon as it
// arrives, so it is one of the visits that are coming either way; until they
// say they have seen it ("Video sam"), it also waits at the top of the home.
// It is not a yes: saying something is wrong with it, or calling the visit
// off, is done from the plan itself.
export const plansToConfirm = (c) => allVisits(c).filter((v) => v.status === 'planned' && !v.planOk);

export const confirmPlan = (visitId) => (c) => {
  const v = findVisit(c, visitId);
  return logged(mapVisit(c, visitId, (x) => ({ ...x, planOk: true })), {
    kind: 'visit',
    caregiverId: v.caregiver.id,
    by: 'you',
    title: msg('Videli ste plan posete'),
    detail: say('{date} · {time}.', { date: dateSaid(v, todayOf(c)), time: v.time }),
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
    title: say('Plaćeno {amount}', { amount: { $eur: visitCharge(v) } }),
    detail: say('Radni nalog za {date} je potvrđen.', { date: dateSaid(v, todayOf(c), true) }),
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
      title: v.status === 'planned' ? msg('Prijavili ste problem sa planom posete') : msg('Prijavili ste problem sa radnim nalogom'),
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
      ? { kind: 'money', caregiverId: v.caregiver.id, by: 'you', title: say('Otkazano u poslednjem satu, naplaćeno {amount}', { amount: { $eur: held } }), detail: reason }
      : {
          kind: 'visit',
          caregiverId: v.caregiver.id,
          by: 'you',
          title: say('Otkazali ste posetu, {amount} vraćeno', { amount: { $eur: held } }),
          detail: say('{date} · {time}. {reason}.', { date: dateSaid(v, todayOf(c)), time: v.time, reason: { $t: reason } }),
        }
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
      title: approve ? say('Odobrili ste dodatne sate, {amount}', { amount: { $eur: amount } }) : msg('Odbili ste dodatne sate'),
      detail: say('{hours} preko rezervisanog, {date}.', { hours: hoursSaid(v.extra.hours), date: dateSaid(v, todayOf(c), true) }),
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
        v.status === 'planned' ? { ...v, status: 'cancelled', cancelledBy: by, cancelReason: msg('Saradnja je završena') } : v
      ),
    })),
    { kind: 'agreement', caregiverId, by, title: msg('Saradnja je završena'), detail: msg('Sve što je izmireno ostaje u evidenciji.') }
  );

// ── the clock ───────────────────────────────────────────────────────────────

// Dates written relative to today ("Sutra") are said again for the new today;
// so are the hours left before a visit and before a work order is charged.
export function relabel(c) {
  const now = nowOf(c);
  const today = todayOf(c);
  return {
    ...c,
    requests: c.requests.map((r) => (r.requestedDay == null ? r : { ...r, requested: lowerDate(dayLabel(r.requestedDay, today)) })),
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

// After a language switch: every date written relative to today is said again,
// and so is every fixed date ("10. avgusta") kept on the care.
export function relanguage(c) {
  if (!c) return c;
  const next = relabel(c);
  const r = redate;
  return {
    ...next,
    // a request with no day of its own (the gallery's) keeps its date as text
    requests: next.requests.map((q) => (q.requestedDay == null && q.requested ? { ...q, requested: lowerDate(retext(q.requested)) } : q)),
    payment: next.payment?.connectedOn ? { ...next.payment, connectedOn: r(next.payment.connectedOn) } : next.payment,
    arrangements: next.arrangements.map((a) => ({
      ...a,
      since: r(a.since),
      endedOn: r(a.endedOn),
      periods: a.periods?.map((p) => ({ ...p, since: r(p.since), endedOn: r(p.endedOn) })),
      versions: a.versions.map((v) => ({
        ...v,
        agreedOn: r(v.agreedOn),
        declinedOn: r(v.declinedOn),
        sentOn: v.sentAt == null && v.sentOn ? lowerDate(retext(v.sentOn)) : v.sentOn,
      })),
      visits: a.visits.map((v) => ({
        ...v,
        date: v.day == null ? retext(v.date) : v.date,
        sentOn: v.sentAt == null && v.sentOn ? lowerDate(retext(v.sentOn)) : v.sentOn,
        chargedOn: r(v.chargedOn),
        extra: v.extra ? { ...v.extra, answeredOn: r(v.extra.answeredOn) } : v.extra,
        resolution: v.resolution ? { ...v.resolution, on: r(v.resolution.on) } : v.resolution,
      })),
    })),
  };
}
