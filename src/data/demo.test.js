import { describe, expect, it } from 'vitest';
import { demoAccount, demoEntry, seedState, toCountry } from './demo';

describe('demoEntry', () => {
  it('is nothing without demo', () => expect(demoEntry('?kartice')).toBeNull());
  it('is the Finnish family by default', () =>
    expect(demoEntry('?demo')).toEqual({ role: 'family', market: 'fi', filled: false, explicit: false }));
  it('reads the caregiver and the market', () =>
    expect(demoEntry('?demo=negovateljica&trziste=sr')).toEqual({ role: 'caregiver', market: 'sr', filled: false, explicit: true }));
  it('keeps ?demo=rs as the Serbian family', () =>
    expect(demoEntry('?demo=rs')).toEqual({ role: 'family', market: 'sr', filled: false, explicit: true }));
  it('reads puno', () => expect(demoEntry('?demo&puno').filled).toBe(true));
});

describe('demoAccount', () => {
  it('a caregiver account names her caregiver record', () => {
    expect(demoAccount('caregiver', 'fi')).toMatchObject({ role: 'caregiver', caregiverId: 'sanna', country: 'FI' });
    expect(demoAccount('caregiver', 'sr')).toMatchObject({ role: 'caregiver', caregiverId: 'milica', country: 'RS' });
  });
  it('a family account is on its market', () => {
    expect(demoAccount('family', 'fi').country).toBe('FI');
    expect(demoAccount('family', 'sr').country).toBe('RS');
  });
});

describe('seedState', () => {
  it('starts the family with a plan and nobody asked', () => {
    const s = seedState('fi', { filled: false });
    expect(s.person.planMade).toBe(true);
    expect(s.person.care.requests).toEqual([]);
    expect(s.family).toEqual({ unlocked: false, subscription: null });
    expect(s.clients.length).toBeGreaterThan(0);
    expect(seedState('sr', { filled: false }).clients).toEqual([]);
  });
  it('filled is a week into care, paid', () => {
    const s = seedState('fi', { filled: true });
    expect(s.person.care.arrangements.length).toBeGreaterThan(0);
    expect(s.family.unlocked).toBe(true);
  });
  it('the Serbian family lives in Belgrade', () => {
    expect(seedState('sr', { filled: false }).person.answers['about-person'].values.city).toMatch(/Beograd/);
  });
  it('maps the market to the country the app speaks of', () => {
    expect([toCountry('fi'), toCountry('sr')]).toEqual(['FI', 'RS']);
  });
});
