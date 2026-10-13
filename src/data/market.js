// The market a family is in: the country they registered with (FI or RS). It
// decides the facts of the place, such as the emergency number. The language is
// only how they are said, so English reads the Finnish or the Serbian facts.
let current = 'FI';

export const setMarket = (country) => {
  if (country) current = country;
};
export const market = () => current;

// Finland has one number for everything; in Serbia the ambulance is 194.
const EMERGENCY = { FI: '112', RS: '194' };
export const emergencyNumber = () => EMERGENCY[current] || EMERGENCY.FI;
