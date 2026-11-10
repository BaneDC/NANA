import { demoAnswers, demoAnswersRs, demoNotes, demoUser, demoUserRs } from './demoCase';
import { demoPerson } from './person';
import { withAnswers } from './familyStart';
import { agreeTerms, allVisits, askCaregiver, confirmPlan, confirmVisit, endArrangement, linkCard } from './familyCare';
import { DECLINE_REASONS, answerRequest, planVisit, sendTerms, sendWorkOrder } from './caregiverCare';
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

const asked = (c) => askCaregiver(CAREGIVER, '')(c);
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

// Serbia: the requests other families sent Milica, so "Upiti" has some in each
// chip and not only the demo family's. Nothing is agreed through the platform
// there, so a request is all there is: asked, then a yes or a no. What each
// family says differs, so their pages do; what they typed stays as typed.
const MILICA = 'milica';

const familyRs = (id, { elder, age, city, relative, relation, phone, email, goal, worry, ...rest }) => {
  const answers = reconcile(
    {},
    {
      ...demoAnswersRs,
      ...rest,
      'about-person': { values: { name: elder, age, city } },
      'about-you': { values: { 'your-name': relative, relation, 'your-phone': phone } },
      'family-goal': { values: { goal, worry } },
    }
  ).answers;
  const user = { ...demoUserRs, name: relative, phone, email };
  const p = demoPerson(answers, [], user);
  return { id, person: { ...p, care: withAnswers(p.care, answers, user) } };
};

const askedRs = (c) => askCaregiver(MILICA, '')(c);

// names, places and what the families typed are Serbian on purpose
const RS_FAMILIES = {
  markovic: {
    elder: 'Ljubica Marković', // i18n-ignore
    age: '79',
    city: 'Zemun, Beograd', // i18n-ignore
    relative: 'Nenad Marković', // i18n-ignore
    relation: msg('Sin'),
    phone: '+381 63 222 1876',
    email: 'nenad.markovic@mail.rs',
    household: { optionId: 'partner' },
    mobility: { optionId: 'independent' },
    'going-out': { optionId: 'accompanied' },
    falls: { optionId: 'none' },
    'reason-for-contact': { optionId: 'memory' },
    onset: { optionId: 'gradual' },
    hospitalisation: { optionId: 'none' },
    goal: 'Da ne zaboravlja lekove i da ima društvo dok smo na poslu.', // i18n-ignore
    worry: 'Da ne izađe iz stana i ne zna da se vrati.', // i18n-ignore
  },
  stojanovic: {
    elder: 'Vera Stojanović', // i18n-ignore
    age: '86',
    city: 'Novi Beograd, Beograd', // i18n-ignore
    relative: 'Ana Stojanović', // i18n-ignore
    relation: msg('Ćerka'),
    phone: '+381 64 318 4402',
    email: 'ana.stojanovic@mail.rs',
    mobility: { optionId: 'walker' },
    'daily-help': { optionId: 'several-times' },
    falls: { optionId: 'once' },
    overall: { optionId: 'most-help' },
    'who-helps-now': { optionId: 'nobody' },
    'reason-for-contact': { optionId: 'discharge' },
    onset: { optionId: 'sudden' },
    hospitalisation: { optionId: 'recent' },
    goal: 'Da se posle operacije kuka oporavi i ponovo hoda sama.', // i18n-ignore
    worry: 'Noći, kad je sama i treba da ustane.', // i18n-ignore
  },
  ilic: {
    elder: 'Radmila Ilić', // i18n-ignore
    age: '91',
    city: 'Zvezdara, Beograd', // i18n-ignore
    relative: 'Marko Ilić', // i18n-ignore
    relation: msg('Sin'),
    phone: '+381 65 410 2290',
    email: 'marko.ilic@mail.rs',
    mobility: { optionId: 'wheelchair' },
    'reason-for-contact': { optionId: 'respite' },
    onset: { optionId: 'long-standing' },
    goal: 'Da imamo nekoga na koga možemo da se oslonimo.', // i18n-ignore
    worry: 'Da mi se mama ne razboli dok ja radim.', // i18n-ignore
  },
  djordjevic: {
    elder: 'Smiljana Đorđević', // i18n-ignore
    age: '77',
    city: 'Voždovac, Beograd', // i18n-ignore
    relative: 'Ivana Đorđević', // i18n-ignore
    relation: msg('Ćerka'),
    phone: '+381 62 775 1043',
    email: 'ivana.djordjevic@mail.rs',
    mobility: { optionId: 'independent' },
    falls: { optionId: 'none' },
    'reason-for-contact': { optionId: 'loneliness' },
    onset: { optionId: 'long-standing' },
    goal: 'Da ima s kim da popije kafu i prošeta.', // i18n-ignore
    worry: 'Što je po ceo dan sama.', // i18n-ignore
  },
  pavlovic: {
    elder: 'Desanka Pavlović', // i18n-ignore
    age: '84',
    city: 'Palilula, Beograd', // i18n-ignore
    relative: 'Dragan Pavlović', // i18n-ignore
    relation: msg('Sin'),
    phone: '+381 60 128 9931',
    email: 'dragan.pavlovic@mail.rs',
    'reason-for-contact': { optionId: 'home-help' },
    onset: { optionId: 'gradual' },
    goal: 'Da kuća bude sređena i da jede topao obrok.', // i18n-ignore
    worry: 'Što se umara i kad samo opere sudove.', // i18n-ignore
  },
};

export function caregiverClientsRs() {
  const f = (id) => familyRs(id, RS_FAMILIES[id]);
  return [
    run(f('markovic'), askedRs),
    run(f('stojanovic'), askedRs),
    run(f('ilic'), askedRs, answerRequest(MILICA, false, DECLINE_REASONS[0])),
    run(f('djordjevic'), askedRs, answerRequest(MILICA, false, DECLINE_REASONS[1])),
    run(f('pavlovic'), askedRs, answerRequest(MILICA, false, DECLINE_REASONS[3])),
  ];
}
