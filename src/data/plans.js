import { eur } from '../lib/money';
import { getLang, locale, msg, t } from '../i18n';

// What the subscription costs, per market.
//
// Serbia has three one-month packages, told apart by how much of the team's
// help they include. Finland has two subscriptions, because paying for three
// months at once is how that market expects to be offered a discount.
//
// Which market a family is in comes from the country they registered with, not
// from the language they read in.
//
// Everything is in euros, in both markets.
//
// Finland has two subscriptions: Basic, 9,99 € a month, and Premium, 17,99 €
// for three months. Every line below is the live platform's plan picker
// (nanaprime.com, "Choose your plan"), in Serbian. One line is ours: the
// partners' discount, which the platform does not have yet.
//
// What Premium saves is worked out from the prices (`planSaving`): 17,99 €
// against three months of Basic, 29,97 €, is 40% less.

const MONTHLY = {
  name: 'Basic',
  description: msg('Za porodice koje žele punu kontrolu i slobodu, bez dugoročnih obaveza.'),
  benefits: [
    msg('Direktan pristup našoj bazi proverenih i pouzdanih negovateljica'),
    msg('Vi birate osobu sa kojom radite - bez posrednika, skrivenih provizija i ograničenja kakva postavljaju agencije'),
    msg('Podrška tima i koordinatorke tokom celog trajanja paketa'),
    msg('Zamena negovateljice u hitnim situacijama, bez dodatnih troškova'),
    msg('Formular „Pošalji zahtev" za dodatnu pomoć (lekar, medicinska sestra, rehabilitacija…)'),
    msg('Savet i pomoć pri izboru drugih vrsta nege'),
    msg('Pregledi i pomagala kod naših partnera, do 10% jeftinije'),
    msg('Pristup bazi mesec dana'),
  ],
};

const QUARTERLY = {
  name: 'Premium',
  description: msg('Najčešći izbor naših korisnika - za porodice koje žele stabilnost, kontinuitet i sigurnu podršku.'),
  lead: msg('Sve iz Basic plana, i još:'),
  benefits: [
    msg('Prednost kod slobodnih termina koordinatorke'),
    msg('Stabilnija podrška u planiranju dugoročnije nege'),
    msg('Lični vodič za negu kod kuće (na vaš zahtev)'),
    msg('Bez nove pretrage i dogovora svakog meseca'),
    msg('Pristup bazi tri meseca'),
  ],
};

// Serbia's three packages, word for word from nanaprime.com/sr/pricing (2. 11.).
// Each is paid once and lasts a month, never renewed: `once`. Models are still
// being tried, so what a package is lives only here
// (docs/superpowers/specs/2026-10-19-porodica-srbija-design.md).
const RS_STARTER = {
  name: msg('Početni paket'),
  tagline: msg('Podrška putem mejla'),
  description: msg('Za porodice koje žele same da pronađu negovateljicu i kojima je dovoljna pisana podrška našeg tima.'),
  lead: msg('Uključeno:'),
  benefits: [
    msg('Pristup preporučenim negovateljicama: Pregledate profile i sami birate sa kim želite da ostvarite saradnju.'),
    msg('Procena potrebe za negom putem mejla (na zahtev): Na osnovu upitnika koji ste popunili, šaljemo vam procenu potrebe za negom i preporuku najpogodnijeg vida nege (negovatelj u kući, dom za stare ili medicinska/bolnička nega).'),
    msg('Podrška putem mejla: Na vaša pitanja odgovaramo pisanim putem.'),
  ],
  footnote: msg('Napomena: Komunikacija u ovom paketu odvija se isključivo putem mejla. Razgovor sa koordinatorom nege nije uključen.'),
};
const RS_GUIDED = {
  name: msg('Vođeni paket'),
  tagline: msg('Jedan razgovor sa koordinatorom + podrška putem mejla'),
  description: msg('Za porodice koje žele same da izaberu negovateljicu, ali uz jedan razgovor sa stručnjakom kako bi od početka napravile pravi izbor.'),
  lead: msg('Sve iz Početnog paketa, plus:'),
  benefits: [
    msg('Jedan razgovor sa koordinatorom nege: Opišete situaciju člana porodice, dobijete više informacija o negovateljicama i objašnjenje kako ceo proces funkcioniše.'),
    msg('Praktični saveti iz oblasti nege putem mejla (na zahtev): Na osnovu upitnika o starijem članu porodice šaljemo vam konkretne savete za negu.'),
    msg('Predlog rešenja prema vašem budžetu (na zahtev): Putem mejla dobijate preporuku koja vrsta nege i angažovanja vam najviše odgovara za budžet kojim raspolažete.'),
  ],
  footnote: msg('Napomena: Paket uključuje jedan razgovor sa koordinatorom; dalja komunikacija odvija se putem mejla. Stalna podrška koordinatora, personalizovani plan nege i garancija povraćaja novca dostupni su isključivo u Premium paketu.'),
};
const RS_PREMIUM = {
  name: msg('Premium paket'),
  tagline: msg('Puna podrška koordinatora tokom celog meseca'),
  description: msg('Za porodice koje žele potpunu podršku i bezbrižnost, uz posvećenog koordinatora tokom celog procesa.'),
  lead: msg('Sve iz Vođenog paketa, plus:'),
  benefits: [
    msg('Posvećeni koordinator nege tokom celog meseca: Dostupan vam je za razgovore i pitanja tokom celog trajanja paketa.'),
    msg('Personalizovani plan nege (na zahtev, putem mejla): Plan prilagođen dnevnoj rutini i stanju vašeg člana porodice.'),
    msg('Konkretna pomoć pri izboru negovateljice: Učestvujemo u razgovorima sa kandidatkinjama i pomažemo pri uvođenju izabrane negovateljice u posao.'),
    msg('Prioritetni odgovor našeg tima.'),
    msg('Garancija povraćaja novca u roku od 14 dana: Ako ne pronađemo odgovarajuću negovateljicu, vraćamo vam 100% uplaćenog iznosa.'),
  ],
};

const PLANS = {
  RS: [
    { id: 'starter', months: 1, price: 9, currency: 'EUR', once: true, ...RS_STARTER },
    { id: 'guided', months: 1, price: 25, currency: 'EUR', once: true, ...RS_GUIDED },
    { id: 'premium', months: 1, price: 49, currency: 'EUR', once: true, recommended: true, badge: msg('Preporučeno'), ...RS_PREMIUM },
  ],
  FI: [
    { id: 'monthly', months: 1, price: 9.99, currency: 'EUR', ...MONTHLY },
    { id: 'quarterly', months: 3, price: 17.99, currency: 'EUR', recommended: true, ...QUARTERLY },
  ],
};

// Every market we do not have prices for is billed the way Serbia is.
export const plansFor = (country) => PLANS[country] || PLANS.RS;

// whole euros without the cents (10 €), anything else with them (9,99 €)
export const planPrice = ({ price }) => eur(price);

// What it works out to a month, for the plan that is not monthly — the number a
// family actually compares the other plan against.
export const perMonth = (plan) => planPrice({ ...plan, price: plan.price / plan.months });

export const planEvery = (plan) =>
  plan.months === 1 ? t('mesečno') : t('svaka {n} meseca', { n: plan.months });

// How much the longer plan saves against paying monthly, when it saves enough
// to be worth saying.
export function planSaving(plan, plans) {
  if (plan.saving) return plan.saving;
  const monthly = plans.find((p) => p.months === 1);
  if (!monthly || plan.months === 1) return null;
  const off = 1 - plan.price / (monthly.price * plan.months);
  return off >= 0.05 ? Math.round(off * 100) : null;
}

// The line the app uses wherever it just states what the subscription costs:
// the plan they are on, or — before they have one — every plan the market has,
// so Finland reads "12,90 € mesečno ili 34,90 € svaka 3 meseca", not only the
// first of them.
export const priceLine = (country, planId) => {
  const plans = plansFor(country);
  const one = planId && plans.find((p) => p.id === planId);
  return (one ? [one] : plans).map((p) => planPrice(p) + ' ' + planEvery(p)).join(' ' + t('ili') + ' ');
};

const GENITIVE = ['januara', 'februara', 'marta', 'aprila', 'maja', 'juna', 'jula', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra'];

// When a plan taken out on `at` renews: a month, or three, later.
export function renewalAt(country, planId, at) {
  const plan = plansFor(country).find((p) => p.id === planId) || plansFor(country)[0];
  const d = new Date(at);
  d.setMonth(d.getMonth() + plan.months);
  return d.getTime();
}

// A day, as it is said: "12. novembra 2026.", "12 November 2026".
export function dateOn(at) {
  const d = new Date(at);
  // Serbian wants the month in the genitive, which Intl does not give
  if (getLang() === 'sr') return `${d.getDate()}. ${GENITIVE[d.getMonth()]} ${d.getFullYear()}.`;
  return d.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
}

// The same, for when it renews (or, for a package, runs out).
export const renewsOn = (country, planId, at) => dateOn(renewalAt(country, planId, at));

// A package (paid once) is over once its months have passed; a subscription is
// never "over" this way, it renews or is cancelled.
export function packageOver(country, subscription, now = Date.now()) {
  if (!subscription) return false;
  const plan = plansFor(country).find((p) => p.id === subscription.planId);
  return Boolean(plan?.once) && now >= renewalAt(country, subscription.planId, subscription.at);
}
