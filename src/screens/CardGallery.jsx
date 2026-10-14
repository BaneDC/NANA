import { useMemo, useState } from 'react';
import { useKept } from '@/hooks/use-kept';
import FamilyDrawer from '../components/family/FamilyDrawer';
import { buildPlan, caregivers } from '../data/carePlan';
import { demoAnswers, demoNotes, demoUser } from '../data/demoCase';
import { reconcile } from '../data/dependencies';
import { startCare } from '../data/familyStart';
import { startRecord } from '../data/record';
import { dateText, hoursSaid, relanguage, servicesSaid, standingWith } from '../data/familyCare';
import { Button } from '@/components/ui/button';
import { toggleVariants } from '@/components/ui/toggle';
import { PageDescription, PageTitle } from '@/components/page';
import { cn } from '@/lib/utils';
import { getLang, msg, say, t, useLang } from '../i18n';
import Dashboard from './Dashboard';
import CaregiverPage from './CaregiverPage';
import RequestsPage from './RequestsPage';
import FindCaregiver from './FindCaregiver';
import Settings from './Settings';
import MedicalRecord from './MedicalRecord';
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

// what the coordinator settled, and a visit paid, as the app writes them
const RESOLVED = say('Koordinatorka je proverila: naplaćuje se {hours}, {amount}.', { hours: hoursSaid(2), amount: { $eur: 36 } });
const PAID_54 = say('Plaćeno {amount}', { amount: { $eur: 54 } });

const report = (over = {}) => ({
  hours: 3,
  mood: 'good',
  eating: 'usual',
  moving: 'usual',
  note: msg('Prošetale smo do parka, ručala je sve. Raspoložena, pričala o unucima.'),
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
    schedule: msg('pon, sre, pet · 09:00–12:00'),
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
    sentOn: msg('juče'),
    ...over,
  });
  return {
    ...startCare(demoUser),
    family: { name: 'Anna Korhonen', relation: msg('ćerka') },
    elder: { name: 'Aino Korhonen', area: 'Töölö' },
    payment: { connected: true, brand: 'Visa', last4: '4242', expires: '11/2028', connectedOn: '20. jula' },
    requests: [
      { caregiverId: 'sanna', status: 'accepted', requested: '19. jula', message: msg('Treba nam pomoć ujutru, tri puta nedeljno.'), detail: msg('Prihvatila je i poslala svoje uslove.') },
      { caregiverId: 'paivi', status: 'accepted', requested: '19. jula', message: msg('Treba nam pomoć ujutru, tri puta nedeljno.'), detail: msg('Prihvatila je i poslala svoje uslove.') },
      { caregiverId: 'liisa', status: 'declined', requested: '19. jula', message: msg('Treba nam pomoć ujutru, tri puta nedeljno.'), detail: msg('Ponedeljkom i četvrtkom je zauzeta kod druge porodice do oktobra.') },
      { id: 'tuula-2', caregiverId: 'tuula', status: 'pending', requested: msg('juče'), again: true, message: msg('Treba nam ponovo pomoć ujutru.'), detail: msg('Još nije odgovorila. Javićemo vam u svakom slučaju.') },
      { caregiverId: 'riitta', status: 'accepted', requested: '8. avgusta', message: msg('Da li biste mogli vikendom?'), detail: msg('Prihvatila je. Uslove šalje uskoro.') },
      { caregiverId: 'anneli', status: 'accepted', requested: '7. avgusta', message: msg('Treba nam pomoć ujutru, tri puta nedeljno.'), detail: msg('Prihvatila je. Uslove šalje uskoro.') },
      { caregiverId: 'johanna', status: 'pending', requested: msg('juče'), message: msg('Da li biste mogli vikendom?'), detail: msg('Još nije odgovorila. Javićemo vam u svakom slučaju.') },
      { id: 'tuula-1', caregiverId: 'tuula', status: 'accepted', requested: '28. juna', message: msg('Treba nam pomoć ujutru.'), detail: msg('Prihvatila je i poslala svoje uslove.') },
    ],
    arrangements: [
      {
        caregiver: person(sanna),
        since: '21. jula',
        endedOn: null,
        versions: [terms(1, 'active')],
        visits: [
          // both booked: the first one's plan was seen, the one after it not
          // yet. A visit is planned for today or tomorrow at the latest (as in
          // her app), so the second is later today. Two plans at once break her
          // app's one-at-a-time rule, kept so the gallery shows both states.
          visit('g-planned', msg('Sutra'), 'planned', { dueInHours: 20, notes: msg('Doneću spisak za nabavku.'), planOk: true }),
          visit('g-to-confirm', msg('Danas'), 'planned', { time: '15:00–18:00', dueInHours: 7, sentOn: msg('danas') }),
          visit('g-charging', msg('Juče'), 'charging', { report: report(), chargesInHours: 3, sentOn: msg('juče u 13:10') }),
          visit('g-awaiting', msg('Danas'), 'awaiting'),
          visit('g-disputed', '7. avgusta', 'disputed', { report: report({ hours: 2 }), queryReason: msg('Ostala je dva sata, ne tri.') }),
          visit('g-paid-you', '5. avgusta', 'paid', { report: report({ mood: 'usual' }), confirmed: 'you', chargedOn: '6. avgusta' }),
          visit('g-paid-auto', '3. avgusta', 'paid', { report: report({ mood: 'low', concern: msg('Žalila se na koleno.') }), confirmed: 'auto', chargedOn: '4. avgusta' }),
          visit('g-cancelled', '31. jula', 'cancelled', { cancelledBy: 'family', cancelReason: msg('Hitan slučaj u porodici') }),
          visit('g-extra', '2. avgusta', 'paid', { report: report({ hours: 4 }), extra: { hours: 1, status: 'asked' }, confirmed: 'auto', chargedOn: '3. avgusta' }),
          visit('g-less', '1. avgusta', 'paid', { report: report({ hours: 2, mood: 'low' }), confirmed: 'you', chargedOn: '1. avgusta' }),
          visit('g-resolved', '30. jula', 'paid', {
            report: report({ hours: 2 }),
            confirmed: 'coordinator',
            chargedOn: '31. jula',
            queryReason: msg('Ostala je dva sata, ne tri.'),
            resolution: { outcome: 'reduce', text: RESOLVED, on: '31. jula' },
          }),
          visit('g-cg-cancelled', '28. jula', 'cancelled', { cancelledBy: 'caregiver', cancelReason: say('Negovateljica je otkazala: {reason}', { reason: { $fmt: 'lower', value: 'Bila sam bolesna' } }) }),
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
            sentOn: msg('juče'),
            services: [...SERVICES, 'grocery-shopping'],
            note: msg('Mogla bih da dolazim i utorkom, i da usput uradim nabavku.'),
            terms: msg('Ključ ostaje kod komšinice u stanu 4.'),
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
      { id: 'l9', at: 8, kind: 'visit', caregiverId: 'sanna', by: 'caregiver', title: msg('Stigao je plan posete'), detail: say('{date} · {time}. {amount} je rezervisano na kartici.', { date: say('Sutra'), time: '09:00–12:00', amount: { $eur: 54 } }) },
      { id: 'l8', at: 7, kind: 'agreement', caregiverId: 'paivi', by: 'caregiver', title: say('Stigli su novi uslovi, verzija {version}', { version: 2 }), detail: say('{rate} na sat, {services}.', { rate: { $eur: 17 }, services: servicesSaid(7) }) },
      { id: 'l7', at: -10, kind: 'visit', caregiverId: 'sanna', by: 'caregiver', title: msg('Stigao je radni nalog'), detail: say('{date} · {hours}. Naplaćuje se za 24 sata, osim ako nešto prijavite.', { date: say('Juče'), hours: hoursSaid(3) }) },
      { id: 'l6', at: -14, kind: 'request', caregiverId: 'tuula', by: 'you', title: msg('Ponovo ste joj pisali'), detail: msg('Treba nam ponovo pomoć ujutru.') },
      { id: 'l5', at: -40, kind: 'agreement', caregiverId: 'anneli', by: 'you', title: say('Odbili ste uslove, verzija {version}', { version: 1 }), detail: msg('Koordinatorka će vas pozvati.') },
      { id: 'l4', at: -60, kind: 'money', caregiverId: 'sanna', by: 'coordinator', title: msg('Prijava je rešena'), detail: RESOLVED },
      { id: 'l3', at: -200, kind: 'money', caregiverId: 'sanna', by: 'you', title: PAID_54, detail: say('Radni nalog za {date} je potvrđen.', { date: { $fmt: 'date', value: { text: '5. avgusta' } } }) },
      { id: 'l2', at: -500, kind: 'money', by: 'you', title: msg('Kartica je dodata'), detail: msg('Visa ···· 4242. Posete sada mogu da se rezervišu.') },
      { id: 'l1', at: -520, kind: 'request', caregiverId: 'sanna', by: 'you', title: msg('Poslali ste upit'), detail: msg('Treba nam pomoć ujutru, tri puta nedeljno.') },
    ],
  };
}

// The same family a year on: enough visits and events that every long list
// shows its first few and "Prikaži još" (docs/patterns.md §8a), and every card
// on the home its three and the button to the rest (§4a).
function longCare() {
  const c = sampleCare();
  const a = c.arrangements[0];
  const paid = a.visits.find((v) => v.id === 'g-old-0');
  const past = Array.from({ length: 36 }, (_, i) => ({ ...paid, id: `g-long-${i}`, date: dateText(-30 - i * 3), chargedOn: dateText(-29 - i * 3) }));
  const log = Array.from({ length: 30 }, (_, i) => ({
    id: `l-long-${i}`,
    at: -700 - i * 72,
    kind: 'money',
    caregiverId: 'sanna',
    by: i % 2 ? 'caregiver' : 'you',
    title: i % 2 ? msg('Stigao je radni nalog') : PAID_54,
    detail: msg('Poseta od 3 sata.'),
  }));
  return {
    ...c,
    arrangements: [{ ...a, visits: [...a.visits, ...past] }, ...c.arrangements.slice(1)],
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
    message: msg('Treba nam pomoć ujutru, tri puta nedeljno.'),
    detail:
      status === 'pending'
        ? msg('Još nije odgovorila. Javićemo vam u svakom slučaju.')
        : msg('Ponedeljkom i četvrtkom je zauzeta kod druge porodice do oktobra.'),
  });
  return { ...base, requests: [req('sanna', msg('juče')), req('paivi', msg('danas'))] };
}

const SECTIONS = [
  { id: 'moja-nega', title: msg('Moja nega'), where: msg('Pregled u mreži: Čeka na vas, tri broja (svaki svoja kartica), pa po dve kartice: Predstoji, Poslednja poseta, Vaše negovateljice, Ponude partnera (red otvara drawer ponude sa cenama), poruka koordinatorke (skupljena) i koordinatorka') },
  { id: 'prvi-korak', title: msg('Moja nega, pre prvog upita'), where: msg('Plan nege je ova stranica (svoju više nema): „Sledeći korak", Minnino pismo, preporuke, partneri, negovateljice') },
  { id: 'upit-poslat', title: msg('Moja nega, upit poslat'), where: msg('Čeka se odgovor, pa „Pogledaj upite"; ispod plan nege') },
  { id: 'svi-odbili', title: msg('Moja nega, svi su odbili'), where: msg('Stigli su odgovori, pa „Pogledaj upite"') },
  { id: 'njena-stranica', title: msg('Njena stranica'), where: msg('Čeka na vas, Ugovor o nezi, Ukratko, Posete (svaki status, 10 pa „Prikaži još")') },
  { id: 'nove-uslove', title: msg('Njena stranica, novi uslovi čekaju'), where: msg('Čeka na vas, Novi uslovi') },
  { id: 'zavrsena', title: msg('Njena stranica, završena saradnja'), where: msg('Ponovni upit poslat, ugovor koji više ne važi') },
  { id: 'bez-ugovora', title: msg('Njena stranica, prihvatila bez ugovora'), where: msg('Prihvatila je, ugovor stiže') },
  { id: 'odbijeni-uslovi', title: msg('Njena stranica, odbijeni uslovi'), where: msg('Uslovi su odbijeni, verzija 1 odbijena') },
  { id: 'posete', title: msg('Sve posete'), where: msg('Drawer sa početne: posete po mesecima. Otvara se dugmetom ispod, ili „Sve posete" na kartici „Poslednja poseta".') },
  { id: 'duge-liste', title: msg('Duge liste'), where: msg('Godinu dana kasnije. Na početnoj kartica pokazuje 3 reda, a dugme u glavi („Sve negovateljice", „Sve ponude") otvara drawer sa svima; Sve posete, njena stranica i „Šta se desilo" po 10, svaki sa „Prikaži još"') },
  { id: 'upiti', title: msg('Moji upiti'), where: msg('Upit: čeka, prihvaćen, odbijen') },
  { id: 'upiti-prazno', title: msg('Moji upiti, prazno'), where: msg('Još nijedan upit: sledeći korak kao na Mojoj nezi') },
  { id: 'pronadji', title: msg('Pronađi negovateljicu'), where: msg('Kartica negovateljice: dugme, već dolazi, ugovor čeka, upit poslat, prihvatila, odbila, dolazila ranije') },
  { id: 'podesavanja', title: msg('Podešavanja'), where: msg('Nalog, Plaćanje, Bezbednost, Opšte, Privatnost') },
  { id: 'podesavanja-paket', title: msg('Podešavanja, prelazak na drugi paket'), where: msg('Pretplata: Basic, od obnove Premium') },
  { id: 'podesavanja-kartica', title: msg('Podešavanja, kartica odbijena'), where: msg('Pretplata nije plaćena, Način plaćanja traži novu karticu') },
  { id: 'karton', title: msg('Medicinski karton'), where: msg('Skala krhkosti, delovi iz odgovora, zdravlje (redovi), gde živi, istorija sa zapažanjima sa poseta; dijalozi izmene se otvaraju') },
  { id: 'karton-prazno', title: msg('Medicinski karton, prazno'), where: msg('Kartona još nema') },
  { id: 'negovateljica', title: msg('Strana negovateljice'), where: msg('Tabla i klijent (klik na karticu na tabli)') },
];

const S = (id) => SECTIONS.find((x) => x.id === id);

function Frame({ id, title, where, tall, children }) {
  return (
    // each screen in a frame of its own: r32, the container's shadow; the
    // caregiver's board in a fixed 860, scrolling
    <section className="flex scroll-mt-6 flex-col gap-3" id={id}>
      <div>
        <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">{t(title)}</h2>
        <p className="text-xs leading-body text-muted-foreground">{t(where)}</p>
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
  // the sample's dates are written in Serbian; in another language they are
  // said again in it, as the app does after a switch (relanguage)
  const lang = useLang();
  const inLang = (c) => (getLang() === 'sr' ? c : relanguage(c));
  const care = useMemo(() => inLang(sampleCare()), [lang]);
  const answers = useMemo(() => reconcile({}, demoAnswers).answers, []);
  const plan = useMemo(() => buildPlan(answers, demoNotes), [answers]);
  const user = { ...demoUser };
  const record = useMemo(() => startRecord(true), []);
  // what the home reads beside the care: the plan's own actions
  const home = { unlocked: true, onCare: noop, onFlash: noop, onDrawer: noop, onCaregiver: noop, onView: noop, onAskAssistant: noop, onFindCaregiver: noop, onSelectCaregiver: noop, onOpenCaregiver: noop, onUnlock: noop, onUndoChange: noop, onDismissChange: noop, standingOf: () => null };
  const subscription = { planId: 'monthly', at: Date.now() };
  // Her page's drawers open here (the visits, the terms, the overview…), on
  // the sample data, read only: what is decided in them changes nothing.
  const [drawer, setDrawer] = useState(null);
  const shownDrawer = useKept(drawer);
  // which sample the open drawer reads: the usual one, or the year-on one
  const [drawerCare, setDrawerCare] = useState('sample');
  const long = useMemo(() => inLang(longCare()), [lang]);
  // the same plan with more from the partners than a card on the home shows
  const longPlan = useMemo(() => {
    const offers = plan.recommendations.filter((r) => r.kind === 'offer');
    const more = [msg('Kontrolni pregled'), msg('Rukohvati u kupatilu'), msg('Šetalica')].map((title, i) => ({
      ...offers[i % offers.length],
      id: `g-long-offer-${i}`,
      title,
    }));
    return { ...plan, recommendations: [...plan.recommendations, ...more] };
  }, [plan]);
  const family = { onDrawer: (d) => { setDrawerCare('sample'); setDrawer(d); }, onCare: noop, onFlash: noop };
  const familyLong = { onDrawer: (d) => { setDrawerCare('long'); setDrawer(d); }, onCare: noop, onFlash: noop };

  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto px-6 py-8 *:mx-auto *:w-full *:max-w-[960px] phone:p-4">
      <header className="flex items-start justify-between gap-4 phone:flex-col">
        <div>
          <PageTitle>{t('Sve kartice')}</PageTitle>
          <PageDescription>
            {t(
              'Prave komponente aplikacije sa primerom podataka u kom je svaka kartica u svakom stanju. Draweri na njenoj stranici se otvaraju (npr. „Šta se desilo"), a ostala dugmad ne rade ništa. Za telefon otvorite stranicu na telefonu ili suzite prozor.'
            )}
          </PageDescription>
        </div>
        <Button variant="secondary" onClick={() => (window.location.href = '/')}>
          {t('Nazad na prijavu')}
        </Button>
      </header>

      {/* the parts, as chips */}
      <nav className="flex flex-wrap gap-2" aria-label={t('Delovi')}>
        {SECTIONS.map((s) => (
          <a key={s.id} className={cn(toggleVariants({ size: 'sm' }), 'no-underline')} href={`#${s.id}`}>
            {t(s.title)}
          </a>
        ))}
      </nav>

      <Frame {...S('moja-nega')}>
        {/* its drawers open here too (every visit, a visit's plan), on the sample */}
        <Dashboard care={care} user={user} plan={plan} {...home} {...family} />
      </Frame>
      <Frame {...S('prvi-korak')}>
        <Dashboard care={startCare(user)} user={user} plan={plan} {...home} />
      </Frame>
      <Frame {...S('upit-poslat')}>
        <Dashboard care={askedCare('pending')} user={user} plan={plan} {...home} />
      </Frame>
      <Frame {...S('svi-odbili')}>
        <Dashboard care={askedCare('declined')} user={user} plan={plan} {...home} />
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
        {/* a drawer, so it is opened here rather than laid out */}
        <div className="flex flex-wrap gap-2 p-4">
          <Button variant="secondary" onClick={() => family.onDrawer({ kind: 'visits' })}>
            {t('Sve posete')}
          </Button>
          <Button variant="secondary" onClick={() => familyLong.onDrawer({ kind: 'visits' })}>
            {t('Sve posete, godinu dana kasnije')}
          </Button>
        </div>
      </Frame>
      <Frame {...S('duge-liste')}>
        <Dashboard care={long} user={user} plan={longPlan} {...home} {...familyLong} />
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
      <Frame {...S('podesavanja')}>
        <Settings unlocked subscription={subscription} care={care} user={user} onCare={noop} onSaveUser={noop} onSubscribe={noop} />
      </Frame>
      <Frame {...S('podesavanja-paket')}>
        <Settings unlocked subscription={{ ...subscription, nextPlanId: 'quarterly' }} care={care} user={user} onCare={noop} onSaveUser={noop} onSubscribe={noop} />
      </Frame>
      <Frame {...S('podesavanja-kartica')}>
        <Settings unlocked subscription={subscription} care={{ ...care, payment: { ...care.payment, declined: true } }} user={user} onCare={noop} onSaveUser={noop} onSubscribe={noop} />
      </Frame>
      <Frame {...S('karton')}>
        <MedicalRecord answers={answers} plan={plan} care={care} record={record} onGoToChat={noop} onOpenPlan={noop} onReportChange={noop} />
      </Frame>
      <Frame {...S('karton-prazno')}>
        <MedicalRecord answers={{}} plan={null} care={care} record={record} onGoToChat={noop} onOpenPlan={noop} onReportChange={noop} />
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
          plan={drawerCare === 'long' ? longPlan : plan}
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
