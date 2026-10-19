import { nowOf } from './caregiverCare';
import {
  dateOfToday,
  dateSaid,
  dateText,
  findVisit,
  hoursSaid,
  logged,
  mapVisit,
  relabel,
  todayOf,
  visitCharge,
} from './familyCare';
import { msg, say } from '../i18n';

// The other side of the family's care, simulated. The caregivers' own app and
// the coordinator are not part of this build, so everything they would do is
// here as a function the hidden simulation panel calls (SimPanel, Ctrl+H):
// answer a request, send terms, plan a visit, send a work order, settle a
// query, and move the clock. Nothing here runs on its own.
//
// The rules are the caregivers' app's own: one visit plan at a time per
// family, none while new terms wait or a query is open, at most two work
// orders not yet charged.

// what a caregiver does lives with her (caregiverCare.js); named here too, so
// the panel and the demo keep importing it from the simulation
export * from './caregiverCare';

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
          notes.push({ kind: 'visit', caregiverId: a.caregiver.id, by: 'caregiver', title: msg('Poseta je obavljena'), detail: say('{date} · {time}. Čeka se radni nalog.', { date: dateSaid(v, today), time: v.time }) });
          return { ...v, status: 'awaiting' };
        }
        if (v.status === 'charging' && v.reportAt != null && v.reportAt + 24 <= now) {
          notes.push({ kind: 'money', caregiverId: a.caregiver.id, by: 'coordinator', title: say('Naplaćeno automatski {amount}', { amount: { $eur: visitCharge(v) } }), detail: msg('Radni nalog je prošao posle 24 sata bez primedbe.') });
          return { ...v, status: 'paid', confirmed: 'auto', chargedOn: dateText(today) };
        }
        return v;
      }),
    })),
  };
  if (notes.length) next = logged(next, ...notes);
  return relabel(next);
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
    text = say('Koordinatorka je proverila: naplaćuje se kako je poslato, {amount}.', { amount: { $eur: visitCharge(v) } });
  } else if (outcome === 'reduce') {
    const hours = Math.max(0.5, (v.report?.hours ?? v.hours) - 1);
    fn = (x) => ({ ...x, status: 'paid', confirmed: 'coordinator', chargedOn: today, report: { ...x.report, hours } });
    text = say('Koordinatorka je proverila: naplaćuje se {hours}, {amount}.', { hours: hoursSaid(hours), amount: { $eur: visitCharge({ ...v, report: { ...v.report, hours } }) } });
  } else if (outcome === 'waive') {
    fn = (x) => ({ ...x, status: 'cancelled', cancelledBy: 'coordinator', cancelReason: msg('Koordinatorka je odlučila da se ništa ne naplaćuje') });
    text = msg('Koordinatorka je proverila: ništa se ne naplaćuje, rezervacija je vraćena.');
  } else if (outcome === 'keep') {
    fn = (x) => ({ ...x, status: 'planned' });
    text = msg('Koordinatorka je proverila: plan posete ostaje kakav je.');
  } else {
    fn = (x) => ({ ...x, status: 'cancelled', cancelledBy: 'coordinator', cancelReason: msg('Koordinatorka je otkazala posetu') });
    text = msg('Koordinatorka je otkazala posetu, rezervacija je vraćena.');
  }
  return logged(
    mapVisit(c, visitId, (x) => ({ ...fn(x), resolution: { outcome, text, on: today } })),
    { kind: outcome === 'keep' || outcome === 'cancel' ? 'visit' : 'money', caregiverId: v.caregiver.id, by: 'coordinator', title: msg('Prijava je rešena'), detail: text }
  );
};

// The card, from Stripe's side: the bank declines the next charge, or the card
// runs out this month. Either way the family is asked to change it.
export const declineCard = (c) => ({ ...c, payment: { ...c.payment, declined: true } });

export const expireCard = (c) => {
  const d = dateOfToday(c);
  return { ...c, payment: { ...c.payment, expires: `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` } };
};
