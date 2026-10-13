import { locale } from '../i18n';

// Every amount in the app is in euros, written the way the language being read
// writes money: 38 €, 38,50 € and 1 240 € in Finnish and Serbian, €38, €38.50
// and €1,240 in English. Whole euros are written without the cents, since most
// prices here are whole and "38,00 €" reads like a receipt.
//
// The spaces are no-break, so an amount never wraps between its number and
// its sign.
const format = (n, cents) =>
  new Intl.NumberFormat(locale(), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(n);

export const eur = (n) => {
  const rounded = Math.round(n * 100) / 100;
  return format(rounded, !Number.isInteger(rounded));
};

// A range, for a price that is agreed later: "34–42 €/h", "€34–42/h".
export const eurRange = (min, max, unit = '') => {
  const sample = format(1, false);
  return sample.startsWith('€') ? `€${min}–${max}${unit}` : `${min}–${max} €${unit}`;
};
