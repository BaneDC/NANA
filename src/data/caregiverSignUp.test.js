import { describe, expect, it } from 'vitest';
import { PAIRS } from './personalityTest';
import { adult, afterSteps, emptyForm, recordFrom, stepErrors } from './caregiverSignUp';

const filled = (market) => ({
  ...emptyForm(market),
  firstName: 'Ana',
  lastName: 'Lind',
  birth: new Date(1990, 0, 1).getTime(),
  address: 'Ulica 1',
  area: 'Helsinki',
  phone: '40 123 4567',
  classifications: ['Lähihoitaja'],
  education: 'Srednja škola', // i18n-ignore
  bio: 'Iskustvo.',
  days: ['0', '1'],
  slots: ['morning'],
  rateMin: '15',
  rateMax: '20',
});

describe('personality test', () => {
  it('has 62 pairs, none twice, the first six as on the screenshot', () => {
    expect(PAIRS.length).toBe(62);
    expect(new Set(PAIRS.map((p) => [...p].sort().join())).size).toBe(62);
    expect(PAIRS[0]).toEqual(['warm', 'adventurous']);
    expect(PAIRS[5]).toEqual(['brooding', 'careful']);
  });
});

describe('sign-up steps', () => {
  it('an empty basic step says what is missing', () => {
    expect(Object.keys(stepErrors('basic', emptyForm('fi')))).toEqual(['firstName', 'lastName', 'birth', 'address', 'area', 'phone']);
  });
  it('a filled Finnish form passes its steps', () => {
    const f = filled('fi');
    for (const s of ['basic', 'profession', 'availability']) expect(stepErrors(s, f)).toEqual({});
  });
  it('the rate from cannot be above the rate to', () => {
    expect(stepErrors('availability', { ...filled('fi'), rateMin: '25', rateMax: '20' }).rate).toBeTruthy();
  });
  it('Finland asks for documents only when a classification needs one; Serbia has the test', () => {
    expect(afterSteps(filled('fi'))).toEqual(['documents', 'interview', 'thanks']);
    expect(afterSteps({ ...filled('fi'), classifications: ['Kotiavustaja'] })).toEqual(['interview', 'thanks']);
    expect(afterSteps(filled('sr'))).toEqual(['test', 'interview', 'thanks']);
  });
  it('makes a record in the shape of the others, waiting for the interview', () => {
    const r = recordFrom(filled('fi'), 'reg-1');
    expect(r).toMatchObject({ id: 'reg-1', market: 'FI', status: 'interview', name: 'Ana Lind', rateMin: 15, rateMax: 20, days: [0, 1] });
  });
});

describe('date of birth', () => {
  it('18 today is old enough, a day short is not', () => {
    const now = new Date(2026, 9, 19);
    expect(adult(new Date(2008, 9, 19), now)).toBe(true);
    expect(adult(new Date(2008, 9, 20), now)).toBe(false);
  });
  it('someone under 18 is told so under the field', () => {
    const f = { ...emptyForm('fi'), birth: Date.now() };
    expect(stepErrors('basic', f).birth).toBe('Morate imati najmanje 18 godina.');
  });
});
