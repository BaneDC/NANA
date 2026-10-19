import { demoAnswers, demoNotes, demoUser } from './demoCase';
import { demoPerson } from './person';
import { withAnswers, requestSaid } from './familyStart';
import { agreeTerms, allVisits, askCaregiver, confirmPlan, confirmVisit, endArrangement, linkCard } from './familyCare';
import { answerRequest, planVisit, sendTerms, sendWorkOrder } from './caregiverCare';
import { passTime } from './sim';
import { reconcile } from './dependencies';
import { msg, t } from '../i18n';

// The other families on Sanna's board in the demo, so her board is not a single
// card: each one made by the same steps the two sides would take
// (docs/superpowers/specs/2026-10-19-negovateljica-finska-design.md), never
// written as finished state. Names, ages and places are the old board's.
const CAREGIVER = 'sanna';

const family = (id, elder, age, city, relative) => {
  const answers = reconcile(
    {},
    {
      ...demoAnswers,
      'about-person': { values: { name: elder, age, city } },
      'about-you': { values: { 'your-name': relative, relation: msg('Sin'), 'your-phone': '+358 40 555 2100' } },
      'family-goal': { values: { goal: t(demoAnswers['family-goal'].values.goal), worry: t(demoAnswers['family-goal'].values.worry) } },
    }
  ).answers;
  const user = { ...demoUser, name: relative };
  const p = demoPerson(answers, demoNotes.map((n) => t(n)), user);
  return { id, person: { ...p, care: withAnswers(p.care, answers, user) } };
};

const run = (client, ...steps) => ({
  ...client,
  person: { ...client.person, care: steps.reduce((c, step) => step(c), client.person.care) },
});

const asked = (c) => askCaregiver(CAREGIVER, requestSaid(c))(c);
const agreed = [linkCard, asked, answerRequest(CAREGIVER, true), sendTerms(CAREGIVER), agreeTerms(CAREGIVER)];
// one visit from its plan to its paid work order
const paidVisit = (c) => {
  let next = planVisit(CAREGIVER)(c);
  const v = allVisits(next).find((x) => x.status === 'planned');
  if (!v) return c;
  next = confirmPlan(v.id)(next);
  next = passTime(v.day * 24 + v.start + v.hours + 1 - next.now)(next);
  next = sendWorkOrder(v.id)(next);
  return confirmVisit(v.id)(next);
};
// a visit that is over and waits for her work order
const visitDone = (c) => {
  const next = planVisit(CAREGIVER)(c);
  const v = allVisits(next).find((x) => x.status === 'planned');
  return v ? passTime(v.day * 24 + v.start + v.hours + 1 - next.now)(next) : c;
};

export function caregiverClients() {
  return [
    run(family('makela', 'Eila Mäkelä', '84', 'Töölö, Helsinki', 'Mikko Mäkelä'), asked), // i18n-ignore
    run(family('virtanen', 'Eero Virtanen', '79', 'Kallio, Helsinki', 'Liisa Virtanen'), asked, answerRequest(CAREGIVER, true)), // i18n-ignore
    run(family('lehtinen', 'Kaarina Lehtinen', '88', 'Kamppi, Helsinki', 'Juha Lehtinen'), ...agreed, paidVisit, planVisit(CAREGIVER)), // i18n-ignore
    run(family('heikkinen', 'Pentti Heikkinen', '81', 'Vallila, Helsinki', 'Anne Heikkinen'), ...agreed, paidVisit, visitDone), // i18n-ignore
    run(family('laine', 'Helmi Laine', '90', 'Munkkiniemi, Helsinki', 'Petri Laine'), ...agreed, paidVisit, endArrangement(CAREGIVER)), // i18n-ignore
    run(family('nieminen', 'Toivo Nieminen', '76', 'Espoo', 'Sari Nieminen'), asked, answerRequest(CAREGIVER, false)), // i18n-ignore
  ];
}
