import { describe, expect, it } from 'vitest';
import { NONE, caregiverCount } from './caregiverCounts';
import { municipalityGroups } from './caregiverProfile';

describe('caregiverCount', () => {
  it('is the same number for the same municipality', () => {
    expect(caregiverCount('sr', 'Niš')).toBe(caregiverCount('sr', 'Niš'));
  });
  it('is none where the demo has none, and those are on the list', () => {
    for (const m of ['sr', 'fi']) {
      const all = municipalityGroups(m).flatMap((g) => g.options.map((o) => o.value));
      for (const place of NONE[m]) {
        expect(all).toContain(place);
        expect(caregiverCount(m, place)).toBe(0);
      }
    }
  });
  it('is at least one everywhere else, more in the capital', () => {
    for (const m of ['sr', 'fi'])
      for (const { value } of municipalityGroups(m).flatMap((g) => g.options))
        if (!NONE[m].includes(value)) expect(caregiverCount(m, value)).toBeGreaterThan(0);
    expect(caregiverCount('sr', 'Vračar, Beograd')).toBeGreaterThanOrEqual(5);
  });
  it('is none with no municipality', () => expect(caregiverCount('fi', '')).toBe(0));
});
