import { eur } from '../lib/money';
import { getLang, locale, msg, t } from '../i18n';

// What the subscription costs, per market.
//
// Serbia has one plan and always will: a family deciding whether to pay at all
// should not also be deciding between two ways to pay. Finland has two, because
// paying for three at once is how that market expects to be offered a discount.
//
// Which market a family is in comes from the country they registered with, not
// from the language they read in.
//
// Everything is in euros now, the demo being prepared for Finland. Serbia's
// one plan is its dinar price converted (1.490 RSD at ~117 RSD to the euro),
// until its own euro price and options are decided.
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

// Serbia's two packages, word for word from nanaprime.com/sr/pricing (19. 10.).
// Paid once, never renewed: `once`. Models are still being tried, so what a
// package is lives only here (docs/superpowers/specs/2026-10-19-porodica-srbija-design.md).
const RS_MONTHLY = {
  name: msg('Mesečni paket'),
  tagline: msg('Fleksibilnost kada vam je potrebna'),
  description: msg('Za porodice koje žele brzo da pronađu pouzdanu negovateljicu, bez dugoročnih obaveza.'),
  benefits: [
    msg('Pristup bazi proverenih negovateljica'),
    msg('Pomoć pri pronalaženju odgovarajuće negovateljice'),
    msg('Besplatan uvodni razgovor od 30 minuta sa koordinatorom'),
    msg('Direktna komunikacija sa negovateljicama'),
    msg('Zamena negovateljice u hitnim slučajevima, bez dodatnih troškova'),
    msg('Bez posrednika i skrivenih troškova'),
    msg('14-dnevna garancija povraćaja novca - ako ne pronađete odgovarajuću negovateljicu, vraćamo vam 100% novca'),
  ],
};
const RS_QUARTERLY = {
  name: msg('Tromesečni paket'),
  tagline: msg('Više podrške. Više sigurnosti. Manje brige.'),
  description: msg('Naš najpopularniji paket za porodice koje žele sigurnost, kontinuitet i ličnu podršku tokom dugoročnog zbrinjavanja.'),
  lead: msg('Sve iz Mesečnog paketa, plus:'),
  benefits: [
    msg('Prioritet pri pronalaženju negovateljice'),
    msg('Personalizovani plan nege prilagođen potrebama vaše porodice'),
    msg('Prioritetna podrška koordinatora kada vam je potrebna pomoć'),
    msg('Kontinuirana podrška u planiranju dugoročne nege'),
    msg('Pomoć pri organizaciji dodatnih usluga, kao što su lekar ili rehabilitacija'),
    msg('Personalizovani vodič za kućnu negu'),
  ],
};

const PLANS = {
  RS: [
    { id: 'monthly', months: 1, price: 43, currency: 'EUR', once: true, ...RS_MONTHLY },
    { id: 'quarterly', months: 3, price: 98, was: 129, currency: 'EUR', once: true, recommended: true, badge: msg('Najpopularnije'), ...RS_QUARTERLY },
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
