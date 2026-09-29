// Every amount in the app, written the Finnish way: the euro sign after the
// number, a comma for the cents, a space between thousands — 38 €, 38,50 €,
// 1 240 €. Whole euros are written without the cents, since most prices here
// are whole and "38,00 €" reads like a receipt.
//
// The spaces are no-break, so an amount never wraps between its number and
// its sign.
const whole = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const eur = (n) => {
  const rounded = Math.round(n * 100) / 100;
  return `${(Number.isInteger(rounded) ? whole : cents).format(rounded)} €`;
};

// A range, for a price that is agreed later: "34–42 €/h".
export const eurRange = (min, max, unit = '') => `${min}–${max} €${unit}`;
