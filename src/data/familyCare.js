import { SERVICE_FEE, money, serviceTitle, totalsFor } from './caregiverBoard';

// The family's side of NANA Prime: everyone who has cared for their mother, the
// terms each of them works under, and every visit and what it cost. It starts
// empty (see familyStart) and fills with what the family and the caregivers do.
//
// A visit moves through the same states the billing prototype uses, in the
// family's words:
//   planned   — the plan is in and the money is set aside, not charged
//   awaiting  — the visit happened, the caregiver has not sent the work order
//   charging  — the work order is in; it is charged in 24 h unless queried
//   disputed  — the family queried the plan or the work order; nothing moves
//   paid      — charged
//   cancelled — called off before it happened; the money went back

export { money, serviceTitle, totalsFor, SERVICE_FEE };

// What the family is charged is the whole of it. The 10% is between the
// platform and the caregiver and is none of the family's business — showing
// them a "you receive" line would be showing them someone else's payslip.
export const chargedFor = (hours, rate) => totalsFor(hours, rate).charged;

// Inside this, calling a visit off costs the whole visit: she has kept the time
// and can no longer fill it.
export const LATE_HOURS = 1;

export const MOOD_LABEL = { low: 'Loše', usual: 'Kao i obično', good: 'Dobro' };
export const AMOUNT_LABEL = { less: 'Manje nego obično', usual: 'Kao i obično', more: 'Više nego obično' };

// ── reading it ──────────────────────────────────────────────────────────────

export const firstName = (name) => name.split(' ')[0];

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

export const arrangementOf = (c, caregiverId) => c.arrangements.find((a) => a.caregiver.id === caregiverId);

// every visit, with the caregiver it belongs to beside it
export const allVisits = (c) => c.arrangements.flatMap((a) => a.visits.map((v) => ({ ...v, caregiver: a.caregiver })));

export const findVisit = (c, id) => allVisits(c).find((v) => v.id === id);

// The last visit hours can be worked at the rate agreed for it; a report can say
// more, but only what was reserved is ever taken.
export const visitCharge = (v) => chargedFor(Math.min(v.report?.hours ?? v.hours, v.hours), v.rate);

export const chargingVisit = (c) => allVisits(c).find((v) => v.status === 'charging');

export const heldNow = (c) =>
  allVisits(c)
    .filter((v) => v.status === 'planned')
    .reduce((sum, v) => sum + chargedFor(v.hours, v.rate), 0);

export const paidThisMonth = (c) =>
  allVisits(c)
    .filter((v) => v.status === 'paid' && /avgust/.test(v.chargedOn))
    .reduce((sum, v) => sum + visitCharge(v), 0);

export const lastVisit = (c) => allVisits(c).find((v) => v.status === 'paid');

// What is waiting on the family, in the order it blocks things: terms stop every
// visit behind them; a work order is the other way round and goes through on
// its own unless they say something.
export function waitingOnYou(c) {
  const out = [];
  for (const a of c.arrangements) {
    const pen = pendingVersion(a);
    if (pen) out.push({ kind: 'terms', arrangement: a, version: pen });
  }
  for (const v of allVisits(c)) {
    if (v.status === 'charging') out.push({ kind: 'work-order', visit: v });
  }
  return out;
}

// Why an arrangement cannot be ended right now: a visit she has already made
// and not been paid for.
export const unsettled = (a) => a.visits.filter((v) => v.status === 'awaiting' || v.status === 'charging' || v.status === 'disputed');

// Dates are written the way people say them ("Sutra", "10. avgusta"), so to
// order and group them they are read back into a day. The demo's today is
// 11 August 2026.
const TODAY = new Date(2026, 7, 11);
const MONTHS = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
// "10. avgusta": the genitive, as a date is said
const GENITIVE = ['januara', 'februara', 'marta', 'aprila', 'maja', 'juna', 'jula', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra'];
export function dayOf(text) {
  const t = String(text).trim().toLowerCase();
  const shift = { danas: 0, sutra: 1, juče: -1 }[t];
  if (shift !== undefined) return new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + shift);
  const [d, m, y] = t.split(' ');
  const mi = GENITIVE.indexOf(m);
  return mi === -1 ? new Date(0) : new Date(y ? Number(y) : TODAY.getFullYear(), mi, parseInt(d, 10));
}
export const monthOf = (text) => {
  const d = dayOf(text);
  return Math.abs(d - TODAY) <= 86400000 ? 'Ove nedelje' : `${MONTHS[d.getMonth()]} ${d.getFullYear()}.`;
};

// ── changing it ─────────────────────────────────────────────────────────────
// Each takes the whole state and returns the next, so the screens can hand them
// straight to the setter.

const mapArrangement = (c, caregiverId, fn) => ({
  ...c,
  arrangements: c.arrangements.map((a) => (a.caregiver.id === caregiverId ? fn(a) : a)),
});

const mapVisit = (c, visitId, fn) => ({
  ...c,
  arrangements: c.arrangements.map((a) => ({
    ...a,
    visits: a.visits.map((v) => (v.id === visitId ? fn(v) : v)),
  })),
});

// Asking costs nothing and commits nobody; she answers from her own board.
export const askCaregiver = (caregiverId, message) => (c) =>
  c.requests.some((r) => r.caregiverId === caregiverId)
    ? c
    : {
        ...c,
        requests: [
          {
            caregiverId,
            status: 'pending',
            requested: 'upravo',
            detail: 'Još nije odgovorila. Javićemo vam u svakom slučaju.',
            message: message || 'Da li biste mogli da dolazite?',
          },
          ...c.requests,
        ],
      };

export const linkCard = (c) => ({
  ...c,
  payment: { connected: true, brand: 'Visa', last4: '4242', connectedOn: 'danas' },
});

// The proposed version takes over; the one it replaces is kept, marked replaced.
export const agreeTerms = (caregiverId) => (c) =>
  mapArrangement(c, caregiverId, (a) => ({
    ...a,
    endedOn: null,
    since: a.versions.some((v) => v.status === 'active') ? a.since : 'danas',
    versions: a.versions.map((v) =>
      v.status === 'sent'
        ? { ...v, status: 'active', agreedOn: 'danas' }
        : v.status === 'active'
          ? { ...v, status: 'replaced' }
          : v
    ),
  }));

export const declineTerms = (caregiverId) => (c) =>
  mapArrangement(c, caregiverId, (a) => ({
    ...a,
    versions: a.versions.map((v) => (v.status === 'sent' ? { ...v, status: 'declined', declinedOn: 'danas' } : v)),
  }));

// Saying it is fine only brings the charge forward. Silence does the same thing
// 24 hours later, which is the arrangement they signed up to.
export const confirmVisit = (visitId) => (c) =>
  mapVisit(c, visitId, (v) => ({ ...v, status: 'paid', chargedOn: 'upravo', confirmed: 'you' }));

// A query on a plan or on a work order: nothing moves until the coordinator has
// looked at it, and the caregiver is told not to come in the meantime.
export const queryVisit = (visitId, reason) => (c) =>
  mapVisit(c, visitId, (v) => ({ ...v, status: 'disputed', queriedFrom: v.status, queryReason: reason }));

export const callOffVisit = (visitId, reason) => (c) =>
  mapVisit(c, visitId, (v) => ({
    ...v,
    status: 'cancelled',
    cancelledBy: 'you',
    cancelReason: reason,
    // inside the last hour she has held the time and cannot fill it
    lateCharge: (v.dueInHours ?? Infinity) < LATE_HOURS,
  }));

// Only once nothing is left unsettled. A booked visit is called off with it and
// its money goes back.
export const endArrangement = (caregiverId) => (c) =>
  mapArrangement(c, caregiverId, (a) => ({
    ...a,
    endedOn: 'danas',
    versions: a.versions.map((v) =>
      v.status === 'active' ? { ...v, status: 'ended' } : v.status === 'sent' ? { ...v, status: 'withdrawn' } : v
    ),
    visits: a.visits.map((v) =>
      v.status === 'planned' ? { ...v, status: 'cancelled', cancelledBy: 'you', cancelReason: 'Saradnja je završena' } : v
    ),
  }));
