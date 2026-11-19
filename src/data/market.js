import { caregiverCount } from './caregiverCounts';

// The market a family is in: the country they registered with (FI or RS). It
// decides the facts of the place, such as the emergency number. The language is
// only how they are said, so English reads the Finnish or the Serbian facts.
let current = 'FI';

export const setMarket = (country) => {
  if (country) current = country;
};
export const market = () => current;

// Where this family is, from its account (docs/patterns.md §12, decided
// 16. 11.): abroad (diaspora: Serbia's market, only caregivers who travel),
// and the municipality it named when it signed up. Set by the app next to the
// market; the demo's family has neither.
let place = { abroad: false, municipality: null };
export const setPlace = ({ abroad = false, municipality = null } = {}) => {
  place = { abroad: Boolean(abroad), municipality: municipality || null };
};
export const isAbroad = () => place.abroad;
// a municipality we have no caregiver in: the lists a family browses are empty
export const noneHere = () => !place.abroad && Boolean(place.municipality) && caregiverCount(current, place.municipality) === 0;

// Finland has one number for everything; in Serbia the ambulance is 194.
const EMERGENCY = { FI: '112', RS: '194' };
export const emergencyNumber = () => EMERGENCY[current] || EMERGENCY.FI;

// What the platform does in a market, asked by the screens instead of the
// market's name (docs/superpowers/specs/2026-10-19-porodica-srbija-design.md).
// Finland: terms, visits and their money go through the platform, the card is
// kept, the family subscribes. Serbia: the family pays once for a package and
// agrees everything else with the caregiver by phone.
const FEATURES = {
  FI: ['agreements', 'visits', 'card', 'subscription'],
  RS: ['package'],
};
export const marketHas = (what) => FEATURES[current]?.includes(what) ?? false;
