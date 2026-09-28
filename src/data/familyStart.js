import { caregivers } from './carePlan';
import { serviceTitle } from './caregiverBoard';

// The family's side as it really starts: nobody asked yet, nobody coming, no
// card. Everything on it from here is something the family did, or a
// caregiver's answer to it.
//
// Caregivers answer from their own board, which in this build is nobody. So
// that the story still moves on its own the way it would, their answers come
// here, a few seconds after the thing they answer — the same answer a real
// one would give, built from the family's own plan.

export const REPLY_AFTER_MS = 6000;
export const VISIT_AFTER_MS = 5000;

export function startCare(user) {
  return {
    family: { name: user?.name || '', relation: '' },
    elder: { name: '', area: '' },
    payment: { connected: false },
    need: null,
    requests: [],
    arrangements: [],
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
    services: [...out],
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

// Who says no, and why. A real board has people who are full; one of them
// here, so a family sees what a no looks like and that it always says why.
const BUSY = {
  dragana: 'Ponedeljkom i četvrtkom je zauzeta kod druge porodice do oktobra.',
};

const rateOf = (c) => parseInt(String(c.rate).replace(/\D/g, ''), 10) || 850;

// A caregiver's answer to a request: a no with its reason, or a yes that comes
// with her terms for exactly what the plan asks for.
export const answerRequest = (caregiverId) => (care) => {
  const req = care.requests.find((r) => r.caregiverId === caregiverId);
  if (!req || req.status !== 'pending') return care;
  const c = caregivers.find((x) => x.id === caregiverId);
  if (BUSY[caregiverId]) {
    return {
      ...care,
      requests: care.requests.map((r) => (r === req ? { ...r, status: 'declined', detail: BUSY[caregiverId] } : r)),
    };
  }
  const need = care.need || needFrom({});
  return {
    ...care,
    requests: care.requests.map((r) =>
      r === req ? { ...r, status: 'accepted', detail: 'Prihvatila je i poslala svoje uslove.' } : r
    ),
    arrangements: [
      ...care.arrangements,
      {
        caregiver: {
          id: c.id,
          name: c.name,
          initials: c.initials,
          phone: c.phone,
          area: c.area,
          distance: c.distance,
          years: c.years,
          rating: c.rating,
          reviews: c.reviews,
          bio: c.bio,
        },
        since: null,
        endedOn: null,
        versions: [
          {
            version: 1,
            status: 'sent',
            services: need.services,
            rate: rateOf(c),
            hours: need.hours,
            schedule: need.schedule,
            sentOn: 'upravo',
            note: `Pročitala sam plan nege. Mogu da dolazim ${need.schedule}, i da preuzmem sve što piše u njemu.`,
          },
        ],
        visits: [],
      },
    ],
  };
};

// Once terms are agreed she plans the first visit, as she would from her board:
// tomorrow, on the agreed schedule, for what the terms cover.
export const planFirstVisit = (caregiverId) => (care) => ({
  ...care,
  arrangements: care.arrangements.map((a) => {
    if (a.caregiver.id !== caregiverId || a.visits.length) return a;
    const v = a.versions.find((x) => x.status === 'active');
    if (!v) return a;
    const time = v.schedule.split('·')[1]?.trim() || '09:00–12:00';
    const [from, to] = time.split('–').map((t) => parseInt(t, 10));
    return {
      ...a,
      visits: [
        {
          id: `v-${caregiverId}-1`,
          date: 'Sutra',
          time,
          hours: to - from || 3,
          rate: v.rate,
          services: v.services,
          notes: 'Prva poseta. Upoznaću se sa njom i proći kroz plan nege sa vama.',
          status: 'planned',
          sentOn: 'upravo',
          dueInHours: 20,
        },
      ],
    };
  }),
});
