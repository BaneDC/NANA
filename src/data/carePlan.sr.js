import { riskIdsOf } from './carePlan';
import { frailtyOf } from './frailty';

// The care plan's overview in Serbian, for the last screen of the AI
// conversation — the plan read back in the language it was talked through in.
// An overlay, like flow.sr.js: buildPlan still decides what the plan says, and
// the English document the rest of the app shows is untouched.
//
// It comes back in parts rather than as paragraphs, because the screen does not
// read it as one block of prose: who she is leads, the risks are a list, the
// family's own words are quotes, and the recommendation stands on its own.
//
// Serbian declines names and places, and a template cannot: "za Milica" and
// "u Vračar" are both wrong. So nothing the family typed is ever inflected. A
// name only appears as the subject, age and place go in brackets, and their own
// words go in quotes — all exactly as they were written.
//
// Where Serbian forces a gender, the person is "she", as on the Serbian cards.

const HOUSEHOLD = {
  alone: 'živi sama',
  partner: 'živi sa suprugom',
  family: 'živi sa porodicom',
  crowded: 'živi u punoj kući',
};

const WISH = {
  light: ' i želi da nastavi da živi baš kao do sada',
  moderate: ' i želi da sačuva što više samostalnosti',
  // not "kod kuće": with no household answer the sentence already says it
  high: ' i želi da ostane u svom domu, uz pravu pomoć oko sebe',
  severe: ' i potrebna joj je nega koja pruža mir i sigurnost',
  palliative: ', a sada su najvažniji udobnost, dostojanstvo i porodica u blizini',
};

const REASON = {
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

// "it began", never the reason itself: after "a fall", "it came on suddenly" says
// the fall did — and "promena" would repeat itself after "promena u pamćenju"
const ONSET = {
  sudden: 'počelo je naglo, u poslednjih par nedelja',
  gradual: 'počelo je postepeno, pre nekoliko meseci',
  'long-standing': 'ovako je već dugo',
};

const HOSPITAL = {
  recent: ' U poslednjih mesec dana bila je i u bolnici.',
  older: ' Ranije je bila i u bolnici.',
};

const HELPER = {
  nobody: ' Za sada oko nje ništa nije organizovano.',
  neighbour: ' Komšinica ili prijateljica pomaže kad stigne, ali to nije organizovano.',
  family: ' Porodica to nosi između sebe, a to ne može dugo da traje.',
};

// list items, so they stand alone and start with a capital
const RISK = {
  medication: 'Redovno uzimanje lekova',
  kitchen: 'Bezbednost u kuhinji',
  bathing: 'Kupanje bez pomoći',
  fall: 'Novi pad',
  isolation: 'Usamljenost',
  flat: 'Stanje stana',
  sores: 'Rane od ležanja',
};

// a heading, so the nominative
const ROLE = {
  light: 'Osoba za društvo',
  moderate: 'Negovateljica',
  high: 'Iskusna negovateljica',
  severe: 'Medicinska sestra uz negovateljicu',
  palliative: 'Palijativni tim',
};

// what that role is there to do — the same promise as BAND_ACTIONS in English
const ROLE_DOES = {
  light: 'Neko ko joj pravi društvo, izvodi je napolje i pomaže da ostane aktivna.',
  moderate: 'Redovne posete za kuću, obroke i svakodnevne obaveze.',
  high: 'Pomoć oko lične nege, a sprečavanje padova je prvo na listi.',
  severe: 'Nega na nivou medicinske sestre, sama negovateljica ovde ne bi bila dovoljna.',
  palliative: 'Medicinska sestra, dostava lekova i podrška za celu porodicu.',
};

// what the family typed, without the quotes or full stop it may already carry
const bare = (text) => (text || '').trim().replace(/^["„“”']+|[.!?"„“”']+$/g, '').trim();
const sentence = (text) => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

export function planOverview(answers, notes = []) {
  const person = answers['about-person']?.values || {};
  const name = person.name?.trim();
  const details = [person.age?.trim(), person.city?.trim()].filter(Boolean);

  const you = answers['about-you']?.values || {};
  const caller = you['your-name']?.trim();
  const relation = you.relation?.trim();

  const band = frailtyOf(answers)?.band ?? 'moderate';
  const reasonId = answers['reason-for-contact']?.optionId;
  const goal = bare(answers['family-goal']?.values?.goal);
  const worry = bare(answers['family-goal']?.values?.worry);

  const lead = `${name || 'Osoba o kojoj brinete'}${details.length ? ` (${details.join(', ')})` : ''} ${
    HOUSEHOLD[answers.household?.optionId] || 'živi kod kuće'
  }${WISH[band]}.`;

  const story = [];
  if (reasonId) {
    story.push(
      `${REASON[reasonId] || REASON['daily-living']}, ${
        ONSET[answers.onset?.optionId] || 'traje već neko vreme'
      }.${HOSPITAL[answers.hospitalisation?.optionId] || ''}`
    );
  }
  if (caller) {
    story.push(
      `${caller}${relation ? ` (${relation.toLowerCase()})` : ''} je glavni kontakt.${
        HELPER[answers['who-helps-now']?.optionId] || ''
      }`
    );
  }

  return {
    lead,
    story,
    risks: riskIdsOf(answers).map((id) => RISK[id]),
    goal: goal || null,
    // the worry is the second half of the goal question, as in the English plan
    worry: goal && worry ? worry : null,
    // said in passing and belonging to no question, kept as they were said
    notes: notes.map(sentence),
    role: ROLE[band],
    recommendation: `${ROLE_DOES[band]} Nivo podrške proveravamo kad god se stanje promeni.`,
  };
}
