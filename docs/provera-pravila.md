# Provera pravila iz `patterns.md` (19. 10. 2026.)

Prošli smo celu aplikaciju i uporedili je sa `docs/patterns.md`. Provera je rađena pretragom koda i merenjem u pregledaču (skript iz §13, plus mere za dodir), na 1440 i na 375×812.

Skoro sve je u redu. Ispod je ono što nije, sa predlogom. Ništa od ovoga nije menjano.

## 1. Grupe u „Podešavanjima kolačića" su kutija u modalu

`src/components/CookieSettings.jsx:30`: svaka grupa ima podlogu (siva, a narandžasta kad je uključena), `rounded-2xl p-3`.

- **§6 / §14:** nema kutije unutar kartice ili prozora.
- **§1, koncentrični uglovi:** glava grupe ima r8, a sa paddingom 12 spoljni ugao bi morao da bude 20. To nije na skali, pa je po §1 raspored pogrešan.
- **§6, hover:** naziv grupe na hover postaje narandžast (`group-hover/summary:text-primary-700`). Od 11. 10. tekst na hover ne menja boju.

Predlog: grupe kao redovi (`Item`) sa linijom između, bez podloge, kao svaki spisak u prozoru. Uključeno-isključeno već pokazuju prekidač i „Uključeno / Isključeno".

## 2. Na dodir manje od 44px (§9)

| Šta | Gde | Izmereno |
|---|---|---|
| Oko „Prikaži lozinku" | polje za lozinku: registracija, prijava, „Promenite lozinku" (`TextField.jsx:147`, `size="icon-xs"`) | 24 |
| Tab „Stanje sada" / „Istorija" | medicinski karton (traka je 44, sam tab nije) | 36 |
| Glava grupe kolačića | „Podešavanja kolačića" | 36 |
| Kvadratić saglasnosti | registracija (labela je klikabilna, ali je red visok koliko tekst) | 16, red 20–40 |

## 3. Brojevi koraka u uključivanju 2FA su pun krug

`src/components/TwoFactorSetup.jsx:41`: krug od 20px (`rounded-full`). §1 kaže da značke i čipovi nikad nisu pun krug. Ovo nije prava značka, pa je pitanje:
- da li pravilo važi i ovde (onda r4, kao značka),
- ili je ovo izuzetak koji treba upisati u §1.

## 4. Onboarding: tekst od 11px

§1 kaže da je najmanji tekst 12, **svuda**, a §2 da onboarding ima staru skalu (12 / 14 / 16). U `src/styles/onboarding.css` je pet mesta sa `font-size: 11px`:

- `.imm-know-label`
- `.imm-scale-ends`
- `.imm-scale-note`
- `.imm-starters-label`
- `.imm-history-index`

Predlog: 12 (`--text-small-*`). Ostali izgled onboardinga se ne dira (§0).

## 5. Polje za telefon na registraciji nije iz `TextField.jsx`

`src/screens/Register.jsx:152`: pozivni broj i broj su sklopljeni direktno od shadcn `InputGroup` + `InputGroupInput`. §10 kaže da su polja samo iz `TextField.jsx`.

Predlog: polje `Phone` u `TextField.jsx` (izbor države ispred, linija, pa broj), upisano u §0 i §10. Za sada ga koristi samo registracija, ali promena telefona u „Vašim podacima" bi trebalo da bude isto polje.

## 6. Sitnice: razmak 6 u shadcn komponentama (§1)

Ostalo iz shadcn-a i jedva se vidi, ali je van mreže od 4:

- `ui/tabs.jsx`: ikonica i tekst u tabu (`gap-1.5`);
- `ui/button.jsx`: malo dugme, `sm` (`gap-1.5`);
- `ui/field.jsx`: `FieldContent` (`gap-1.5`).

## Šta je provereno i čisto

- **Galerija `/?kartice`:** svih 19 ekrana, desktop i telefon. Nema prekršaja u koncentričnosti, velikim slovima, izlasku van ekrana, karticama (24/16) i naslovima (16 i 12).
- **Drawer-i i modali** sa početne, iz „Mojih upita", „Pronađi", Podešavanja i sa stranice negovateljice, uključujući modale preko drawer-a („Otkaži posetu", „Šta nije u redu?", „Odbiti verziju 2?") i „Pomoć".
- **Ređa stanja iz Simulacije:**
  - nova verzija ugovora i povučen predlog;
  - završena saradnja;
  - plan posete za pola sata;
  - radni nalog sa satom više ili manje i poseta koja se nije desila;
  - odbijena kartica i obnova pretplate, kartica koja ističe.
- **U kodu:**
  - nema velikih slova, hex boja, teksta manjeg od 12 (osim onboardinga, gore), svojih `<input>`/`<select>`, `onClick` na div-u, citata u kurzivu i duge crte (ni u prevodima);
  - nema dugmeta isključenog zbog nepopunjenog polja, nema ikonica u dugmadima sa tekstom u Podešavanjima;
  - svi filteri su `ToggleGroup scroll`;
  - ne nedostaje nijedan prevod.
