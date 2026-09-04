# NANA Prime — Onboarding prototype

Interactive prototype of the client onboarding flow (register → branching frailty assessment → care plan), built 1:1 against the Figma design ("Nana Prime" file) with design tokens mirrored from the "NANA Prime - Tailwind config" file.

## Run

```bash
npm install
npm run dev
```

Opens on http://localhost:5180, or the next free port if that one is taken.

## Shell

After registering, the user is inside their own account: a left nav with **Chat**,
**Dashboard**, **Care plans**, **Profile** and **Settings**. The chat stays mounted
behind the other views so switching away never loses its progress, and `answers`
lives in `App` so the profile reads the same data the assistant collected — no
second source of truth.

- **Chat** — the row carries its own **+** so a new chat is one click away without opening the list; selecting Chat unfolds the thread list underneath. Starting a new chat files the current one away first, but only if it produced a plan, so untouched threads don't clutter the history. A past thread replays read only: the same messages and question cards, with the answers as chips, editing removed and an archived footer in place of the composer. Threads store their `answers`, so the replay is rendered by the same components as the live chat.
- **Dashboard** — every caregiver request and where it stands: accepted, waiting, or declined. A decline always carries the reason, so the user is never left guessing. Empty until they've actually contacted someone.
- **Care plans** — the live plan plus archived ones, newest first.
- **Profile** — account details and everything the questionnaire collected, editable back in the chat.
- **Settings** — notification toggles, subscription state, account actions.

The nav, statuses and screens are placeholder structure for the concept — mock data
lives in `src/data/bookings.js`, and status colours come from the Tailwind config
scales, so replacing them with the real design is a styling job, not a rewrite.

## Question content

The questions come from the client's "Conversation Flow AI" document. It is not a flat
form — it is an assessment that branches:

1. **Getting to know you** — who the care is for, who is calling, household, home condition.
2. **Daily life** — eight questions that establish how they move, manage and have changed.
3. **Frailty assessment** — the flow's pivot. `src/data/frailty.js` estimates a level on
   the Clinical Frailty Scale (1–9) from those answers, and the assistant states it before
   asking anything else. Shown as a card in the chat and a full screen in the immersive
   variant. It is labelled an estimate, not a diagnosis.
4. **Support** — *branches on the level*. 1–3 asks about lifestyle and prevention, 4–5 about
   the housework, 6 about hands-on personal care, 7–8 about bed mobility, eating, pressure
   sores and breathing support, 9 about palliative needs. `when({ band, level })` on a
   question makes it conditional; `applicableQuestions()` resolves the list.
5. **Reason for contact** — what brought them, how it started, hospital stay, and what a
   good outcome looks like for the family.

The recommendation follows the document's formula — frailty 50%, reason for contact 35%,
context 15% (`WEIGHTS` in `frailty.js`) — and the first moves per reason come straight from
its scenarios.

Copy is in English to match the rest of the prototype and the Figma design; the source
document is Serbian. Every string lives in `src/data/flow.js`, so switching is a data edit.

## Review, and answers that carry other answers

Nothing is built until the user has seen everything they said and confirmed it. After
the last question the assistant posts a **review** — every answer, grouped by section,
each editable — and only the confirm button produces the plan.

The catch is that the answers are not independent. The eight daily-life answers feed the
frailty estimate, the estimate picks the band, and the band decides which support
questions exist at all. Changing one can retire answers already given and open questions
never asked.

`src/data/dependencies.js` is the single source of truth for that, and it is pure, so the
warning shown *before* an edit and the pruning done *after* one cannot disagree:

- `isLoadBearing(id)` — marks the rows the review flags with a link icon.
- `dependentsOf(id, answers)` — what is currently riding on this answer. If it is not
  empty, the review asks for confirmation and names exactly which follow-ups are at risk
  before opening the editor.
- `reconcile(prev, next)` — applied to **every** answer in `App`, so state can never hold
  an answer to a question this user is not being asked. It returns what it dropped and
  what is newly being asked, which is what the notice in the thread reports.

The notice only appears when something was actually **dropped**. Running forward the
estimate moves with every answer and branch questions simply appear — that is the flow
working, not news, and an early version announced it on every single answer. It renders
directly above the section holding the reopened questions rather than at the end of the
thread, so the user isn't sent scrolling back up. Confirming the review is undone
automatically if an edit reopens anything, because there is now something unseen.

The immersive variant has the same three states as full screens — review, warning,
"that changed things" — and returns to the review once the reopened questions are cleared.

## Questionnaire variants

The nav carries a **Classic / Immersive / AI** switch. All three ask the same questions
and write into the same `answers` in `App`, so you can switch mid-flow: answers given in
one show up in the others, and each resumes at the first unanswered question rather than
restarting. The AI variant has its own section at the end of this file.

**Immersive** is a fullscreen take: one question at a time, glass cards over drifting
clouds, with generative ambient audio.

- Transitions are **staggered in both directions**: the outgoing screen unwinds from
  the bottom up (`staggerDirection: -1`), the incoming one builds from the top down,
  option lists staggering their own rows inside that. About 1.1s end to end.
- The counter tracks **position in the flow**, not committed answers — a four-field
  question commits once, so counting answers left the number frozen for four screens
  and then jumping by four.

- Multi-field questions are split into **one field per screen**, each with its own
  conversational prompt and hint (`src/data/prompts.js`) — the copy lives with the
  immersive variant, the classic form keeps its shorter labels. The answer is only
  committed once the last field is filled, so a half-finished question never counts
  as answered in either variant. Selects stay as they are.
- It does **not** close to reveal the result: the finished care plan is shown inside
  the experience, and only then does **See the full plan** exit and land on that
  plan's page — the dashboard stays empty until a caregiver is actually requested,
  so it would be an anticlimax to land there.

- **Clouds** — `src/components/immersive/CloudBackground.jsx`. A raw WebGL fragment
  shader, no libraries: domain-warped fbm noise over a pale golden-hour sky, drifting
  at 0.015× time. Rendered at 0.75× resolution and capped at 1.25 DPR — the clouds are
  soft, so the upscale costs nothing visually. Falls back to a CSS sky gradient if
  WebGL or shader compilation is unavailable.
- **Audio** — `src/lib/zenAudio.js`. Web Audio only, no files and nothing to license:
  a detuned sine drone, band-passed noise for air, and pentatonic tones blooming on a
  loose random timer, so it never loops audibly. Starts from a click, so autoplay
  policies are satisfied. Mute is in the top-right.
- Honours `prefers-reduced-motion`: the clouds render one frame and hold.

## Flow

The questionnaire itself is framed as an AI chat. There is no wizard footer — the
assistant posts one section at a time, the answered cards stay in the thread as
artifacts, and the composer at the bottom is the only persistent control.

1. **Register** — name + email (both required, email validated)
2. **Chat** — the assistant greets the user, then works through the sections one at a
   time (see Question content above)
   - Each section is introduced by a plain assistant message, not a title — finishing one makes the assistant "think", then post the next
   - Exactly one question is active across the whole thread; answered ones collapse into an overview row with answer chips and a pencil edit button; the rest stay listed as pending, so how much is left in the section is always visible
   - Clicking a collapsed row re-opens it for editing at any point, in any section, and unfolds that section so the active card is never hidden
   - Question types: multi-input (Next button), single select (auto-advance), multi select (Next button)
   - No Continue button and no step titles — the composer is the only persistent control
   - The composer is disabled until the questions are done, then accepts free-text messages

A finished section folds down to a single summary row — the answer count and the
question titles — from `FOLDABLE_FROM` rows up. It started as a peek at the list
under a gradient, but that cost more height than the answers it revealed: a folded
section measured 172px against 68px for the summary row.
3. **Review** — everything they said, grouped and editable (see above)
4. **Care plan** — once the review is confirmed the assistant posts the plan as a chat
   artifact: a grey container holding a white document, with the narrative and fact grid
   generated from the actual answers, plus the top matches.

## What the care plan is

Shaped by the client's "Care Coordinator" document. The plan is written, not tabulated,
and it is explicitly not a sales page — the client's note on generic "book now" buttons
was *"ježim se od toga"*. Everything is built in `buildPlan()` in `src/data/carePlan.js`:

1. **The narrative** — who they are and what they want, how it developed, who is around
   them, the biggest risks right now, what matters to the family, and the recommendation.
   Built sentence by sentence from the answers, following the paragraph in the document.
   `risksOf()` names the risks the document names: medication, kitchen safety, isolation.
2. **The coordinator's message** — a letter, addressed to the caller by first name and
   signed by a named person, ending on "we'll go step by step, together". The
   acknowledgement sentence is chosen per reason for contact, because the document's own
   example named the specific hard thing rather than offering generic sympathy.
3. **Recommendations** — each one a title, **why we're recommending this** for this person
   specifically, who would do it, and soft actions ("Ask Jovana to arrange this", "Talk it
   through first"). Never "book now".
4. **Ask or adjust** — a free-text box, because the plan is a conversation the family can
   push back on, not a document handed down.
5. **Reaching the coordinator** — WhatsApp, phone, email. Never behind the paywall; the
   paywall is on caregiver numbers, not on reaching us.

## Paywall

The only thing sold is caregiver contact. Everything else in the plan — the summary,
the full caregiver list, the doctor and equipment recommendations — is readable for free.

- The chat card is a **preview**: narrative, facts and the top 2 matches. The open
  affordance is deliberate — an "Open ↗" pill in the header, a primary-coloured hover
  state on the whole card, and an explicit CTA.
- Opening it reveals the **sidebar**: the coordinator's letter, the caregiver
  recommendation, the full caregiver list, and the ways to reach us.
- The first recommendation is **open** — it is the emotional payload of the document and
  the entry point into the caregiver flow. The three that follow (doctor, home changes,
  what's nearby) sit behind the gradient with the rest of the upsell.
- **Tapping a caregiver opens the paywall**, which asks for the user's own phone number
  (the introduction is made by SMS, so it doubles as lead capture) and then payment.
- **Phone numbers are never sent to a locked client.** `caregiversFor(unlocked)` in
  `src/data/carePlan.js` strips `phone` from the objects entirely, and the row renders
  a `+381 •• ••• ••••` placeholder that is not derived from the real number. Nothing is
  hidden with CSS, so there is no real digit in the DOM to recover — the projection is
  what the API should do server-side.
- Paying flips a single `unlocked` flag that the sidebar, the in-chat card and the
  assistant's replies all react to. The payment step itself is simulated.

## Structure

- `src/styles/tokens.css` — Figma variables (primitives + semantic aliases)
- `src/data/flow.js` — all step/question content; edit this to change copy or add questions
- `src/data/carePlan.js` — caregivers, the coordinator, and the whole plan built from the answers
- `src/data/dependencies.js` — which answers carry other answers, and the pruning that follows
- `src/components/` — Button, Chip, NumberIndicator, SelectCard, SelectInput, TextField, QuestionItem, ChatInput, CarePlanCard, CaregiverRow, CaregiverSidebar, PhotoCarousel, Logo
- `src/screens/` — Register, Chat

Icons are [lucide-react](https://lucide.dev) at `size={14} strokeWidth={1.75}`, which renders a ~1px stroke at 14px to match the design's icon tokens.

## Animation notes

- The question card resizes with FLIP (`layout` on the wrapper). Because FLIP animates size via `scale`, the content inside carries `layout="position"` so Framer counter-scales it — without that, all the text stretches during collapse/expand. `borderRadius` is set in `style` (not a class) so scale correction can reach it.
- `AnimatePresence mode="popLayout"` takes the outgoing content out of flow so it is never squashed on its way out.
- No `layoutId` is used anywhere — the morph is a single element resizing, not a shared-element transition.
- `PhotoCarousel` is a Material 3 multi-browse carousel that auto-advances every 2.8s: an item enters small on the right, grows into the hero slot, then shrinks away to the left. Slot widths come from the Figma layout; images are fixed-width and center-cropped by their slot, so narrowing crops rather than squashes. Honors `prefers-reduced-motion`.

Note: `?forceRaf` URL param is a test hook that keeps animations running in headless/background tabs — irrelevant for normal use.

## Third variant: the AI conversation, inside the immersive shell

`Classic / Immersive / AI`. The AI variant is **not a chat window** — it is the
immersive shell (one screen at a time, clouds, ambient audio) with the question on
each screen written by Jovana instead of read off a list.

It answers three things a questionnaire structurally cannot:

**1. "What if it's easier to just write everything out?"** The first screen is a
blank page, not a question: *"Recite mi svojim rečima šta se dešava."* One
paragraph typically fills four to six answers at once, and the flow resumes from
what is missing. Measured on a realistic paragraph: 16 remaining → 12, plus a note,
in one turn. Four **starters** sit under the field for anyone staring at a blank
page not knowing where to begin — each is sent as the user's own first message, so
Jovana picks it up like anything else they could have typed. A line about
emergencies sits below them: a chat is the wrong channel for a fall, and saying so
costs nothing.

**2. "What if the options don't contain what I'd say?"** One composer sits under
every screen, always — the cards are a shortcut, never a cage. There is no
per-field input: `inputs` questions (name/age/city, your name/relation/phone,
goal/worry) render **no cards at all**. Three stacked field cards were the last
piece of questionnaire left in the variant; now the person answers in a sentence
— *"Bogdan, sin, 063 555 210"* — and Jovana maps it onto the fields. Select
questions keep their cards, multi-selects keep their "other" row.

Jovana's line arrives **word by word, each resolving out of a 10px blur** rather
than the paragraph snapping in. Words are keyed by index, so one already on
screen never re-animates as the next token extends the string.

**3. "Then the next question has to adapt."** Two tools exist for exactly this:

- `follow_up` — Jovana asks **her own** question, one that is nowhere in `flow.js`,
  with no cards and optional soft suggestion chips. This is what stops the flow
  from replying to *"sestra je kod nje tri dana nedeljno"* with the next scripted
  question as if it hadn't heard.
- `record_note` — anything said that belongs to no question is kept and **reaches
  the care plan narrative**. Without it that sentence would be collected and then
  silently dropped, which is the failure mode this variant exists to fix.

Jovana always writes the question text herself; the flow's phrasing is never shown
on screen. `ask(questionId)` only decides which cards appear beneath it.

The boundary that keeps the rest of the app working: **Claude invents questions,
never data.** Question ids, option ids and answer shapes are untouched, because the
frailty scoring, the branching and the care plan all read them.

`stateMessage()` goes out each turn as a `role: "system"` message inside
`messages[]` — carrying the remaining questions *and the notes so far*, so nothing
already said gets asked again — without invalidating the cached prefix above it.

**There is no question counter.** The bar tracks data actually collected, and the
label names the section you are in. A count was tried and removed: it could only
count questions from the list, so a `follow_up` screen — Jovana's own question,
which by design is not in the list — froze the number while screens went by. A
number the flow cannot honour reads as broken; with follow-ups the total is
genuinely unknowable, so the honest move is not to claim one.

**The support section is withheld until daily life is fully answered.** The frailty
estimate exists from the first answer, but a band derived from two answers is not
one to branch on: the model would ask a branch question, the band would move as the
rest landed, and `reconcile` would drop the answer it had just collected. The other
two variants get this for free by walking the steps in order; here the model
chooses, so `remainingQuestions()` enforces it.

Serbian copy is an overlay (`src/data/flow.sr.js`), not a rewrite of `flow.js` —
the other two variants stay English to match Figma, and the ids must not move.

### Running it

Bring your own key: the app asks for one and keeps it in `localStorage`, so whoever
pulls the repo uses their own and nothing secret is committed.

> **Local demo only.** A key held in the browser is readable by anything running on
> the page. Shipped, this call belongs behind a server.

Model config, in `src/lib/claudeChat.js`: `claude-opus-5`, **thinking on** at `low`
effort. Thinking stays on deliberately — disabling it on this model lets tool calls
arrive as plain text, so the turn succeeds, the call never runs, nothing errors, and
in a loop that text poisons later turns. For a design that hangs entirely on tool
use that is the worst available failure. `low` effort is the cheap lever instead.
Server-side `fallbacks: "default"` is on, so a declined request re-runs on
Anthropic's recommended fallback rather than dying.
