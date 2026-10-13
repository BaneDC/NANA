import { caregivers } from './carePlan';
import { needFrom } from './familyStart';
import {
  START_HOUR,
  activeVersion,
  arrangementOf,
  chargedFor,
  dateText,
  dayLabel,
  endArrangement,
  findVisit,
  hourText,
  lastVersion,
  latestRequest,
  logged,
  mapArrangement,
  mapVisit,
  money,
  pendingVersion,
  relabel,
  todayOf,
  unsettled,
  visitCharge,
  whenText,
} from './familyCare';
import { msg, t, tn } from '../i18n';

// The other side of the family's care, simulated. The caregivers' own app and
// the coordinator are not part of this build, so everything they would do is
// here as a function the hidden simulation panel calls (SimPanel, Ctrl+H):
// answer a request, send terms, plan a visit, send a work order, settle a
// query, and move the clock. Nothing here runs on its own.
//
// The rules are the caregivers' app's own: one visit plan at a time per
// family, none while new terms wait or a query is open, at most two work
// orders not yet charged.

const nowOf = (c) => c.now ?? START_HOUR;
const pick = (id) => caregivers.find((c) => c.id === id);

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

// ── the clock ───────────────────────────────────────────────────────────────

// Time passes. A visit whose end has come is over as far as the family can
// tell: it waits for her work order. A work order nobody queried in 24 hours
// is charged.
export const passTime = (hours) => (c) => {
  const now = nowOf(c) + hours;
  const today = Math.floor(now / 24);
  const notes = [];
  let next = {
    ...c,
    now,
    arrangements: c.arrangements.map((a) => ({
      ...a,
      visits: a.visits.map((v) => {
        if (v.status === 'planned' && v.day != null && v.day * 24 + v.start + v.hours <= now) {
          notes.push({ kind: 'visit', caregiverId: a.caregiver.id, by: 'caregiver', title: t('Poseta je obavljena'), detail: t('{date} · {time}. Čeka se radni nalog.', { date: dayLabel(v.day, today), time: v.time }) });
          return { ...v, status: 'awaiting' };
        }
        if (v.status === 'charging' && v.reportAt != null && v.reportAt + 24 <= now) {
          notes.push({ kind: 'money', caregiverId: a.caregiver.id, by: 'coordinator', title: t('Naplaćeno automatski {amount}', { amount: money(visitCharge(v)) }), detail: t('Radni nalog je prošao posle 24 sata bez primedbe.') });
          return { ...v, status: 'paid', confirmed: 'auto', chargedOn: dateText(today) };
        }
        return v;
      }),
    })),
  };
  if (notes.length) next = logged(next, ...notes);
  return relabel(next);
};

// ── requests ────────────────────────────────────────────────────────────────

// Serbian keys: shown and stored through t()
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
  const requests = c.requests.map((x) =>
    x === r
      ? accept
        ? { ...x, status: 'accepted', detail: t('Prihvatila je. Uslove šalje uskoro.') }
        : { ...x, status: 'declined', detail: t(reason) }
      : x
  );
  let next = { ...c, requests };
  if (accept && !arrangementOf(c, caregiverId)) {
    next.arrangements = [...c.arrangements, { caregiver: person(cg), since: null, endedOn: null, versions: [], visits: [] }];
  }
  return logged(next, {
    kind: 'request',
    caregiverId,
    by: 'caregiver',
    title: accept ? t('Upit je prihvaćen') : t('Upit je odbijen'),
    detail: accept ? t('Uslove šalje uskoro.') : t(reason),
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

export const sendTerms = (caregiverId) => (c) => {
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
    services: change && add ? [...services, add] : services,
    rate: change ? before.rate + 1 : rateOf(pick(caregiverId)),
    hours: need.hours,
    schedule: need.schedule,
    sentAt: now,
    sentOn: whenText(now, now),
    // what she adds to the agreement in her own words
    terms: t('Ključ ostaje kod komšinice u stanu 4. Ako je sprečena, javlja dan ranije.'),
    note: change
      ? t('Od sledeće nedelje mogu i nabavku, pa sam dodala tu uslugu. Cena je za euro veća.')
      : t('Pročitala sam plan nege. Mogu da dolazim po rasporedu iz plana i da preuzmem sve što piše u njemu.'),
  };
  return logged(mapArrangement(c, caregiverId, (x) => ({ ...x, versions: [...x.versions, version] })), {
    kind: 'agreement',
    caregiverId,
    by: 'caregiver',
    title: change ? t('Stigli su novi uslovi, verzija {version}', { version: version.version }) : t('Stigao je ugovor o nezi, verzija {version}', { version: version.version }),
    detail: t('{rate} na sat, {services}.', { rate: money(version.rate), services: tn(version.services.length, 'usluga', 'usluge', 'usluga') }),
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
    { kind: 'agreement', caregiverId, by: 'caregiver', title: t('Predlog je povučen, verzija {version}', { version: pen.version }) }
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
export const planVisit = (caregiverId, soon = false) => (c) => {
  if (cannotPlan(c, caregiverId)) return c;
  const a = arrangementOf(c, caregiverId);
  const act = activeVersion(a);
  const now = nowOf(c);
  const today = todayOf(c);
  const day = soon ? today : today + 1;
  const start = soon ? (now % 24) + 0.5 : startOf(act.schedule);
  const hours = Math.max(1, Math.round(act.hours / Math.max(1, (act.schedule || '').split(',').length || 3))) || 3;
  const visit = {
    id: `v-${caregiverId}-${a.visits.length + 1}-${now}`,
    day,
    start,
    time: `${hourText(start)}–${hourText(start + hours)}`,
    hours,
    rate: act.rate,
    agreementVersion: act.version,
    services: act.services,
    notes: a.visits.length ? t('Kao i prošli put. Ako treba nešto iz apoteke, ostavite recept na stolu.') : t('Prva poseta. Upoznaću se sa njom i proći kroz plan nege sa vama.'),
    status: 'planned',
    sentAt: now,
  };
  const next = relabel(mapArrangement(c, caregiverId, (x) => ({ ...x, visits: [visit, ...x.visits] })));
  const v = findVisit(next, visit.id);
  return logged(next, {
    kind: 'visit',
    caregiverId,
    by: 'caregiver',
    title: t('Stigao je plan posete'),
    detail: t('{date} · {time}. {amount} je rezervisano na kartici.', { date: v.date, time: v.time, amount: money(chargedFor(hours, act.rate)) }),
  });
};

// The work order: as planned, with an hour less (the difference goes back), or
// with an hour more (charged only if the family says yes).
export const sendWorkOrder = (visitId, kind = 'as-planned') => (c) => {
  const v = findVisit(c, visitId);
  if (v?.status !== 'awaiting') return c;
  const now = nowOf(c);
  const hours = kind === 'less' ? Math.max(0.5, v.hours - 1) : kind === 'more' ? v.hours + 1 : v.hours;
  const done = kind === 'less' ? v.services.slice(0, Math.max(1, v.services.length - 1)) : v.services;
  const report = {
    hours,
    mood: kind === 'less' ? 'low' : 'good',
    eating: 'usual',
    moving: kind === 'more' ? 'more' : 'usual',
    note:
      kind === 'less'
        ? t('Bila je umorna, pa smo završile ranije. Nismo stigle do svega sa spiska.')
        : kind === 'more'
          ? t('Prošetale smo do parka i nazad, pa sam ostala sat duže da ručamo zajedno.')
          : t('Sve po planu. Ručala je sve, pričale smo o unucima.'),
    done,
    concern: kind === 'less' ? t('Žalila se na koleno.') : undefined,
  };
  const next = relabel(
    mapVisit(c, visitId, (x) => ({
      ...x,
      status: 'charging',
      report,
      reportAt: now,
      extra: kind === 'more' ? { hours: 1, status: 'asked' } : undefined,
    }))
  );
  return logged(next, {
    kind: 'visit',
    caregiverId: v.caregiver.id,
    by: 'caregiver',
    title: kind === 'more' ? t('Stigao je radni nalog, sa dodatnim satima') : t('Stigao je radni nalog'),
    detail: t('{date} · {hours}. Naplaćuje se za 24 sata, osim ako nešto prijavite.', { date: v.date, hours: tn(hours, 'sat', 'sata', 'sati') }),
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
        ? t('Negovateljica je otkazala: {reason}', { reason: t(reason).toLowerCase() })
        : t('Poseta se nije desila: {reason}', { reason: t(reason).toLowerCase() }),
    })),
    {
      kind: 'visit',
      caregiverId: v.caregiver.id,
      by: 'caregiver',
      title: before ? t('Negovateljica je otkazala posetu') : t('Poseta se nije desila'),
      detail: t('{date} · {time}. {reason}. {amount} vraćeno.', { date: v.date, time: v.time, reason: t(reason), amount: money(chargedFor(v.hours, v.rate)) }),
    }
  );
};

export const caregiverEnds = (caregiverId) => (c) => {
  const a = arrangementOf(c, caregiverId);
  if (!a || a.endedOn || unsettled(a).length) return c;
  // the family's own function, said as hers
  return endArrangement(caregiverId, 'caregiver')(c);
};

// ── the coordinator ─────────────────────────────────────────────────────────

// How a query is settled. A queried work order is charged as sent, with an
// hour less, or not at all; a queried plan stays, or the visit is called off.
export const RESOLUTIONS = {
  charging: [
    { id: 'charge', label: msg('Naplati kako je poslato') },
    { id: 'reduce', label: msg('Umanji za sat') },
    { id: 'waive', label: msg('Ne naplaćuj ništa') },
  ],
  planned: [
    { id: 'keep', label: msg('Plan ostaje') },
    { id: 'cancel', label: msg('Otkaži posetu') },
  ],
};

export const resolveQuery = (visitId, outcome) => (c) => {
  const v = findVisit(c, visitId);
  if (v?.status !== 'disputed') return c;
  const today = dateText(todayOf(c));
  let fn;
  let text;
  if (outcome === 'charge') {
    fn = (x) => ({ ...x, status: 'paid', confirmed: 'coordinator', chargedOn: today });
    text = t('Koordinatorka je proverila: naplaćuje se kako je poslato, {amount}.', { amount: money(visitCharge(v)) });
  } else if (outcome === 'reduce') {
    const hours = Math.max(0.5, (v.report?.hours ?? v.hours) - 1);
    fn = (x) => ({ ...x, status: 'paid', confirmed: 'coordinator', chargedOn: today, report: { ...x.report, hours } });
    text = t('Koordinatorka je proverila: naplaćuje se {hours}, {amount}.', { hours: tn(hours, 'sat', 'sata', 'sati'), amount: money(visitCharge({ ...v, report: { ...v.report, hours } })) });
  } else if (outcome === 'waive') {
    fn = (x) => ({ ...x, status: 'cancelled', cancelledBy: 'coordinator', cancelReason: t('Koordinatorka je odlučila da se ništa ne naplaćuje') });
    text = t('Koordinatorka je proverila: ništa se ne naplaćuje, rezervacija je vraćena.');
  } else if (outcome === 'keep') {
    fn = (x) => ({ ...x, status: 'planned' });
    text = t('Koordinatorka je proverila: plan posete ostaje kakav je.');
  } else {
    fn = (x) => ({ ...x, status: 'cancelled', cancelledBy: 'coordinator', cancelReason: t('Koordinatorka je otkazala posetu') });
    text = t('Koordinatorka je otkazala posetu, rezervacija je vraćena.');
  }
  return logged(
    mapVisit(c, visitId, (x) => ({ ...fn(x), resolution: { outcome, text, on: today } })),
    { kind: outcome === 'keep' || outcome === 'cancel' ? 'visit' : 'money', caregiverId: v.caregiver.id, by: 'coordinator', title: t('Prijava je rešena'), detail: text }
  );
};
