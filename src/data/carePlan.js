import { questionById } from './flow';
import { frailtyOf } from './frailty';
import { CFS_SR, srOptionTitles } from './flow.sr';
import { aidsFor, visitsFor } from './partners';
import { eurRange } from '../lib/money';

// Matched caregivers. `match` is the fake relevance score the assistant "computed"
// from the questionnaire — it exists to sell the AI framing in the prototype.
// Each one names an hourly range in euros, 10 to 20 an hour; the exact rate is
// what she agrees with the family.
const CAREGIVERS = [
  {
    id: 'sanna',
    name: 'Sanna Virtanen',
    initials: 'SV',
    match: 97,
    rating: 4.9,
    reviews: 64,
    rateMin: 16,
    rateMax: 20,
    area: 'Helsinki',
    radius: 10,
    bio: 'Diplomirana gerijatrijska sestra. Dvanaest godina sa porodicama koje brinu o roditelju kod kuće, najčešće u ranoj fazi demencije.',
    phone: '+358 40 218 4471',
    email: 'sanna.virtanen@mail.fi',
    classifications: ['Sairaanhoitaja', 'Lähihoitaja'],
    education: 'Visoka strukovna škola',
    languages: ['finski', 'engleski'],
    days: [0, 1, 2, 3, 4],
    slots: ['morning'],
  },
  {
    id: 'paivi',
    name: 'Päivi Korhonen',
    initials: 'PK',
    match: 94,
    rating: 5.0,
    reviews: 88,
    rateMin: 14,
    rateMax: 18,
    area: 'Helsinki',
    radius: 15,
    bio: 'Petnaest godina u kućnoj nezi, uključujući oporavak posle šloga. Kuva, vodi pisani dnevnik i svake večeri javlja porodici kako je prošao dan.',
    phone: '+358 50 318 9032',
    email: 'paivi.korhonen@mail.fi',
    classifications: ['Lähihoitaja', 'Hoiva-avustaja'],
    education: 'Stručna škola',
    languages: ['finski', 'švedski'],
    days: [0, 1, 2, 3, 4, 5],
    slots: ['morning', 'afternoon'],
  },
  {
    id: 'liisa',
    name: 'Liisa Mäkinen',
    initials: 'LM',
    match: 91,
    rating: 4.8,
    reviews: 41,
    rateMin: 11,
    rateMax: 14,
    area: 'Helsinki',
    radius: 8,
    bio: 'Topla i strpljiva, poznata po tome što i one koji ne žele izvede u svakodnevnu šetnju. Dostupna i vikendom.',
    phone: '+358 44 447 1120',
    email: 'liisa.makinen@mail.fi',
    classifications: ['Hoiva-avustaja', 'Kotiavustaja'],
    education: 'Srednja škola',
    languages: ['finski', 'ruski'],
    days: [2, 3, 4, 5, 6],
    slots: ['afternoon'],
  },
  {
    id: 'tuula',
    name: 'Tuula Nieminen',
    initials: 'TN',
    match: 88,
    rating: 4.9,
    reviews: 130,
    rateMin: 17,
    rateMax: 20,
    area: 'Espoo',
    radius: 25,
    bio: 'Najiskusnija negovateljica u našoj mreži. Obučena za premeštanje i sprečavanje padova, radi sa onima kojima je potrebna potpuna pomoć.',
    phone: '+358 40 993 2218',
    email: 'tuula.nieminen@mail.fi',
    classifications: ['Sairaanhoitaja'],
    education: 'Master (visoka strukovna)',
    languages: ['finski', 'nemački'],
    days: [0, 1, 2, 3, 4],
    slots: ['morning', 'afternoon', 'evening'],
  },
  {
    id: 'riitta',
    name: 'Riitta Heikkinen',
    initials: 'RH',
    match: 84,
    rating: 4.7,
    reviews: 29,
    rateMin: 13,
    rateMax: 16,
    area: 'Helsinki',
    radius: 12,
    bio: 'Bivša bolnička negovateljica. Mirna u hitnim situacijama i navikla da se dogovara sa lekarima i apotekama.',
    phone: '+358 50 302 7754',
    email: 'riitta.heikkinen@mail.fi',
    classifications: ['Lähihoitaja'],
    education: 'Stručna škola',
    languages: ['finski'],
    days: [0, 1, 2, 3, 4],
    slots: ['morning'],
  },
  {
    id: 'anneli',
    name: 'Anneli Laine',
    initials: 'AL',
    match: 81,
    rating: 4.8,
    reviews: 52,
    rateMin: 11,
    rateMax: 15,
    area: 'Vantaa',
    radius: 20,
    bio: 'Devet godina noćnih smena. Dobar izbor ako se raspored kasnije pomeri ka noćima.',
    phone: '+358 40 771 5580',
    email: 'anneli.laine@mail.fi',
    classifications: ['Hoiva-avustaja', 'Kotiavustaja'],
    education: 'Srednja škola',
    languages: ['finski', 'engleski'],
    days: [0, 1, 2, 3, 4, 5, 6],
    slots: ['evening'],
  },
  {
    id: 'johanna',
    name: 'Johanna Koskinen',
    initials: 'JK',
    match: 78,
    rating: 4.8,
    reviews: 47,
    rateMin: 15,
    rateMax: 19,
    area: 'Helsinki',
    radius: 10,
    bio: 'Jedanaest godina sa starijima koji žive sami. Pazi na lekove, vodi računa o ishrani i uredno javlja porodici posle svake posete.',
    phone: '+358 50 552 3187',
    email: 'johanna.koskinen@mail.fi',
    classifications: ['Sairaanhoitaja', 'Lähihoitaja'],
    education: 'Visoka strukovna škola',
    languages: ['finski', 'švedski'],
    days: [0, 1, 2, 3, 4],
    slots: ['afternoon'],
  },
  {
    id: 'satu',
    name: 'Satu Järvinen',
    initials: 'SJ',
    match: 76,
    rating: 4.7,
    reviews: 23,
    rateMin: 10,
    rateMax: 13,
    area: 'Helsinki',
    radius: 5,
    bio: 'Mlada i vedra, sa iskustvom u domu za stare. Rado ide u šetnje, na pijacu i kod lekara.',
    phone: '+358 44 813 4409',
    email: 'satu.jarvinen@mail.fi',
    classifications: ['Kotiavustaja'],
    education: 'Srednja škola',
    languages: ['finski', 'engleski'],
    days: [0, 1, 2, 3, 4, 5],
    slots: ['morning'],
  },
  {
    id: 'kaisa',
    name: 'Kaisa Lehtinen',
    initials: 'KL',
    match: 74,
    rating: 4.9,
    reviews: 71,
    rateMin: 14,
    rateMax: 17,
    area: 'Espoo',
    radius: 30,
    bio: 'Četrnaest godina u kućnoj nezi, najviše sa ležećim pacijentima. Obučena za negu rana i sprečavanje dekubitusa.',
    phone: '+358 40 407 2291',
    email: 'kaisa.lehtinen@mail.fi',
    classifications: ['Lähihoitaja', 'Hoiva-avustaja'],
    education: 'Stručna škola',
    languages: ['finski', 'švedski'],
    days: [0, 1, 2, 3, 4, 5, 6],
    slots: ['morning', 'afternoon', 'evening'],
  },
  {
    id: 'heli',
    name: 'Heli Salonen',
    initials: 'HS',
    match: 71,
    rating: null,
    reviews: 0,
    rateMin: 10,
    rateMax: 14,
    area: 'Helsinki',
    radius: 6,
    bio: 'Strpljiva sa onima koji zaboravljaju. Drži se istog dnevnog reda iz dana u dan, jer to ljudima sa demencijom najviše znači.',
    phone: '+358 50 219 6630',
    email: 'heli.salonen@mail.fi',
    classifications: ['Hoiva-avustaja'],
    education: 'Srednja škola',
    languages: ['finski', 'estonski'],
    days: [0, 1, 2, 3, 4],
    slots: ['morning', 'afternoon'],
  },
  {
    id: 'marjatta',
    name: 'Marjatta Hämäläinen',
    initials: 'MH',
    match: 68,
    rating: 4.8,
    reviews: 95,
    rateMin: 15,
    rateMax: 20,
    area: 'Kauniainen',
    radius: 20,
    bio: 'Osamnaest godina iskustva, od toga deset u bolnici. Snalazi se sa terapijom, merenjem pritiska i šećera.',
    phone: '+358 40 348 7712',
    email: 'marjatta.hamalainen@mail.fi',
    classifications: ['Sairaanhoitaja'],
    education: 'Fakultet',
    languages: ['finski', 'švedski'],
    days: [1, 2, 3, 4, 5],
    slots: ['morning'],
  },
  {
    id: 'eeva',
    name: 'Eeva Rantanen',
    initials: 'ER',
    match: 65,
    rating: null,
    reviews: 0,
    rateMin: 10,
    rateMax: 12,
    area: 'Vantaa',
    radius: 15,
    bio: 'Radi noću i vikendom, kad je porodici najteže da nađe zamenu. Mirna, pouzdana i uvek na vreme.',
    phone: '+358 44 925 1148',
    email: 'eeva.rantanen@mail.fi',
    classifications: ['Hoiva-avustaja', 'Kotiavustaja'],
    education: 'Osnovna škola',
    languages: ['finski'],
    days: [4, 5, 6],
    slots: ['evening'],
  },
];

// The range as it is shown, made from the two numbers so the two cannot drift
// apart: "16–20 €/h".
export const caregivers = CAREGIVERS.map((c) => ({ ...c, rate: eurRange(c.rateMin, c.rateMax, '/h') }));

// ---------------------------------------------------------------------------
// What a caregiver is shown with. In Finland the law limits what may be
// collected about her, so this is all of it — the platform's own form: her
// municipality (never the address), how far she travels, her classifications
// (the four the form offers, by their Finnish names), education, languages,
// the days and parts of the day she works, and her price. No years of
// experience, no list of skills. Phone and e-mail open with the subscription.

// The form's three parts of the day. There is no round-the-clock care.
export const SLOTS = {
  morning: { label: 'Jutro', hours: '06–14' },
  afternoon: { label: 'Popodne', hours: '14–22' },
  evening: { label: 'Veče', hours: '22–06' },
};

const DAY_NAMES = ['pon', 'uto', 'sre', 'čet', 'pet', 'sub', 'ned'];

// "pon–pet", "svaki dan", "sre–ned" — or the days one by one when they are not
// a run.
export function daysText(days) {
  if (days.length === 7) return 'svaki dan';
  const run = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  return run && days.length > 2
    ? `${DAY_NAMES[days[0]]}–${DAY_NAMES[days[days.length - 1]]}`
    : days.map((d) => DAY_NAMES[d]).join(', ');
}

export const slotsText = (slots) => slots.map((s) => SLOTS[s].label.toLowerCase()).join(', ');

// Why she comes up, the way the platform says it under the match. Worked out
// for the demo family, who live in Helsinki and want mornings; the platform
// works it out from the plan.
export function matchReasons(c) {
  const reasons = [];
  if (c.match >= 85) reasons.push('Sve vrste nege');
  reasons.push(c.area === 'Helsinki' ? 'Isti grad' : `Dolazi do ${c.radius} km`);
  if (c.slots.includes('morning')) reasons.push('Raspored se poklapa');
  return reasons;
}

// What is shown in place of her phone and e-mail before the subscription.
export const MASKED_EMAIL = '********@*****.fi';

// What a locked phone number looks like. Deliberately not derived from the real
// number — no real digit reaches the client until the plan is paid for.
export const MASKED_PHONE = '+358 ** *** ****';

// Mirrors what the API should do: `phone` is simply absent from the payload until
// the plan is unlocked, so it never sits in the DOM waiting to be read out.
export function caregiversFor(unlocked) {
  return caregivers.map(({ phone, ...rest }) => (unlocked ? { ...rest, phone } : rest));
}

// The coordinator is a person, not a support queue — the client was explicit that
// the plan should read as one named human who has your back. Contact details are
// shown freely; the paywall is on caregiver numbers, not on reaching us.
export const coordinator = {
  name: 'Minna Alanen',
  initials: 'MA',
  role: 'Vaša koordinatorka nege',
  phone: '+358 9 4000 220',
  whatsapp: '+358 40 400 0220',
  email: 'minna@nanaprime.com',
};

// ---------------------------------------------------------------------------
// The plan is written in Serbian, the language the family talked it through in.
//
// Serbian declines names and places, and a template cannot: "za Zorka" and
// "u Vračar" are both wrong. So nothing the family typed is ever inflected — a
// name only appears as the subject, age and place go in brackets, and their own
// words go in quotes, exactly as they were written. Where Serbian forces a
// gender, the person is "she", as everywhere else in the Serbian copy.
// ---------------------------------------------------------------------------

const HOUSEHOLD_PHRASE = {
  alone: 'živi sama',
  partner: 'živi sa suprugom',
  family: 'živi sa porodicom',
  crowded: 'živi u punoj kući',
};

const WISH = {
  light: ' i želi da nastavi da živi baš kao do sada',
  moderate: ' i želi da sačuva što više samostalnosti',
  high: ' i želi da ostane u svom domu, uz pravu pomoć oko sebe',
  severe: ' i potrebna joj je nega koja pruža mir i sigurnost',
  palliative: ', a sada su najvažniji udobnost, dostojanstvo i porodica u blizini',
};

const REASON_PHRASE = {
  fall: 'Javili ste nam se posle pada',
  memory: 'Javili ste nam se zbog promena u pamćenju',
  discharge: 'Javili ste nam se jer se vraća kući iz bolnice',
  loneliness: 'Javili ste nam se jer je previše sama',
  medication: 'Javili ste nam se jer je praćenje lekova postalo teško',
  diagnosis: 'Javili ste nam se zbog dijagnoze',
  'home-help': 'Javili ste nam se jer joj je kuća postala prevelika',
  respite: 'Javili ste nam se jer je porodici potreban predah',
  'daily-living': 'Javili ste nam se jer svakodnevica traži podršku',
};

const ONSET_PHRASE = {
  sudden: 'počelo je naglo, u poslednjih par nedelja',
  gradual: 'počelo je postepeno, pre nekoliko meseci',
  'long-standing': 'ovako je već dugo',
};

const HOSPITAL_PHRASE = {
  recent: ' U poslednjih mesec dana bila je i u bolnici.',
  older: ' Ranije je bila i u bolnici.',
};

const HELPER_PHRASE = {
  nobody: ' Za sada oko nje ništa nije organizovano.',
  neighbour: ' Komšinica ili prijateljica pomaže kad stigne, ali to nije organizovano.',
  family: ' Porodica to nosi između sebe, a to ne može dugo da traje.',
};

// a heading, so the nominative
const CAREGIVER_ROLE = {
  light: 'Osoba za društvo',
  moderate: 'Negovateljica',
  high: 'Iskusna negovateljica',
  severe: 'Medicinska sestra uz negovateljicu',
  palliative: 'Palijativni tim',
};

const BAND_ACTIONS = {
  light: 'Lagana podrška - društvo, prevoz i da ostane aktivna.',
  moderate: 'Redovne posete negovateljice za kuću, obroke i obaveze.',
  high: 'Pomoć oko lične nege, a sprečavanje padova je na prvom mestu.',
  severe: 'Nega na nivou medicinske sestre - sama negovateljica ovde ne bi bila dovoljna.',
  palliative: 'Palijativna koordinacija - medicinska sestra, dostava lekova i podrška porodici.',
};

// The document's scenarios: what gets arranged depends far more on why the family
// called than on the frailty level alone. Each entry is a coordinator's first move.
const REASON_ACTIONS = {
  fall: [
    'Poseta medicinske sestre da proceni pad i proveri povrede',
    'Procena rizika od pada u stanu',
    'Fizioterapeut, pa negovateljica kad bude stabilnija',
  ],
  memory: [
    'Kognitivni pregled kod neuropsihijatra',
    'Negovateljica sa iskustvom u radu sa demencijom',
    'Provera bezbednosti stana - šporet, brave, ključevi',
  ],
  discharge: [
    'Medicinska sestra prve nedelje posle otpusta',
    'Usklađivanje lekova sa otpusnom listom',
    'Svakodnevne posete negovateljice dok ne povrati snagu',
  ],
  loneliness: [
    'Negovateljica za društvo, u redovnom ritmu',
    'Odlazak u lokalni klub ili grupu',
    'Prevoz, da posete ne zavise samo od porodice',
  ],
  medication: [
    'Pregled terapije sa izabranim lekarom',
    'Nedeljna kutijica za lekove koju puni negovateljica',
    'Posete za podsećanje u vreme kada je to važno',
  ],
  diagnosis: [
    'Negovateljica sa iskustvom sa ovom bolešću',
    'Koordinacija sa lekarom specijalistom',
    'Pomagala prilagođena toku bolesti',
  ],
  'home-help': [
    'Negovateljica za kuvanje, veš i nabavku',
    'Generalno čišćenje, da se stan sredi',
    'Redovan nedeljni ritam, da se ne ponovi',
  ],
  respite: [
    'Negovateljica za sate koje želite nazad',
    'Zamena za duži odmor',
    'Jedna koordinatorka, da vi ne morate sve da vodite',
  ],
  'daily-living': [
    'Negovateljica za najteže delove dana',
    'Pomoć oko obroka i lekova',
    'Nedeljni razgovor telefonom sa vama',
  ],
};

// What the coordinator's letter acknowledges, per reason. The client's own example
// named the specific hard thing ("watching someone you love change") rather than
// offering generic sympathy, so each reason gets its own sentence.
const LETTER_ACKNOWLEDGEMENT = {
  fall: 'Pad promeni kako porodica gleda na sve. Briga koja dođe posle često je teža od samog pada.',
  memory:
    'Znam da nije lako gledati kako se neko koga volite menja, pogotovo dok pokušavate da ga podržite i da pritom nastavite svoj život.',
  discharge: 'Povratak iz bolnice je trenutak kada porodica ima najviše posla, a najmanje uputstava.',
  loneliness: 'O usamljenosti se retko govori naglas, a to je jedna od stvari koje čoveka najbrže iscrpe.',
  medication: 'Lekovi su jedna od onih tihih briga koje nosite ceo dan - da li su uzeti, i da li su pravi.',
  diagnosis: 'Dijagnoza sve preuredi odjednom, i obično stigne sa više pitanja nego odgovora.',
  'home-help': 'Kad kuća počne da izmiče, retko je stvar u kući. To je znak da je dan postao predug.',
  respite: 'Tražiti predah ne znači odustati. Porodice koje izdrže su one koje dozvole nekom drugom da preuzme smenu.',
  'daily-living': 'Svakodnevne stvari porodicu najviše iscrpljuju, a najlakše ih je podeliti.',
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

// list items, so they stand alone and start with a capital
const RISK_PHRASE = {
  medication: 'redovno uzimanje lekova',
  kitchen: 'bezbednost u kuhinji',
  bathing: 'kupanje bez pomoći',
  fall: 'novi pad',
  isolation: 'usamljenost',
  flat: 'stanje stana',
  sores: 'rane od ležanja',
};

// The support section asks a different question per band, and it is the one place
// the family describes their own needs — including anything they typed into the
// "something else" row.
const SUPPORT_QUESTIONS = ['lifestyle', 'household-tasks', 'personal-care', 'palliative-needs'];

const titlesOf = (id, answers) => srOptionTitles(questionById[id], answers[id]);

function supportNeedsOf(answers) {
  return SUPPORT_QUESTIONS.flatMap((id) => titlesOf(id, answers));
}

const listOf = (items) =>
  items.length <= 1 ? items[0] || '' : `${items.slice(0, -1).join(', ')} i ${items[items.length - 1]}`;

// what the family typed, without the quotes or full stop it may already carry
const bare = (text) => (text || '').trim().replace(/^["„“”']+|[.!?"„“”']+$/g, '').trim();
const quoted = (text) => `„${bare(text)}“`;
const lower = (t) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);

// ---------------------------------------------------------------------------

// Builds the care plan from what the user actually answered, so the artifact
// visibly reflects the questionnaire — and follows the client's formula:
// decision = frailty (50%) + reason for contact (35%) + context (15%).
export function buildPlan(answers, notes = []) {
  const name = answers['about-person']?.values?.name?.trim() || 'Osoba o kojoj brinete';
  const firstName = answers['about-person']?.values?.name?.trim()?.split(' ')[0] || 'Ona';
  const age = answers['about-person']?.values?.age?.trim();
  const city = answers['about-person']?.values?.city?.trim();

  const caller = answers['about-you']?.values?.['your-name']?.trim() || '';
  const callerFirst = caller.split(' ')[0] || '';
  const relation = answers['about-you']?.values?.relation?.trim();

  const frailty = frailtyOf(answers);
  const band = frailty?.band ?? 'moderate';

  const reasonId = answers['reason-for-contact']?.optionId;
  const reason = titlesOf('reason-for-contact', answers)[0];
  const onsetId = answers['onset']?.optionId;
  const onset = titlesOf('onset', answers)[0];
  const hospital = titlesOf('hospitalisation', answers)[0];
  const mobilityId = answers['mobility']?.optionId;
  const mobility = titlesOf('mobility', answers)[0];
  const dailyHelp = titlesOf('daily-help', answers)[0];
  const goal = bare(answers['family-goal']?.values?.goal);
  const worry = bare(answers['family-goal']?.values?.worry);

  const helper = answers['who-helps-now']?.optionId;
  const needs = supportNeedsOf(answers);
  const risks = riskIdsOf(answers).map((id) => RISK_PHRASE[id]);
  const actions = REASON_ACTIONS[reasonId] || REASON_ACTIONS['daily-living'];
  const role = CAREGIVER_ROLE[band];

  // The narrative summary, the way the client's example reads: who they are, how
  // it developed, who is around them, what is at risk, what matters to you.
  const details = [age, city].filter(Boolean);
  const narrative = [
    `${name}${details.length ? ` (${details.join(', ')})` : ''} ${HOUSEHOLD_PHRASE[answers['household']?.optionId] || 'živi kod kuće'}${WISH[band]}.`,
  ];
  if (reasonId) {
    narrative.push(
      `${REASON_PHRASE[reasonId] || REASON_PHRASE['daily-living']} - ${ONSET_PHRASE[onsetId] || 'traje već neko vreme'}.${
        HOSPITAL_PHRASE[answers['hospitalisation']?.optionId] || ''
      }`
    );
  }
  if (caller) {
    narrative.push(`${caller}${relation ? ` (${relation.toLowerCase()})` : ''} je glavni kontakt.${HELPER_PHRASE[helper] || ''}`);
  }
  if (risks.length) narrative.push(`Najveći rizici su sada ${listOf(risks)}.`);
  if (goal) narrative.push(`Najvažnije vam je ${quoted(goal)}.${worry ? ` Najviše vas brine ${quoted(worry)}.` : ''}`);
  // Anything the family said that no question covers. Without this it would be
  // collected in the conversation and then quietly dropped on the way to the plan.
  if (notes.length) narrative.push(`Rekli ste nam i: ${notes.map(quoted).join(', ')}.`);
  narrative.push(`Preporučujemo: ${lower(role)}, uz proveru nivoa podrške kad god se stanje promeni.`);

  // The coordinator's letter. Personal, addressed by name, and explicitly not a
  // sales message — the client's note was that nothing should read like "book now".
  const letter = {
    greeting: callerFirst ? `Zdravo, ${callerFirst},` : 'Zdravo,',
    paragraphs: [
      `Hvala vam što ste mi ispričali šta se dešava. ${LETTER_ACKNOWLEDGEMENT[reasonId] || LETTER_ACKNOWLEDGEMENT['daily-living']}`,
      `Ovo što sam pripremila treba da ${firstName} bude bezbedna, a da sačuvamo što više njene samostalnosti, navika i svakodnevne rutine. ${BAND_ACTIONS[band]}`,
      goal
        ? 'Rekli ste mi kako za vas izgleda dobar ishod, i sve ispod je napravljeno oko toga.'
        : 'Sve ispod je napravljeno oko onoga što ste mi rekli da je najvažnije.',
      // what was said in passing stays in the letter, where the family reads it
      // and the coordinator acts on it
      ...(notes.length ? [`Zabeležila sam i ono što ste usput rekli: ${notes.map(quoted).join(', ')}.`] : []),
      'Ne morate sve ovo da rešite danas. Idemo korak po korak, zajedno. Kad god budete spremni, tu sam da organizujem sledeći.',
    ],
    from: coordinator,
  };

  const defaultNeeds =
    band === 'light'
      ? ['društvo', 'izlasci', 'aktivnost']
      : band === 'high' || band === 'severe' || band === 'palliative'
        ? ['lična nega', 'obroci', 'lekovi']
        : ['kuća', 'obroci', 'obaveze'];

  // Recommendations, in the document's card shape: a title, and why it is being
  // recommended for this person specifically. Then either who would do it, what a
  // partner charges for it (and less when the coordinator books it), or — for what
  // is advice rather than a purchase — just the list.
  const recommendations = [
    {
      id: 'caregiver',
      kind: 'caregivers',
      locked: false,
      title:
        band === 'light'
          ? 'Osoba za društvo, dva-tri puta nedeljno'
          : band === 'severe' || band === 'palliative'
            ? 'Svakodnevne posete na nivou medicinske sestre'
            : 'Redovne posete negovateljice',
      // their own words first — this is what they actually asked for, including
      // anything the option list did not cover
      why:
        `Stalna podrška za ${needs.length ? 'ono što ste naveli' : 'ono što je najpotrebnije'}: ${listOf(
          (needs.length ? needs.slice(0, 4) : defaultNeeds).map(lower)
        )}. A vi biste znali da je neko uz nju svakog dana.` + (worry ? ' To je i najdirektniji odgovor na ono što vas brine.' : ''),
      providers: 'caregivers',
    },
    {
      id: 'medical',
      kind: 'offer',
      locked: true,
      title: reasonId === 'fall' ? 'Procena posle pada, pa pregled kod lekara' : 'Pregled kod lekara',
      why: 'Više stvari se dešava istovremeno, a jedan pregled koji zajedno gleda lekove, kretanje i pamćenje kaže nam više nego tri odvojena.',
      partner: 'koivu',
      items: visitsFor(reasonId),
    },
    {
      id: 'aids',
      kind: 'offer',
      locked: true,
      title: 'Pomagala',
      why:
        mobilityId === 'bed'
          ? 'Uglavnom leži, pa su joj potrebni dušek koji štiti kožu i nešto za šta može da se pridrži.'
          : mobility && mobilityId !== 'independent'
            ? `Kreće se ${lower(mobility)}, a pravo pomagalo joj vraća sigurnost u koracima.`
            : 'Dve stvari koje štite od pada u kupatilu i pokazuju kako je pritisak iz dana u dan.',
      partner: 'tukivaline',
      items: aidsFor(mobilityId),
    },
    {
      id: 'home',
      kind: 'list',
      locked: true,
      title: 'Male promene u stanu',
      why: 'Nekoliko jeftinih promena sada sprečava da se mali posrtaj pretvori u pad.',
      items: [
        'Rukohvati i protivklizna podloga u kupatilu',
        'Noćno svetlo na putu do kupatila',
        'Skloniti tepihe i kablove sa prolaza',
      ],
    },
    {
      id: 'local',
      kind: 'list',
      locked: true,
      title: `Još mogućnosti u blizini${city ? ` · ${city.split(',')[0]}` : ''}`,
      why: 'Nega nisu samo posete. Ovo su stvari u blizini koje joj daju razlog da izađe iz stana.',
      items: ['Gradski bazen', 'Klub penzionera', 'Jutarnja grupa u dnevnom centru'],
    },
  ];

  const facts = [
    { label: 'Za koga', value: name },
    { label: 'Nivo krhkosti', value: frailty ? `${frailty.level} · ${CFS_SR[frailty.level]?.label || frailty.label}` : '-' },
    { label: 'Kretanje', value: mobility || '-' },
    { label: 'Pomoć tokom dana', value: dailyHelp || '-' },
    { label: 'Gde treba pomoć', value: needs.length ? needs.join(', ') : '-' },
    { label: 'Razlog javljanja', value: reason || '-' },
    { label: 'Kako je počelo', value: onset || '-' },
    { label: 'Bolnica', value: hospital || '-' },
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
