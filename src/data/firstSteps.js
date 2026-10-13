import { activeVersion, allVisits, firstName, hasBeen, plansToConfirm, waitingOnYou } from './familyCare';
import { planPrice, plansFor } from './plans';
import { msg, t } from '../i18n';

// What a family is told on its way to the first visit, and only then
// (docs/patterns.md §4b). No tour and no tooltips: what there is to know is
// said where and when something is first done, and is read from what has
// really happened, so nothing is remembered about what was "seen".

// What asking a caregiver costs, said the same wherever it is said. A request
// commits nobody, but sending one is part of the subscription: without one the
// family is told so, with the price, before the dialog and not only in it.
export function requestNote(unlocked, country) {
  if (unlocked) {
    return t('Upit šalje plan nege negovateljici i nikoga ne obavezuje. Možete da pitate više njih, a ništa nije dogovoreno dok zajedno ne postavite uslove.');
  }
  const plans = plansFor(country);
  const monthly = plans.find((p) => p.months === 1) || plans[0];
  return t('Slanje upita je deo pretplate (od {price} mesečno). Sam upit nikoga ne obavezuje: ništa nije dogovoreno dok zajedno ne postavite uslove.', { price: planPrice(monthly) });
}

// the same, as the one line under a request in the assistant's card
export const requestFoot = (unlocked) =>
  unlocked ? t('Upit nikoga ne obavezuje.') : t('Slanje upita je deo pretplate. Sam upit nikoga ne obavezuje.');

// How long an answer usually takes, kept where the family is waiting and not
// only in the message that goes away after a request is sent.
// shown through t()
export const USUAL_ANSWER = msg('Negovateljice obično odgovore istog dana.');

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
      title: t('Čeka se ugovor o nezi'),
      text: t('{name} je prihvatila i sada sastavlja ugovor o nezi: šta će raditi, po kojoj ceni i kojim danima. Javićemo vam kad stigne, a vi do tada ne morate ništa.', { name: firstName(noContract.caregiver.name) }),
    };
  }

  const noVisit = coming.find((a) => activeVersion(a) && !a.visits.length);
  if (noVisit) {
    return {
      title: t('Čeka se plan prve posete'),
      text: t('{name} vam pre svake posete šalje plan: kada dolazi, koliko ostaje i šta će raditi. Prvi stiže pre nego što dođe, a vi ne zakazujete ništa.', { name: firstName(noVisit.caregiver.name) }),
    };
  }
  return null;
}
