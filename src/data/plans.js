import { eur } from '../lib/money';

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
  description: 'Za porodice koje žele punu kontrolu i slobodu, bez dugoročnih obaveza.',
  benefits: [
    'Direktan pristup našoj bazi proverenih i pouzdanih negovateljica',
    'Vi birate osobu sa kojom radite - bez posrednika, skrivenih provizija i ograničenja kakva postavljaju agencije',
    'Podrška tima i koordinatorke tokom celog trajanja paketa',
    'Zamena negovateljice u hitnim situacijama, bez dodatnih troškova',
    'Formular „Pošalji zahtev" za dodatnu pomoć (lekar, medicinska sestra, rehabilitacija…)',
    'Savet i pomoć pri izboru drugih vrsta nege',
    'Pregledi i pomagala kod naših partnera, do 10% jeftinije',
    'Pristup bazi mesec dana',
  ],
};

const QUARTERLY = {
  name: 'Premium',
  description: 'Najčešći izbor naših korisnika - za porodice koje žele stabilnost, kontinuitet i sigurnu podršku.',
  lead: 'Sve iz Basic plana, i još:',
  benefits: [
    'Prednost kod slobodnih termina koordinatorke',
    'Stabilnija podrška u planiranju dugoročnije nege',
    'Lični vodič za negu kod kuće (na vaš zahtev)',
    'Bez nove pretrage i dogovora svakog meseca',
    'Pristup bazi tri meseca',
  ],
};

const PLANS = {
  RS: [{ id: 'monthly', months: 1, price: 12.7, currency: 'EUR', ...MONTHLY }],
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
  plan.months === 1 ? 'mesečno' : `svaka ${plan.months} meseca`;

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
  return (one ? [one] : plans).map((p) => `${planPrice(p)} ${planEvery(p)}`).join(' ili ');
};

const GENITIVE = ['januara', 'februara', 'marta', 'aprila', 'maja', 'juna', 'jula', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra'];

// When a plan taken out on `at` renews: a month, or three, later.
export function renewsOn(country, planId, at) {
  const plan = plansFor(country).find((p) => p.id === planId) || plansFor(country)[0];
  const d = new Date(at);
  d.setMonth(d.getMonth() + plan.months);
  return `${d.getDate()}. ${GENITIVE[d.getMonth()]} ${d.getFullYear()}.`;
}
