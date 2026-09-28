# Prelazak na shadcn/ui

Demo postaje 1/1 dizajn koji developeri implementiraju, na shadcn-u. Ovo je
plan i procena, napravljeni 28.09.2026. Posao još nije počeo.

Procena je napravljena pre pull-a koji je doneo `TextField.jsx` (Field, Input,
Password, TextArea, Select). To je sada jedno polje u celoj aplikaciji, pa se
inputi menjaju na jednom mestu i taj deo je lakši nego što je procenjeno.

## Obim

Oko **3–4 nedelje** za jednu osobu, bez dizajnerovih prolaza kroz animacije i
stanja, koji idu paralelno.

| Faza | Trajanje |
|---|---|
| 1. Tailwind + shadcn u projektu | ~1 dan |
| 2. Tema: naši tokeni kao shadcn promenljive | 1–2 dana |
| 3. Osnovne komponente sa override-ima | ~1 nedelja |
| 4. Složeniji delovi (nav, paneli, modali, forme) | 1–2 nedelje |
| 5. Brisanje CSS-a koji više ništa ne koristi | usput |

Najveći teret je `src/styles/app.css` (~6.900 linija): svaka zamena oslobađa
deo tog CSS-a i on mora da se očisti.

## 1. Tailwind + shadcn

- Tailwind je obavezan za shadcn: v4 preko `@tailwindcss/vite`, alias `@/`,
  `components.json`, zavisnosti Radix, `class-variance-authority`, `clsx`,
  `tailwind-merge`.
- shadcn radi i sa JS-om (`"tsx": false`). Otvoreno pitanje: prelazak na TS,
  jer će developeri verovatno raditi u njemu.
- Rizik je Tailwind-ov reset (preflight). Pošto je u `@layer base`, a
  `app.css` je van slojeva, naš CSS pobeđuje. Menja se samo tamo gde smo se
  oslanjali na podrazumevane stilove pretraživača. Posle uvoza treba proći sve
  ekrane.
- Raditi na posebnoj grani.

## 2. Tema

`src/styles/tokens.css` je već iz Figma fajla „NANA Prime - Tailwind config", a
`--primary` i `--primary-foreground` se zovu isto kao u shadcn-u. Treba:

- preslikati ostale uloge: `--background`, `--foreground`, `--card`, `--muted`,
  `--accent`, `--border`, `--input`, `--ring`, `--destructive`;
- uskladiti radijuse: naša skala je 4/8/16/24/32, a shadcn ima jedan
  `--radius` iz kog računa ostale;
- dodati senke (`--shadow-card`, prsten od 1px umesto ivice) i font Geist.

## 3. Osnovne komponente

| Kod nas | shadcn | Napomena |
|---|---|---|
| `Button` (primary/secondary/ghost, `lg`, `iconOnly`) | Button | naše varijante i veličine, efekat pritiska |
| `TextField` (Input, Password, TextArea) | Input, Textarea, Label | |
| `TextField` Select (naš dropdown) | Select | tastatura i otvaranje nagore već postoje kod nas |
| Toggle u Podešavanjima | Switch | red sa podnaslovom oko prekidača |
| `status-pill` | Badge | statusi ok/wait/no, muted, attention |
| `.svc` čipovi | Toggle / ToggleGroup | |
| `panel-card` | Card | |
| `Toast` | Sonner | |
| paginacija (`.pager`, Pronađi negovateljicu) | Pagination | |

Naše komponente zadržavaju ime i props-e (`<Button variant="secondary">`), a
iznutra koriste shadcn. Tako se ekrani ne diraju dok se menja jedna komponenta.

## 4. Složeniji delovi

- `Modal` je zapravo bočni panel → **Sheet**; isto važi za `FamilyDrawer` i
  verovatno `CaregiverSidebar`.
- `PaywallModal`, `SharePlanModal`, kolačići, 2FA → **Dialog**.
- `AppNav` → **Sidebar**, najveći pojedinačni komad (drawer na telefonu, liste
  razgovora i planova koje se skupljaju).
- Forme: Profil, Podešavanja, `PlanEditor`, registracija.

## Animacije i stanja

Sada skoro sve animira framer-motion (opruga na panelima, pritisak dugmeta,
panel koji pri zatvaranju odmah prestaje da hvata klikove). Radix animira preko
`data-state` i CSS-a. Dizajner za svaku komponentu bira:

- **shadcn animaciju**: jednostavnije za developere, drugačiji osećaj;
- **framer-motion**: moguće (`forceMount` + `AnimatePresence`), ali više posla
  po komponenti.

U projektu su sada i `framer-motion` 11 i `motion` 12, što je ista biblioteka.
Svesti na jednu.

## Šta ne ide na shadcn

- **Chat (`inline-chat-kit`)** ima svoje komponente, CSS i animacije, bez
  Tailwind-a i Radix-a. Samo ga uskladiti bojama i fontom preko njegove teme.
- **Immersive ekrani i onboarding sa Jovanom** su namerno drugačiji. Tamo
  shadcn samo za sitnice (dugmad, polja).

## Redosled

1. Grana, Tailwind + shadcn, prolaz kroz sve ekrane zbog reseta.
2. Tema.
3. Button, pa ostale osnovne komponente, jedna po jedna, svaka zapisana u
   `docs/changes` da dizajner zna šta da pregleda.
4. Sheet/Dialog, pa Sidebar, pa forme.
5. Usput brisati CSS koji je ostao bez upotrebe.
