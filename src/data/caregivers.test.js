import { describe, expect, it } from 'vitest';
import { caregiverById, caregivers } from './carePlan';
import { caregiversRs } from './caregiversRs';

describe('caregiverById', () => {
  it('finds a Finnish caregiver', () => {
    expect(caregiverById('sanna')?.name).toBe('Sanna Virtanen');
  });
  it('finds a Serbian caregiver, who is not on the Finnish list', () => {
    expect(caregiverById('milica')?.market).toBe('RS');
    expect(caregivers.some((c) => c.id === 'milica')).toBe(false);
  });
  it('is undefined for nobody', () => {
    expect(caregiverById('nobody')).toBeUndefined();
  });
  it('gives the Serbian one everything a request and an arrangement read', () => {
    const m = caregiversRs[0];
    for (const key of ['id', 'name', 'initials', 'phone', 'email', 'area', 'radius', 'languages', 'bio', 'education']) {
      expect(m[key], key).toBeDefined();
    }
  });
});
