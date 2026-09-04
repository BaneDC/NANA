# NANA Prime — Billing UI change list

Layout only. No wording, no amounts, no calculations, no states.
Caregiver side, desktop. Below 860px most of this is already single column and already correct.

Companion files:
- `billing-prototype.html` — **the working prototype with every change applied.** The original bundle, patched. Click through it.
- `billing-ui-review.html` — the same changes rendered before / after.

---

## 1. Work order

**Now:** the form splits into two reading columns twice, the price block draws six lines around three numbers, and the one field for flagging a problem is hidden behind a link.

- **One column throughout.** `Hours worked` and `What you did` stop sharing a row — each is full width with its label above. `Eating` sits above `Moving around` instead of beside it; at full modal width all three chips then fit on one line, so nothing wraps.
- **Something worried you today?** becomes a field that is **always visible**, marked *optional*, with one line underneath saying when to use it and where it goes: *leave it empty if the visit was as usual; if something was off it goes straight to your coordinator, not into the monthly summary the family sees*. The disclosure link goes away — a caregiver skimming the form currently has no idea the field exists.
- Consistent spacing between sections rather than the current mix.
- Price block — see §3.

---

## 2. Plan the next visit

**Now:** three controls in one row at three different heights, the read-only one heaviest of all; and the timing line sits inside the price block where it has nothing to do with money.

- **Three equal columns.** Day, start time and hours all get the same height, type size and corner radius.
- **The read-only `3 h` stops shouting.** It is currently the largest, boldest thing in the row. Bring it down to the shared size; keep the soft fill and the muted *as agreed* caption so it still reads as locked. It must not out-weigh the controls the caregiver can actually change.
- **`Today / Tomorrow` becomes a segmented control** rather than two loose pills, so it fills its column and matches the time field beside it. *This is the only component change in the set* — keeping two pills at a matching height fixes the size mismatch just as well.
- **The timing line moves out of the price block** — `tomorrow, 09:00 – 12:00 · 25 h from now` becomes a quiet caption directly under the controls, next to what produces it. The late warning follows it in the same position.
- Price block — see §3.

---

## 3. Price block — one pattern, both dialogs

- **Remove the dotted leaders** on all three rows. Label left, amount right, nothing between them.
- **One rule, not six.** Keep only the divider above **You receive**. The notes underneath lose their rules — spacing is enough.
- **The total carries.** The amount goes up to roughly 19px with its label at 14px, so the number does the work and the words stay quiet. The other rows stay as they are.
- The service fee row darkens slightly. It is a real deduction the caregiver should read, not disabled text.

---

## 4. Care agreement — draft and review

### Both steps

- **Remove the stepper.** `Step 1 of 2 · draft` / `Step 2 of 2 · review` and the progress bar both go. This is one form that gets reviewed before sending, not a two-step wizard — the dialog title and the footer button already say where you are.
- **Remove the bordered card wrapping the form.** It sits inside a dialog that already has a border and a radius. Two frames, 18px apart.
- **Let the dialog grow taller** before the content starts scrolling — about 15% more height. Roughly four more service rows visible.

Nothing inside the draft form itself changes.

### Review step — one reading axis

**Now:** five vertical axes in one short panel — labels at the left edge, big numbers flush right, category headings back at the left, then service bullets in two columns. Every row restarts the scan.

- **Everything left-aligns.** Nothing flush right.
- **Rate and hours become the headline.** One line — `€32.00/h × 3 h` — with `Each visit comes to €96.00` as a caption directly beneath. That is the answer the caregiver came for; it should be read first.
- **Services become chips**, the same ones used in the request cards, the caregiver profile and the work order. Services are chips everywhere else in the product; the one screen where they are being confirmed should not be the exception.
  Use the **outlined read-only variant** (the one on the request cards), not the filled accent chip. Nothing on this screen is selectable, and a filled chip invites a click that does nothing.
- **Four rules become one hairline.** The lock note keeps its soft fill but loses its border and gains a radius, so it reads as a note rather than a closing slab.

---

## 5. Earnings — the row opens the work order

**Now:** Earnings lists every visit and the amount it produced, but there is no way to get from the amount to the work order behind it. Rows are plain divs — no click, no hover, no chevron. Seeing what was filled in means leaving Earnings for Clients, finding the person, and opening the visit there. The row's own tracker even names *Work order* as a stage while giving no way to look at it.

- **The row becomes clickable** and opens the work order side panel **that already exists** — the same one the board opens. Nothing new to design or build.
- **Standard affordances:** a right chevron, plus the hover already used on the earnings summary cards directly above.
- **No dead clicks.** A visit with no work order yet opens the same panel in its pre-visit state — reserved amount, where the visit is in the flow, and a **Fill in work order** button when one is due, which hands straight over to the form.

The prototype implements this as a read-only work order view: status line, what was written down, how the visit went, the services covered as read-only chips, and the price block.

---

## Not in scope

Wording · amounts and how they are calculated · the service catalogue · states and transitions · the mobile layout, which is already single column.
