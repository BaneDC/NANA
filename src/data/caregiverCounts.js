// How many caregivers work in a municipality, said on the family's sign-up
// before the account is made (docs/patterns.md §10, decided 16. 11.). In
// production the server counts them; the demo has a dozen caregivers a market,
// so the number here is made up: the same for the same municipality, larger in
// the capitals, and none in a few, so that case is seen too.

// municipalities as the Combobox gives them ("Kallio, Helsinki", "Niš")
export const NONE = {
  sr: ['Čačak', 'Subotica', 'Rakovica, Beograd', 'Savski venac, Beograd'], // i18n-ignore: place names
  fi: ['Koivukylä, Vantaa', 'Espoonlahti, Espoo', 'Malmi, Helsinki', 'Oulunkylä, Helsinki'],
};

const CAPITAL = /Beograd|Helsinki/;

export function caregiverCount(market, municipality) {
  const place = (municipality || '').trim();
  if (!place) return 0;
  const m = market === 'sr' || market === 'RS' ? 'sr' : 'fi';
  if (NONE[m].includes(place)) return 0;
  let h = 0;
  for (const ch of place) h = (h * 31 + ch.codePointAt(0)) % 9973;
  return ((h % 9) + 1) * (CAPITAL.test(place) ? 5 : 1);
}
