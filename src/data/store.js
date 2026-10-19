// The demo's shared state, one per market: the family's person and what they
// pay, and the caregiver's other clients. Kept in localStorage so a reload
// keeps it and a second tab reads it; every save tells the other tabs over a
// BroadcastChannel, so the family in one tab and the caregiver in another see
// each other's doing at once. The last save wins: a demo, not a database.
// Without storage (a private window) it all still works in one tab, unkept
// (docs/superpowers/specs/2026-10-19-temelj-design.md).

export const VERSION = 1;
const key = (market) => `nana.demo.${market}`;
const CHANNEL = 'nana.demo';

const safe = (fn, fallback) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export function createStore({
  storage = safe(() => globalThis.localStorage, null),
  Channel = globalThis.BroadcastChannel ?? null,
  onStorage = typeof window !== 'undefined' ? (fn) => (window.addEventListener('storage', fn), () => window.removeEventListener('storage', fn)) : null,
} = {}) {
  const channel = Channel ? safe(() => new Channel(CHANNEL), null) : null;
  const listeners = new Set();

  const load = (market) => {
    const raw = storage ? safe(() => storage.getItem(key(market)), null) : null;
    if (!raw) return null;
    const parsed = safe(() => JSON.parse(raw), null);
    if (!parsed || parsed.v !== VERSION) return null;
    const { v, ...state } = parsed;
    return state;
  };
  const tell = (market) => channel && safe(() => channel.postMessage({ market }));
  const save = (market, state) => {
    if (storage) safe(() => storage.setItem(key(market), JSON.stringify({ ...state, v: VERSION })));
    tell(market);
  };
  const reset = (market) => {
    if (storage) safe(() => storage.removeItem(key(market)));
    tell(market);
  };

  // another tab saved: read what it left, for whoever watches that market
  const heard = (market) => listeners.forEach((l) => l.market === market && l.fn(load(market)));
  if (channel) channel.onmessage = (e) => e?.data?.market && heard(e.data.market);
  // the browser's own event, for a tab that missed the message
  onStorage?.((e) => {
    const m = /^nana\.demo\.(fi|sr)$/.exec(e?.key || '');
    if (m) heard(m[1]);
  });

  const subscribe = (market, fn) => {
    const l = { market, fn };
    listeners.add(l);
    return () => listeners.delete(l);
  };

  return { load, save, reset, subscribe };
}

export const store = createStore();
