import { activeVersion, allVisits, firstName, hasBeen, plansToConfirm, waitingOnYou } from './familyCare';
import { planPrice, plansFor } from './plans';

// What a family is told on its way to the first visit, and only then
// (docs/patterns.md §4b). No tour and no tooltips: what there is to know is
// said where and when something is first done, and is read from what has
// really happened, so nothing is remembered about what was "seen".

// What asking a caregiver costs, said the same wherever it is said. A request
// commits nobody, but sending one is part of the subscription: without one the
// family is told so, with the price, before the dialog and not only in it.
export function requestNote(unlocked, country) {
  if (unlocked) {
    return 'Upit šalje plan nege negovateljici i nikoga ne obavezuje. Možete da pitate više njih, a ništa nije dogovoreno dok zajedno ne postavite uslove.';
  }
  const plans = plansFor(country);
  const monthly = plans.find((p) => p.months === 1) || plans[0];
  return `Slanje upita je deo pretplate (od ${planPrice(monthly)} mesečno). Sam upit nikoga ne obavezuje: ništa nije dogovoreno dok zajedno ne postavite uslove.`;
}

// the same, as the one line under a request in the assistant's card
export const requestFoot = (unlocked) =>
  unlocked ? 'Upit nikoga ne obavezuje.' : 'Slanje upita je deo pretplate. Sam upit nikoga ne obavezuje.';

// How long an answer usually takes, kept where the family is waiting and not
// only in the message that goes away after a request is sent.
export const USUAL_ANSWER = 'Negovateljice obično odgovore istog dana.';

// Who the family is waiting on, on the way to the first visit, when nothing is
// waiting on them: her contract after she said yes, her plan of the first
// visit after the terms were agreed. Waiting for an answer to a request has
// its own card on the home already. Once a visit has been there is nothing
// here: by then the family knows how it goes, and her row says where she is.
export function waitingOnHer(care) {
  if (allVisits(care).some(hasBeen)) return null;
  if (waitingOnYou(care).length || plansToConfirm(care).length) return null;
  const coming = care.arrangements.filter((a) => !a.endedOn);

  const noContract = coming.find((a) => !a.versions.length);
  if (noContract) {
    return {
      title: 'Čeka se ugovor o nezi',
      text: `${firstName(noContract.caregiver.name)} je prihvatila i sada sastavlja ugovor o nezi: šta će raditi, po kojoj ceni i kojim danima. Javićemo vam kad stigne, a vi do tada ne morate ništa.`,
    };
  }

  const noVisit = coming.find((a) => activeVersion(a) && !a.visits.length);
  if (noVisit) {
    return {
      title: 'Čeka se plan prve posete',
      text: `${firstName(noVisit.caregiver.name)} vam pre svake posete šalje plan: kada dolazi, koliko ostaje i šta će raditi. Prvi stiže pre nego što dođe, a vi ne zakazujete ništa.`,
    };
  }
  return null;
}
