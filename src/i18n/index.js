import { useSyncExternalStore } from 'react';
import en from './en';
import fi from './fi';

// The app is written in Serbian and translated at the moment a text is shown.
// The Serbian sentence is its own key: `t('Sačuvaj')` reads "Save" in English,
// and a sentence nobody translated yet stays Serbian instead of breaking.
//
//   t('Sačuvaj')                          a fixed text
//   t('Plaćeno {amount}', { amount })     with a value in it; the key keeps {amount}
//   tn(n, 'usluga', 'usluge', 'usluga')   a count with its noun: 1 usluga, 3 usluge, 5 usluga
//   msg('Sačuvaj')                        marks a text kept in a constant or in
//                                         stored data; it is translated where shown, t(x)
//
// Dictionaries are src/i18n/en/*.js and src/i18n/fi/*.js, one file per part of the
// app. `node scripts/i18n-missing.mjs` lists the keys that have no translation.

export const LANGUAGES = [
  { id: 'sr', label: 'Srpski', locale: 'sr-Latn-RS' },
  { id: 'en', label: 'English', locale: 'en-GB' },
  { id: 'fi', label: 'Suomi', locale: 'fi-FI' },
];
const DICTIONARIES = { en, fi };
const STORAGE = 'nana.lang';

const read = () => {
  try {
    const v = localStorage.getItem(STORAGE);
    return LANGUAGES.some((l) => l.id === v) ? v : 'sr';
  } catch {
    return 'sr';
  }
};

let current = read();
const listeners = new Set();

export const getLang = () => current;
export const locale = () => LANGUAGES.find((l) => l.id === current).locale;

export function setLang(id) {
  if (!LANGUAGES.some((l) => l.id === id) || id === current) return;
  current = id;
  try {
    localStorage.setItem(STORAGE, id);
  } catch {
    /* the choice lasts until reload */
  }
  document.documentElement.lang = id;
  listeners.forEach((f) => f());
}

const subscribe = (f) => {
  listeners.add(f);
  return () => listeners.delete(f);
};
// The language as React state: a component that reads it renders again on a switch.
export const useLang = () => useSyncExternalStore(subscribe, getLang);

const fill = (text, vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(vars[k]))) : text;

export function t(key, vars) {
  if (key == null || key === '') return key;
  const found = current === 'sr' ? key : DICTIONARIES[current]?.[key];
  if (found === undefined && import.meta.env?.DEV) missing(key);
  return fill(found ?? key, vars);
}

export const msg = (key) => key;

// Serbian has three forms of a counted noun, English and Finnish two. The key is
// the three Serbian forms joined by "|", so the dictionary entry is "service|services".
export function tn(n, one, few, many, vars) {
  const key = `${one}|${few}|${many}`;
  if (current === 'sr') {
    const d = n % 10;
    const h = n % 100;
    const word = d === 1 && h !== 11 ? one : d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many;
    return `${n} ${fill(word, vars)}`;
  }
  const found = DICTIONARIES[current]?.[key];
  if (found === undefined && import.meta.env?.DEV) missing(key);
  const [sing, plural] = (found ?? key).split('|');
  return `${n} ${fill(n === 1 ? sing : plural ?? sing, vars)}`;
}

const seen = new Set();
function missing(key) {
  if (seen.has(key)) return;
  seen.add(key);
  console.warn(`[i18n] ${current}: no translation for`, JSON.stringify(key));
}

if (typeof document !== 'undefined') document.documentElement.lang = current;
