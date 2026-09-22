// The Clinical Frailty Scale the client's flow is built around. The questionnaire
// estimates a level from the answers, the conversation then branches on it, and the
// recommendation weighs it at 50% (see WEIGHTS below).
export const CFS = {
  1: { label: 'Veoma vitalna', blurb: 'Aktivna, energična i motivisana. Redovno vežba i među najvitalnijima je za svoje godine.' },
  2: { label: 'Vitalna', blurb: 'Bez aktivnih simptoma bolesti, ali manje vitalna nego prva kategorija. Aktivna povremeno, npr. sezonski.' },
  3: { label: 'Dobro se snalazi', blurb: 'Zdravstveni problemi su pod kontrolom. Nije redovno aktivna izvan uobičajenih šetnji.' },
  4: { label: 'Ranjiva', blurb: 'Nije zavisna od drugih iz dana u dan, ali je simptomi često ograničavaju. Često „usporena" ili umorna tokom dana.' },
  5: { label: 'Blago krhka', blurb: 'Usporavanje je vidljivije. Treba joj pomoć oko obaveza, kuće, prevoza i težih poslova; često i oko lekova.' },
  6: { label: 'Umereno krhka', blurb: 'Treba joj pomoć oko svih aktivnosti van kuće i oko domaćinstva. Često ima problem sa stepenicama, kupanjem i oblačenjem.' },
  7: { label: 'Izrazito krhka', blurb: 'Potpuno zavisna od drugih oko lične nege, iz bilo kog razloga. Stabilna i bez visokog rizika u narednih šest meseci.' },
  8: { label: 'Veoma izrazito krhka', blurb: 'Potpuno zavisna i pri kraju života. Po pravilu se ne bi oporavila ni od lakše bolesti.' },
  9: { label: 'Terminalno bolesna', blurb: 'Pri kraju života, sa očekivanim trajanjem ispod šest meseci, bez druge izražene krhkosti.' },
};

// Which branch of the conversation a level opens. Straight from the document.
export function bandOf(level) {
  if (level <= 3) return 'light';
  if (level <= 5) return 'moderate';
  if (level === 6) return 'high';
  if (level <= 8) return 'severe';
  return 'palliative';
}

// The client's formula for how a recommendation is reached.
export const WEIGHTS = { frailty: 0.5, reason: 0.35, context: 0.15 };

// How each answer pushes the estimate. Deliberately simple and inspectable — this
// is a prototype's best guess, not a validated clinical instrument.
const SCORES = {
  mobility: { independent: 1, stick: 3, walker: 5, wheelchair: 7, bed: 8 },
  'going-out': { easily: 1, 'little-help': 3, accompanied: 5, 'never-out': 7 },
  'daily-help': { none: 1, occasional: 3, 'several-times': 5, 'almost-constant': 7, dependent: 8 },
  falls: { none: 1, once: 4, 'more-than-once': 6 },
  outdoors: { daily: 1, weekly: 2, rarely: 5, never: 7 },
  slowing: { no: 1, little: 4, lot: 6 },
  overall: { active: 1, independent: 3, 'house-help': 4, 'most-help': 6, dependent: 8 },
};

// Self-description and mobility are the strongest signals, so they carry more.
const WEIGHT_PER_QUESTION = {
  mobility: 1.5,
  overall: 1.5,
  'daily-help': 1.2,
  'going-out': 1,
  'self-care': 1.2,
  falls: 0.6,
  outdoors: 0.6,
  slowing: 0.8,
};

const SELF_CARE_TASKS = ['dressing', 'bathing', 'toilet', 'meals', 'medication'];

export function estimateFrailty(answers) {
  let total = 0;
  let weight = 0;

  Object.entries(SCORES).forEach(([qid, table]) => {
    const picked = answers[qid]?.optionId;
    if (!picked || table[picked] === undefined) return;
    const w = WEIGHT_PER_QUESTION[qid] ?? 1;
    total += table[picked] * w;
    weight += w;
  });

  // the self-care checklist is inverted: ticking a task means she still manages it
  const selfCare = answers['self-care']?.optionIds;
  if (selfCare) {
    const unable = SELF_CARE_TASKS.filter((t) => !selfCare.includes(t)).length;
    const w = WEIGHT_PER_QUESTION['self-care'];
    total += (1 + (unable / SELF_CARE_TASKS.length) * 7) * w;
    weight += w;
  }

  if (!weight) return null;
  return Math.min(9, Math.max(1, Math.round(total / weight)));
}

export function frailtyOf(answers) {
  const level = estimateFrailty(answers);
  if (!level) return null;
  return { level, band: bandOf(level), ...CFS[level] };
}
