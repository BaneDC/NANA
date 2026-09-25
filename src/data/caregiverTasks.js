import { SERVICES } from './caregiverBoard';

// What the caregiver is asked to do, grouped for reading.
//
// The list itself is not ours to invent: it is `SERVICES` from the caregiver's
// side, the closed list every agreement and every visit is billed against. All
// this adds is an order to read them in and a line saying what each one covers,
// because a family choosing them has not seen an agreement yet.
//
// The care plan proposes this set from the answers (`needFrom`); this is where
// the family looks at what was proposed and says otherwise.
const NOTE = {
  'personal-care': 'Kupanje, oblačenje, higijena.',
  mobility: 'Ustajanje, hodanje po stanu, stepenice.',
  housekeeping: 'Pospremanje, sudovi, veš.',
  meals: 'Planiranje i kuvanje obroka.',
  medication: 'Da se lekovi popiju na vreme.',
  errands: 'Nabavka, apoteka, računi.',
  company: 'Razgovor, društvo, zajedničko vreme.',
  walks: 'Šetnje i boravak napolju.',
};

export const TASK_GROUPS = [
  { id: 'care', title: 'Lična nega', services: ['personal-care', 'mobility'] },
  { id: 'home', title: 'Kuća i obroci', services: ['housekeeping', 'meals'] },
  { id: 'daily', title: 'Svakodnevne obaveze', services: ['medication', 'errands'] },
  { id: 'company', title: 'Društvo', services: ['company', 'walks'] },
].map((g) => ({
  ...g,
  items: g.services.map((id) => {
    const s = SERVICES.find((x) => x.id === id);
    return { id, title: s?.title || id, note: NOTE[id] || '' };
  }),
}));

// What the caregiver is asked to do right now: what the family chose, or what
// the plan proposed while they have not chosen anything else.
export const tasksOf = (care) => care?.tasks?.services || care?.need?.services || [];
