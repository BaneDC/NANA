import { buildPlan } from './carePlan';
import { startCare } from './familyStart';
import { createdEntry, demoLog } from './planLog';

// What an account holds, in the order the app is built on (docs/plan-nege.md):
//
//   nalog (user, src/lib/account.js)
//   └── osoba
//       ├── odgovori + beleške ──► plan (computed, one)
//       ├── izmene (what changed in the plan, when, from where)
//       └── nega (requests, agreements, visits: care, src/data/familyStart.js and familyCare.js)
//
// One person per account for now: a second one (grandmother and grandfather)
// is a second account. Who she is lives in her answers (`about-person`), so
// there is one source for it. The plan is not stored: it is built from the
// answers and notes once the onboarding has made it, and every change rebuilds
// it, so it can never disagree with them.
//
// { answers, notes, planMade, log, care }
export const newPerson = ({ answers = {}, notes = [], planMade = false, log = [], care = startCare(null) } = {}) => ({
  answers,
  notes,
  planMade,
  log,
  care,
});

// The plan, from what she is: null until the onboarding has made it.
export const planOf = (person) => (person.planMade ? buildPlan(person.answers, person.notes) : null);

// The onboarding's end: the plan exists from now, and its history starts.
export const withPlan = (person, at = Date.now()) => ({ ...person, planMade: true, log: [createdEntry(at)] });

// The finished case /?demo and the sign-in screen's demo open on.
export const demoPerson = (answers, notes, user) =>
  newPerson({ answers, notes, planMade: true, log: demoLog(answers, notes), care: startCare(user) });
