import { agreeTerms, allVisits, askCaregiver, confirmVisit, linkCard, seeAnswers } from './familyCare';
import { requestMessage, startCare } from './familyStart';
import { answerRequest, passTime, planVisit, sendTerms, sendWorkOrder } from './sim';

// The demo, filled in one go (the button in the simulation panel, and
// /?demo&puno): a family a week into care, so the home and everything behind
// it have something to show without clicking through the simulation a step at
// a time. Nothing here is made up beside it: every step is the same function
// the app and the simulation run, in the order the two sides would, so the
// state and its history are what clicking through would have left.
//
// Two caregivers come. Sanna: three visits paid (one an hour short, with what
// she flagged), a work order waiting on the family, nothing booked after it.
// Päivi: one visit paid, and a plan for the next one, booked. A
// third was asked and has not answered. The card is saved.

// she was asked, said yes, sent her terms, and they were agreed
const begins = (id) => (c) => {
  let next = askCaregiver(id, requestMessage(c))(c);
  next = answerRequest(id, true)(next);
  next = sendTerms(id)(next);
  return agreeTerms(id)(next);
};

// one visit, from its plan to its work order; `settle` pays it
const visits = (id, { kind = 'as-planned', settle = true } = {}) => (c) => {
  let next = planVisit(id)(c);
  const v = allVisits(next).find((x) => x.caregiver.id === id && x.status === 'planned');
  if (!v) return c;
  // the clock, to an hour after she has left
  next = passTime(v.day * 24 + v.start + v.hours + 1 - next.now)(next);
  next = sendWorkOrder(v.id, kind)(next);
  return settle ? confirmVisit(v.id)(next) : next;
};

export function fillCare(care) {
  // from nobody asked, keeping who they are and what the plan asks for
  let c = { ...startCare(null), family: care.family, elder: care.elder, need: care.need };
  const steps = [
    linkCard,
    begins('sanna'),
    visits('sanna'),
    begins('paivi'),
    visits('sanna', { kind: 'less' }),
    visits('paivi'),
    visits('sanna'),
    // what waits on the family: her work order; Päivi's next plan is booked
    visits('sanna', { settle: false }),
    planVisit('paivi'),
    seeAnswers,
    // asked, not answered yet
    (x) => askCaregiver('liisa', requestMessage(x))(x),
  ];
  for (const step of steps) c = step(c);
  return c;
}
