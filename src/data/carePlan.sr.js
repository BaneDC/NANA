import { riskIdsOf } from './carePlan';
import { frailtyOf } from './frailty';

// The care plan's opening paragraphs in Serbian, for the last screen of the AI
// conversation — the plan read back in the language it was talked through in.
// An overlay, like flow.sr.js: buildPlan still decides what the plan says, and
// the English document the rest of the app shows is untouched. Only the
// sentences are written again here.
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

// Accusative after "paziti na" — which for every one of these is the same as
// the nominative, so the list never needs declining either.
const RISK = {
  medication: 'redovno uzimanje lekova',
  kitchen: 'bezbednost u kuhinji',
  bathing: 'kupanje bez pomoći',
  fall: 'novi pad',
  isolation: 'usamljenost',
  flat: 'stanje stana',
  sores: 'rane od ležanja',
};

const ROLE = {
  light: 'osobu za društvo',
  moderate: 'negovateljicu',
  high: 'iskusnu negovateljicu',
  severe: 'medicinsku sestru uz negovateljicu',
  palliative: 'palijativni tim',
};

const listOf = (items) =>
  items.length <= 1 ? items[0] || '' : `${items.slice(0, -1).join(', ')} i ${items[items.length - 1]}`;

// what the family typed, without the quotes or full stop it may already carry
const bare = (text) => (text || '').trim().replace(/^["„“”']+|[.!?"„“”']+$/g, '').trim();
const sentence = (text) => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

export function planNarrative(answers, notes = []) {
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
  const risks = riskIdsOf(answers);

  const out = [];

  out.push(
    `${name || 'Osoba o kojoj brinete'}${details.length ? ` (${details.join(', ')})` : ''} ${
      HOUSEHOLD[answers.household?.optionId] || 'živi kod kuće'
    }${WISH[band]}.`
  );

  if (reasonId) {
    out.push(
      `${REASON[reasonId] || REASON['daily-living']} — ${
        ONSET[answers.onset?.optionId] || 'traje već neko vreme'
      }.${HOSPITAL[answers.hospitalisation?.optionId] || ''}`
    );
  }

  if (caller) {
    out.push(
      `${caller}${relation ? ` (${relation.toLowerCase()})` : ''} je glavni kontakt.${
        HELPER[answers['who-helps-now']?.optionId] || ''
      }`
    );
  }

  if (risks.length) {
    out.push(`Sada najviše treba paziti na ${listOf(risks.map((id) => RISK[id]))}.`);
  }

  if (goal) {
    out.push(
      `Rekli ste šta vam je najvažnije: „${goal}“.${worry ? ` A najviše vas brine: „${worry}“.` : ''}`
    );
  }

  // Said in passing and belonging to no question — kept as they were said, each
  // its own sentence, since these arrive as whole sentences already.
  if (notes.length) {
    out.push(`Zapamtili smo i ovo što ste usput rekli. ${notes.map(sentence).join(' ')}`);
  }

  out.push(
    `Preporučujemo ${ROLE[band]}, po meri ovoga što ste opisali — a nivo podrške proveravamo kad god se stanje promeni.`
  );

  return out;
}
