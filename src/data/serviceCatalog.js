// The services a caregiver's agreement can cover, as the caregivers' own app
// lists them: four groups, one closed list. That app sends agreements, visit
// plans and work orders in these terms, so the family's side shows the same
// names, grouped the same way. The caregiver screens in this repo keep their
// own short list (caregiverBoard.SERVICES); `serviceTitle` reads both.

export const SERVICE_GROUPS = [
  {
    id: 'assistance',
    title: 'Pomoć u svakodnevici',
    items: [
      ['grocery-shopping', 'Kupovina namirnica'],
      ['pharmacy-pickup', 'Preuzimanje lekova iz apoteke'],
      ['food-preparation', 'Priprema hrane'],
      ['eating-assistance', 'Pomoć pri jelu i piću'],
      ['light-cleaning', 'Lakše čišćenje'],
      ['laundry', 'Pranje veša'],
      ['bed-linens', 'Promena posteljine'],
      ['trash', 'Iznošenje smeća'],
      ['companionship', 'Društvo'],
      ['walks', 'Šetnje i boravak napolju'],
      ['transport', 'Prevoz na preglede'],
      ['doctor-visits', 'Pratnja kod lekara'],
      ['errands', 'Obaveze u banci ili pošti'],
      ['social-activities', 'Čitanje, igre i druženje'],
      ['technology', 'Pomoć sa telefonom i računarom'],
      ['pet-care', 'Briga o kućnom ljubimcu'],
    ],
  },
  {
    id: 'personal',
    title: 'Lična nega i kuća',
    items: [
      ['dressing', 'Pomoć pri oblačenju'],
      ['bathing', 'Pomoć pri kupanju'],
      ['hygiene', 'Lična higijena'],
      ['oral-care', 'Nega usta i zuba'],
      ['hair-care', 'Nega kose'],
      ['toileting', 'Pomoć pri odlasku u toalet'],
      ['mobility-assistance', 'Pomoć pri kretanju'],
      ['transfers', 'Premeštanje iz kreveta u stolicu'],
      ['medication-reminders', 'Podsećanje na lekove'],
      ['observe-condition', 'Praćenje opšteg stanja'],
      ['report-changes', 'Javljanje promena koordinatorki'],
    ],
  },
  {
    id: 'practical-nursing',
    title: 'Praktična nega',
    items: [
      ['medication-organization', 'Raspoređivanje lekova'],
      ['medication-administration', 'Davanje lekova'],
      ['blood-pressure', 'Merenje pritiska'],
      ['blood-glucose', 'Merenje šećera u krvi'],
      ['temperature', 'Merenje temperature'],
      ['pulse', 'Merenje pulsa'],
      ['oxygen', 'Merenje zasićenosti kiseonikom'],
      ['weight', 'Praćenje težine'],
      ['wound-care', 'Osnovna nega rana'],
      ['compression', 'Kompresivne čarape'],
      ['catheter', 'Nega katetera'],
      ['stoma', 'Nega stome'],
      ['rehabilitation', 'Vežbe za oporavak'],
      ['nutrition', 'Praćenje ishrane'],
      ['hydration', 'Praćenje unosa tečnosti'],
      ['fall-risk', 'Praćenje rizika od pada'],
    ],
  },
  {
    id: 'registered-nursing',
    title: 'Medicinska nega',
    items: [
      ['nursing-assessment', 'Procena nege'],
      ['clinical-assessment', 'Klinička procena'],
      ['advanced-wound-care', 'Složena nega rana'],
      ['injections', 'Injekcije'],
      ['iv-therapy', 'Infuzija'],
      ['blood-samples', 'Vađenje krvi'],
      ['ecg', 'EKG'],
      ['chronic-monitoring', 'Praćenje hronične bolesti'],
      ['palliative', 'Palijativna nega'],
      ['plan-evaluation', 'Procena plana nege'],
      ['physician-consultation', 'Konsultacija sa lekarom'],
      ['clinical-documentation', 'Medicinska dokumentacija'],
      ['provider-coordination', 'Saradnja sa zdravstvenim službama'],
      ['family-education', 'Obuka porodice'],
    ],
  },
];

export const CATALOG = Object.fromEntries(
  SERVICE_GROUPS.flatMap((g) => g.items.map(([id, title]) => [id, { id, title, group: g.id }]))
);

// The services, in the catalog's order, each group under its own name: how an
// agreement or a visit lists them (docs/patterns.md §10, a group of tags says
// what it is). Ids the catalog does not know are left out.
export function groupServices(ids) {
  return SERVICE_GROUPS.map((g) => ({
    id: g.id,
    title: g.title,
    items: g.items.filter(([id]) => ids.includes(id)).map(([id]) => id),
  })).filter((g) => g.items.length);
}

// What the plan says is needed (the care plan's own eight words for it), in the
// catalog's terms: what a caregiver's first agreement offers for that need.
const FROM_NEED = {
  'personal-care': ['dressing', 'bathing', 'hygiene'],
  meals: ['food-preparation', 'eating-assistance'],
  medication: ['medication-reminders'],
  company: ['companionship', 'social-activities'],
  errands: ['grocery-shopping', 'pharmacy-pickup'],
  housekeeping: ['light-cleaning', 'laundry'],
  walks: ['walks'],
  mobility: ['mobility-assistance', 'transfers'],
};

export const servicesForNeed = (need) => [...new Set((need || []).flatMap((id) => FROM_NEED[id] || []))];
