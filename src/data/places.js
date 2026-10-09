// Where caregivers work: the four cities of the capital region. "Gde živi" is
// picked from these (and a part of town, if they like); anywhere else is
// "Drugo mesto", which the coordinator handles. Matching and the move dialog
// read the city from here, not from free text.
export const PLACES = ['Helsinki', 'Espoo', 'Vantaa', 'Kauniainen'];
export const OTHER_PLACE = 'other';

// the city a written place is in, or null when it is none of ours
export const cityOf = (place) => {
  const t = String(place || '').toLowerCase();
  return PLACES.find((c) => t.includes(c.toLowerCase())) || null;
};

// "Töölö, Helsinki" read back into its parts, and put together again
export function splitPlace(place) {
  const text = String(place || '').trim();
  const city = cityOf(text);
  if (!city) return { city: text ? OTHER_PLACE : '', part: '', other: text };
  const part = text.replace(new RegExp(`,?\\s*${city}\\s*$`, 'i'), '').trim();
  return { city, part: part === text ? '' : part, other: '' };
}
export const joinPlace = ({ city, part, other }) =>
  city === OTHER_PLACE ? other.trim() : city ? [part.trim(), city].filter(Boolean).join(', ') : '';
