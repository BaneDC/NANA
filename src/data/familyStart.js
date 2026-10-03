import { serviceTitle } from './caregiverBoard';
import { servicesForNeed } from './serviceCatalog';
import { START_HOUR } from './familyCare';

// The family's side as it really starts: nobody asked yet, nobody coming, no
// card. Everything on it from here is something the family did, or a
// caregiver's or the coordinator's answer to it. Those answers are not timed:
// they are simulated by hand, from a hidden panel (sim.js, SimPanel).

export function startCare(user) {
  return {
    family: { name: user?.name || '', relation: '' },
    elder: { name: '', area: '' },
    payment: { connected: false },
    need: null,
    requests: [],
    arrangements: [],
    // the clock (hours since 11 August 2026, 00:00) and what has happened
    now: START_HOUR,
    log: [],
  };
}

const has = (answer, id) => Boolean(answer?.optionIds?.includes(id));
const answered = (answer) => Array.isArray(answer?.optionIds);

// What the family needs done, in the caregiver's own list of services, read
// from the answers the plan is built from.
export function needFrom(answers) {
  const alone = answers['self-care'];
  const tasks = answers['household-tasks'];
  const life = answers.lifestyle;
  const out = new Set();
  if (answered(alone) && !(has(alone, 'dressing') && has(alone, 'bathing') && has(alone, 'toilet'))) out.add('personal-care');
  if (has(tasks, 'cooking') || (answered(alone) && !has(alone, 'meals'))) out.add('meals');
  if (has(tasks, 'meds-admin') || (answered(alone) && !has(alone, 'medication'))) out.add('medication');
  if (has(life, 'company')) out.add('company');
  if (has(tasks, 'shopping') || has(life, 'transport')) out.add('errands');
  if (has(tasks, 'cleaning') || has(tasks, 'laundry') || ['needs-help', 'neglected'].includes(answers['home-condition']?.optionId)) out.add('housekeeping');
  if (['little-help', 'accompanied'].includes(answers['going-out']?.optionId) || has(life, 'exercise')) out.add('walks');
  if (['walker', 'wheelchair', 'bed'].includes(answers.mobility?.optionId)) out.add('mobility');
  if (!out.size) out.add('company');

  // How much help, from how often she needs someone during the day.
  const often = answers['daily-help']?.optionId;
  const week =
    often === 'several-times'
      ? { days: 'pon – pet', time: '09:00–13:00', perVisit: 4, visits: 5 }
      : often === 'almost-constant' || often === 'dependent'
        ? { days: 'pon – pet', time: '08:00–16:00', perVisit: 8, visits: 5 }
        : often === 'none'
          ? { days: 'uto, čet', time: '10:00–13:00', perVisit: 3, visits: 2 }
          : { days: 'pon, sre, pet', time: '09:00–12:00', perVisit: 3, visits: 3 };

  return {
    // in the catalog's terms, as a caregiver's agreement would list them
    services: servicesForNeed([...out]),
    hours: week.perVisit * week.visits,
    perVisit: week.perVisit,
    time: week.time,
    schedule: `${week.days} · ${week.time}`,
  };
}

// The part of the care state that follows the answers: who she is, where, and
// what is needed. Kept current as the plan changes.
export function withAnswers(care, answers, user) {
  const person = answers['about-person']?.values || {};
  const you = answers['about-you']?.values || {};
  return {
    ...care,
    family: { name: you['your-name'] || user?.name || care.family.name, relation: you.relation || care.family.relation },
    elder: { name: person.name || care.elder.name, area: (person.city || care.elder.area).split(',')[0].trim() },
    need: needFrom(answers),
  };
}

// What the request says, in the family's words, from the plan.
export function requestMessage(care) {
  const what = (care.need?.services || []).map((s) => serviceTitle(s).toLowerCase()).join(', ');
  return [
    'Tražimo negovateljicu, plan nege je u prilogu.',
    what && `Potrebno je: ${what}.`,
    care.need && `Otprilike ${care.need.schedule}.`,
    'Da li biste mogli da dolazite?',
  ]
    .filter(Boolean)
    .join(' ');
}

