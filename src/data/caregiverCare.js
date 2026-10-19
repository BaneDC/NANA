// What a caregiver does to a family's care: answer a request, send terms, plan
// a visit, send a work order, end the cooperation. One source for both sides:
// her own app calls these, and so does the simulation when the family's side
// is open and nobody is signed in as her (docs/superpowers/specs/2026-10-19-temelj-design.md).
// Each takes what she chose as an optional last argument; without it, it
// picks what the simulation always picked.

import { caregiverById } from './carePlan';
import { needFrom } from './familyStart';
import {
  START_HOUR,
  activeVersion,
  arrangementOf,
  chargedFor,
  dateSaid,
  endArrangement,
  findVisit,
  hourText,
  hoursSaid,
  lastVersion,
  latestRequest,
  logged,
  mapArrangement,
  mapVisit,
  pendingVersion,
  relabel,
  servicesSaid,
  todayOf,
  unsettled,
  whenText,
} from './familyCare';
import { market } from './market';
import { msg, say, t } from '../i18n';

export const nowOf = (c) => c.now ?? START_HOUR;
const pick = caregiverById;

// She names a range on her profile; the terms she sends start in its middle,
// in whole euros, so the family has room either way.
const rateOf = (c) => (c?.rateMin && c?.rateMax ? Math.round((c.rateMin + c.rateMax) / 2) : 15);

const person = (c) => ({
  id: c.id,
  name: c.name,
  initials: c.initials,
  phone: c.phone,
  area: c.area,
  radius: c.radius,
  classifications: c.classifications,
  rating: c.rating,
  reviews: c.reviews,
  bio: c.bio,
  languages: c.languages,
  education: c.education,
});

// ── requests ────────────────────────────────────────────────────────────────

// Serbian keys: stored as they are and shown through t()
export const DECLINE_REASONS = [
  msg('Predaleko mi je'),
  msg('Ne uklapa se u moj raspored'),
  msg('To je van mojih kvalifikacija'),
  msg('Trenutno sam popunjena'),
];

// A yes opens a cooperation with no terms yet; she sends them next. A yes to a
// request sent after an earlier cooperation ended reopens that one.
export const answerRequest = (caregiverId, accept, reason = DECLINE_REASONS[0]) => (c) => {
  const r = latestRequest(c, caregiverId);
  if (r?.status !== 'pending') return c;
  const cg = pick(caregiverId);
  // In Serbia nothing is agreed through the platform: a yes is the end of it
  // here, and the two call each other.
  const rs = market() === 'RS';
  const said = rs ? msg('Prihvatila je. Njen telefon i e-mail su u njenom profilu.') : msg('Prihvatila je. Uslove šalje uskoro.');
  const requests = c.requests.map((x) =>
    x === r ? (accept ? { ...x, status: 'accepted', detail: said } : { ...x, status: 'declined', detail: reason }) : x
  );
  let next = { ...c, requests };
  if (accept && !rs && !arrangementOf(c, caregiverId)) {
    next.arrangements = [...c.arrangements, { caregiver: person(cg), since: null, endedOn: null, versions: [], visits: [] }];
  }
  return logged(next, {
    kind: 'request',
    caregiverId,
    by: 'caregiver',
    title: accept ? msg('Upit je prihvaćen') : msg('Upit je odbijen'),
    detail: accept ? (rs ? msg('Javite joj se telefonom.') : msg('Uslove šalje uskoro.')) : reason,
  });
};

// ── terms ───────────────────────────────────────────────────────────────────

// Terms can go out when nothing is waiting on the family already: the first
// ones after a yes, a change while some are in force, new ones after the
// family said no, and new ones after an ended cooperation was asked again.
export function canSendTerms(c, caregiverId) {
  const a = arrangementOf(c, caregiverId);
  if (!a || pendingVersion(a)) return false;
  if (a.endedOn) return latestRequest(c, caregiverId)?.again && latestRequest(c, caregiverId).status === 'accepted';
  return true;
}

const ADDED = ['grocery-shopping', 'pharmacy-pickup', 'laundry', 'walks'];

export const sendTerms = (caregiverId, opts = {}) => (c) => {
  if (!canSendTerms(c, caregiverId)) return c;
  const a = arrangementOf(c, caregiverId);
  const before = activeVersion(a) || lastVersion(a);
  const need = c.need || needFrom({});
  const now = nowOf(c);
  const change = Boolean(activeVersion(a));
  const services = before?.services?.length ? before.services : need.services;
  const add = ADDED.find((s) => !services.includes(s));
  const version = {
    version: a.versions.length + 1,
    status: 'sent',
    services: opts.services ?? (change && add ? [...services, add] : services),
    rate: opts.rate ?? (change ? before.rate + 1 : rateOf(pick(caregiverId))),
    hours: need.hours,
    schedule: need.schedule,
    sentAt: now,
    sentOn: whenText(now, now),
    // what she adds to the agreement in her own words
    terms: opts.terms ?? msg('Ključ ostaje kod komšinice u stanu 4. Ako je sprečena, javlja dan ranije.'),
    note:
      opts.note ??
      (change
        ? msg('Od sledeće nedelje mogu i nabavku, pa sam dodala tu uslugu. Cena je za euro veća.')
        : msg('Pročitala sam plan nege. Mogu da dolazim po rasporedu iz plana i da preuzmem sve što piše u njemu.')),
  };
  return logged(mapArrangement(c, caregiverId, (x) => ({ ...x, versions: [...x.versions, version] })), {
    kind: 'agreement',
    caregiverId,
    by: 'caregiver',
    title: change ? say('Stigli su novi uslovi, verzija {version}', { version: version.version }) : say('Stigao je ugovor o nezi, verzija {version}', { version: version.version }),
    detail: say('{rate} na sat, {services}.', { rate: { $eur: version.rate }, services: servicesSaid(version.services.length) }),
  });
};

export const withdrawTerms = (caregiverId) => (c) => {
  const pen = pendingVersion(arrangementOf(c, caregiverId) || { versions: [] });
  if (!pen) return c;
  return logged(
    mapArrangement(c, caregiverId, (a) => ({
      ...a,
      versions: a.versions.map((v) => (v === pen ? { ...v, status: 'withdrawn' } : v)),
    })),
    { kind: 'agreement', caregiverId, by: 'caregiver', title: say('Predlog je povučen, verzija {version}', { version: pen.version }) }
  );
};

// ── visits ──────────────────────────────────────────────────────────────────

// Why she cannot send a visit plan right now, or null when she can.
export function cannotPlan(c, caregiverId) {
  const a = arrangementOf(c, caregiverId);
  if (!a || a.endedOn) return t('Nema saradnje.');
  if (!activeVersion(a)) return t('Uslovi još nisu prihvaćeni.');
  if (pendingVersion(a)) return t('Novi uslovi čekaju porodicu, posete su pauzirane.');
  if (!c.payment.connected) return t('Porodica nema karticu.');
  if (a.visits.some((v) => v.status === 'planned')) return t('Jedan plan posete već čeka.');
  if (a.visits.some((v) => v.status === 'disputed')) return t('Prijava je otvorena kod koordinatorke.');
  if (a.visits.some((v) => v.status === 'awaiting')) return t('Prvo radni nalog za prošlu posetu.');
  if (a.visits.filter((v) => v.status === 'charging').length >= 2) return t('Dva radna naloga još nisu naplaćena.');
  return null;
}

const startOf = (schedule) => parseInt((schedule || '').split('·')[1]?.trim() || '9', 10) || 9;

// `soon`: today, half an hour from now, so the last hour before a visit (when
// calling it off costs the whole visit) can be tried. Otherwise tomorrow, at
// the hour the terms say.
export const planVisit = (caregiverId, soonOrOpts = false) => (c) => {
  if (cannotPlan(c, caregiverId)) return c;
  // `true`: half an hour from now (the simulation's "za pola sata");
  // an object: the day, start and hours she chose in her own form
  const opts = typeof soonOrOpts === 'object' && soonOrOpts ? soonOrOpts : null;
  const soon = soonOrOpts === true;
  const a = arrangementOf(c, caregiverId);
  const act = activeVersion(a);
  const now = nowOf(c);
  const today = todayOf(c);
  const day = opts?.day ?? (soon ? today : today + 1);
  const start = opts?.start ?? (soon ? (now % 24) + 0.5 : startOf(act.schedule));
  const hours = opts?.hours ?? (Math.max(1, Math.round(act.hours / Math.max(1, (act.schedule || '').split(',').length || 3))) || 3);
  const visit = {
    id: `v-${caregiverId}-${a.visits.length + 1}-${now}`,
    day,
    start,
    time: `${hourText(start)}–${hourText(start + hours)}`,
    hours,
    rate: act.rate,
    agreementVersion: act.version,
    services: act.services,
    notes: opts?.notes ?? (a.visits.length ? msg('Kao i prošli put. Ako treba nešto iz apoteke, ostavite recept na stolu.') : msg('Prva poseta. Upoznaću se sa njom i proći kroz plan nege sa vama.')),
    status: 'planned',
    sentAt: now,
  };
  const next = relabel(mapArrangement(c, caregiverId, (x) => ({ ...x, visits: [visit, ...x.visits] })));
  const v = findVisit(next, visit.id);
  return logged(next, {
    kind: 'visit',
    caregiverId,
    by: 'caregiver',
    title: msg('Stigao je plan posete'),
    detail: say('{date} · {time}. {amount} je rezervisano na kartici.', { date: dateSaid(v, today), time: v.time, amount: { $eur: chargedFor(hours, act.rate) } }),
  });
};

// The work order: as planned, with an hour less (the difference goes back), or
// with an hour more (charged only if the family says yes).
export const sendWorkOrder = (visitId, kindOrReport = 'as-planned') => (c) => {
  const v = findVisit(c, visitId);
  if (v?.status !== 'awaiting') return c;
  // a string is one of the simulation's three; an object is what she wrote
  const written = typeof kindOrReport === 'object' && kindOrReport ? kindOrReport : null;
  const kind = written ? (written.hours > v.hours ? 'more' : written.hours < v.hours ? 'less' : 'as-planned') : kindOrReport;
  const now = nowOf(c);
  const hours = written ? written.hours : kind === 'less' ? Math.max(0.5, v.hours - 1) : kind === 'more' ? v.hours + 1 : v.hours;
  const done = kind === 'less' ? v.services.slice(0, Math.max(1, v.services.length - 1)) : v.services;
  const report = written
    ? { hours: written.hours, mood: written.mood, eating: written.eating, moving: written.moving, note: written.note, done: written.done, concern: written.concern }
    : {
      hours,
      mood: kind === 'less' ? 'low' : 'good',
      eating: 'usual',
      moving: kind === 'more' ? 'more' : 'usual',
      note:
        kind === 'less'
          ? msg('Bila je umorna, pa smo završile ranije. Nismo stigle do svega sa spiska.')
          : kind === 'more'
            ? msg('Prošetale smo do parka i nazad, pa sam ostala sat duže da ručamo zajedno.')
            : msg('Sve po planu. Ručala je sve, pričale smo o unucima.'),
      done,
      concern: kind === 'less' ? msg('Žalila se na koleno.') : undefined,
      };
  const next = relabel(
    mapVisit(c, visitId, (x) => ({
      ...x,
      status: 'charging',
      report,
      reportAt: now,
      extra: written ? (written.hours > v.hours ? { hours: written.hours - v.hours, status: 'asked' } : undefined) : kind === 'more' ? { hours: 1, status: 'asked' } : undefined,
    }))
  );
  return logged(next, {
    kind: 'visit',
    caregiverId: v.caregiver.id,
    by: 'caregiver',
    title: kind === 'more' ? msg('Stigao je radni nalog, sa dodatnim satima') : msg('Stigao je radni nalog'),
    detail: say('{date} · {hours}. Naplaćuje se za 24 sata, osim ako nešto prijavite.', { date: dateSaid(v, todayOf(c)), hours: hoursSaid(hours) }),
  });
};

export const NOT_HAPPENED_REASONS = [msg('Niko nije bio kod kuće'), msg('Nisam mogla da dođem'), msg('Bila sam bolesna')];

// The visit did not happen (after its time), or she calls it off (before it):
// either way the reservation goes back, and nothing is charged.
export const visitNotHappened = (visitId, reason = NOT_HAPPENED_REASONS[0]) => (c) => {
  const v = findVisit(c, visitId);
  if (v?.status !== 'awaiting' && v?.status !== 'planned') return c;
  const before = v.status === 'planned';
  return logged(
    mapVisit(c, visitId, (x) => ({
      ...x,
      // an earlier query settled on this plan is no longer what happened to it
      resolution: undefined,
      status: 'cancelled',
      cancelledBy: 'caregiver',
      cancelReason: before
        ? say('Negovateljica je otkazala: {reason}', { reason: { $fmt: 'lower', value: reason } })
        : say('Poseta se nije desila: {reason}', { reason: { $fmt: 'lower', value: reason } }),
    })),
    {
      kind: 'visit',
      caregiverId: v.caregiver.id,
      by: 'caregiver',
      title: before ? msg('Negovateljica je otkazala posetu') : msg('Poseta se nije desila'),
      detail: say('{date} · {time}. {reason}. {amount} vraćeno.', { date: dateSaid(v, todayOf(c)), time: v.time, reason: { $t: reason }, amount: { $eur: chargedFor(v.hours, v.rate) } }),
    }
  );
};

export const caregiverEnds = (caregiverId) => (c) => {
  const a = arrangementOf(c, caregiverId);
  if (!a || a.endedOn || unsettled(a).length) return c;
  // the family's own function, said as hers
  return endArrangement(caregiverId, 'caregiver')(c);
};
