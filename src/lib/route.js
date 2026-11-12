import { useSyncExternalStore } from 'react';

// Every page and every step of signing up or in has an address (decided
// 12. 11.; docs/superpowers/specs/2026-11-12-rutiranje-design.md). English and
// the same in every language. Drawers and modals have none.
//
// A route is { page, id?, who?, step? }: `page` null is "/", "unknown" any
// address not in the table.

// pages that are one word in the address and the route alike
const PLAIN = ['onboarding', 'chat', 'dashboard', 'requests', 'find-caregiver', 'record', 'settings', 'board', 'clients', 'earnings', 'profile'];
// pages with an id: the address's word, and the route's page
const WITH_ID = { caregivers: 'caregiver', clients: 'client' };
const ID_WORD = Object.fromEntries(Object.entries(WITH_ID).map(([word, page]) => [page, word]));
export const CAREGIVER_STEPS = ['account', 'form', 'review', 'documents', 'test', 'interview', 'thanks'];
const SIGNIN_STEPS = ['verify', 'reset'];

const UNKNOWN = { page: 'unknown' };

export function parse(pathname) {
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const [first, second, third, ...rest] = parts;
  if (!first) return { page: null };
  if (rest.length) return UNKNOWN;
  if (first === 'signup') {
    if (!second) return third ? UNKNOWN : { page: 'signup' };
    if (second === 'family') return third ? UNKNOWN : { page: 'signup', who: 'family' };
    if (second !== 'caregiver') return UNKNOWN;
    if (!third) return { page: 'signup', who: 'caregiver' };
    return CAREGIVER_STEPS.includes(third) ? { page: 'signup', who: 'caregiver', step: third } : UNKNOWN;
  }
  if (third) return UNKNOWN;
  if (first === 'signin') {
    if (!second) return { page: 'signin' };
    return SIGNIN_STEPS.includes(second) ? { page: 'signin', step: second } : UNKNOWN;
  }
  if (second) return WITH_ID[first] ? { page: WITH_ID[first], id: second } : UNKNOWN;
  return PLAIN.includes(first) ? { page: first } : UNKNOWN;
}

export function href(route) {
  const { page, id, who, step } = route || {};
  if (!page) return '/';
  const enc = encodeURIComponent;
  if (page === 'signup') return ['/signup', who, step].filter(Boolean).join('/');
  if (page === 'signin') return ['/signin', step].filter(Boolean).join('/');
  if (ID_WORD[page]) return `/${ID_WORD[page]}/${enc(id)}`;
  return `/${page}`;
}

// What stays in the address from page to page: the demo's ?demo and
// &trziste, so a reload is still the demo. &puno fills the demo once, on the
// first load, and goes.
export function keptSearch(search) {
  const q = new URLSearchParams(search);
  q.delete('puno');
  const s = q.toString().replace(/=(?=&|$)/g, '');
  return s ? `?${s}` : '';
}

const listeners = new Set();
const notify = () => listeners.forEach((l) => l());
const subscribe = (l) => {
  listeners.add(l);
  window.addEventListener('popstate', l);
  return () => {
    listeners.delete(l);
    window.removeEventListener('popstate', l);
  };
};

const here = () => window.location.pathname;

// A new step in the history, or the current one replaced. The step remembers
// the address it was taken from (`prev`), so goBackTo can tell when going back
// is the same as going there.
export function navigate(to, { replace = false, state } = {}) {
  const url = href(to) + keptSearch(window.location.search);
  const prev = replace ? window.history.state?.prev : here();
  const next = { ...state, prev };
  if (url === here() + window.location.search && !replace) return;
  window.history[replace ? 'replaceState' : 'pushState'](next, '', url);
  notify();
}

// Our "Nazad": where it leads, as before. When that is the step before this
// one, it goes back to it, so the browser's back afterwards does not lead
// forward to the page just left; otherwise (the page was opened from a link)
// it goes there as a new step.
export function goBackTo(to, opts) {
  if (window.history.state?.prev === href(to)) window.history.back();
  else navigate(to, opts);
}

// cached per address and state, so useSyncExternalStore sees a stable value
let cache = { key: null, value: null };
function snapshot() {
  const state = window.history.state;
  const key = here();
  if (cache.key !== key || cache.value.state !== state) cache = { key, value: { route: parse(key), state } };
  return cache.value;
}

export function useRoute() {
  return useSyncExternalStore(subscribe, snapshot);
}
