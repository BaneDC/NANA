// What the subscription costs, per market.
//
// Serbia has one plan and always will: a family deciding whether to pay at all
// should not also be deciding between two ways to pay. Finland has two, because
// paying for three at once is how that market expects to be offered a discount.
//
// Which market a family is in comes from the country they registered with, not
// from the language they read in — someone reading the app in English in
// Belgrade still pays in dinars.
//
// NOTE: the Finnish prices are placeholders until the real ones are confirmed.

const PLANS = {
  RS: [{ id: 'monthly', months: 1, price: 1490, currency: 'RSD' }],
  FI: [
    { id: 'monthly', months: 1, price: 12.9, currency: 'EUR' },
    { id: 'quarterly', months: 3, price: 34.9, currency: 'EUR' },
  ],
};

// Every market we do not have prices for is billed the way Serbia is.
export const plansFor = (country) => PLANS[country] || PLANS.RS;

export const planPrice = ({ price, currency }) =>
  currency === 'RSD'
    ? `${price.toLocaleString('sr-RS')} RSD`
    : `${price.toFixed(2).replace('.', ',')} €`;

// What it works out to a month, for the plan that is not monthly — the number a
// family actually compares the other plan against.
export const perMonth = (plan) => planPrice({ ...plan, price: plan.price / plan.months });

export const planEvery = (plan) =>
  plan.months === 1 ? 'mesečno' : `svaka ${plan.months} meseca`;

export const planTitle = (plan) => (plan.months === 1 ? 'Mesečno' : `${plan.months} meseca`);

// How much the longer plan saves against paying monthly, when it saves enough
// to be worth saying.
export function planSaving(plan, plans) {
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
