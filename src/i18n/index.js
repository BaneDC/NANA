import { useLayoutEffect, useSyncExternalStore } from 'react';
import { eur } from '../lib/money';
import en from './en';
import fi from './fi';

// The app is written in Serbian and translated at the moment a text is shown.
// The Serbian sentence is its own key: `t('Sačuvaj')` reads "Save" in English,
// and a sentence nobody translated yet stays Serbian instead of breaking.
//
//   t('Sačuvaj')                          a fixed text
//   t('Plaćeno {amount}', { amount })     with a value in it; the key keeps {amount}
//   tn(n, 'usluga', 'usluge', 'usluga')   a count with its noun: 1 usluga, 3 usluge, 5 usluga
//   msg('Sačuvaj')                        marks a text kept in a constant; it is
//                                         translated where shown, t(x)
//   say('Plaćeno {amount}', { amount: { $eur: 48 } })
//                                         a sentence kept in stored data (a log entry,
//                                         a message): the key and its values, not the
//                                         words, so t(x) says it in whatever language is
//                                         chosen when it is read. A value can be a number
//                                         or name as it is, { $eur: n } for money,
//                                         { $t: 'key' } or another say(...) for words,
//                                         and { $fmt: 'name', value } for a formatter a
//                                         module registered with registerFormat.
//   localized(() => text)                 a text worked out from much else (a plan
//                                         change, a record entry), worked out once in
//                                         every language and kept as all three; t(x)
//                                         picks the one being read. Any shape: each
//                                         string in what fn returns is kept that way.
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
  // what is drawn again starts from the top, so where each page was scrolled to
  // is kept here and put back by useKeepScroll before the new words are painted
  kept = [...document.querySelectorAll(SCROLLERS)].map((e) => e.scrollTop);
  listeners.forEach((f) => f());
}

const SCROLLERS = '[data-slot=page], [data-slot=gallery]';
let kept = null;

// For the component that draws everything again on a switch (keyed by the
// language): the pages under it stay scrolled where they were.
export function useKeepScroll(lang) {
  useLayoutEffect(() => {
    if (!kept) return;
    document.querySelectorAll(SCROLLERS).forEach((e, i) => {
      if (kept[i]) e.scrollTop = kept[i];
    });
    kept = null;
  }, [lang]);
}

const subscribe = (f) => {
  listeners.add(f);
  return () => listeners.delete(f);
};
// The language as React state: a component that reads it renders again on a switch.
export const useLang = () => useSyncExternalStore(subscribe, getLang);

// How a value inside a stored sentence is said, decided when it is read.
const formats = {
  eur: (n) => eur(n),
  // the same text in every language (localized): one string when they agree
  lang: (v) => (typeof v === 'string' ? v : v?.[current] ?? v?.sr ?? ''),
};
export const registerFormat = (name, fn) => {
  formats[name] = fn;
};

function value(v) {
  if (v == null || typeof v !== 'object') return v;
  if ('$eur' in v) return formats.eur(v.$eur);
  if ('$t' in v) return t(v.$t, v.vars);
  if ('$fmt' in v) return formats[v.$fmt] ? formats[v.$fmt](v.value) : String(v.value);
  return String(v);
}

const fill = (text, vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(value(vars[k])))) : text;

// A sentence for stored data: see the top of this file.
export const say = (key, vars) => (vars ? { $t: key, vars } : { $t: key });
export const isSaid = (x) => x != null && typeof x === 'object' && '$t' in x;

export function t(key, vars) {
  if (isSaid(key)) return t(key.$t, key.vars);
  // a money amount or a formatted value kept on its own ({ $eur }, { $fmt })
  if (key != null && typeof key === 'object' && !Array.isArray(key)) return String(value(key));
  if (key == null || key === '') return key;
  const found = current === 'sr' ? key : DICTIONARIES[current]?.[key];
  if (found === undefined && import.meta.env?.DEV) missing(key);
  return fill(found ?? key, vars);
}

export const msg = (key) => key;

// The same text in English whatever the app is set to: for what only the model
// reads (tool descriptions, tool results, the state under the prompt), which is
// written once, in English, for every language.
export function inEnglish(key, vars) {
  if (isSaid(key)) return inEnglish(key.$t, key.vars);
  return fill(DICTIONARIES.en[key] ?? key, vars);
}

// A text that is either a key (the demo's answers are written as keys) or what
// someone typed: translated when the dictionary has it, as it is otherwise, and
// not reported as missing.
export const known = (text) =>
  typeof text !== 'string' ? t(text) : current === 'sr' ? text : DICTIONARIES[current]?.[text] ?? text;

// Worked out in each language in turn, without telling anyone the language
// changed, and kept as one value: a string that differs between languages
// becomes { $fmt: 'lang', value: { sr, en, fi } }, read with t().
export function localized(fn) {
  const was = current;
  const out = {};
  try {
    for (const l of LANGUAGES) {
      current = l.id;
      out[l.id] = fn();
    }
  } finally {
    current = was;
  }
  return merge(LANGUAGES.map((l) => out[l.id]));
}
function merge(all) {
  const [first] = all;
  if (typeof first === 'string') {
    if (all.every((x) => x === first)) return first;
    return { $fmt: 'lang', value: Object.fromEntries(LANGUAGES.map((l, i) => [l.id, all[i]])) };
  }
  if (Array.isArray(first)) return first.map((_, i) => merge(all.map((x) => x?.[i])));
  if (first && typeof first === 'object' && Object.getPrototypeOf(first) === Object.prototype && !isSaid(first)) {
    return Object.fromEntries(Object.keys(first).map((k) => [k, merge(all.map((x) => x?.[k]))]));
  }
  return first;
}

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
