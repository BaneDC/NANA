# Rutiranje Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every page and every sign-up/sign-in step gets its own address, so the browser's back/forward/reload work, without removing any "Nazad" button.

**Architecture:** A small router over the History API (`src/lib/route.js`: parse/href/navigate/goBackTo/useRoute) plus a pure guard (`src/lib/routeGuard.js`: homeOf/resolve) that redirects addresses the signed-in role may not see. The app keeps its existing `view` naming: `view` is derived from the address and `setView` becomes a thin wrapper over `navigate`, so `AppNav` and the many `setView(...)` calls stay as they are. The caregiver's sign-up keeps its form in memory and in a 7-day `localStorage` draft, with its step taken from the address.

**Tech Stack:** React 19, Vite 8, vitest 5, puppeteer-core (checks in the session scratchpad), Vercel (`vercel.json`, `middleware.js`).

**Spec:** `docs/superpowers/specs/2026-11-12-rutiranje-design.md` (read it first; rule numbers below refer to it).

## Global Constraints

- Work on branch `rutiranje`; never merge to `main` without Branislav saying so. Pull before push.
- No new dependency (no React Router).
- Addresses are English and the same in every language (spec table). Route names: `signup`, `signin`, `onboarding`, `chat`, `dashboard`, `caregiver`, `requests`, `find-caregiver`, `record`, `settings`, `board`, `clients`, `client`, `earnings`, `profile`.
- Drawers and modals get no address. The family onboarding and the personality test are one address each.
- No "Nazad" button is removed; no visual change. `docs/patterns.md` is binding (CLAUDE.md); §13 check at 1440 and 375×812 after UI changes, zero new findings.
- `?demo=…&trziste=…` stays in the address on every page; one-off `&puno` is dropped after its first read. `/?kartice` untouched.
- Every user-visible string through `t()` with en/fi entries; `node scripts/i18n-missing.mjs` reports 0.
- Log in `docs/changes/GGGG-MM-DD.md` (Serbian) on the day of work.

## Review Focus

1. **The onboarding's summary**: the plan exists while the summary is still on screen; `/onboarding` must not redirect to `/dashboard` until "finish" (pinned in Task 2 with `summaryShowing`).
2. **Redirect loops**: `resolve(homeOf(ctx), ctx)` must be `null` for every role/market/plan combination (pinned in Task 2).
3. **A stale deep link** (`/clients/x` for a client not in this browser's demo state, `/caregivers/x` unknown) goes home with `replace`, not to a blank page (pinned in Task 2, checked in Task 7).
4. **Back after our "Nazad"** must not go forward to the page just left (pinned in Task 1 `goBackTo`, checked in Task 7).
5. **Language switch on `/signup/caregiver`** keeps her screen and chosen country (draft, Task 5; checked in Task 7).

---

### Task 1: Router core and Vercel fallback

**Files:**
- Create: `src/lib/route.js`
- Test: `src/lib/route.test.js`
- Modify: `vercel.json` (add rewrites)

**Interfaces:**
- Produces:
  - `type Route = { page: string|null, id?: string, who?: 'family'|'caregiver', step?: string }`; `page: null` is `/`, `page: 'unknown'` anything else not in the table.
  - `parse(pathname: string): Route`
  - `href(route: Route): string`; inverse of `parse` for every table address.
  - `navigate(to: Route, opts?: { replace?: boolean, state?: object }): void`; pushes (or replaces) `href(to)` + the kept query; stores `{ ...state, prev: <href before> }` in `history.state`; notifies subscribers.
  - `goBackTo(to: Route, opts?: { state?: object }): void`; `history.back()` when `history.state?.prev === href(to)`, else `navigate(to, opts)`.
  - `useRoute(): { route: Route, state: object|null }` via `useSyncExternalStore` on `popstate` + navigate notifications.
  - `keptSearch(search: string): string`; drops `puno`, keeps the rest.

- [ ] **Step 0: Branch** — `git switch main && git pull && git switch -c rutiranje`.
- [ ] **Step 1: Write failing tests** in `src/lib/route.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { href, keptSearch, parse } from './route';

const table = [
  ['/', { page: null }],
  ['/signup', { page: 'signup' }],
  ['/signup/family', { page: 'signup', who: 'family' }],
  ['/signup/caregiver', { page: 'signup', who: 'caregiver' }],
  ['/signup/caregiver/documents', { page: 'signup', who: 'caregiver', step: 'documents' }],
  ['/signin', { page: 'signin' }],
  ['/signin/verify', { page: 'signin', step: 'verify' }],
  ['/signin/reset', { page: 'signin', step: 'reset' }],
  ['/onboarding', { page: 'onboarding' }],
  ['/dashboard', { page: 'dashboard' }],
  ['/caregivers/sanna', { page: 'caregiver', id: 'sanna' }],
  ['/find-caregiver', { page: 'find-caregiver' }],
  ['/board', { page: 'board' }],
  ['/clients', { page: 'clients' }],
  ['/clients/c-12', { page: 'client', id: 'c-12' }],
];
describe('route', () => {
  it.each(table)('parses %s', (path, route) => expect(parse(path)).toEqual(route));
  it.each(table)('writes %s back', (path, route) => expect(href(route)).toBe(path));
  it('anything else is unknown', () => {
    expect(parse('/nope')).toEqual({ page: 'unknown' });
    expect(parse('/signup/caregiver/nope')).toEqual({ page: 'unknown' });
    expect(parse('/clients/a/b')).toEqual({ page: 'unknown' });
  });
  it('a trailing slash is the same page', () => expect(parse('/board/')).toEqual({ page: 'board' }));
  it('an id is decoded and encoded', () => {
    expect(parse('/clients/a%20b')).toEqual({ page: 'client', id: 'a b' });
    expect(href({ page: 'client', id: 'a b' })).toBe('/clients/a%20b');
  });
  it('keeps the demo, drops puno', () => {
    expect(keptSearch('?demo=negovateljica&trziste=fi&puno')).toBe('?demo=negovateljica&trziste=fi');
    expect(keptSearch('')).toBe('');
  });
});
```

Valid caregiver steps: `account, form, review, documents, test, interview, thanks`.

- [ ] **Step 2: Run** `npx vitest run src/lib/route.test.js` — FAIL (module missing).
- [ ] **Step 3: Implement** `src/lib/route.js` with the interfaces above. `keptSearch` must keep `?demo` with an empty value as `?demo` (not `?demo=`).
- [ ] **Step 4: Run** `npx vitest run src/lib/route.test.js` — PASS.
- [ ] **Step 5: Vercel fallback** — add to `vercel.json`: `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]` (static files are matched first; `middleware.js` still runs on every request).
- [ ] **Step 6: Commit** — `git add src/lib/route.js src/lib/route.test.js vercel.json && git commit -m "Every page an address: the router and its table"` (with the Co-Authored-By line).

### Task 2: Guard — which address this person may see

**Files:**
- Create: `src/lib/routeGuard.js`
- Test: `src/lib/routeGuard.test.js`

**Interfaces:**
- Consumes: `Route` from Task 1.
- Produces:
  - `type Ctx = { signedIn: boolean, role: 'family'|'caregiver', market: 'fi'|'sr', hasPlan: boolean, summaryShowing: boolean, hasClient: (id) => boolean, hasCaregiver: (id) => boolean }`
  - `homeOf(ctx: Ctx): Route` — signed out `{page:'signup'}`; family without plan `{page:'onboarding'}`, with plan `{page:'dashboard'}`; caregiver fi `{page:'board'}`, sr `{page:'requests'}`.
  - `resolve(route: Route, ctx: Ctx): Route|null` — the address to replace with, or `null` when allowed.

Rules (spec 4, 5, 6, 14):
- Signed out: `signup*`, `signin*` allowed; `/` → `signup`; anything else → `{page:'signin'}`.
- Signed in on `signup*`/`signin*`/`/`/`unknown` → `homeOf`.
- Family: allowed `chat, dashboard, caregiver(hasCaregiver), requests, find-caregiver, record, settings, onboarding`. Without plan every family page except `onboarding` → `onboarding`. With plan `onboarding` → `dashboard` unless `summaryShowing`.
- Caregiver fi: `board, clients, client(hasClient), earnings, profile, settings`. sr: `requests, client(hasClient), profile, settings`. Else → `homeOf`.

- [ ] **Step 1: Write failing tests** in `src/lib/routeGuard.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { homeOf, resolve } from './routeGuard';

const base = { signedIn: true, role: 'family', market: 'fi', hasPlan: true, summaryShowing: false, hasClient: (id) => id === 'c1', hasCaregiver: (id) => id === 'sanna' };
const ctxs = [false, true].flatMap((signedIn) => ['family', 'caregiver'].flatMap((role) => ['fi', 'sr'].flatMap((market) => [false, true].map((hasPlan) => ({ ...base, signedIn, role, market, hasPlan })))));

describe('guard', () => {
  it.each(ctxs)('home never redirects (%o)', (ctx) => expect(resolve(homeOf(ctx), ctx)).toBeNull());
  it('signed out: app page goes to sign-in, / to sign-up', () => {
    const out = { ...base, signedIn: false };
    expect(resolve({ page: 'board' }, out)).toEqual({ page: 'signin' });
    expect(resolve({ page: null }, out)).toEqual({ page: 'signup' });
    expect(resolve({ page: 'signup', who: 'caregiver', step: 'form' }, out)).toBeNull();
  });
  it('signed in never sees sign-up', () => expect(resolve({ page: 'signup', who: 'family' }, base)).toEqual({ page: 'dashboard' }));
  it('family without plan sees only the onboarding', () => {
    const np = { ...base, hasPlan: false };
    expect(resolve({ page: 'chat' }, np)).toEqual({ page: 'onboarding' });
    expect(resolve({ page: 'onboarding' }, np)).toBeNull();
  });
  it('the summary stays while it shows', () => {
    expect(resolve({ page: 'onboarding' }, base)).toEqual({ page: 'dashboard' });
    expect(resolve({ page: 'onboarding' }, { ...base, summaryShowing: true })).toBeNull();
  });
  it('the other role or market goes home', () => {
    expect(resolve({ page: 'board' }, base)).toEqual({ page: 'dashboard' });
    const sr = { ...base, role: 'caregiver', market: 'sr' };
    expect(resolve({ page: 'board' }, sr)).toEqual({ page: 'requests' });
    expect(resolve({ page: 'dashboard' }, { ...sr, market: 'fi' })).toEqual({ page: 'board' });
  });
  it('an unknown id goes home', () => {
    expect(resolve({ page: 'client', id: 'zz' }, { ...base, role: 'caregiver' })).toEqual({ page: 'board' });
    expect(resolve({ page: 'client', id: 'c1' }, { ...base, role: 'caregiver' })).toBeNull();
    expect(resolve({ page: 'caregiver', id: 'zz' }, base)).toEqual({ page: 'dashboard' });
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/lib/routeGuard.test.js` — FAIL.
- [ ] **Step 3: Implement** `homeOf` and `resolve` per the rules above.
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** — `"Which address a person may see, and where the rest go"`.

### Task 3: The signed-in app reads its page from the address

**Files:**
- Modify: `src/App.jsx` (`view` state at :80; `showCaregiver` :207; `openPage` :412; `onContinue` :586–621; demo fill :904; `phase` checks), `src/screens/caregiver/CaregiverApp.jsx` (:22–66), `src/data/demo.js` (`go`), `src/screens/CaregiverPage.jsx` (back only via prop; no change expected)

**Interfaces:**
- Consumes: `useRoute`, `navigate`, `goBackTo`, `href` (Task 1); `resolve`, `homeOf` (Task 2).
- Produces: in `App.jsx`, `const view` (route page, with `'caregiver'`/`'client'` for id pages) and `setView(page: string, id?: string, state?: object)` = `navigate({ page, id }, { state })`; `openCaregiver` comes from `route.id`. `CaregiverApp` gets `openId` from the route and `onView(page, id?, state?)`.

- [ ] **Step 1:** In `App.jsx` replace `useState` for `view` with `useRoute()`. Build `ctx` (`signedIn: phase === 'app'`, `hasPlan: Boolean(plan)`, `summaryShowing` state added in Task 4 — start it as `false` here, `hasClient` over `myClientsNow`, `hasCaregiver` via `caregiverById`). Render with `const shown = resolve(route, ctx) || route`; in an effect, when `resolve` returns a route, `navigate(it, { replace: true })`. Remove `openCaregiver` state; `showCaregiver(id)` → `setView('caregiver', id)`.
- [ ] **Step 1b:** On every change of `href(route)` close what is open over the page (`setDrawer(null)`, `setOpenPane(null)`, the right panel on a phone) and scroll the page to the top (spec rules 9, 12). Modals opened by a page component unmount with it.
- [ ] **Step 2:** Entering the app after sign-up/sign-in (`onContinue`) navigates to `homeOf(...)` with `replace: true` (spec rule 4) instead of `setView(...)`.
- [ ] **Step 3:** `CaregiverApp.jsx`: drop `openId`/`from` state; `open(id)` → `onView('client', id, { from: view })`; `from` = `useRoute().state?.from || 'board'`. Each `onBack` → `goBackTo({ page: from === 'clients' ? 'clients' : 'board' })` (sr: `{page:'requests'}`). Family `CaregiverPage` `onBack` in `App.jsx` → `goBackTo({ page: 'dashboard' })`.
- [ ] **Step 4:** `demo.js` `go(next)`: `window.location.assign('/?demo')` (a role switch starts at home, not on the old role's path).
- [ ] **Step 5: Verify** `npx vitest run` (all pass), `npx vite build` (ok), and in the dev server (`http://localhost:5180/?demo=negovateljica&trziste=fi`): menu clicks change the address; `/clients/<id>?demo=negovateljica&trziste=fi` opens the client directly; back/forward move between them; reload stays.
- [ ] **Step 6: Commit** — `"The app's pages read from the address; back and reload work"`.

### Task 4: The family sees nothing before the plan

**Files:**
- Modify: `src/App.jsx` (`variant`/`fullscreen`/`startVariant` :505–514, key gate `onCancel` :820–823, `onFinish` :841–844, `onPlan`, the "Upoznavanje nije završeno" block :666–677)

**Interfaces:**
- Consumes: Task 2 `summaryShowing` in `ctx`; Task 3 `setView`.
- Produces: `fullscreen` ⇔ `shown.page === 'onboarding'`; `startVariant('ai')` → `navigate({page:'onboarding'})`.

- [ ] **Step 1:** Derive the AI variant from the address (`/onboarding`); keep `variant` state only if something else still needs it, otherwise remove it.
- [ ] **Step 2:** `onPlan` also sets `summaryShowing = true`; `onFinish` sets it `false` and `navigate({page:'dashboard'}, {replace:true})` (spec 14).
- [ ] **Step 3:** Key gate "Odustani": sign out — `setPhase('register')`, reset `user` as on first load, `navigate({page:'signin'}, {replace:true})`.
- [ ] **Step 4:** Delete the `Attention` "Upoznavanje nije završeno" branch in `/chat` (its i18n keys too, if no longer used anywhere — check with grep before removing).
- [ ] **Step 5: Verify** — new family account in the dev server (no demo): after registration the address is `/onboarding`; typing `/dashboard` goes back to `/onboarding`; with the key gate, "Odustani" lands on `/signin`. `npx vitest run`, `npx vite build`, `node scripts/i18n-missing.mjs` → 0.
- [ ] **Step 6: Commit** — `"A family sees the app only once the onboarding has made the plan"`.

### Task 5: Sign-up, sign-in and the caregiver's draft

**Files:**
- Create: `src/data/signupDraft.js`, test `src/data/signupDraft.test.js`
- Modify: `src/screens/Register.jsx` (`Register` :549, `SignUp` `who` :84–93 and :148, `SignIn` `pending`/`forgot` :332–346, `ResetPassword` back), `src/screens/caregiver/SignUp.jsx` (`screen` :124, `pickLang` :133–141, `next`/`back` :172–193, `partNext` :205, `submit` :~250, `pageButtons`)

**Interfaces:**
- Consumes: `useRoute`, `navigate`, `goBackTo` (Task 1).
- Produces:
  - `saveDraft(d: { screen, reached, market, f, account, open, done, sent }): void` — `localStorage['nana.signup.caregiver'] = { ...d, savedAt: Date.now() }`.
  - `loadDraft(now = Date.now()): Draft|null` — `null` when missing, unreadable, or `now - savedAt > 7 * 24 * 3600 * 1000`.
  - `clearDraft(): void`.

- [ ] **Step 1: Write failing tests** `src/data/signupDraft.test.js` (stub `localStorage` as `store.test.js` does): save→load returns the same fields; load after 7 days + 1 ms → `null` (and the entry is removed); broken JSON → `null`; `clearDraft` → `null`.
- [ ] **Step 2: Run** `npx vitest run src/data/signupDraft.test.js` — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Register/SignIn from the address:** `mode` = `route.page`; `who` = `route.who ?? null`; "Porodica"/"Negovateljica" → `navigate({page:'signup', who})`; "Već imate nalog?" → `navigate({page:'signin'})`; `forgot` ⇔ `route.step === 'reset'`; 2FA: `navigate({page:'signin', step:'verify'})` after setting `pending`; `/signin/verify` without `pending` → `navigate({page:'signin'},{replace:true})`. Every existing back (`onBack` to "Ko ste?", "Nazad na prijavu", 2FA back) → `goBackTo(<its target>)`. Remove the `nana.signup` `sessionStorage` read here and the write in `SignUp.jsx` `pickLang`.
- [ ] **Step 6: Caregiver steps from the address:** `screen` = `route.step ?? 'country'`. Init `market, f, account, open, done, sent, reached` from `loadDraft()`; `saveDraft` on every change of them. `reached` = the furthest screen whose checks passed (order `['country','account','form','review', ...afterSteps(f)]`); `next()`/`partNext()` raise it and `navigate` to the next step; `back()` → `goBackTo` the previous step. Guard in an effect: a step not in the order for her market, or past `reached` → `navigate({page:'signup', who:'caregiver', step: reached === 'country' ? undefined : reached}, {replace:true})`; after `sent`, any step but `thanks` → `thanks` (replace); `submit` moves to `thanks` with `replace`. "Na početnu" (`onDone`) calls `clearDraft()`.
- [ ] **Step 7: Verify** — dev server, fresh profile: walk `/signup` → caregiver → country → account → form; reload on form keeps step and values; switch language on `/signup/caregiver` keeps the screen and country; close the tab, open `/signup/caregiver` → back on form; after "Zakaži razgovor", back goes to `thanks` again. `npx vitest run`, build, i18n 0.
- [ ] **Step 8: Commit** — `"Sign-up and sign-in have addresses; her application waits for her a week"`.

### Task 6: The family's onboarding resumes where it stopped

**Files:**
- Inspect: `src/screens/ImmersiveConversation.jsx` (`stage` :376, the `open` screen :670), `src/App.jsx` `onContinue` resume (:609–620)

- [ ] **Step 1: Measure** — dev server: register a family, answer a few questions, close the tab, sign in again. Record whether the conversation opens on the "open" screen (start) or continues asking from the first unanswered question.
- [ ] **Step 2:** If it continues: nothing to change; note it in the day's log. If it starts over: when saved answers beyond `about-you` exist, start `stage` at `'talking'` so Minna asks the next missing thing. **If that needs more than this one start-state change, stop and report to Branislav instead of building it.**
- [ ] **Step 3: Commit** (only if code changed) — `"A family signing in again continues the onboarding"`.

### Task 7: End-to-end check, rules and the list for the designer

**Files:**
- Create: `<scratchpad>/rute.mjs` (puppeteer, not committed)
- Modify: `docs/patterns.md` §4, `docs/changes/<today>.md`

- [ ] **Step 1: Puppeteer** at 1440×900 and 375×812 (touch), each in a fresh `browser.createBrowserContext()`: for each address of the spec table reachable in the demo (`?demo`, `?demo=negovateljica&trziste=fi`, `&trziste=sr`), open it directly and assert the page title; click to a client/caregiver page and back, assert the address; press our "Nazad" then `page.goBack()` and assert it did **not** return to the page left (Review Focus 4); `/clients/zz` → replaced by home (Review Focus 3); reload keeps the address. Expected: all assertions pass, no `pageerror`.
- [ ] **Step 2: §13 check** (`<scratchpad>/check13.js`) on board, client page, dashboard, sign-up steps, at both sizes — no new findings vs `main`.
- [ ] **Step 3: patterns.md §4** — add: „**Svaka stranica ima svoju adresu** (odlučeno 12. 11.): stranice i koraci prijave i registracije imaju adresu na engleskom (`/board`, `/clients/:id`, `/signup/caregiver/form`); drawer-i i modali je nemaju. Browser back ide kroz njih; naše „Nazad" vodi na isto mesto kao do sada, a kad je to prethodni korak, ide korak nazad. Tabela: `docs/superpowers/specs/2026-11-12-rutiranje-design.md`."
- [ ] **Step 4: Day log** — what changed (routes, family gate, draft, removed "Upoznavanje nije završeno", key "Odustani" → prijava) and, under „Za dizajnera", the table of every „Nazad": gde je, kako izgleda, kuda vodi, šta bi browser back uradio umesto njega. Source the list with `grep -rn "t('Nazad\|BackButton\|onBack=" src --include=*.jsx` and the spec's starting list; separate page/flow buttons from those inside drawers/modals.
- [ ] **Step 5: Commit and push the branch** — `git push -u origin rutiranje`. Report to Branislav; merge to `main` only on his word.
