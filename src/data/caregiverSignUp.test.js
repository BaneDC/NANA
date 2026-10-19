import { describe, expect, it } from 'vitest';
import { PAIRS } from './personalityTest';
import { afterSteps, emptyForm, recordFrom, stepErrors } from './caregiverSignUp';

const filled = (market) => ({
  ...emptyForm(market),
  firstName: 'Ana',
  lastName: 'Lind',
  birth: '1.1.1990.',
  address: 'Ulica 1',
  area: 'Helsinki',
  phone: '+358 40 123 4567',
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
