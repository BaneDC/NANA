import { requiredError } from '../components/TextField';
import { DOCUMENTS } from './caregiverProfile';
import { msg, t } from '../i18n';

// The caregiver's sign-up, per market (docs/superpowers/specs/2026-10-19-registracija-negovateljice-design.md):
// which steps, what each one requires, and the caregiver record it makes. The
// screens only draw the fields.

export const STEPS = {
  fi: [
    { id: 'basic', title: msg('Osnovni podaci') },
    { id: 'profession', title: msg('Profesija') },
    { id: 'availability', title: msg('Dostupnost') },
    { id: 'review', title: msg('Pregled') },
  ],
  sr: [
    { id: 'basic', title: msg('Osnovni podaci') },
    { id: 'qualifications', title: msg('Kvalifikacije') },
    { id: 'availability', title: msg('Dostupnost') },
    { id: 'health', title: msg('Zdravlje i navike') },
    { id: 'emergency', title: msg('Kontakt za hitne slučajeve') },
    { id: 'review', title: msg('Pregled') },
  ],
};

// The Finnish classifications, and whether each asks for a document.
export const CLASSIFICATIONS = [
  { id: 'Hoiva-avustaja', text: msg('Osnovna pomoć u nezi') },
  { id: 'Lähihoitaja', text: msg('Praktična medicinska nega') },
  { id: 'Sairaanhoitaja', text: msg('Diplomirana medicinska sestra') },
  { id: 'Kotiavustaja', text: msg('Pomoć u kući i domaćinstvu') },
].map((c) => ({ ...c, document: DOCUMENTS[c.id] || null }));

export const emptyForm = (market) => ({
  market,
  firstName: '',
  lastName: '',
  birth: '',
  address: '',
  area: '',
  phone: market === 'sr' ? '+381 ' : '+358 ',
  classifications: [],
  education: '',
  languages: [],
  bio: '',
  certificate: false,
  courses: '',
  engagement: ['daily'],
  days: [],
  slots: [],
  radius: 10,
  rateMin: '',
  rateMax: '',
  abroad: false,
  habits: { smoker: false, alcohol: false, pets: false },
  health: { allergies: false, limits: false, problems: false, convicted: false },
  readiness: [],
  unwilling: '',
  emergency: { name: '', relation: '', phone: market === 'sr' ? '+381 ' : '+358 ', address: '' },
  documents: {},
  test: {},
  channel: '',
});

const blank = (v) => !String(v ?? '').trim();
const phoneShort = (v) => String(v || '').replace(/\D/g, '').length < 8;

// What is wrong in a step, field by field; an empty object when it is right.
export function stepErrors(step, f) {
  const e = {};
  const need = (k, ok) => {
    if (!ok) e[k] = requiredError();
  };
  if (step === 'basic') {
    need('firstName', !blank(f.firstName));
    need('lastName', !blank(f.lastName));
    need('birth', !blank(f.birth));
    need('address', !blank(f.address));
    need('area', !blank(f.area));
    if (phoneShort(f.phone)) e.phone = blank(f.phone) ? requiredError() : t('Unesite ceo broj telefona.');
  }
  if (step === 'profession') {
    if (!f.classifications.length) e.classifications = t('Izaberite bar jednu klasifikaciju.');
    need('education', !blank(f.education));
    need('bio', !blank(f.bio));
  }
  if (step === 'qualifications') {
    need('education', !blank(f.education));
    need('bio', !blank(f.bio));
  }
  if (step === 'availability') {
    if (!f.days.length) e.days = t('Izaberite bar jedan dan.');
    if (!f.slots.length) e.slots = t('Izaberite bar jedno doba dana.');
    if (f.market === 'sr' && !f.engagement.length) e.engagement = t('Izaberite bar jednu vrstu angažmana.');
    if (f.market !== 'sr') {
      const a = Number(String(f.rateMin).replace(',', '.'));
      const b = Number(String(f.rateMax).replace(',', '.'));
      if (blank(f.rateMin) || blank(f.rateMax)) e.rate = requiredError();
      else if (!(a > 0 && b >= a)) e.rate = t('Cena „od" ne može biti veća od cene „do".');
    }
  }
  if (step === 'emergency') {
    need('emergencyName', !blank(f.emergency.name));
    need('emergencyRelation', !blank(f.emergency.relation));
    if (phoneShort(f.emergency.phone)) e.emergencyPhone = requiredError();
    need('emergencyAddress', !blank(f.emergency.address));
  }
  if (step === 'documents') {
    documentsNeeded(f).forEach((c) => {
      if (!f.documents[c]) e['doc-' + c] = t('Dodajte dokument.');
    });
  }
  if (step === 'test') {
    const left = TEST_SIZE() - Object.keys(f.test).length;
    if (left > 0) e.test = t('Ostalo je {n} parova bez izbora.', { n: left });
  }
  if (step === 'interview' && !f.channel) e.channel = requiredError();
  return e;
}

// set from the test's own module, so this one does not import it
let testSize = 62;
export const TEST_SIZE = () => testSize;
export const setTestSize = (n) => {
  testSize = n;
};

export const documentsNeeded = (f) => f.classifications.filter((c) => DOCUMENTS[c]);

// what comes after the steps: Finland the documents (when any are needed),
// Serbia the test; both the interview, then the thanks
export const afterSteps = (f) => [...(f.market === 'sr' ? ['test'] : documentsNeeded(f).length ? ['documents'] : []), 'interview', 'thanks'];

// The caregiver record her sign-up makes, in the shape of every other one
// (carePlan.js, caregiversRs.js), new and not yet active.
export function recordFrom(f, id, email = '') {
  const name = `${f.firstName.trim()} ${f.lastName.trim()}`;
  const sr = f.market === 'sr';
  return {
    id,
    market: sr ? 'RS' : 'FI',
    status: 'interview',
    name,
    initials: (f.firstName[0] || '') + (f.lastName[0] || ''),
    match: 80,
    rating: null,
    reviews: 0,
    area: f.area.trim(),
    radius: Number(f.radius),
    phone: f.phone.trim(),
    email,
    bio: f.bio.trim(),
    education: f.education,
    languages: f.languages,
    days: [...f.days].map(Number).sort(),
    slots: f.slots,
    classifications: sr ? [] : f.classifications,
    address: f.address.trim(),
    birth: f.birth,
    ...(sr
      ? { certificate: f.certificate, courses: f.courses.trim(), engagement: f.engagement, abroad: f.abroad, habits: f.habits, health: f.health, readiness: f.readiness, unwilling: f.unwilling.trim(), emergency: f.emergency }
      : { rateMin: Number(String(f.rateMin).replace(',', '.')), rateMax: Number(String(f.rateMax).replace(',', '.')) }),
  };
}
