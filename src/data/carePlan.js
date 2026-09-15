import { optionTitles } from './flow';
import { frailtyOf } from './frailty';

// Matched caregivers. `match` is the fake relevance score the assistant "computed"
// from the questionnaire — it exists to sell the AI framing in the prototype.
export const caregivers = [
  {
    id: 'vesna',
    name: 'Vesna Mitrović',
    initials: 'VM',
    match: 97,
    years: 12,
    rating: 4.9,
    reviews: 64,
    rate: '850 RSD/h',
    area: 'Vračar',
    distance: '1.8 km away',
    bio: 'Certified geriatric nurse. Twelve years with families caring for a parent at home, most of them with early-stage dementia.',
    tags: ['Dementia care', 'Medication', 'Personal care'],
    phone: '+381 63 210 4471',
  },
  {
    id: 'snezana',
    name: 'Snežana Popović',
    initials: 'SP',
    match: 94,
    years: 15,
    rating: 5.0,
    reviews: 88,
    rate: '950 RSD/h',
    area: 'Vračar',
    distance: '2.4 km away',
    bio: 'Fifteen years in home care, including post-stroke recovery. Cooks, keeps a written daily log and reports back to the family every evening.',
    tags: ['Meals', 'Mobility support', 'Daily reports'],
    phone: '+381 64 118 9032',
  },
  {
    id: 'dragana',
    name: 'Dragana Ilić',
    initials: 'DI',
    match: 91,
    years: 8,
    rating: 4.8,
    reviews: 41,
    rate: '780 RSD/h',
    area: 'Zvezdara',
    distance: '3.1 km away',
    bio: 'Warm and patient, known for getting reluctant clients out for a daily walk. Available for weekend shifts.',
    tags: ['Companionship', 'Household', 'Weekends'],
    phone: '+381 62 447 1120',
  },
  {
    id: 'gordana',
    name: 'Gordana Nikolić',
    initials: 'GN',
    match: 88,
    years: 20,
    rating: 4.9,
    reviews: 130,
    rate: '1000 RSD/h',
    area: 'Savski venac',
    distance: '4.0 km away',
    bio: 'The most experienced caregiver in our network. Trained in transfers and fall prevention, works with clients who need full assistance.',
    tags: ['Transfers', 'Fall prevention', 'Personal care'],
    phone: '+381 60 993 2218',
  },
  {
    id: 'ljiljana',
    name: 'Ljiljana Marković',
    initials: 'LM',
    match: 84,
    years: 6,
    rating: 4.7,
    reviews: 29,
    rate: '720 RSD/h',
    area: 'Voždovac',
    distance: '5.2 km away',
    bio: 'Former hospital assistant. Calm in emergencies and comfortable coordinating with doctors and pharmacies.',
    tags: ['Medication', 'Doctor visits', 'Meals'],
    phone: '+381 65 302 7754',
  },
  {
    id: 'mirjana',
    name: 'Mirjana Jovanović',
    initials: 'MJ',
    match: 81,
    years: 9,
    rating: 4.8,
    reviews: 52,
    rate: '800 RSD/h',
    area: 'Novi Beograd',
    distance: '6.7 km away',
    bio: 'Nine years of overnight shifts. A good fit if the schedule shifts towards nights later on.',
    tags: ['Overnight', 'Companionship', 'Household'],
    phone: '+381 63 771 5580',
  },
];

// What a locked phone number looks like. Deliberately not derived from the real
// number — no real digit reaches the client until the plan is paid for.
export const MASKED_PHONE = '+381 ** *** ****';

// Mirrors what the API should do: `phone` is simply absent from the payload until
// the plan is unlocked, so it never sits in the DOM waiting to be read out.
export function caregiversFor(unlocked) {
  return caregivers.map(({ phone, ...rest }) => (unlocked ? { ...rest, phone } : rest));
}

// The coordinator is a person, not a support queue — the client was explicit that
// the plan should read as one named human who has your back. Contact details are
// shown freely; the paywall is on caregiver numbers, not on reaching us.
export const coordinator = {
  name: 'Jovana Đorđević',
  initials: 'JĐ',
  role: 'Your care coordinator',
  phone: '+381 11 4000 220',
  whatsapp: '+381 63 4000 220',
  email: 'jovana@nanaprime.rs',
};

// ---------------------------------------------------------------------------
// Narrative helpers. The plan is written, not tabulated: the client's document
// opens with a paragraph about the person, not a field list.
// ---------------------------------------------------------------------------

const HOUSEHOLD_PHRASE = {
  alone: 'lives alone',
  partner: 'lives with a partner',
  family: 'lives with family',
  crowded: 'lives in a full household',
};

const ONSET_PHRASE = {
  sudden: 'and it came on suddenly, in the last weeks',
  gradual: 'and it has come on gradually, over months',
  'long-standing': 'and it has been this way for a long time',
};

const REASON_PHRASE = {
  fall: 'You came to us after a fall',
  memory: 'What brought you to us is a change in memory',
  discharge: 'What brought you to us is the return home from hospital',
  loneliness: 'What brought you to us is how much time they spend alone',
  medication: 'What brought you to us is medication becoming hard to manage',
  diagnosis: 'What brought you to us is a diagnosis',
  'home-help': 'What brought you to us is that the house has become too much',
  respite: 'What brought you to us is that the family needs a break',
  'daily-living': 'What brought you to us is day-to-day life needing support',
};

const WISH = {
  light: 'and wants to keep living exactly as they do now',
  moderate: 'and wants to hold on to as much independence as possible',
  high: 'and wants to stay at home, with the right hands around them',
  severe: 'and needs care that keeps them comfortable and safe at home',
  palliative: 'and what matters now is comfort, dignity and having the family close',
};

const CAREGIVER_ROLE = {
  light: 'a companion',
  moderate: 'a caregiver',
  high: 'an experienced caregiver',
  severe: 'a nurse alongside a caregiver',
  palliative: 'a palliative team',
};

const BAND_ACTIONS = {
  light: 'Light-touch support — company, transport and keeping them active.',
  moderate: 'Regular caregiver visits for the house, meals and errands.',
  high: 'Hands-on personal care, with fall prevention as the priority.',
  severe: 'Nursing-level care. A caregiver alone would not be enough here.',
  palliative: 'Palliative coordination — nursing, medication delivery and family support.',
};

// The document's scenarios: what gets arranged depends far more on why the family
// called than on the frailty level alone. Each entry is a coordinator's first move.
const REASON_ACTIONS = {
  fall: [
    'A nurse visit to assess the fall and check for injury',
    'A home fall-risk assessment',
    'A physiotherapist, then a caregiver once they are steadier',
  ],
  memory: [
    'A cognitive screening with a neuropsychiatrist',
    'A caregiver experienced with dementia',
    'A safety check of the flat — hob, locks, keys',
  ],
  discharge: [
    'A nurse for the first week after discharge',
    'Medication reconciliation against the discharge letter',
    'Daily caregiver visits while they regain strength',
  ],
  loneliness: [
    'A companion caregiver on a regular rhythm',
    'Getting them out to a local social group',
    'Transport so visits stop depending on the family',
  ],
  medication: [
    'A medication review with the GP',
    'A weekly organiser prepared by the caregiver',
    'Reminder visits at the times that matter',
  ],
  diagnosis: [
    'A caregiver with experience of this condition',
    'Coordination with the treating specialist',
    'Equipment suited to how the condition progresses',
  ],
  'home-help': [
    'A caregiver for cooking, laundry and shopping',
    'A deeper clean to reset the flat',
    'A regular weekly rhythm so it does not slip again',
  ],
  respite: [
    'A caregiver covering the hours you need back',
    'Cover arranged for a longer break',
    'A single coordinator so you stop managing it',
  ],
  'daily-living': [
    'A caregiver for the parts of the day that are hardest',
    'Help with meals and medication',
    'A weekly check-in call with you',
  ],
};

// What the coordinator's letter acknowledges, per reason. The client's own example
// named the specific hard thing ("watching someone you love change") rather than
// offering generic sympathy, so each reason gets its own sentence.
const LETTER_ACKNOWLEDGEMENT = {
  fall: 'A fall changes how a family sees everything. The worry afterwards is often heavier than the fall itself.',
  memory:
    'We know it isn’t easy to watch someone you love change over time, especially when you are trying to support them and keep your own life going.',
  discharge:
    'Coming home from hospital is the point where families are left with the most to do and the least guidance.',
  loneliness:
    'Loneliness is rarely mentioned out loud, and it is one of the things that wears a person down fastest.',
  medication:
    'Medication is one of those quiet worries that sits with you all day — whether it was taken, and whether it was the right one.',
  diagnosis:
    'A diagnosis rearranges everything at once, and it usually arrives with more questions than answers.',
  'home-help':
    'When the house starts slipping it is rarely about the house. It is a sign that the day has become too long.',
  respite:
    'Asking for a break is not giving up. Families who last are the ones who let someone else take a shift.',
  'daily-living':
    'The everyday things are what quietly take the most out of a family, and they are the easiest to share.',
};

// The risks worth naming out loud, in the order the document names them:
// medication, kitchen safety, isolation. Ids rather than words, so the Serbian
// overview names the same risks without deciding them a second time.
export function riskIdsOf(answers) {
  const selfCare = answers['self-care']?.optionIds;
  const manages = (id) => !!selfCare?.includes(id);
  const risks = [];

  if (selfCare && !manages('medication')) risks.push('medication');
  if (selfCare && !manages('meals')) risks.push('kitchen');
  if (selfCare && !manages('bathing')) risks.push('bathing');
  const falls = answers['falls']?.optionId;
  if (falls && falls !== 'none') risks.push('fall');
  if (['rarely', 'never'].includes(answers['outdoors']?.optionId)) risks.push('isolation');
  if (answers['home-condition']?.optionId === 'neglected') risks.push('flat');
  const sores = answers['pressure-sores']?.optionId;
  if (sores && sores !== 'none') risks.push('sores');

  return risks.slice(0, 3);
}

const RISK_PHRASE = {
  medication: 'taking medication on time',
  kitchen: 'safety in the kitchen',
  bathing: 'washing without help',
  fall: 'another fall',
  isolation: 'social isolation',
  flat: 'the state of the flat',
  sores: 'pressure sores',
};

// The support section asks a different question per band, and it is the one place
// the family describes their own needs — including anything they typed into the
// "something else" row, which optionTitles folds in.
const SUPPORT_QUESTIONS = ['lifestyle', 'household-tasks', 'personal-care', 'palliative-needs'];

function supportNeedsOf(answers) {
  return SUPPORT_QUESTIONS.flatMap((id) => optionTitles(id, answers[id]));
}

const listOf = (items) =>
  items.length <= 1
    ? items[0] || ''
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

// ---------------------------------------------------------------------------

// Builds the care plan from what the user actually answered, so the artifact
// visibly reflects the questionnaire — and follows the client's formula:
// decision = frailty (50%) + reason for contact (35%) + context (15%).
export function buildPlan(answers, notes = []) {
  const name = answers['about-person']?.values?.name?.trim() || 'your loved one';
  const firstName = name.split(' ')[0];
  const age = answers['about-person']?.values?.age?.trim();
  const city = answers['about-person']?.values?.city?.trim();

  const caller = answers['about-you']?.values?.['your-name']?.trim() || '';
  const callerFirst = caller.split(' ')[0] || 'there';
  const relation = answers['about-you']?.values?.relation?.trim();

  const frailty = frailtyOf(answers);
  const band = frailty?.band ?? 'moderate';

  const reasonId = answers['reason-for-contact']?.optionId;
  const reason = optionTitles('reason-for-contact', answers['reason-for-contact'])[0];
  const onsetId = answers['onset']?.optionId;
  const onset = optionTitles('onset', answers['onset'])[0];
  const hospital = optionTitles('hospitalisation', answers['hospitalisation'])[0];
  const mobility = optionTitles('mobility', answers['mobility'])[0];
  const dailyHelp = optionTitles('daily-help', answers['daily-help'])[0];
  const goal = answers['family-goal']?.values?.goal?.trim();
  const worry = answers['family-goal']?.values?.worry?.trim();

  const household = HOUSEHOLD_PHRASE[answers['household']?.optionId];
  const helper = answers['who-helps-now']?.optionId;
  const needs = supportNeedsOf(answers);
  const risks = riskIdsOf(answers).map((id) => RISK_PHRASE[id]);
  const actions = REASON_ACTIONS[reasonId] || REASON_ACTIONS['daily-living'];
  const role = CAREGIVER_ROLE[band];

  // The narrative summary, built the way the client's example reads: who they are,
  // how it developed, who is around them, what is at risk, what matters to you.
  const narrative = [];
  narrative.push(
    [
      `${name}${age ? ` (${age})` : ''}`,
      household || 'lives at home',
      city ? `in ${city}` : null,
      WISH[band],
      '.',
    ]
      .filter(Boolean)
      .join(' ')
      .replace(' .', '.')
  );

  if (reasonId) {
    narrative.push(
      // Falls back the way the line below it and `actions` already do. The plan
      // is the last thing anyone reads: a missing phrase here should cost a
      // sentence's precision, never print the word "undefined" at a family.
      `${REASON_PHRASE[reasonId] || REASON_PHRASE['daily-living']}, ${
        ONSET_PHRASE[onsetId] || 'and it has been building for a while'
      }.` +
        (hospital && answers['hospitalisation']?.optionId !== 'none'
          ? ` There has been a hospital stay — ${hospital.toLowerCase()}.`
          : '')
    );
  }

  if (caller) {
    narrative.push(
      `${caller}${relation ? ` (${relation.toLowerCase()})` : ''} is the main contact.` +
        (helper === 'nobody'
          ? ' Nothing is organised around them at the moment.'
          : helper === 'neighbour'
            ? ' A neighbour helps when they can, but the support isn’t organised.'
            : helper === 'family'
              ? ' The family is holding it together between them, which is not something that lasts.'
              : '')
    );
  }

  if (risks.length) {
    narrative.push(`The biggest risks right now are ${listOf(risks)}.`);
  }

  if (goal) {
    narrative.push(
      `What matters most to you is ${goal.charAt(0).toLowerCase()}${goal.slice(1).replace(/\.$/, '')}.` +
        (worry ? ` The worry you named is ${worry.charAt(0).toLowerCase()}${worry.slice(1).replace(/\.$/, '')}.` : '')
    );
  }

  // Anything the family said that no question covers. Without this it would be
  // collected in the conversation and then quietly dropped on the way to the plan.
  if (notes.length) {
    narrative.push(`You also told us: ${listOf(notes.map((n) => n.replace(/\.$/, '')))}.`);
  }

  narrative.push(
    `We recommend ${role} matched to that picture, with the level reassessed as things change.`
  );

  // The coordinator's letter. Personal, addressed by name, and explicitly not a
  // sales message — the client's note was that nothing should read like "book now".
  const letter = {
    greeting: `Dear ${callerFirst},`,
    paragraphs: [
      `Thank you for telling me about ${firstName}. ${LETTER_ACKNOWLEDGEMENT[reasonId] || LETTER_ACKNOWLEDGEMENT['daily-living']}`,
      `What I’ve put together is meant to keep ${firstName} safe while protecting as much of their independence, habits and daily routine as we can. ${BAND_ACTIONS[band]}`,
      goal
        ? `You told me what a good outcome looks like for you, and everything below is built around that.`
        : `Everything below is built around what you told me matters most.`,
      `You don’t have to solve all of this today. We’ll go step by step, together. Whenever you’re ready, I’m here to arrange the next one.`,
    ],
    from: coordinator,
  };

  // Recommendations, in the document's card shape: a title, why it is being
  // recommended for this person specifically, who would do it, and soft actions.
  const recommendations = [
    {
      id: 'caregiver',
      kind: 'caregivers',
      locked: false,
      title:
        band === 'light'
          ? 'A companion, two or three times a week'
          : band === 'severe' || band === 'palliative'
            ? 'Daily nursing-level visits'
            : 'Regular caregiver visits',
      why:
        // their own words first — this is what they actually asked for, including
        // anything the option list did not cover
        `${firstName} would have steady support with ${listOf(
          needs.length
            ? needs.slice(0, 4).map((n) => n.toLowerCase())
            : band === 'light'
              ? ['company', 'getting out', 'staying active']
              : band === 'high' || band === 'severe' || band === 'palliative'
                ? ['personal care', 'meals', 'medication']
                : ['the house', 'meals', 'errands']
        )}, and you would know that someone is with them every day.` +
        (worry ? ` It is also the most direct answer to what worries you.` : ''),
      providers: 'caregivers',
      actions: ['Ask Jovana to arrange this', 'Talk it through first'],
    },
    {
      id: 'medical',
      kind: 'list',
      locked: true,
      title: reasonId === 'fall' ? 'A nurse assessment, then a doctor’s review' : 'A doctor’s review',
      why: `${firstName} has more than one thing going on at once, and a single visit that looks at medication, mobility and cognition together tells us more than three separate ones.`,
      items: actions,
      actions: ['Ask Jovana to book this', 'I have a question'],
    },
    {
      id: 'equipment',
      kind: 'list',
      locked: true,
      title: 'Small changes at home',
      why:
        mobility && mobility !== 'Completely on their own'
          ? `${firstName} gets around ${mobility.toLowerCase()}, and the flat can be made to work with that rather than against it.`
          : `A few inexpensive changes now are what keep a small stumble from becoming a fall.`,
      items: [
        'Grab bars and a non-slip mat in the bathroom',
        'A weekly pill organiser the caregiver fills',
        'An upper-arm blood pressure monitor',
      ],
      actions: ['Ask Jovana to organise this', 'Save for later'],
    },
    {
      id: 'local',
      kind: 'list',
      locked: true,
      title: `More options for ${firstName}${city ? ` in ${city.split(',')[0]}` : ' nearby'}`,
      why: `Care is not only visits. These are the things nearby that give ${firstName} a reason to leave the flat.`,
      items: ['The local swimming pool', 'A pensioners’ club', 'The day centre’s morning group'],
      actions: ['Ask Jovana to look into it'],
    },
  ];

  const facts = [
    { label: 'Care for', value: name },
    { label: 'Frailty level', value: frailty ? `${frailty.level} · ${frailty.label}` : '—' },
    { label: 'Getting around', value: mobility || '—' },
    { label: 'Help needed', value: dailyHelp || '—' },
    { label: 'Where help is needed', value: needs.length ? needs.join(', ') : '—' },
    { label: 'Reason for contact', value: reason || '—' },
    { label: 'How it started', value: onset || '—' },
    { label: 'Hospital stay', value: hospital || '—' },
  ];

  return {
    name,
    firstName,
    caller,
    callerFirst,
    relation,
    narrative,
    // one-line form for the places that only have room for a sentence
    summary: narrative.join(' '),
    letter,
    recommendations,
    facts,
    frailty,
    band,
    reason,
    goal,
    worry,
    actions,
    role,
    notes,
    coordinator,
  };
}
