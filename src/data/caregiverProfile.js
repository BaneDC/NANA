import { msg } from '../i18n';

// What her profile asks, the same in "Moj profil" and in the sign-up (part 5).
// Days are 0 (Monday) to 6, as on every caregiver record.
export const DAYS = [msg('pon'), msg('uto'), msg('sre'), msg('čet'), msg('pet'), msg('sub'), msg('ned')];
// the platform's own list (the live sign-up, 19. 10.)
export const EDUCATION = [
  msg('Osnovna škola'),
  msg('Srednja škola'),
  msg('Stručna škola'),
  msg('Visoka strukovna škola'),
  msg('Fakultet'),
  msg('Master (visoka strukovna škola)'),
  msg('Master'),
  msg('Doktorat'),
];
export const LANGUAGES_OFFERED = [msg('engleski'), msg('nemački'), msg('švedski'), msg('finski'), msg('norveški'), msg('srpski'), msg('drugi jezici')];

// What the demo knows of her that the family's list does not show: kept on
// her profile only (part 3).
export const PERSONAL = {
  sanna: { address: 'Mannerheimintie 40 B 12', birth: '12. 3. 1979.' }, // i18n-ignore
  milica: {
    address: 'Njegoševa 14', // i18n-ignore
    birth: '4. 7. 1988.',
    abroad: false,
    habits: { smoker: false, alcohol: false, pets: true },
    health: { allergies: false, limits: false, problems: false, convicted: false },
    readiness: ['dementia', 'semi-mobile', 'bathing'],
    unwilling: '',
    emergency: { name: 'Jovan Jovanović', relation: msg('Brat'), phone: '+381 64 777 1122', address: 'Njegoševa 14, Beograd' }, // i18n-ignore
  },
};

// Documents her classifications need, and whether they are checked.
export const DOCUMENTS = {
  Lähihoitaja: 'Lähihoitaja todistus',
  Sairaanhoitaja: 'Sairaanhoitaja todistus',
};

// Serbia's sign-up asks more of her (part 4): her habits, her health, what work
// she is ready for and whom to call if she cannot be reached.
export const HABITS = [
  ['smoker', msg('Pušite')],
  ['alcohol', msg('Pijete alkohol')],
  ['pets', msg('Rad uz kućne ljubimce')],
];
export const HEALTH_QUESTIONS = [
  ['allergies', msg('Alergije')],
  ['limits', msg('Fizička ograničenja')],
  ['problems', msg('Zdravstveni problemi koji otežavaju rad')],
  ['convicted', msg('Osuđivani za krivično delo')],
];
export const READINESS = [
  ['dementia', msg('Rad sa osobama sa demencijom')],
  ['immobile', msg('Rad sa nepokretnim osobama')],
  ['semi-mobile', msg('Rad sa polupokretnim osobama')],
  ['bathing', msg('Pomoć pri kupanju')],
  ['live-in', msg('Život sa starijom osobom')],
];
export const RELATIONS = [msg('Majka'), msg('Otac'), msg('Brat'), msg('Sestra'), msg('Supružnik'), msg('Dete'), msg('Prijatelj')];

// Where she lives, as the platform's list has it: by city, searched as typed.
// Places are names and are not translated.
export const MUNICIPALITIES = {
  fi: [
    { label: 'Helsinki', options: ['Central Helsinki', 'Pasila', 'Töölö', 'Kallio', 'Haaga', 'Munkkiniemi', 'Malmi', 'Oulunkylä', 'Vallila', 'Kamppi'] }, // i18n-ignore
    { label: 'Espoo', options: ['Leppävaara', 'Tapiola', 'Matinkylä', 'Espoonlahti'] }, // i18n-ignore
    { label: 'Vantaa', options: ['Tikkurila', 'Myyrmäki', 'Koivukylä'] }, // i18n-ignore
  ],
  sr: [
    { label: 'Beograd', options: ['Vračar', 'Zvezdara', 'Zemun', 'Novi Beograd', 'Voždovac', 'Palilula', 'Čukarica', 'Rakovica', 'Stari grad', 'Savski venac'] }, // i18n-ignore
    { label: 'Vojvodina', options: ['Novi Sad', 'Pančevo', 'Subotica'] }, // i18n-ignore
    { label: 'Ostalo', options: ['Niš', 'Kragujevac', 'Čačak'] }, // i18n-ignore
  ],
};
// as the Combobox takes them; the value says the city too ("Kallio, Helsinki")
export const municipalityGroups = (market) =>
  (MUNICIPALITIES[market] || MUNICIPALITIES.fi).map((g) => ({
    label: g.label,
    options: g.options.map((o) => ({ value: o === g.label || g.label === 'Ostalo' || g.label === 'Vojvodina' ? o : `${o}, ${g.label}`, label: o })),
  }));
