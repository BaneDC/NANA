// The services a caregiver's agreement can cover, as the caregivers' own app
// lists them: four groups, one closed list. That app sends agreements, visit
// plans and work orders in these terms, so the family's side shows the same
// names, grouped the same way. The caregiver screens in this repo keep their
// own short list (caregiverBoard.SERVICES); `serviceTitle` reads both.

import { msg } from '../i18n';

// Every title here is a Serbian key (msg): it is shown through t().
export const SERVICE_GROUPS = [
  {
    id: 'assistance',
    title: msg('Pomoć u svakodnevici'),
    items: [
      ['grocery-shopping', msg('Kupovina namirnica')],
      ['pharmacy-pickup', msg('Preuzimanje lekova iz apoteke')],
      ['food-preparation', msg('Priprema hrane')],
      ['eating-assistance', msg('Pomoć pri jelu i piću')],
      ['light-cleaning', msg('Lakše čišćenje')],
      ['laundry', msg('Pranje veša')],
      ['bed-linens', msg('Promena posteljine')],
      ['trash', msg('Iznošenje smeća')],
      ['companionship', msg('Društvo')],
      ['walks', msg('Šetnje i boravak napolju')],
      ['transport', msg('Prevoz na preglede')],
      ['doctor-visits', msg('Pratnja kod lekara')],
      ['errands', msg('Obaveze u banci ili pošti')],
      ['social-activities', msg('Čitanje, igre i druženje')],
      ['technology', msg('Pomoć sa telefonom i računarom')],
      ['pet-care', msg('Briga o kućnom ljubimcu')],
    ],
  },
  {
    id: 'personal',
    title: msg('Lična nega i kuća'),
    items: [
      ['dressing', msg('Pomoć pri oblačenju')],
      ['bathing', msg('Pomoć pri kupanju')],
      ['hygiene', msg('Lična higijena')],
      ['oral-care', msg('Nega usta i zuba')],
      ['hair-care', msg('Nega kose')],
      ['toileting', msg('Pomoć pri odlasku u toalet')],
      ['mobility-assistance', msg('Pomoć pri kretanju')],
      ['transfers', msg('Premeštanje iz kreveta u stolicu')],
      ['medication-reminders', msg('Podsećanje na lekove')],
      ['observe-condition', msg('Praćenje opšteg stanja')],
      ['report-changes', msg('Javljanje promena koordinatorki')],
    ],
  },
  {
    id: 'practical-nursing',
    title: msg('Praktična nega'),
    items: [
      ['medication-organization', msg('Raspoređivanje lekova')],
      ['medication-administration', msg('Davanje lekova')],
      ['blood-pressure', msg('Merenje pritiska')],
      ['blood-glucose', msg('Merenje šećera u krvi')],
      ['temperature', msg('Merenje temperature')],
      ['pulse', msg('Merenje pulsa')],
      ['oxygen', msg('Merenje zasićenosti kiseonikom')],
      ['weight', msg('Praćenje težine')],
      ['wound-care', msg('Osnovna nega rana')],
      ['compression', msg('Kompresivne čarape')],
      ['catheter', msg('Nega katetera')],
      ['stoma', msg('Nega stome')],
      ['rehabilitation', msg('Vežbe za oporavak')],
      ['nutrition', msg('Praćenje ishrane')],
      ['hydration', msg('Praćenje unosa tečnosti')],
      ['fall-risk', msg('Praćenje rizika od pada')],
    ],
  },
  {
    id: 'registered-nursing',
    title: msg('Medicinska nega'),
    items: [
      ['nursing-assessment', msg('Procena nege')],
      ['clinical-assessment', msg('Klinička procena')],
      ['advanced-wound-care', msg('Složena nega rana')],
      ['injections', msg('Injekcije')],
      ['iv-therapy', msg('Infuzija')],
      ['blood-samples', msg('Vađenje krvi')],
      ['ecg', msg('EKG')],
      ['chronic-monitoring', msg('Praćenje hronične bolesti')],
      ['palliative', msg('Palijativna nega')],
      ['plan-evaluation', msg('Procena plana nege')],
      ['physician-consultation', msg('Konsultacija sa lekarom')],
      ['clinical-documentation', msg('Medicinska dokumentacija')],
      ['provider-coordination', msg('Saradnja sa zdravstvenim službama')],
      ['family-education', msg('Obuka porodice')],
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
