import { useMemo, useState } from 'react';
import { useKept } from '@/hooks/use-kept';
import FamilyDrawer from '../components/family/FamilyDrawer';
import { buildPlan, caregivers } from '../data/carePlan';
import { demoAnswers, demoNotes, demoUser } from '../data/demoCase';
import { reconcile } from '../data/dependencies';
import { planEntries } from '../data/threads';
import { startCare } from '../data/familyStart';
import { dateText, standingWith } from '../data/familyCare';
import { Button } from '@/components/ui/button';
import { toggleVariants } from '@/components/ui/toggle';
import { PageDescription, PageTitle } from '@/components/page';
import { cn } from '@/lib/utils';
import Dashboard from './Dashboard';
import CaregiverPage from './CaregiverPage';
import VisitsPage from './VisitsPage';
import RequestsPage from './RequestsPage';
import FindCaregiver from './FindCaregiver';
import PlanDetail, { NoPlan } from './PlanDetail';
import Settings from './Settings';
import Profile from './Profile';
import CaregiverApp from './caregiver/CaregiverApp';

// Every card the platform has, on one page, for comparing them side by side:
// /?kartice, or "Sve kartice" under the sign-in. Nothing here is a copy — each
// section renders the real screen with sample data that puts every card in
// every state it has (each visit status, new terms, an ended collaboration,
// each answer to a request). Buttons do nothing.

const noop = () => {};

// what her agreement covers, in the catalog's terms
const SERVICES = ['hygiene', 'dressing', 'food-preparation', 'light-cleaning', 'walks', 'companionship'];
const pick = (id) => caregivers.find((c) => c.id === id);

const person = (c) => ({
  id: c.id,
  name: c.name,
  initials: c.initials,
  phone: c.phone,
  area: c.area,
  radius: c.radius,
  classifications: c.classifications,
  rating: c.rating,
  reviews: c.reviews,
  bio: c.bio,
});

const report = (over = {}) => ({
  hours: 3,
  mood: 'good',
  eating: 'usual',
  moving: 'usual',
  note: 'Prošetale smo do parka, ručala je sve. Raspoložena, pričala o unucima.',
  done: ['hygiene', 'food-preparation', 'walks'],
  ...over,
});

export function sampleCare() {
  const sanna = pick('sanna');
  const paivi = pick('paivi');
  const tuula = pick('tuula');
  const terms = (version, status, over = {}) => ({
    version,
    status,
    services: SERVICES,
    rate: 18,
    hours: 9,
    schedule: 'pon, sre, pet · 09:00–12:00',
    sentOn: '20. jula',
    agreedOn: '21. jula',
    ...over,
  });
  const visit = (id, date, status, over = {}) => ({
    id,
    date,
    time: '09:00–12:00',
    hours: 3,
    rate: 18,
    services: SERVICES,
    status,
    sentOn: 'juče',
    ...over,
  });
  return {
    ...startCare(demoUser),
    family: { name: 'Anna Korhonen', relation: 'ćerka' },
    elder: { name: 'Aino Korhonen', area: 'Töölö' },
    payment: { connected: true, brand: 'Visa', last4: '4242', connectedOn: '20. jula' },
    requests: [
      { caregiverId: 'sanna', status: 'accepted', requested: '19. jula', message: 'Treba nam pomoć ujutru, tri puta nedeljno.', detail: 'Prihvatila je i poslala svoje uslove.' },
      { caregiverId: 'paivi', status: 'accepted', requested: '19. jula', message: 'Treba nam pomoć ujutru, tri puta nedeljno.', detail: 'Prihvatila je i poslala svoje uslove.' },
      { caregiverId: 'liisa', status: 'declined', requested: '19. jula', message: 'Treba nam pomoć ujutru, tri puta nedeljno.', detail: 'Ponedeljkom i četvrtkom je zauzeta kod druge porodice do oktobra.' },
      { id: 'tuula-2', caregiverId: 'tuula', status: 'pending', requested: 'juče', again: true, message: 'Treba nam ponovo pomoć ujutru.', detail: 'Još nije odgovorila. Javićemo vam u svakom slučaju.' },
      { caregiverId: 'riitta', status: 'accepted', requested: '8. avgusta', message: 'Da li biste mogli vikendom?', detail: 'Prihvatila je. Uslove šalje uskoro.' },
      { caregiverId: 'anneli', status: 'accepted', requested: '7. avgusta', message: 'Treba nam pomoć ujutru, tri puta nedeljno.', detail: 'Prihvatila je. Uslove šalje uskoro.' },
      { caregiverId: 'johanna', status: 'pending', requested: 'juče', message: 'Da li biste mogli vikendom?', detail: 'Još nije odgovorila. Javićemo vam u svakom slučaju.' },
      { id: 'tuula-1', caregiverId: 'tuula', status: 'accepted', requested: '28. juna', message: 'Treba nam pomoć ujutru.', detail: 'Prihvatila je i poslala svoje uslove.' },
    ],
    arrangements: [
      {
        caregiver: person(sanna),
        since: '21. jula',
        endedOn: null,
        versions: [terms(1, 'active')],
        visits: [
          visit('g-planned', 'Sutra', 'planned', { dueInHours: 20, notes: 'Doneću spisak za nabavku.' }),
          visit('g-charging', 'Juče', 'charging', { report: report(), chargesInHours: 3, sentOn: 'juče u 13:10' }),
          visit('g-awaiting', 'Danas', 'awaiting'),
          visit('g-disputed', '7. avgusta', 'disputed', { report: report({ hours: 2 }), queryReason: 'Ostala je dva sata, ne tri.' }),
          visit('g-paid-you', '5. avgusta', 'paid', { report: report({ mood: 'usual' }), confirmed: 'you', chargedOn: '6. avgusta' }),
          visit('g-paid-auto', '3. avgusta', 'paid', { report: report({ mood: 'low', concern: 'Žalila se na koleno.' }), confirmed: 'auto', chargedOn: '4. avgusta' }),
          visit('g-cancelled', '31. jula', 'cancelled', { cancelledBy: 'family', cancelReason: 'Hitan slučaj u porodici' }),
          visit('g-extra', '2. avgusta', 'paid', { report: report({ hours: 4 }), extra: { hours: 1, status: 'asked' }, confirmed: 'auto', chargedOn: '3. avgusta' }),
          visit('g-less', '1. avgusta', 'paid', { report: report({ hours: 2, mood: 'low' }), confirmed: 'you', chargedOn: '1. avgusta' }),
          visit('g-resolved', '30. jula', 'paid', {
            report: report({ hours: 2 }),
            confirmed: 'coordinator',
            chargedOn: '31. jula',
            queryReason: 'Ostala je dva sata, ne tri.',
            resolution: { outcome: 'reduce', text: 'Koordinatorka je proverila: naplaćuje se 2 sata, 36 €.', on: '31. jula' },
          }),
          visit('g-cg-cancelled', '28. jula', 'cancelled', { cancelledBy: 'caregiver', cancelReason: 'Negovateljica je otkazala: bila sam bolesna' }),
          // enough of them that her page shows ten and "Prikaži još"
          ...['26. jula', '24. jula', '22. jula', '21. jula'].map((d, i) =>
            visit(`g-old-${i}`, d, 'paid', { report: report(), confirmed: i % 2 ? 'auto' : 'you', chargedOn: d })
          ),
        ],
      },
      {
        caregiver: person(paivi),
        since: '22. jula',
        endedOn: null,
        versions: [
          terms(1, 'active', { rate: 16 }),
          terms(2, 'sent', {
            rate: 17,
            hours: 12,
            sentOn: 'juče',
            services: [...SERVICES, 'grocery-shopping'],
            note: 'Mogla bih da dolazim i utorkom, i da usput uradim nabavku.',
            terms: 'Ključ ostaje kod komšinice u stanu 4.',
          }),
        ],
        visits: [visit('g-p-paid', '6. avgusta', 'paid', { rate: 16, report: report(), confirmed: 'you', chargedOn: '7. avgusta' })],
      },
      {
        caregiver: person(tuula),
        since: '1. jula',
        endedOn: '20. jula',
        versions: [terms(1, 'ended', { rate: 19 })],
        visits: [visit('g-t-paid', '15. jula', 'paid', { rate: 19, report: report(), confirmed: 'auto', chargedOn: '16. jula' })],
      },
      // accepted, her terms not sent yet
      { caregiver: person(pick('riitta')), since: null, endedOn: null, versions: [], visits: [] },
      // her terms were declined, nothing in force
      {
        caregiver: person(pick('anneli')),
        since: null,
        endedOn: null,
        versions: [terms(1, 'declined', { rate: 14, declinedOn: '9. avgusta' })],
        visits: [],
      },
    ],
    now: 8,
    log: [
      { id: 'l9', at: 8, kind: 'visit', caregiverId: 'sanna', by: 'caregiver', title: 'Stigao je plan posete', detail: 'Sutra · 09:00–12:00. 54 € je rezervisano na kartici.' },
      { id: 'l8', at: 7, kind: 'agreement', caregiverId: 'paivi', by: 'caregiver', title: 'Stigli su novi uslovi, verzija 2', detail: '17 € na sat, 7 usluga.' },
      { id: 'l7', at: -10, kind: 'visit', caregiverId: 'sanna', by: 'caregiver', title: 'Stigao je radni nalog', detail: 'Juče · 3 sata. Naplaćuje se za 24 sata, osim ako nešto prijavite.' },
      { id: 'l6', at: -14, kind: 'request', caregiverId: 'tuula', by: 'you', title: 'Ponovo ste joj pisali', detail: 'Treba nam ponovo pomoć ujutru.' },
      { id: 'l5', at: -40, kind: 'agreement', caregiverId: 'anneli', by: 'you', title: 'Odbili ste uslove, verzija 1', detail: 'Koordinatorka će vas pozvati.' },
      { id: 'l4', at: -60, kind: 'money', caregiverId: 'sanna', by: 'coordinator', title: 'Prijava je rešena', detail: 'Koordinatorka je proverila: naplaćuje se 2 sata, 36 €.' },
      { id: 'l3', at: -200, kind: 'money', caregiverId: 'sanna', by: 'you', title: 'Plaćeno 54 €', detail: 'Radni nalog za 5. avgusta je potvrđen.' },
      { id: 'l2', at: -500, kind: 'money', by: 'you', title: 'Kartica je dodata', detail: 'Visa ···· 4242. Posete sada mogu da se rezervišu.' },
      { id: 'l1', at: -520, kind: 'request', caregiverId: 'sanna', by: 'you', title: 'Poslali ste upit', detail: 'Treba nam pomoć ujutru, tri puta nedeljno.' },
    ],
  };
}

// The same family a year on: enough visits and events that every long list
// shows its first few and "Prikaži još" (docs/patterns.md §8a).
function longCare() {
  const c = sampleCare();
  const a = c.arrangements[0];
  const paid = a.visits.find((v) => v.id === 'g-old-0');
  const planned = a.visits.find((v) => v.id === 'g-planned');
  const coming = [2, 4, 7, 9, 11, 14].map((d, i) => ({ ...planned, id: `g-long-plan-${i}`, date: dateText(d), notes: undefined }));
  const past = Array.from({ length: 36 }, (_, i) => ({ ...paid, id: `g-long-${i}`, date: dateText(-30 - i * 3), chargedOn: dateText(-29 - i * 3) }));
  const log = Array.from({ length: 30 }, (_, i) => ({
    id: `l-long-${i}`,
    at: -700 - i * 72,
    kind: 'money',
    caregiverId: 'sanna',
    by: i % 2 ? 'caregiver' : 'you',
    title: i % 2 ? 'Stigao je radni nalog' : 'Plaćeno 54 €',
    detail: 'Poseta od 3 sata.',
  }));
  return {
    ...c,
    arrangements: [{ ...a, visits: [...a.visits, ...coming, ...past] }, ...c.arrangements.slice(1)],
    log: [...c.log, ...log],
  };
}

// A family that has asked and has nobody coming yet: two requests waiting, or
// both answered no.
function askedCare(status) {
  const base = startCare(demoUser);
  const req = (caregiverId, requested) => ({
    caregiverId,
    status,
    requested,
    message: 'Treba nam pomoć ujutru, tri puta nedeljno.',
    detail: status === 'pending' ? 'Još nije odgovorila. Javićemo vam u svakom slučaju.' : 'Ponedeljkom i četvrtkom je zauzeta kod druge porodice do oktobra.',
  });
  return { ...base, requests: [req('sanna', 'juče'), req('paivi', 'danas')] };
}

const SECTIONS = [
  { id: 'moja-nega', title: 'Moja nega', where: 'Čeka na vas, Predstoji, poslednja poseta, Vaše negovateljice' },
  { id: 'prvi-korak', title: 'Moja nega, pre prvog upita', where: 'Sledeći korak' },
  { id: 'upit-poslat', title: 'Moja nega, upit poslat', where: 'Čeka se odgovor, pa „Pogledaj upite"' },
  { id: 'svi-odbili', title: 'Moja nega, svi su odbili', where: 'Stigli su odgovori, pa „Pogledaj upite"' },
  { id: 'njena-stranica', title: 'Njena stranica', where: 'Čeka na vas, Ugovor o nezi, Ukratko, Posete (svaki status, 10 pa „Prikaži još")' },
  { id: 'nove-uslove', title: 'Njena stranica, novi uslovi čekaju', where: 'Čeka na vas, Novi uslovi' },
  { id: 'zavrsena', title: 'Njena stranica, završena saradnja', where: 'Ponovni upit poslat, ugovor koji više ne važi' },
  { id: 'bez-ugovora', title: 'Njena stranica, prihvatila bez ugovora', where: 'Prihvatila je, ugovor stiže' },
  { id: 'odbijeni-uslovi', title: 'Njena stranica, odbijeni uslovi', where: 'Uslovi su odbijeni, verzija 1 odbijena' },
  { id: 'posete', title: 'Sve posete', where: 'Posete po mesecima' },
  { id: 'duge-liste', title: 'Duge liste', where: 'Godinu dana kasnije: Predstoji 3, Sve posete, njena stranica i „Šta se desilo" po 10, svaki sa „Prikaži još"' },
  { id: 'upiti', title: 'Moji upiti', where: 'Upit: čeka, prihvaćen, odbijen' },
  { id: 'upiti-prazno', title: 'Moji upiti, prazno', where: 'Još nijedan upit: sledeći korak kao na Mojoj nezi' },
  { id: 'pronadji', title: 'Pronađi negovateljicu', where: 'Kartica negovateljice: dugme, već dolazi, ugovor čeka, upit poslat, prihvatila, odbila, dolazila ranije' },
  { id: 'plan', title: 'Plan nege', where: 'Minnino pismo, preporuke, partneri, negovateljice (sa stanjem: već dolazi, upit poslat)' },
  { id: 'plan-prazno', title: 'Plan nege, prazno', where: 'Još nema plana' },
  { id: 'podesavanja', title: 'Podešavanja', where: 'Plaćanje, Bezbednost, Opšte, Privatnost' },
  { id: 'profil', title: 'Profil', where: 'O kome brinemo, Glavni kontakt, Čemu se nadate' },
  { id: 'profil-prazno', title: 'Profil, prazno', where: 'Ovde još nema ničega' },
  { id: 'negovateljica', title: 'Strana negovateljice', where: 'Tabla i klijent (klik na karticu na tabli)' },
];

const S = (id) => SECTIONS.find((x) => x.id === id);

function Frame({ id, title, where, tall, children }) {
  return (
    // each screen in a frame of its own: r32, the container's shadow; the
    // caregiver's board in a fixed 860, scrolling
    <section className="flex scroll-mt-6 flex-col gap-3" id={id}>
      <div>
        <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">{title}</h2>
        <p className="text-xs leading-body text-muted-foreground">{where}</p>
      </div>
      <div
        data-slot="gallery-frame"
        className={cn('overflow-hidden rounded-4xl bg-card shadow-container', tall && 'h-[860px] overflow-auto')}
      >
        {children}
      </div>
    </section>
  );
}

export default function CardGallery() {
  const care = useMemo(sampleCare, []);
  const answers = useMemo(() => reconcile({}, demoAnswers).answers, []);
  const plan = useMemo(() => buildPlan(answers, demoNotes), [answers]);
  const entries = useMemo(
    () => planEntries({ plan, caregiverCount: caregivers.length, today: '1. oktobra 2026.', answers, notes: demoNotes }),
    [plan]
  );
  const live = entries.find((e) => e.id === 'live') || entries[0];
  const user = { ...demoUser };
  const subscription = { planId: 'monthly', at: Date.now() };
  // Her page's drawers open here (the visits, the terms, the overview…), on
  // the sample data, read only: what is decided in them changes nothing.
  const [drawer, setDrawer] = useState(null);
  const shownDrawer = useKept(drawer);
  // which sample the open drawer reads: the usual one, or the year-on one
  const [drawerCare, setDrawerCare] = useState('sample');
  const long = useMemo(longCare, []);
  const family = { onDrawer: (d) => { setDrawerCare('sample'); setDrawer(d); }, onCare: noop, onFlash: noop };
  const familyLong = { onDrawer: (d) => { setDrawerCare('long'); setDrawer(d); }, onCare: noop, onFlash: noop };

  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto px-6 py-8 *:mx-auto *:w-full *:max-w-[960px] phone:p-4">
      <header className="flex items-start justify-between gap-4 phone:flex-col">
        <div>
          <PageTitle>Sve kartice</PageTitle>
          <PageDescription>
            Prave komponente aplikacije sa primerom podataka u kom je svaka kartica u svakom stanju. Draweri na njenoj stranici se
            otvaraju (npr. „Šta se desilo"), a ostala dugmad ne rade ništa. Za telefon otvorite stranicu na telefonu ili suzite prozor.
          </PageDescription>
        </div>
        <Button variant="secondary" onClick={() => (window.location.href = '/')}>
          Nazad na prijavu
        </Button>
      </header>

      {/* the parts, as chips */}
      <nav className="flex flex-wrap gap-2" aria-label="Delovi">
        {SECTIONS.map((s) => (
          <a key={s.id} className={cn(toggleVariants({ size: 'sm' }), 'no-underline')} href={`#${s.id}`}>
            {s.title}
          </a>
        ))}
      </nav>

      <Frame {...S('moja-nega')}>
        <Dashboard care={care} user={user} plan={plan} onDrawer={noop} onCaregiver={noop} onView={noop} onAskAssistant={noop} onFindCaregiver={noop} />
      </Frame>
      <Frame {...S('prvi-korak')}>
        <Dashboard care={startCare(user)} user={user} plan={plan} onDrawer={noop} onCaregiver={noop} onView={noop} onAskAssistant={noop} onFindCaregiver={noop} />
      </Frame>
      <Frame {...S('upit-poslat')}>
        <Dashboard care={askedCare('pending')} user={user} plan={plan} onDrawer={noop} onCaregiver={noop} onView={noop} onAskAssistant={noop} onFindCaregiver={noop} />
      </Frame>
      <Frame {...S('svi-odbili')}>
        <Dashboard care={askedCare('declined')} user={user} plan={plan} onDrawer={noop} onCaregiver={noop} onView={noop} onAskAssistant={noop} onFindCaregiver={noop} />
      </Frame>
      <Frame {...S('njena-stranica')}>
        <CaregiverPage care={care} caregiverId="sanna" onBack={noop} {...family} />
      </Frame>
      <Frame {...S('nove-uslove')}>
        <CaregiverPage care={care} caregiverId="paivi" onBack={noop} {...family} />
      </Frame>
      <Frame {...S('zavrsena')}>
        <CaregiverPage care={care} caregiverId="tuula" onBack={noop} {...family} />
      </Frame>
      <Frame {...S('bez-ugovora')}>
        <CaregiverPage care={care} caregiverId="riitta" onBack={noop} {...family} />
      </Frame>
      <Frame {...S('odbijeni-uslovi')}>
        <CaregiverPage care={care} caregiverId="anneli" onBack={noop} {...family} />
      </Frame>
      <Frame {...S('posete')}>
        <VisitsPage care={care} onDrawer={noop} onBack={noop} />
      </Frame>
      <Frame {...S('duge-liste')}>
        <Dashboard care={long} user={user} plan={plan} onDrawer={noop} onCaregiver={noop} onView={noop} onAskAssistant={noop} onFindCaregiver={noop} />
        <VisitsPage care={long} onDrawer={noop} onBack={noop} />
        <CaregiverPage care={long} caregiverId="sanna" onBack={noop} {...familyLong} />
      </Frame>
      <Frame {...S('upiti')}>
        <RequestsPage care={care} onCaregiver={noop} onFind={noop} />
      </Frame>
      <Frame {...S('upiti-prazno')}>
        <RequestsPage care={startCare(user)} onCaregiver={noop} onFind={noop} />
      </Frame>
      <Frame {...S('pronadji')}>
        <FindCaregiver care={care} onContact={noop} onDrawer={noop} onFlash={noop} />
      </Frame>
      <Frame {...S('plan')}>
        <PlanDetail
          entry={live}
          unlocked
          onSelectCaregiver={noop}
          onOpenCaregiver={noop}
          onUnlock={noop}
          onAskAssistant={noop}
          onShare={noop}
          onUndoChange={noop}
          onDismissChange={noop}
          onFindCaregivers={noop}
          standingOf={(id) => standingWith(care, id)}
        />
      </Frame>
      <Frame {...S('plan-prazno')}>
        <NoPlan onGoToChat={noop} />
      </Frame>
      <Frame {...S('podesavanja')}>
        <Settings unlocked subscription={subscription} care={care} user={user} onCare={noop} onSaveUser={noop} onSubscribe={noop} />
      </Frame>
      <Frame {...S('profil')}>
        <Profile user={user} answers={answers} care={care} onGoToChat={noop} onSaveUser={noop} onEditAnswers={noop} onFlash={noop} />
      </Frame>
      <Frame {...S('profil-prazno')}>
        <Profile user={user} answers={{}} onGoToChat={noop} onSaveUser={noop} onEditAnswers={noop} />
      </Frame>
      <Frame {...S('negovateljica')} tall>
        <CaregiverApp user={{ name: 'Sanna Virtanen', email: 'sanna@mail.com', role: 'caregiver' }} />
      </Frame>

      {shownDrawer && (
        <FamilyDrawer
          key={`${shownDrawer.kind}-${shownDrawer.caregiverId || shownDrawer.visitId}`}
          drawer={shownDrawer}
          open={Boolean(drawer)}
          care={drawerCare === 'long' ? long : care}
          unlocked
          onCare={noop}
          onFlash={noop}
          onClose={() => setDrawer(null)}
          onOpen={setDrawer}
          onContact={noop}
          onCaregiver={noop}
        />
      )}
    </div>
  );
}
