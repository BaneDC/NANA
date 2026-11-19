import { describe, expect, it } from 'vitest';
import { buildPlan } from './carePlan';
import { planOverview } from './carePlan.sr';
import { daysCounted, needFrom, scheduleFrom } from './familyStart';
import { frailtyOf } from './frailty';
import { servicesForNeed } from './serviceCatalog';
import { demoAnswers } from './demoCase';

const short = {
  'about-person': { values: { name: 'Aino Korhonen', age: '84', city: 'Espoo' } },
  'about-you': { values: { 'your-name': 'Anna Korhonen', relation: 'Ćerka', 'your-phone': '+358 40 1' } },
  'care-needs': { optionIds: ['meals', 'company'] },
  'care-schedule': { values: { days: 'pon, sre, pet', slots: 'pre podne', hours: '3' } },
  mobility: { optionId: 'stick' },
};
const text = (x) => JSON.stringify(x);

describe('what the family needs, said by them', () => {
  it('is the services they named and the hours they said', () => {
    const need = needFrom(short);
    expect(need.services).toEqual(servicesForNeed(['meals', 'company']));
    expect(need).toMatchObject({ perVisit: 3, hours: 9, schedule: 'pon, sre, pet · pre podne' });
  });
  it('makes up no hours when they named none', () => {
    const need = needFrom({ ...short, 'care-schedule': { values: { days: 'svaki dan', slots: 'pre podne' } } });
    expect(need.hours).toBeNull();
    expect(need.perVisit).toBeNull();
    expect(text(need)).not.toMatch(/undefined|NaN/);
  });
  it('round the clock has no hours', () => {
    expect(scheduleFrom({ values: { engagement: '24 sata' } })).toMatchObject({ schedule: '24 sata', hours: null });
  });
  it('counts the days however they are said', () => {
    expect(daysCounted('pon, sre, pet')).toBe(3);
    expect(daysCounted('pon – pet')).toBe(5);
    expect(daysCounted('svaki dan')).toBe(7);
    expect(daysCounted('radnim danima')).toBe(5);
    expect(daysCounted('utorkom i četvrtkom')).toBe(2);
    expect(daysCounted('Monday to Friday')).toBe(5);
    expect(daysCounted('3 puta nedeljno')).toBe(3);
    expect(daysCounted('kad stignemo')).toBeNull();
  });
  it('a full plan from before is worked out as it was', () => {
    expect(needFrom(demoAnswers)).toMatchObject({ hours: 9, perVisit: 3, time: '09:00–12:00', schedule: 'pon, sre, pet · 09:00–12:00' });
  });
  it('a full plan that was also asked when takes what was said', () => {
    expect(needFrom({ ...demoAnswers, 'care-schedule': { values: { days: 'pon – pet', slots: 'popodne', hours: '2' } } })).toMatchObject({ hours: 10, schedule: 'pon – pet · popodne' });
  });
});

describe('the small plan', () => {
  const plan = buildPlan(short, ['Ima psa.']);
  it('has one recommendation, the caregivers, and no estimate', () => {
    expect(plan.short).toBe(true);
    expect(plan.recommendations.map((r) => r.kind)).toEqual(['caregivers']);
    expect(plan.frailty).toBeNull();
    expect(frailtyOf(short)).toBeNull();
  });
  it('says only what is known: no dash, nothing undefined', () => {
    expect(plan.facts.every((f) => f.value && f.value !== '-')).toBe(true);
    expect(text(plan)).not.toMatch(/undefined|NaN/);
    expect(plan.summary).toContain('Aino Korhonen');
    expect(plan.summary).toContain('pon, sre, pet');
  });
  it('reads back the same in the overview, to the family and to the caregiver', () => {
    for (const to of ['family', 'caregiver']) {
      const o = planOverview(short, ['Ima psa.'], { to });
      expect(o.short).toBe(true);
      expect(o.risks).toEqual([]);
      expect(o.goal).toBeNull();
      expect(text(o)).not.toMatch(/undefined|NaN/);
    }
  });
  it('the full plan is as it was', () => {
    const full = buildPlan(demoAnswers, []);
    expect(full.short).toBeFalsy();
    expect(full.recommendations).toHaveLength(5);
    expect(full.frailty).not.toBeNull();
  });
});

// found in review, 16. 11.
describe('after review', () => {
  it('a plan made whole stays whole when the frailty band later moves', async () => {
    const { isShortPlan } = await import('./path');
    const { applyChanges } = await import('./planEdits');
    const whole = { ...demoAnswers, 'care-needs': short['care-needs'], 'care-schedule': short['care-schedule'] };
    expect(isShortPlan(whole)).toBe(false);
    const worse = applyChanges(whole, [
      { questionId: 'mobility', answer: { optionId: 'bed' } },
      { questionId: 'going-out', answer: { optionId: 'never-out' } },
      { questionId: 'daily-help', answer: { optionId: 'dependent' } },
      { questionId: 'overall', answer: { optionId: 'dependent' } },
      { questionId: 'falls', answer: { optionId: 'more-than-once' } },
    ]).answers;
    expect(isShortPlan(worse)).toBe(false);
    expect(buildPlan(worse, []).short).toBeFalsy();
  });
  it('round the clock answers when she is needed: no days or part of the day to ask', async () => {
    const { openQuestions } = await import('./path');
    const { setMarket } = await import('./market');
    setMarket('RS');
    const a = { ...short, 'care-schedule': { values: { engagement: '24 sata' } } };
    expect(openQuestions(a, 'caregiver').map(({ q }) => q.id)).toEqual([]);
    setMarket('FI');
  });
  it('counts the days in the ways people say them', () => {
    const cases = {
      'pet dana nedeljno': 5,
      'pet dana u nedelji': 5,
      'tri puta u nedelji': 3,
      '3 puta u toku nedelje': 3,
      'pon, sre, pet po 3 sata': 3,
      'Monday through Friday': 5,
      'sunday to thursday': 5,
      'radnim danima i subotom': 6,
      'mon-fri and sunday': 6,
      'svaki dan osim nedelje': 6,
      'twice a week': 2,
      'subotom i nedeljom': 2,
    };
    for (const [said, n] of Object.entries(cases)) expect([said, daysCounted(said)]).toEqual([said, n]);
  });
  it('reads the hours of a visit from a time of day too, and keeps them round', () => {
    expect(scheduleFrom({ values: { days: 'pon', slots: 'pre podne', hours: 'od 9 do 13' } }).perVisit).toBe(4);
    expect(scheduleFrom({ values: { days: 'pon, sre, pet', slots: 'pre podne', hours: '2,2' } }).hours).toBe(6.6);
  });
});
