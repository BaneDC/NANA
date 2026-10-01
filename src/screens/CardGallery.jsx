import { useMemo } from 'react';
import { buildPlan, caregivers } from '../data/carePlan';
import { demoAnswers, demoNotes, demoUser } from '../data/demoCase';
import { reconcile } from '../data/dependencies';
import { planEntries, seedThreads } from '../data/threads';
import { startCare } from '../data/familyStart';
import Button from '../components/Button';
import Dashboard from './Dashboard';
import CaregiverPage from './CaregiverPage';
import VisitsPage from './VisitsPage';
import RequestsPage from './RequestsPage';
import FindCaregiver from './FindCaregiver';
import PlanDetail from './PlanDetail';
import Plans from './Plans';
import Settings from './Settings';
import Profile from './Profile';
import CaregiverApp from './caregiver/CaregiverApp';

// Every card the platform has, on one page, for comparing them side by side:
// /?kartice, or "Sve kartice" under the sign-in. Nothing here is a copy — each
// section renders the real screen with sample data that puts every card in
// every state it has (each visit status, new terms, an ended collaboration,
// each answer to a request). Buttons do nothing.

const noop = () => {};
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
  done: ['personal-care', 'meals', 'walks'],
  ...over,
});

function sampleCare() {
  const sanna = pick('sanna');
  const paivi = pick('paivi');
  const tuula = pick('tuula');
  const terms = (version, status, over = {}) => ({
    version,
    status,
    services: ['personal-care', 'meals', 'housekeeping', 'walks'],
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
    services: ['personal-care', 'meals', 'housekeeping', 'walks'],
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
      { caregiverId: 'riitta', status: 'pending', requested: 'juče', message: 'Da li biste mogli vikendom?', detail: '' },
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
        ],
      },
      {
        caregiver: person(paivi),
        since: '22. jula',
        endedOn: null,
        versions: [terms(1, 'active', { rate: 16 }), terms(2, 'sent', { rate: 17, hours: 12, sentOn: 'juče', note: 'Mogla bih da dolazim i utorkom.' })],
        visits: [visit('g-p-paid', '6. avgusta', 'paid', { rate: 16, report: report(), confirmed: 'you', chargedOn: '7. avgusta' })],
      },
      {
        caregiver: person(tuula),
        since: '1. jula',
        endedOn: '20. jula',
        versions: [terms(1, 'active', { rate: 19 })],
        visits: [visit('g-t-paid', '15. jula', 'paid', { rate: 19, report: report(), confirmed: 'auto', chargedOn: '16. jula' })],
      },
    ],
  };
}

const SECTIONS = [
  { id: 'moja-nega', title: 'Moja nega', where: 'Čeka na vas, Predstoji, poslednja poseta, Vaše negovateljice, Vaši upiti' },
  { id: 'prvi-korak', title: 'Moja nega, pre prvog upita', where: 'Sledeći korak' },
  { id: 'njena-stranica', title: 'Njena stranica', where: 'Predstoji, Ugovor o nezi, Ukratko, Posete (svaki status)' },
  { id: 'nove-uslove', title: 'Njena stranica, novi uslovi čekaju', where: 'Čeka na vas, Novi uslovi' },
  { id: 'zavrsena', title: 'Njena stranica, završena saradnja', where: 'Završeno, ugovor koji više ne važi' },
  { id: 'posete', title: 'Sve posete', where: 'Posete po mesecima' },
  { id: 'upiti', title: 'Vaši upiti', where: 'Upit: čeka, prihvaćen, odbijen' },
  { id: 'pronadji', title: 'Pronađi negovateljicu', where: 'Kartica negovateljice: dugme, već dolazi, čeka odgovor, ne može' },
  { id: 'plan', title: 'Plan nege', where: 'Minnino pismo, preporuke, partneri, negovateljice' },
  { id: 'planovi', title: 'Planovi nege', where: 'Lista planova' },
  { id: 'podesavanja', title: 'Podešavanja', where: 'Plaćanje, Bezbednost, Opšte, Privatnost i nalog' },
  { id: 'profil', title: 'Profil', where: 'O kome brinemo, Glavni kontakt, Čemu se nadate' },
  { id: 'negovateljica', title: 'Strana negovateljice', where: 'Tabla i klijent (klik na karticu na tabli)' },
];

function Frame({ id, title, where, tall, children }) {
  return (
    <section className="gallery-section" id={id}>
      <div className="gallery-section-head">
        <h2 className="doc-section-title">{title}</h2>
        <p className="tip-body">{where}</p>
      </div>
      <div className={`gallery-frame${tall ? ' is-tall' : ''}`}>{children}</div>
    </section>
  );
}

export default function CardGallery() {
  const care = useMemo(sampleCare, []);
  const answers = useMemo(() => reconcile({}, demoAnswers).answers, []);
  const plan = useMemo(() => buildPlan(answers, demoNotes), [answers]);
  const entries = useMemo(
    () => planEntries({ plan, threads: seedThreads, caregiverCount: caregivers.length, today: '1. oktobra 2026.' }),
    [plan]
  );
  const live = entries.find((e) => e.id === 'live') || entries[0];
  const user = { ...demoUser };
  const subscription = { planId: 'monthly', at: Date.now() };
  const family = { onDrawer: noop, onCare: noop, onFlash: noop };

  return (
    <div className="gallery">
      <header className="gallery-head">
        <div>
          <h1 className="view-title">Sve kartice</h1>
          <p className="view-sub">
            Prave komponente aplikacije sa primerom podataka u kom je svaka kartica u svakom stanju. Dugmad ovde ne rade
            ništa. Za telefon otvorite stranicu na telefonu ili suzite prozor.
          </p>
        </div>
        <Button variant="secondary" onClick={() => (window.location.href = '/')}>
          Nazad na prijavu
        </Button>
      </header>

      <nav className="gallery-toc" aria-label="Delovi">
        {SECTIONS.map((s) => (
          <a key={s.id} className="svc is-sm" href={`#${s.id}`}>
            {s.title}
          </a>
        ))}
      </nav>

      <Frame {...SECTIONS[0]}>
        <Dashboard care={care} user={user} plan={plan} onDrawer={noop} onCaregiver={noop} onView={noop} onAskAssistant={noop} onFindCaregiver={noop} />
      </Frame>
      <Frame {...SECTIONS[1]}>
        <Dashboard care={startCare(user)} user={user} plan={plan} onDrawer={noop} onCaregiver={noop} onView={noop} onAskAssistant={noop} onFindCaregiver={noop} />
      </Frame>
      <Frame {...SECTIONS[2]}>
        <CaregiverPage care={care} caregiverId="sanna" onBack={noop} {...family} />
      </Frame>
      <Frame {...SECTIONS[3]}>
        <CaregiverPage care={care} caregiverId="paivi" onBack={noop} {...family} />
      </Frame>
      <Frame {...SECTIONS[4]}>
        <CaregiverPage care={care} caregiverId="tuula" onBack={noop} {...family} />
      </Frame>
      <Frame {...SECTIONS[5]}>
        <VisitsPage care={care} onDrawer={noop} onBack={noop} />
      </Frame>
      <Frame {...SECTIONS[6]}>
        <RequestsPage care={care} onCaregiver={noop} onFind={noop} />
      </Frame>
      <Frame {...SECTIONS[7]}>
        <FindCaregiver care={care} onContact={noop} onDrawer={noop} onFlash={noop} onAskAssistant={noop} />
      </Frame>
      <Frame {...SECTIONS[8]}>
        <PlanDetail
          entry={live}
          unlocked
          onBack={noop}
          onSelectCaregiver={noop}
          onOpenCaregiver={noop}
          onUnlock={noop}
          onAskAssistant={noop}
          onShare={noop}
          onUndoChange={noop}
          onDismissChange={noop}
          onFindCaregivers={noop}
        />
      </Frame>
      <Frame {...SECTIONS[9]}>
        <Plans entries={entries} onOpenPlan={noop} onGoToChat={noop} onNewPlan={noop} onAskAssistant={noop} />
      </Frame>
      <Frame {...SECTIONS[10]}>
        <Settings unlocked subscription={subscription} care={care} user={user} onCare={noop} onSaveUser={noop} onAskAssistant={noop} onSubscribe={noop} />
      </Frame>
      <Frame {...SECTIONS[11]}>
        <Profile user={user} answers={answers} onGoToChat={noop} onAskAssistant={noop} onSaveUser={noop} onEditAnswers={noop} />
      </Frame>
      <Frame {...SECTIONS[12]} tall>
        <CaregiverApp user={{ name: 'Sanna Virtanen', email: 'sanna@mail.com', role: 'caregiver' }} />
      </Frame>
    </div>
  );
}
