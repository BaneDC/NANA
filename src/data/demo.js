import { demoAnswersRs, demoAnswers, demoNotes, demoUser, demoUserRs } from './demoCase';
import { caregiverById } from './carePlan';
import { demoPerson } from './person';
import { fillCare } from './demoFill';
import { withAnswers } from './familyStart';
import { reconcile } from './dependencies';
import { caregiverClients } from './caregiverClients';
import { t } from '../i18n';

// Who this tab is in the demo, and on which market. The address says it first
// (?demo, ?demo=negovateljica, &trziste=sr, ?demo=rs, &puno); after that the
// tab remembers it in sessionStorage, so a reload stays who it was and a second
// tab can be the other side (docs/superpowers/specs/2026-10-19-temelj-design.md).

export const toCountry = (market) => (market === 'sr' ? 'RS' : 'FI');

export function demoEntry(search) {
  const q = new URLSearchParams(search);
  if (!q.has('demo')) return null;
  const v = (q.get('demo') || '').toLowerCase();
  const market = v === 'rs' || q.get('trziste') === 'sr' ? 'sr' : 'fi';
  const role = v === 'negovateljica' ? 'caregiver' : 'family';
  return { role, market, filled: q.has('puno'), explicit: Boolean(v) || q.has('trziste') };
}

const KEY = 'nana.demo.session';
export const session = {
  read() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || 'null');
    } catch {
      return null;
    }
  },
  write(s) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* this tab only: lasts until reload */
    }
  },
};

// A switch of side or market starts this tab again as someone else; the
// address goes back to plain ?demo, so the old one cannot bring the old role back.
export function go(next) {
  session.write(next);
  window.location.assign(`${window.location.pathname}?demo`);
}

const CAREGIVER_OF = { fi: 'sanna', sr: 'milica' };

export function demoAccount(role, market) {
  if (role === 'family') return market === 'sr' ? demoUserRs : demoUser;
  const c = caregiverById(CAREGIVER_OF[market]);
  const [firstName, ...rest] = c.name.split(' ');
  return {
    role: 'caregiver',
    caregiverId: c.id,
    name: c.name,
    firstName,
    lastName: rest.join(' '),
    email: c.email || `${c.id}@nana.fi`,
    phone: c.phone,
    country: toCountry(market),
  };
}

export function seedState(market, { filled }) {
  const user = demoAccount('family', market);
  const raw = market === 'sr' ? demoAnswersRs : demoAnswers;
  const answers = reconcile({}, { ...raw, 'family-goal': { values: { goal: t(raw['family-goal'].values.goal), worry: t(raw['family-goal'].values.worry) } } }).answers;
  const person = demoPerson(answers, demoNotes.map((n) => t(n)), user);
  return {
    person: filled ? { ...person, care: fillCare(withAnswers(person.care, answers, user)) } : person,
    family: filled ? { unlocked: true, subscription: { planId: 'monthly', at: Date.now() } } : { unlocked: false, subscription: null },
    // Finland: the other families on Sanna's board (src/data/caregiverClients.js)
    clients: market === 'fi' ? caregiverClients() : [],
  };
}
