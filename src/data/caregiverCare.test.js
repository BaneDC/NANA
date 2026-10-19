import { beforeEach, describe, expect, it } from 'vitest';
import { setMarket } from './market';
import { startCare, withAnswers } from './familyStart';
import { demoAnswers, demoUser } from './demoCase';
import { agreeTerms, askCaregiver, arrangementOf, linkCard, latestRequest, allVisits, withdrawRequest } from './familyCare';
import { answerRequest, planVisit, sendTerms, sendWorkOrder } from './caregiverCare';
import { passTime } from './sim';

const fresh = () => withAnswers(startCare(demoUser), demoAnswers, demoUser);
const agreed = (id = 'sanna') => {
  let c = askCaregiver(id, 'Zdravo')(fresh());
  c = answerRequest(id, true)(c);
  c = sendTerms(id)(c);
  c = agreeTerms(id)(c);
  return linkCard(c);
};

describe('caregiver actions', () => {
  beforeEach(() => setMarket('FI'));

  it('a yes in Finland opens a cooperation that waits for terms', () => {
    const c = answerRequest('sanna', true)(askCaregiver('sanna', '')(fresh()));
    expect(latestRequest(c, 'sanna').status).toBe('accepted');
    expect(arrangementOf(c, 'sanna')).toBeTruthy();
  });

  it('a yes in Serbia opens nothing: they agree by phone', () => {
    setMarket('RS');
    const c = answerRequest('milica', true)(askCaregiver('milica', '')(fresh()));
    expect(latestRequest(c, 'milica').status).toBe('accepted');
    expect(arrangementOf(c, 'milica')).toBeFalsy();
    expect(latestRequest(c, 'milica').detail).toBe('Prihvatila je. Njen telefon i e-mail su u njenom profilu.');
  });

  it('terms take the services and the rate she chose', () => {
    let c = answerRequest('sanna', true)(askCaregiver('sanna', '')(fresh()));
    c = sendTerms('sanna', { services: ['walks'], rate: 22, note: 'Moja poruka' })(c);
    const v = arrangementOf(c, 'sanna').versions.at(-1);
    expect(v.services).toEqual(['walks']);
    expect(v.rate).toBe(22);
    expect(v.note).toBe('Moja poruka');
  });

  it('terms without options are what the simulation always sent', () => {
    let c = answerRequest('sanna', true)(askCaregiver('sanna', '')(fresh()));
    c = sendTerms('sanna')(c);
    expect(arrangementOf(c, 'sanna').versions.at(-1).rate).toBe(18);
  });

  it('a visit plan takes the day, the start and the hours she chose', () => {
    const c = planVisit('sanna', { day: 1, start: 14, hours: 2 })(agreed());
    const v = allVisits(c).find((x) => x.status === 'planned');
    expect([v.day, v.start, v.hours]).toEqual([1, 14, 2]);
  });

  it('a visit plan with `true` is still half an hour from now', () => {
    const c = agreed();
    const v = allVisits(planVisit('sanna', true)(c)).find((x) => x.status === 'planned');
    expect(v.day).toBe(Math.floor(c.now / 24));
  });

  it('a work order she wrote herself is kept as written, an hour over asks the family', () => {
    let c = planVisit('sanna', { day: 1, start: 9, hours: 2 })(agreed());
    const v = allVisits(c).find((x) => x.status === 'planned');
    c = passTime(24 + 12 - c.now)(c);
    c = sendWorkOrder(v.id, { hours: 3, mood: 'good', eating: 'usual', moving: 'usual', note: 'Sve u redu.', done: v.services })(c);
    const after = allVisits(c).find((x) => x.id === v.id);
    expect(after.report.note).toBe('Sve u redu.');
    expect(after.extra).toEqual({ hours: 1, status: 'asked' });
  });

  it('the family can take back a request nobody has answered', () => {
    const c = withdrawRequest('sanna')(askCaregiver('sanna', '')(fresh()));
    expect(latestRequest(c, 'sanna')).toBeNull();
    expect(c.log[0].title).toBe('Otkazali ste upit');
  });

  it('an answered request cannot be taken back', () => {
    const c = answerRequest('sanna', true)(askCaregiver('sanna', '')(fresh()));
    expect(withdrawRequest('sanna')(c)).toBe(c);
  });
});
