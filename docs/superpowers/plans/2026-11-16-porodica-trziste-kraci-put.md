# Family market, municipality count, short path and diaspora: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A family picks where the elderly person lives and sees how many caregivers we have there before making an account; Minna's conversation gets a five-question "only a caregiver" path that leaves a small plan; diaspora is that path only, on Serbia's market.

**Architecture:** Everything a screen needs to know is derived from data that already travels everywhere: the answers (`person.answers`) and the account (`user`). Whether a plan is small is worked out from the answers (`isShortPlan`), so `buildPlan`, `planOverview` and `planQuestions` need no new argument and the caregiver's side follows by itself. Which questions Minna asks is `person.path`. Where the family is (diaspora, municipality) is set once from the account in `src/data/market.js`, next to the market, and `caregiversIn()` reads it.

**Tech Stack:** React 19, Vite, Vitest, Tailwind + shadcn components, the project's own `t()` / `msg()` i18n (Serbian keys, `src/i18n/en`, `src/i18n/fi`).

**Spec:** `docs/superpowers/specs/2026-11-16-porodica-trziste-kraci-put-design.md`

## Global Constraints

- `docs/patterns.md` is the specification for every interface change. Read §9, §10 and §12 before touching a screen; a pattern that is not in it is written into it first.
- Fields only from `src/components/TextField.jsx`. No capitals-only text. Radii 4 / 8 / 16 / 24 / 32, gaps divisible by 4. Touch targets at least 44px.
- The onboarding's look (`Immersive*`, `imm-*`) is not changed: only its starter, its list of questions and its shorter summary.
- Every new sentence is a Serbian key through `t()` / `msg()` with entries in `src/i18n/en/*.js` and `src/i18n/fi/*.js`.
- After interface changes run the check from `docs/patterns.md` §13 on desktop and at 375×812: zero violations.
- Branch `porodica-trziste-kraci-put`. No commit, push or merge until Branislav says so.
- The day's changes go into `docs/changes/2026-11-16.md`, in Serbian.
- Exact copy from the spec:
  - radio label „Gde živi osoba kojoj treba nega?", options „Srbija", „Finska", „U inostranstvu";
  - count „U ovoj opštini trenutno imamo {n} negovateljica." (plural forms);
  - zero „U ovoj opštini trenutno nemamo negovateljicu. Možemo da napravimo plan nege i javimo vam čim se neka prijavi.";
  - diaspora „Imamo negovateljice iz Srbije koje dolaze kod klijenta u inostranstvo. Napravite nalog da ih vidite.";
  - starter „Treba mi samo negovateljica" / „Nekoliko pitanja, pa negovateljice u njenom kraju";
  - card „Dopunite plan nege", button „Dopunite plan", then „Nastavite".

## Review Focus

1. A municipality with zero caregivers: the account can still be made, and the list and the plan's caregiver recommendation are empty with the same sentence. (Task 1, Task 6)
2. A sign-up in English with no site link: no market is chosen, and "Napravi nalog" says the field is required instead of guessing. (Task 2)
3. A family that changes the market after choosing a municipality: the municipality is cleared and the count goes with it. (Task 2)
4. A full plan made before this change (the demo family, no `care-needs`, no `care-schedule`): it stays a full plan and its schedule is still derived. (Task 3, Task 4)
5. A schedule said loosely ("svaki dan pre podne", no hours): no hours are invented, nothing prints `undefined` or `NaN`. (Task 4)

---

### Task 1: Caregiver counts and the family's place

**Files:**
- Create: `src/data/caregiverCounts.js`, `src/data/caregiverCounts.test.js`
- Modify: `src/data/market.js`, `src/data/market.test.js`, `src/data/carePlan.js` (`caregiversIn`), `src/data/caregiversRs.js`, `src/lib/siteLink.js`, `src/lib/siteLink.test.js`

**Interfaces:**
- Produces:
  - `caregiverCount(market: 'sr'|'fi', municipality: string): number` — the same number for the same municipality, 0 for a few named ones per market (`NONE` in the file), larger for the capital's municipalities.
  - `setPlace({ abroad?: boolean, municipality?: string|null })`, `isAbroad(): boolean`, `noneHere(): boolean` in `market.js` (`noneHere` is true when not abroad, a municipality is set and its count is 0).
  - `caregiversIn()` returns `[]` when `noneHere()`, and for `isAbroad()` only Serbian caregivers with `abroad: true`.
  - `readSiteLink` accepts `market=diaspora`; `siteMarket()` may return `'diaspora'`.
  - Milica and at least half of `caregiversRs` have `abroad: true`.

- [ ] **Step 1: Tests.** `caregiverCounts.test.js`: same input twice gives the same number; every `NONE` municipality gives 0; a municipality not in `NONE` gives ≥ 1. `market.test.js`: `setPlace({ abroad: true })` → `caregiversIn('RS')` all have `abroad`; a `NONE` municipality → `caregiversIn()` is `[]`; `setPlace({})` restores the full list. `siteLink.test.js`: `?market=diaspora` is read.
- [ ] **Step 2: Run** `npx vitest run src/data/caregiverCounts.test.js src/data/market.test.js src/lib/siteLink.test.js` — fails.
- [ ] **Step 3: Implement.** The count is a hash of the municipality's name into 1–9, ×5 for municipalities of Beograd / Helsinki; `NONE` lists four municipalities per market taken from `MUNICIPALITIES`.
- [ ] **Step 4: Run** the same command — passes.

### Task 2: Market, municipality and the count on the family's account

**Files:**
- Modify: `docs/patterns.md` (§10, §12), `src/screens/Register.jsx` (`SignUp`, `FamilySignUp`), `src/App.jsx` (where `user` becomes the market: `setPlace`), `src/i18n/en/family.js`, `src/i18n/fi/family.js`

**Interfaces:**
- Consumes: `caregiverCount`, `setPlace`, `siteMarket`, `municipalityGroups(market)` from `src/data/caregiverProfile.js`, `Radios`, `Combobox`, `Field` as the caregiver's account uses them (`src/screens/caregiver/SignUp.jsx`).
- Produces: the saved user has `country: 'RS'|'FI'` from the radio (diaspora is `'RS'`), `abroad: true` for diaspora, `municipality: string|null`. `App.jsx` calls `setPlace({ abroad: user.abroad, municipality: user.municipality })` wherever it calls `setMarket`.

- [ ] **Step 1: Write the pattern** into `docs/patterns.md` §10 (the radio first in the card, the municipality under it, the count as the field's `hint` line, the diaspora sentence in its place) and §12 (which market a family is on).
- [ ] **Step 2: Implement.** `where` state: `'sr' | 'fi' | 'diaspora' | null`, preselected from `siteMarket() ?? siteRow.read() ?? language` (English with no link: `null`; diaspora never from the language). `municipality` state, cleared when `where` changes. Errors: `where` and (unless diaspora) `municipality` are required. The phone's code follows `where` until she picks one (diaspora +381). The count line uses `tn()` plural forms.
- [ ] **Step 3: Verify in the browser** (`npm run dev`, `/signup/family`): each market, a zero municipality, diaspora, English with no link; desktop and 375×812; the §13 check reports zero violations.

### Task 3: The short path's questions

**Files:**
- Modify: `src/data/flow.js`, `src/data/flow.sr.js`, `src/data/conversation.js`, `src/data/conversation.test.js`, `src/data/planEdits.js`, `src/data/person.js`, `src/lib/account.js` (progress keeps `path`), `src/i18n/en/*.js`, `src/i18n/fi/*.js`

**Interfaces:**
- Produces:
  - Two questions in `flow.js`: `care-needs` (`multi`, options `personal-care`, `meals`, `medication`, `company`, `errands`, `housekeeping`, `walks`, `mobility`; short path only) and `care-schedule` (`inputs`, fields `days`, `slots`, `hours` optional, `engagement` optional and only on Serbia's market; both paths, in the full path after the support section).
  - `SHORT_PATH = ['about-person', 'about-you', 'care-needs', 'care-schedule', 'mobility']`.
  - `answered(q, answer): boolean` — an `inputs` question is answered when every field that is not optional has a value; others when the answer exists.
  - `remainingQuestions(answers, path = 'plan')` — for `'caregiver'` the unanswered of `SHORT_PATH` in that order; for `'plan'` as today, with `care-schedule` and without `care-needs`.
  - `fullRemaining(answers)` = `remainingQuestions(answers, 'plan')` without `care-schedule`.
  - `isShortPlan(answers): boolean` = `Boolean(answers['care-needs']) && fullRemaining(answers).length > 0`.
  - `resumeAt(answers, path)` ignores what registration prefilled (`about-you`, and `about-person` with only `city`).
  - `planQuestions(answers)` lists only `SHORT_PATH` questions when `isShortPlan(answers)`.
  - `newPerson({ path = 'plan' })`; `saveProgress` / `loadProgress` carry `path`.

- [ ] **Step 1: Tests** in `conversation.test.js`: `remainingQuestions({}, 'caregiver')` ids equal `SHORT_PATH`; with `about-person: { values: { city: 'Niš' } }` the first is still `about-person`; `isShortPlan` is false for the demo answers (`demoAnswers`), true for short answers, false once every full question is answered on top of them; `resumeAt` is null for prefilled-only answers; `planQuestions` of short answers has no unanswered question.
- [ ] **Step 2: Run** `npx vitest run src/data/conversation.test.js` — fails.
- [ ] **Step 3: Implement.** A new answer to an `inputs` question merges into the values already there (so the prefilled municipality, name and phone stay).
- [ ] **Step 4: Run** `npx vitest run` — all pass.

### Task 4: The need and the small plan

**Files:**
- Modify: `src/data/familyStart.js`, `src/data/carePlan.js` (`buildPlan`), `src/data/carePlan.sr.js` (`planOverview`), `src/data/caregivers.test.js` or a new `src/data/shortPlan.test.js`, `src/components/PlanOverview.jsx`, `src/components/PlanContents.jsx`, `src/components/FrailtyScale.jsx` users, i18n files

**Interfaces:**
- Consumes: `isShortPlan`, the two questions' ids and field ids from Task 3.
- Produces:
  - `scheduleFrom(answer): { schedule: string, perVisit: number|null, hours: number|null, time: string|null } | null` in `familyStart.js`: days and slots as said, joined „dani · doba dana"; `perVisit` the first number in `hours`; `hours` = days counted × `perVisit` (days counted from day abbreviations and ranges, „svaki dan" = 7), `null` when either is unknown; `engagement` naming 24 → `schedule: msg('24 sata')`, no hours.
  - `needFrom(answers)`: services from `care-needs` when answered, schedule from `care-schedule` when answered, each derived as today otherwise.
  - `buildPlan` returns `short: true` for a small plan: a narrative of who, where, how she moves, what is needed and when, who the contact is; `recommendations` only the caregivers' one; `facts` only those known; `frailty: null`; a letter of two paragraphs that names no risk and no partner.
  - `planOverview` for a small plan: `risks: []`, `goal: null`, `short: true`, the recommendation sentence about caregivers only.
  - Components draw nothing for a part that is missing (no frailty scale, no risks, no "-" facts).

- [ ] **Step 1: Tests:** `needFrom` with `care-needs: ['meals','company']` and `care-schedule: { days: 'pon, sre, pet', slots: 'pre podne', hours: '3' }` → those two needs' services, `perVisit` 3, `hours` 9, schedule „pon, sre, pet · pre podne"; with no hours → `hours: null`, and the string holds neither `undefined` nor `NaN`; `engagement: '24 sata'` → schedule „24 sata"; the demo answers give exactly what they give today (snapshot of `needFrom(demoAnswers)` before the change). `buildPlan(shortAnswers)`: `short` true, one recommendation of kind `caregivers`, no fact whose value is „-", `frailty` null. `buildPlan(demoAnswers).short` falsy and five recommendations.
- [ ] **Step 2: Run** — fails. **Step 3: Implement.** **Step 4: Run** `npx vitest run` — passes.
- [ ] **Step 5: Browser:** a finished short conversation's summary, "Moja nega" and the caregiver's client profile show no empty group.

### Task 5: Entering the short path, and completing the plan

**Files:**
- Modify: `docs/patterns.md` (§12: the card "Dopunite plan nege"), `src/data/flow.sr.js` (`STARTERS`), `src/screens/ImmersiveConversation.jsx`, `src/App.jsx`, `src/screens/Dashboard.jsx`, `src/lib/planCopilot.js`, `src/components/KitAssistant.jsx`, i18n files

**Interfaces:**
- Consumes: `remainingQuestions(answers, path)`, `fullRemaining`, `isShortPlan`, `person.path`, the municipality prefill (`about-person.values.city` from `user.municipality` where `about-you` is prefilled today).
- Produces:
  - Starter `{ id: 'caregiver', path: 'caregiver', … }` replaces `help`; choosing it sets `person.path = 'caregiver'`. The model may also set it through a tool property `put: 'caregiver'` on its first turn (free text that plainly asks only for a caregiver).
  - The conversation ends when `remainingQuestions(answers, path)` is empty; the summary is the same screen.
  - `Dashboard`: under the plan, when `plan.short` and not abroad, a card „Dopunite plan nege" with one sentence and the button „Dopunite plan" (`default`); „Nastavite" once any full-plan question beyond the short path is answered.
  - The button opens the in-app assistant with a first message; `planCopilot` gets a mode in which it is given `fullRemaining(answers)` and a tool `record_answers` that files answers straight away (through `toAnswer` and `reconcile`, as the onboarding does), with no confirmation card.

- [ ] **Step 1: Pattern** into `docs/patterns.md`.
- [ ] **Step 2: Implement** the starter, the path, the prefill and the conversation's end.
- [ ] **Step 3: Implement** the card and the assistant's mode.
- [ ] **Step 4: Run** `npx vitest run`; **browser:** short path start to finish with an API key; "Dopunite plan" answered half way keeps the small plan and says „Nastavite"; answered to the end gives the full plan and the card is gone; §13 check, desktop and 375×812.

### Task 6: Diaspora, the empty list, and the caregiver's side

**Files:**
- Modify: `src/screens/ImmersiveConversation.jsx` (no starters when abroad), `src/data/flow.sr.js` / `conversation.js` (the place field asks for country and city when abroad), `src/screens/FindCaregiver.jsx`, `src/components/RecommendationCard.jsx` (empty state), `src/screens/CaregiverPage.jsx` and the rows that print „{area}, do {radius} km", `src/data/caregiverClients.js`, `src/data/caregiverView.test.js` or `demo.test.js`, `docs/patterns.md` §12, i18n files, `docs/changes/2026-11-16.md`

**Interfaces:**
- Consumes: `isAbroad()`, `noneHere()`, `caregiversIn()`, `person.path`.
- Produces:
  - Abroad: `person.path` is `'caregiver'` from the start, the first page is skipped as a resumed conversation is, no „Dopunite plan nege" card.
  - Where a caregiver's place is printed for a family abroad: „Radi u inostranstvu".
  - `FindCaregiver` and the plan's caregiver recommendation, when the list is empty: the zero sentence (municipality) as an empty state.
  - `caregiverClients()` adds one family from the short path for Sanna; `caregiverClientsRs()` one from the short path and one from diaspora (elder's area a country and city) for Milica, each with a pending request.

- [ ] **Step 1: Tests:** `myClients(seedState('fi', {}), 'sanna')` has a client whose `isShortPlan(person.answers)` is true; `seedState('sr', {})` gives Milica one such and one whose `care.elder.area` names a country; none of the three prints an unanswered question through `planQuestions`.
- [ ] **Step 2: Run** — fails. **Step 3: Implement.** **Step 4: Run** `npx vitest run` — passes.
- [ ] **Step 5: Browser:** diaspora sign-up to the list; a zero municipality's list; Milica's and Sanna's new clients; §13 check on every changed screen, desktop and 375×812.
- [ ] **Step 6:** Write `docs/changes/2026-11-16.md` and the list of changed screens for Branislav.
