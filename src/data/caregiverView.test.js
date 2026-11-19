import { describe, expect, it } from 'vitest';
import { caregiverClients } from './caregiverClients';
import { earnings, myClients, netOf, owes, stageOf } from './caregiverView';
import { seedState } from './demo';
import { isShortPlan } from './path';
import { planQuestions } from './planEdits';

const clients = caregiverClients();
const byId = Object.fromEntries(clients.map((c) => [c.id, c.person.care]));

describe("Sanna's other clients, made by the same steps", () => {
  it('each sits in the column it was made for', () => {
    expect(stageOf(byId.makela, 'sanna')).toBe('request');
    expect(stageOf(byId.virtanen, 'sanna')).toBe('agreement');
    expect(stageOf(byId.lehtinen, 'sanna')).toBe('active');
    expect(stageOf(byId.heikkinen, 'sanna')).toBe('work-order');
    expect(stageOf(byId.laine, 'sanna')).toBe('ended');
    expect(stageOf(byId.nieminen, 'sanna')).toBe('declined');
  });

  it('says what she owes next', () => {
    expect(owes(byId.virtanen, 'sanna')).toEqual({ kind: 'terms' });
    expect(owes(byId.heikkinen, 'sanna').kind).toBe('work-order');
    expect(owes(byId.lehtinen, 'sanna')).toBeNull();
  });
});

describe('myClients', () => {
  it('reads the demo family and the others, only those that concern her', () => {
    const state = { ...seedState('fi', { filled: true }), clients };
    const mine = myClients(state, 'sanna');
    expect(mine.map((c) => c.id)).toContain('family');
    expect(mine.length).toBe(clients.length + 1);
    expect(myClients(state, 'eeva').length).toBe(0);
  });
});

describe('earnings', () => {
  it('her share is 90% of what the family is charged', () => {
    const paid = earnings([{ id: 'x', care: byId.lehtinen }], 'sanna').paid[0];
    expect(netOf(paid)).toBeCloseTo(paid.hours * paid.rate * 0.9, 2);
  });

  it('adds up what is paid, what is being charged and what is held', () => {
    const state = { ...seedState('fi', { filled: true }), clients };
    const e = earnings(myClients(state, 'sanna'), 'sanna');
    expect(e.paid.length).toBeGreaterThan(0);
    expect(e.reserved).toBeGreaterThan(0);
    expect(e.processing).toBeGreaterThan(0);
  });
});

describe('families that asked only for a caregiver, on her side', () => {
  const short = (state, id) => myClients(state, id).filter((c) => isShortPlan(c.person.answers));
  it('Sanna has one, with a request to answer', () => {
    const [c] = short(seedState('fi', {}), 'sanna');
    expect(c.stage).toBe('request');
    expect(c.care.need).toMatchObject({ hours: 6, schedule: 'uto, čet · popodne' });
  });
  it('Milica has one, and one from abroad, round the clock', () => {
    const mine = short(seedState('sr', {}), 'milica');
    expect(mine.map((c) => c.id).sort()).toEqual(['jovic', 'kostic']);
    const abroad = mine.find((c) => c.id === 'kostic');
    expect(abroad.care.elder.area).toBe('Cirih, Švajcarska');
    expect(abroad.care.need).toMatchObject({ schedule: '24 sata', hours: null });
  });
  it('none of them shows a question nobody answered', () => {
    for (const [m, id] of [['fi', 'sanna'], ['sr', 'milica']])
      for (const c of short(seedState(m, {}), id))
        expect(planQuestions(c.person.answers).flatMap((s) => s.questions).every(({ answer }) => answer)).toBe(true);
  });
  it('the demo family that asked only for a caregiver has a small plan', () => {
    const s = seedState('fi', { short: true });
    expect(isShortPlan(s.person.answers)).toBe(true);
    expect(s.person.path).toBe('caregiver');
  });
});
