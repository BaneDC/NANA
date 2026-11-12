import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDraft, DRAFT_DAYS, loadDraft, saveDraft } from './signupDraft';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), raw: m };
};
const draft = { screen: 'form', reached: 'form', market: 'fi', f: { firstName: 'Aino', documents: { Lähihoitaja: 'todistus.pdf' } }, account: { email: 'a@b.fi' }, open: 1, done: ['basic'], sent: null };
const DAY = 24 * 3600 * 1000;

describe('signup draft', () => {
  let storage;
  beforeEach(() => {
    storage = memory();
    vi.stubGlobal('localStorage', storage);
  });
  it('comes back as it was saved', () => {
    saveDraft(draft, 1000);
    expect(loadDraft(1000 + DAY)).toMatchObject(draft);
  });
  it('lasts a week, and goes after', () => {
    expect(DRAFT_DAYS).toBe(7);
    saveDraft(draft, 0);
    expect(loadDraft(7 * DAY)).toMatchObject(draft);
    expect(loadDraft(7 * DAY + 1)).toBeNull();
    expect(storage.raw.size).toBe(0);
  });
  it('a broken one is no draft', () => {
    storage.setItem('nana.signup.caregiver', '{not json');
    expect(loadDraft()).toBeNull();
  });
  it('clears', () => {
    saveDraft(draft);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });
  it('no storage, no draft, no error', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => saveDraft(draft)).not.toThrow();
    expect(loadDraft()).toBeNull();
  });
});
