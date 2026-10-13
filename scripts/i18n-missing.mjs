// Lists what the dictionaries lack: every t('…'), tn(…) and msg('…') key in src/
// with no English or Finnish entry, and Serbian text left outside them.
//   node scripts/i18n-missing.mjs            missing keys and unwrapped text
//   node scripts/i18n-missing.mjs --unused   also entries no code uses any more
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('..', import.meta.url).pathname;
const src = join(root, 'src');
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(jsx?|mjs)$/.test(f) ? [p] : [];
  });

const files = walk(src).filter((p) => !p.includes('/i18n/') && !p.includes('/stories/'));

// a JS string literal, quoted with ' " or ` (no ${} inside)
const STR = String.raw`('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\`(?:[^\`\\$]|\\.)*\`)`;
const unquote = (s) => {
  const q = s[0];
  return s.slice(1, -1).replace(/\\(.)/g, (m, c) => (c === 'n' ? '\n' : c === q || c === '\\' ? c : m));
};
const used = new Map(); // key -> first file
const unwrapped = [];
const SERBIAN = /[čćžšđČĆŽŠĐ]/;

for (const file of files) {
  const code = readFileSync(file, 'utf8');
  const rel = relative(root, file);
  const spans = [];
  for (const m of code.matchAll(new RegExp(String.raw`\b(?:t|msg)\(\s*` + STR, 'g'))) {
    const key = unquote(m[1]);
    if (!used.has(key)) used.set(key, rel);
    spans.push([m.index, m.index + m[0].length]);
  }
  for (const m of code.matchAll(new RegExp(String.raw`\btn\(\s*[^,]+,\s*` + STR + String.raw`\s*,\s*` + STR + String.raw`\s*,\s*` + STR, 'g'))) {
    const key = [m[1], m[2], m[3]].map(unquote).join('|');
    if (!used.has(key)) used.set(key, rel);
    spans.push([m.index, m.index + m[0].length]);
  }
  // Serbian outside any of them: string literals and JSX text, comments skipped
  const bare = code.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`])\/\/[^\n]*/g, (c, p) => p + ' '.repeat(c.length - p.length));
  const inside = (i) => spans.some(([a, b]) => i >= a && i < b);
  // whole template literals first, so one with ${} inside is skipped as a unit
  const ANY = String.raw`('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\`(?:[^\`\\]|\\.)*\`)`;
  for (const m of bare.matchAll(new RegExp(ANY + String.raw`|>([^<>{}]+)<`, 'g'))) {
    if (m[1]?.[0] === '`' && m[1].includes('${')) continue;
    const text = m[1] ? unquote(m[1]) : m[2];
    if (SERBIAN.test(text) && !inside(m.index)) {
      const line = bare.slice(0, m.index).split('\n').length;
      unwrapped.push(`${rel}:${line}  ${text.trim().slice(0, 80)}`);
    }
  }
}

let problems = 0;
for (const lang of ['en', 'fi']) {
  const dir = join(src, 'i18n', lang);
  const dict = {};
  for (const f of readdirSync(dir).filter((f) => f !== 'index.js' && f.endsWith('.js'))) {
    Object.assign(dict, (await import(pathToFileURL(join(dir, f)).href)).default);
  }
  const lacking = [...used].filter(([k]) => !(k in dict));
  problems += lacking.length;
  console.log(`\n${lang}: ${lacking.length} missing of ${used.size}`);
  for (const [k, f] of lacking) console.log(`  ${f}  ${JSON.stringify(k)}`);
  if (process.argv.includes('--unused')) {
    const unused = Object.keys(dict).filter((k) => !used.has(k));
    console.log(`${lang}: ${unused.length} unused`);
    for (const k of unused) console.log(`  ${JSON.stringify(k)}`);
  }
}
console.log(`\nSerbian outside t(): ${unwrapped.length}`);
for (const u of unwrapped) console.log(`  ${u}`);
process.exitCode = problems + unwrapped.length ? 1 : 0;
