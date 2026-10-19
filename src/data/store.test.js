import { describe, expect, it, vi } from 'vitest';
import { createStore, VERSION } from './store';
import { demoPerson } from './person';
import { demoAnswers, demoNotes, demoUser } from './demoCase';
import { fillCare } from './demoFill';
import { withAnswers } from './familyStart';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), raw: m };
};
// two tabs: one bus, a channel per tab, a message reaches every other one
const bus = () => {
  const all = new Set();
  return class {
    constructor() { all.add(this); this.onmessage = null; }
    postMessage(data) { for (const c of all) if (c !== this) c.onmessage?.({ data }); }
    close() { all.delete(this); }
  };
};
const state = (n = 1) => ({ person: { answers: { n } }, family: { unlocked: false, subscription: null }, clients: [] });

describe('store', () => {
  it('keeps a state per market', () => {
    const s = createStore({ storage: memory(), Channel: bus() });
    s.save('fi', state(1));
    s.save('sr', state(2));
    expect(s.load('fi').person.answers.n).toBe(1);
    expect(s.load('sr').person.answers.n).toBe(2);
  });

  it('has nothing for a market never saved', () => {
    expect(createStore({ storage: memory(), Channel: bus() }).load('fi')).toBeNull();
  });

  it('starts over on another version or on broken JSON', () => {
    const storage = memory();
    const s = createStore({ storage, Channel: bus() });
    storage.setItem('nana.demo.fi', JSON.stringify({ v: VERSION + 1, ...state() }));
    expect(s.load('fi')).toBeNull();
    storage.setItem('nana.demo.fi', '{not json');
    expect(s.load('fi')).toBeNull();
  });

  it('tells the other tab, not itself, and only for its market', () => {
    const storage = memory();
    const Channel = bus();
    const a = createStore({ storage, Channel });
    const b = createStore({ storage, Channel });
    const seenByA = vi.fn();
    const seenByB = vi.fn();
    const seenByBsr = vi.fn();
    a.subscribe('fi', seenByA);
    b.subscribe('fi', seenByB);
    b.subscribe('sr', seenByBsr);
    a.save('fi', state(7));
    expect(seenByB).toHaveBeenCalledWith(expect.objectContaining({ person: { answers: { n: 7 } } }));
    expect(seenByA).not.toHaveBeenCalled();
    expect(seenByBsr).not.toHaveBeenCalled();
  });

  it('forgets a market on reset, and tells the other tab', () => {
    const storage = memory();
    const Channel = bus();
    const a = createStore({ storage, Channel });
    const b = createStore({ storage, Channel });
    const seen = vi.fn();
    b.subscribe('fi', seen);
    a.save('fi', state());
    a.reset('fi');
    expect(a.load('fi')).toBeNull();
    expect(seen).toHaveBeenLastCalledWith(null);
  });

  it('works with no storage and no channel, as in a private window', () => {
    const s = createStore({ storage: null, Channel: null });
    expect(() => s.save('fi', state())).not.toThrow();
    expect(s.load('fi')).toBeNull();
    expect(() => s.subscribe('fi', () => {})()).not.toThrow();
  });

  it('a filled demo comes back exactly as it was saved', () => {
    const p = demoPerson(demoAnswers, demoNotes, demoUser);
    const full = { person: { ...p, care: fillCare(withAnswers(p.care, demoAnswers, demoUser)) }, family: { unlocked: true, subscription: { planId: 'monthly', at: 1 } }, clients: [] };
    const s = createStore({ storage: memory(), Channel: bus() });
    s.save('fi', full);
    expect(s.load('fi')).toEqual(full);
  });
});
