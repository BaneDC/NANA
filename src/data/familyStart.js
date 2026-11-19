import { servicesForNeed } from './serviceCatalog';
import { START_HOUR } from './familyCare';
import { getLang, msg, t } from '../i18n';

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

// How many days a week, from how the family said it: a number of times ("pet
// dana nedeljno", "twice a week"), the days named ("pon, sre, pet"), a run of
// them ("pon – pet", "Monday through Friday"), "svaki dan", "radnim danima",
// and what is left out ("svaki dan osim nedelje"). Null when it cannot be
// told: nothing is made up.
// each day by how a word for it begins, in Serbian and English; in Finnish
// (only when the app is in Finnish: "su", "ti", "ma" are Serbian words too)
// also by its two letters
const DAY_STARTS = [
  ['pon', 'mon', 'maanan'],
  ['uto', 'tue', 'tiis'],
  ['sre', 'wed', 'kesk'],
  ['čet', 'cet', 'thu', 'tors'],
  ['pet', 'fri', 'perj'],
  ['sub', 'satur', 'lau'],
  ['ned', 'sun', 'sunn'],
];
const DAY_FI = ['ma', 'ti', 'ke', 'to', 'pe', 'la', 'su'];
// "nedelja" is Sunday and the week: only these forms are the day
const SUNDAY = ['ned', 'nedelja', 'nedeljom', 'nedelju'];
const COUNT = { jednom: 1, jedan: 1, jedna: 1, dva: 2, dve: 2, dvaput: 2, tri: 3, triput: 3, četiri: 4, cetiri: 4, pet: 5, šest: 6, sest: 6, sedam: 7, once: 1, one: 1, twice: 2, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, kerran: 1, yksi: 1, kaksi: 2, kolme: 3, neljä: 4, viisi: 5, kuusi: 6, seitsemän: 7 }; // i18n-ignore: number words
const TIMES = /^(x|puta|put|dana|dan|times|time|days|day|kertaa|kerran|päivää|päivänä|päivä)$/;
const RUN = /[–—-]|\sdo\s|\sto\s|through|thru|until|\still?\s/;

const wordsOf = (s) => s.split(/[^\p{L}\d]+/u).filter(Boolean);
function daysIn(part, { weekIsSunday = false } = {}) {
  const words = wordsOf(part);
  return words
    .map((w, i) => {
      if (w.startsWith('nedelj') || w === 'ned') return SUNDAY.includes(w) || weekIsSunday ? 6 : -1;
      // "to" between two words is the English "to", not Thursday in Finnish
      if (getLang() === 'fi' && DAY_FI.includes(w) && !(w === 'to' && i > 0 && i < words.length - 1)) return DAY_FI.indexOf(w);
      return DAY_STARTS.findIndex((starts) => starts.some((p) => w.startsWith(p)));
    })
    .filter((d) => d >= 0);
}
export function daysCounted(text) {
  const s = ` ${String(text || '').toLowerCase()} `;
  if (!s.trim()) return null;
  // a number of times or days: "3 puta nedeljno", "pet dana u nedelji", "twice a week"
  const words = wordsOf(s);
  for (let i = 0; i < words.length; i += 1) {
    const n = /^\d+$/.test(words[i]) ? Number(words[i]) : COUNT[words[i]];
    const counted = TIMES.test(words[i + 1] || '') || ['jednom', 'dvaput', 'triput', 'once', 'twice', 'kerran'].includes(words[i]);
    if (n >= 1 && n <= 7 && counted) return n;
  }
  const [keep, except = ''] = s.split(/\sosim\s|\sexcept\s|\spaitsi\s/);
  const days = new Set();
  if (/svak(i|og) dan|every ?day|daily|joka päivä|päivittäin/.test(keep)) [0, 1, 2, 3, 4, 5, 6].forEach((d) => days.add(d));
  if (/radnim danima|radni dan|weekdays|arkisin|arkipäiv/.test(keep)) [0, 1, 2, 3, 4].forEach((d) => days.add(d));
  if (/vikend|weekend|viikonlop/.test(keep)) [5, 6].forEach((d) => days.add(d));
  for (const part of keep.split(/[,;]|\si\s|\sand\s|\sja\s|\ssekä\s/)) {
    const named = daysIn(part);
    if (named.length === 2 && RUN.test(` ${part} `)) {
      // from the first named to the last, round the week's end when it has to be
      for (let d = named[0]; ; d = (d + 1) % 7) {
        days.add(d);
        if (d === named[1]) break;
      }
    } else named.forEach((d) => days.add(d));
  }
  daysIn(except, { weekIsSunday: true }).forEach((d) => days.delete(d));
  return days.size || null;
}
// the hours of one visit: a number ("3", "2,5"), or the length of a time of
// day said in its place ("od 9 do 13")
const numberIn = (text) => {
  const s = String(text || '').replace(',', '.');
  const span = s.match(/(\d{1,2})(?::\d\d)?\s*(?:–|-|do|to)\s*(\d{1,2})/);
  if (span && Number(span[2]) > Number(span[1]) && Number(span[2]) <= 24) return Number(span[2]) - Number(span[1]);
  const n = s.match(/\d+(\.\d+)?/);
  return n ? Number(n[0]) : null;
};

// When and how much, as the family said it to Minna (`care-schedule`, decided
// 16. 11.): the days and the part of the day in their words, the hours a visit
// if they named them, and from those the hours a week. Round the clock
// (Serbia) has no hours. Null when that question is not answered.
export function scheduleFrom(answer) {
  const v = answer?.values;
  if (!v) return null;
  if (/24/.test(v.engagement || '') || /24/.test(v.hours || '')) return { schedule: msg('24 sata'), perVisit: null, hours: null, time: null };
  const said = [v.days, v.slots].map((x) => x?.trim()).filter(Boolean).join(' · ');
  if (!said) return null;
  const perVisit = numberIn(v.hours);
  const days = daysCounted(v.days);
  return { schedule: said, perVisit, hours: perVisit && days ? Math.round(perVisit * days * 10) / 10 : null, time: v.slots?.trim() || null };
}

// What the family needs done, in the caregiver's own list of services. On the
// short path they say it themselves (`care-needs`); on the full plan it is
// read from the answers the plan is built from. When they are needed, and how
// much, is what they said (`care-schedule`), and worked out only until they do.
export function needFrom(answers) {
  const alone = answers['self-care'];
  const tasks = answers['household-tasks'];
  const life = answers.lifestyle;
  const out = new Set(answers['care-needs']?.optionIds || []);
  if (!answers['care-needs']) {
    if (answered(alone) && !(has(alone, 'dressing') && has(alone, 'bathing') && has(alone, 'toilet'))) out.add('personal-care');
    if (has(tasks, 'cooking') || (answered(alone) && !has(alone, 'meals'))) out.add('meals');
    if (has(tasks, 'meds-admin') || (answered(alone) && !has(alone, 'medication'))) out.add('medication');
    if (has(life, 'company')) out.add('company');
    if (has(tasks, 'shopping') || has(life, 'transport')) out.add('errands');
    if (has(tasks, 'cleaning') || has(tasks, 'laundry') || ['needs-help', 'neglected'].includes(answers['home-condition']?.optionId)) out.add('housekeeping');
    if (['little-help', 'accompanied'].includes(answers['going-out']?.optionId) || has(life, 'exercise')) out.add('walks');
    if (['walker', 'wheelchair', 'bed'].includes(answers.mobility?.optionId)) out.add('mobility');
  }
  if (!out.size) out.add('company');

  const said = scheduleFrom(answers['care-schedule']);
  if (said)
    return {
      services: servicesForNeed([...out]),
      hours: said.hours,
      perVisit: said.perVisit,
      time: said.time,
      schedule: said.schedule,
    };

  // How much help, from how often she needs someone during the day.
  const often = answers['daily-help']?.optionId;
  const week =
    often === 'several-times'
      ? { days: msg('pon – pet'), time: '09:00–13:00', perVisit: 4, visits: 5 }
      : often === 'almost-constant' || often === 'dependent'
        ? { days: msg('pon – pet'), time: '08:00–16:00', perVisit: 8, visits: 5 }
        : often === 'none'
          ? { days: msg('uto, čet'), time: '10:00–13:00', perVisit: 3, visits: 2 }
          : { days: msg('pon, sre, pet'), time: '09:00–12:00', perVisit: 3, visits: 3 };

  // `schedule` is kept in Serbian, its days a key ("pon – pet · 09:00–13:00"),
  // so terms that carry it read in any language: shown with scheduleText.
  return {
    // in the catalog's terms, as a caregiver's agreement would list them
    services: servicesForNeed([...out]),
    hours: week.perVisit * week.visits,
    perVisit: week.perVisit,
    time: week.time,
    schedule: `${week.days} · ${week.time}`,
  };
}

const KEPT_DAYS = ['pon – pet', 'uto, čet', 'pon, sre, pet', '24 sata']; // i18n-ignore: keys, said through t()

// A schedule kept as "pon – pet · 09:00–13:00", in the language being read.
export const scheduleText = (schedule) => {
  if (!schedule) return schedule;
  const [days, time] = String(schedule).split(' · ');
  // the days we worked out are keys; what the family said itself stays as said
  const own = (x) => (KEPT_DAYS.includes(x) ? t(x) : x);
  return time ? `${own(days)} · ${time}` : own(schedule);
};

// The part of the care state that follows the answers: who she is, where, and
// what is needed. Kept current as the plan changes.
export function withAnswers(care, answers, user) {
  const person = answers['about-person']?.values || {};
  const you = answers['about-you']?.values || {};
  return {
    ...care,
    // the e-mail too: in Serbia a caregiver who says yes sees it (part 4)
    family: {
      name: you['your-name'] || user?.name || care.family.name,
      relation: you.relation || care.family.relation,
      phone: you['your-phone'] || user?.phone || care.family.phone,
      email: user?.email || care.family.email,
    },
    // a municipality by its own name ("Töölö, Helsinki" is Töölö); abroad the
    // country is part of where she is, so it stays ("Cirih, Švajcarska")
    elder: { name: person.name || care.elder.name, area: user?.abroad ? (person.city || care.elder.area).trim() : (person.city || care.elder.area).split(',')[0].trim() },
    need: needFrom(answers),
  };
}

