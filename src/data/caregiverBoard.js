import { CFS } from './frailty';

// The caregiver's side of the same product. A family sends a request; from the
// caregiver's desk that request is a piece of work that moves through four
// stages, and the only question the board has to answer at a glance is "what
// needs me next, and for whom".
//
// Each family sits in exactly one column, and the column is not a label on them
// — it is the next thing the caregiver owes them. A family with a visit to
// invoice is in Work orders even though the arrangement is perfectly active,
// because the invoice is what is outstanding. When it is sent they go back to
// Active. That is why the board can be read without reading any card.

export const STAGES = [
  { id: 'request', title: 'Novi upiti', note: 'Prihvati ili odbij' },
  { id: 'agreement', title: 'Ugovor o nezi', note: 'Koje usluge, i jedna cena po satu' },
  { id: 'active', title: 'Aktivno', note: 'Saradnja je u toku' },
  { id: 'work-order', title: 'Radni nalozi', note: 'Pošalji posle svake posete' },
];

// The services an agreement can cover. One closed list, because the agreement
// is what every later number is calculated from — a visit is billed against
// these, so they cannot be free text. `short` is what fits on a board card.
export const SERVICES = [
  { id: 'personal-care', title: 'Lična nega i higijena', short: 'Lična nega' },
  { id: 'meals', title: 'Priprema obroka', short: 'Obroci' },
  { id: 'medication', title: 'Podsećanje na lekove', short: 'Lekovi' },
  { id: 'company', title: 'Društvo i razgovor', short: 'Društvo' },
  { id: 'errands', title: 'Nabavka i obaveze', short: 'Nabavka' },
  { id: 'housekeeping', title: 'Lakši kućni poslovi', short: 'Kućni poslovi' },
  { id: 'walks', title: 'Šetnje i boravak napolju', short: 'Šetnje' },
  // Not on the client's draft list, but the care plan on the family's side asks
  // about mobility support and someone at CFS 7 is mostly that.
  { id: 'mobility', title: 'Pomoć pri kretanju', short: 'Kretanje' },
];

export const serviceById = Object.fromEntries(SERVICES.map((s) => [s.id, s]));
export const serviceTitle = (id) => serviceById[id]?.title || id;
export const serviceShort = (id) => serviceById[id]?.short || id;

// Belgrade, dinars, the same families the rest of the app talks about — the
// screenshots that prompted this view were euros and Finnish names from another
// product, and this one has its own.
export const money = (n) => `${n.toLocaleString('sr-RS').replace(/,/g, '.')} RSD`;

export const DEFAULT_RATE = 850;

export const clients = [
  {
    id: 'stevanovic',
    elder: 'Milica Stevanović',
    age: 84,
    initials: 'MS',
    family: 'Bogdan Stevanović',
    relation: 'Sin',
    phone: '+381 63 555 210',
    area: 'Vračar',
    distance: '1,8 km',
    frailty: 5,
    needs: ['medication', 'meals', 'company'],
    hours: 12,
    schedule: 'pon, sre, pet · 09:00–13:00',
    stage: 'request',
    waitingDays: 2,
    startsOn: 'ponedeljak, 18. avgusta',
    visits: [],
    activity: [
      {
        kind: 'request',
        when: 'pre 2 dana',
        text: 'Bogdan je poslao upit pošto je završio plan nege. Milica je na nivou krhkosti 5.',
      },
    ],
  },
  {
    id: 'pavlovic',
    elder: 'Đorđe Pavlović',
    age: 79,
    initials: 'ĐP',
    family: 'Jelena Pavlović',
    relation: 'Ćerka',
    phone: '+381 64 220 118',
    area: 'Zvezdara',
    distance: '3,2 km',
    frailty: 6,
    needs: ['personal-care', 'mobility', 'meals'],
    hours: 20,
    schedule: 'svakog radnog dana · 08:00–12:00',
    stage: 'request',
    waitingHours: 4,
    startsOn: 'Što pre',
    visits: [],
    activity: [
      {
        kind: 'request',
        when: 'pre 4 sata',
        text: 'Jelena je poslala upit. Živi u Novom Sadu i radnim danima ne može da bude tu.',
      },
    ],
  },
  {
    id: 'jovanovic',
    elder: 'Radmila Jovanović',
    age: 88,
    initials: 'RJ',
    family: 'Nevena Jovanović',
    relation: 'Unuka',
    phone: '+381 60 771 940',
    area: 'Vračar',
    distance: '1,1 km',
    frailty: 6,
    needs: ['personal-care', 'meals', 'housekeeping'],
    hours: 15,
    schedule: 'pon–čet · 09:00–13:00',
    stage: 'agreement',
    agreementSent: false,
    acceptedOn: 'juče',
    visits: [],
    activity: [
      { kind: 'request', when: 'pre 3 dana', text: 'Nevena je poslala upit za baku.' },
      { kind: 'accepted', when: 'juče', text: 'Prihvatili ste. Ugovor tek treba postaviti.' },
    ],
  },
  {
    id: 'maric',
    elder: 'Vojislav Marić',
    age: 81,
    initials: 'VM',
    family: 'Aleksandar Marić',
    relation: 'Sin',
    phone: '+381 63 044 617',
    area: 'Savski venac',
    distance: '4,6 km',
    frailty: 4,
    needs: ['company', 'errands', 'walks'],
    hours: 8,
    schedule: 'uto, čet · 10:00–14:00',
    stage: 'agreement',
    agreementSent: true,
    sentOn: 'pre 2 dana',
    services: ['company', 'errands', 'walks'],
    rate: 850,
    visits: [],
    activity: [
      { kind: 'request', when: 'pre 5 dana', text: 'Aleksandar je poslao upit.' },
      { kind: 'accepted', when: 'pre 4 dana', text: 'Prihvatili ste.' },
      {
        kind: 'agreement-sent',
        when: 'pre 2 dana',
        text: 'Ugovor poslat: 3 usluge po 850 RSD/h. Čeka se da Aleksandar potpiše.',
      },
    ],
  },
  {
    id: 'ilic',
    elder: 'Zorka Ilić',
    age: 86,
    initials: 'ZI',
    family: 'Milena Ilić',
    relation: 'Ćerka',
    phone: '+381 64 909 335',
    area: 'Vračar',
    distance: '2,0 km',
    frailty: 5,
    needs: ['medication', 'meals', 'company'],
    hours: 12,
    schedule: 'pon, sre, pet · 09:00–13:00',
    stage: 'active',
    services: ['medication', 'meals', 'company', 'housekeeping'],
    rate: 850,
    since: '12. juna',
    plan: {
      date: 'Sutra',
      time: '09:00–13:00',
      hours: 4,
      services: ['medication', 'meals', 'company'],
      notes: 'Podići recept u apoteci u Njegoševoj. Milena je tražila da je pozovete posle.',
      sentOn: 'pre 2 dana',
    },
    visits: [
      { date: '8. avgusta', time: '09:00–13:00', hours: 4, mood: 'good', eating: 'usual', moving: 'usual', services: ['medication', 'meals', 'company'], note: 'Jutarnja rutina, skuvala za dva dana, kratka šetnja do parka.', status: 'paid' },
      { date: '6. avgusta', time: '09:00–13:00', hours: 4, mood: 'usual', eating: 'usual', moving: 'usual', services: ['medication', 'meals', 'housekeeping'], note: 'Apoteka, veš, ručak.', status: 'paid' },
      { date: '4. avgusta', time: '09:00–13:00', hours: 4, mood: 'low', eating: 'less', moving: 'less', services: ['medication', 'meals'], concern: 'Jede mnogo manje nego obično, treći put ove nedelje.', note: 'Umorna celo jutro, nije htela da izađe. Jela je vrlo malo.', status: 'paid' },
    ],
    activity: [
      { kind: 'request', when: '10. juna', text: 'Milena je poslala upit.' },
      { kind: 'accepted', when: '10. juna', text: 'Prihvatili ste.' },
      { kind: 'agreement-sent', when: '11. juna', text: 'Ugovor poslat: 3 usluge po 850 RSD/h.' },
      { kind: 'agreement-signed', when: '12. juna', text: 'Milena je potpisala. Saradnja je počela.' },
      { kind: 'agreement-changed', when: '2. jula', text: 'Lakši kućni poslovi dodati na Milenin zahtev. Cena ista.' },
      { kind: 'note', when: '4. avgusta', text: 'Zabeležili ste: jede mnogo manje nego obično, vredi reći porodici.' },
      { kind: 'message', when: '5. avgusta', text: 'Milena: „Hvala što ste zvali. Zakazali smo lekara za petak.“' },
    ],
  },
  {
    id: 'nikolic',
    elder: 'Branko Nikolić',
    age: 90,
    initials: 'BN',
    family: 'Dušan Nikolić',
    relation: 'Sin',
    phone: '+381 61 328 004',
    area: 'Zvezdara',
    distance: '3,8 km',
    frailty: 7,
    needs: ['personal-care', 'mobility', 'medication'],
    hours: 9,
    schedule: 'uto, čet, sub · 10:00–13:00',
    stage: 'active',
    services: ['personal-care', 'mobility', 'medication'],
    rate: 900,
    since: '3. marta',
    plan: {
      date: 'Četvrtak',
      time: '10:00–13:00',
      hours: 3,
      services: ['personal-care', 'mobility', 'medication'],
      notes: 'Probati ponovo stepenice do dvorišta ako bude mogao.',
      sentOn: 'juče',
    },
    visits: [
      { date: '9. avgusta', time: '10:00–13:00', hours: 3, mood: 'usual', eating: 'usual', moving: 'usual', services: ['personal-care', 'mobility', 'medication'], note: 'Kupanje, oblačenje, vežbe sa hodalicom.', status: 'awaiting', sentOn: 'pre 6 sati', confirmsInHours: 18 },
      { date: '7. avgusta', time: '10:00–13:00', hours: 3, mood: 'good', eating: 'usual', moving: 'more', services: ['personal-care', 'mobility', 'medication'], note: 'Prvi put posle više nedelja savladao stepenice do dvorišta.', status: 'paid' },
    ],
    activity: [
      { kind: 'request', when: '1. marta', text: 'Dušan je poslao upit.' },
      { kind: 'accepted', when: '1. marta', text: 'Prihvatili ste.' },
      { kind: 'agreement-sent', when: '2. marta', text: 'Ugovor poslat: 3 usluge po 900 RSD/h.' },
      { kind: 'agreement-signed', when: '3. marta', text: 'Dušan je potpisao. Saradnja je počela.' },
      { kind: 'note', when: '7. avgusta', text: 'Zabeležili ste: sam je savladao stepenice. Vredi nastaviti.' },
    ],
  },
  {
    id: 'petrovic',
    elder: 'Ljubica Petrović',
    age: 83,
    initials: 'LJP',
    family: 'Marko Petrović',
    relation: 'Sin',
    phone: '+381 63 610 227',
    area: 'Vračar',
    distance: '1,4 km',
    frailty: 5,
    needs: ['meals', 'housekeeping', 'company'],
    hours: 9,
    schedule: 'pon, sre, pet · 09:00–12:00',
    stage: 'work-order',
    services: ['meals', 'housekeeping', 'company'],
    rate: 850,
    since: '4. maja',
    sinceVisit: 'pre 18 sati',
    visits: [
      { date: 'Juče', time: '09:00–12:00', hours: 3, planned: ['meals', 'housekeeping', 'company'], planNotes: 'Peglanje, i želela je pomoć oko pisanja pisma.', status: 'due' },
      { date: '7. avgusta', time: '09:00–12:00', hours: 3, mood: 'good', eating: 'usual', moving: 'usual', services: ['meals', 'housekeeping', 'company'], note: 'Kuvale zajedno, veći deo uradila je sama.', status: 'paid' },
      { date: '5. avgusta', time: '09:00–12:00', hours: 3, mood: 'usual', eating: 'usual', moving: 'usual', services: ['meals', 'housekeeping'], note: 'Nabavka, čišćenje kuhinje.', status: 'paid' },
    ],
    activity: [
      { kind: 'request', when: '2. maja', text: 'Marko je poslao upit.' },
      { kind: 'accepted', when: '2. maja', text: 'Prihvatili ste.' },
      { kind: 'agreement-sent', when: '3. maja', text: 'Ugovor poslat: 3 usluge po 850 RSD/h.' },
      { kind: 'agreement-signed', when: '4. maja', text: 'Marko je potpisao. Saradnja je počela.' },
      { kind: 'message', when: '1. avgusta', text: 'Marko: „Možete li od septembra da dodate i petke?“' },
    ],
  },
  {
    id: 'djuric',
    elder: 'Slavko Đurić',
    age: 77,
    initials: 'SĐ',
    family: 'Tanja Đurić',
    relation: 'Ćerka',
    phone: '+381 60 447 812',
    area: 'Palilula',
    distance: '5,1 km',
    frailty: 4,
    needs: ['company', 'walks', 'errands'],
    hours: 12,
    schedule: 'pon, čet · 08:00–14:00',
    stage: 'work-order',
    services: ['company', 'walks', 'errands'],
    rate: 800,
    since: '20. jula',
    sinceVisit: 'pre 2 dana',
    visits: [
      { date: '9. avgusta', time: '08:00–14:00', hours: 6, planned: ['company', 'walks', 'errands'], planNotes: 'Prvo pijaca, pa šetnja pored Dunava.', status: 'due' },
      { date: '5. avgusta', time: '08:00–14:00', hours: 6, mood: 'good', eating: 'more', moving: 'more', services: ['company', 'walks', 'errands'], note: 'Obaveze i duga šetnja. Ceo dan dobro raspoložen.', status: 'paid' },
    ],
    activity: [
      { kind: 'request', when: '18. jula', text: 'Tanja je poslala upit.' },
      { kind: 'accepted', when: '18. jula', text: 'Prihvatili ste.' },
      { kind: 'agreement-sent', when: '19. jula', text: 'Ugovor poslat: 3 usluge po 800 RSD/h.' },
      { kind: 'agreement-signed', when: '20. jula', text: 'Tanja je potpisala. Saradnja je počela.' },
    ],
  },
];

// What the caregiver has already been paid this month, before anything on the
// board is sent. The work-order column is money not yet asked for, which is the
// reason it sits on the board at all.
export const paidThisMonth = 38400;

export const frailtyLabel = (level) => CFS[level]?.label || '';

// A work order is the visit's hours at the agreed rate, less the platform's
// 10% — the caregiver's number is what lands, not what is charged.
export const SERVICE_FEE = 0.1;

export function totalsFor(hours, rate) {
  const charged = hours * rate;
  const fee = Math.round(charged * SERVICE_FEE);
  return { charged, fee, net: charged - fee };
}

// How long a time range runs, so a plan does not have to be told twice how many
// hours it is. Half-hour precision, which is as fine as anyone schedules.
export function hoursIn(timeRange) {
  const m = /^(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})$/.exec((timeRange || '').trim());
  if (!m) return null;
  const minutes = (+m[3] * 60 + +m[4]) - (+m[1] * 60 + +m[2]);
  return minutes > 0 ? Math.round((minutes / 60) * 2) / 2 : null;
}

// The visit still waiting on its work order. Held in one place rather than
// duplicated onto the client, which was two truths about the same visit.
export const dueVisit = (client) => (client.visits || []).find((v) => v.status === 'due');

export const workOrderTotals = (client) => {
  const v = dueVisit(client);
  return totalsFor(v ? v.hours : 0, client.rate);
};

// Where the agreement stands, said once so the board and the client page cannot
// disagree about it.
export function agreementState(client) {
  if (client.stage === 'request') return 'none';
  if (client.stage === 'agreement') return client.agreementSent ? 'sent' : 'draft';
  return 'active';
}

// Money sits in three places on this board and they are not the same thing:
// held against a visit that has not happened, sent and inside the family's
// 24 hours, and actually paid. Telling them apart is most of the point.
//
// Nothing is asked of the family in that window — the charge goes through on
// its own. What they have is the right to stop it, which is why this is
// "clearing" and not "awaiting approval".
export const heldFor = (client) =>
  client.plan?.sentOn ? totalsFor(client.plan.hours, client.rate).charged : 0;

export const awaitingFor = (client) =>
  (client.visits || [])
    .filter((v) => v.status === 'awaiting')
    .reduce((sum, v) => sum + totalsFor(v.hours, client.rate).net, 0);

// What each column is worth to her, which is not the same question as how many
// cards are in it.
export function boardSummary(list) {
  const at = (stage) => list.filter((c) => c.stage === stage);
  const requests = at('request');
  const toSend = at('agreement').filter((c) => !c.agreementSent);
  const workOrders = at('work-order');
  const awaitingVisits = list.flatMap((c) =>
    (c.visits || []).filter((v) => v.status === 'awaiting').map((v) => v.confirmsInHours ?? Infinity)
  );

  return {
    requests: requests.length,
    // the oldest request is the one that makes waiting look like being ignored
    oldestRequest: requests.reduce(
      (worst, c) => Math.max(worst, c.waitingDays ? c.waitingDays * 24 : c.waitingHours || 0),
      0
    ),
    toSend: toSend.length,
    active: at('active').length,
    workOrders: workOrders.length,
    // money she has done the work for and not yet asked for
    unbilled: workOrders.reduce((sum, c) => sum + workOrderTotals(c).net, 0),
    // sent, and inside the family's window to confirm
    awaiting: list.reduce((sum, c) => sum + awaitingFor(c), 0),
    soonestConfirm: awaitingVisits.length ? Math.min(...awaitingVisits) : Infinity,
    // pre-authorised against visits that have not happened yet
    held: list.reduce((sum, c) => sum + heldFor(c), 0),
    plansSent: list.filter((c) => c.plan?.sentOn).length,
  };
}
