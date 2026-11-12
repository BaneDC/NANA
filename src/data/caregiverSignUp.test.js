import { describe, expect, it } from 'vitest';
import { PAIRS, traitOf } from './personalityTest';
import { adult, afterSteps, emptyForm, firstUnfinished, recordFrom, stepErrors } from './caregiverSignUp';
import { marketDate } from './familyCare';
import { languageOptions } from './caregiverProfile';

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
  it('has the live platform 62 pairs, none twice, each of the twelve traits', () => {
    expect(PAIRS.length).toBe(62);
    expect(new Set(PAIRS.map((p) => [...p].sort().join())).size).toBe(62);
    expect(PAIRS[0]).toEqual(['warm', 'adventurous']);
    expect(PAIRS[61]).toEqual(['obedient', 'sociable']);
    expect(PAIRS.flat().every(traitOf)).toBe(true);
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

describe('how far she may go', () => {
  const order = (f) => ['country', 'account', 'form', 'review', ...afterSteps(f)];
  it('an empty form stops her at the form', () => {
    const f = emptyForm('fi');
    expect(firstUnfinished(order(f), f)).toBe('form');
  });
  it('a filled form with its document missing stops her at the documents', () => {
    const f = filled('fi');
    expect(firstUnfinished(order(f), f)).toBe('documents');
  });
  it('a name cleared after the fact stops her at the form again', () => {
    const f = { ...filled('fi'), firstName: '', documents: { Lähihoitaja: 'todistus.pdf' }, channel: 'viber' };
    expect(firstUnfinished(order(f), f)).toBe('form');
  });
  it('all done: nothing stops her', () => {
    const f = { ...filled('fi'), documents: { Lähihoitaja: 'todistus.pdf' }, channel: 'viber' };
    expect(firstUnfinished(order(f), f)).toBeNull();
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

describe('marketDate', () => {
  it('writes a date of birth as the market does, whatever the language', () => {
    const d = new Date(1967, 10, 8);
    expect(marketDate(d, 'fi')).toBe('8.11.1967');
    expect(marketDate(d, 'sr')).toBe('08.11.1967.');
  });
  it('goes into her record in her market\'s figures', () => {
    const f = { ...filled('sr'), birth: new Date(1967, 10, 8).getTime() };
    expect(recordFrom(f, 'reg-1').birth).toBe('08.11.1967.');
  });
});

describe('languageOptions', () => {
  it('offers her market\'s four, each with a capital', () => {
    expect(languageOptions('sr').map((o) => o.label)).toEqual(['Srpski', 'Engleski', 'Nemački', 'Francuski']);
    expect(languageOptions('FI').map((o) => o.label)).toEqual(['Finski', 'Švedski', 'Norveški', 'Engleski']);
  });
  it('keeps one she already had that the list no longer offers, so it can be taken off', () => {
    expect(languageOptions('RS', ['srpski', 'ruski']).map((o) => o.value)).toEqual(['srpski', 'engleski', 'nemački', 'francuski', 'ruski']);
  });
});
