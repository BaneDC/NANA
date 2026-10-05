# Storybook

Storybook prikazuje svaku komponentu sama za sebe, na istim stilovima kao aplikacija (Tailwind, tokeni, `index.css`), da bi se radio vizuelni QA shadcn komponenti i delova napravljenih od njih. Galerija `/?kartice` pokazuje cele ekrane; Storybook pokazuje delove.

## Pokretanje

Prvi put posle `git pull` (Storybook je u `devDependencies`):

```
npm install
```

Zatim, svaki put:

```
npm run storybook
```

Otvara se na **http://localhost:6006** (aplikacija ostaje na svom portu). U Claude Code-u je to konfiguracija `storybook` u `.claude/launch.json`.

Statički build (npr. za Vercel): `npm run build-storybook` → `storybook-static/` (u `.gitignore`).

## Šta je unutra

| Grupa | Priče |
|---|---|
| Osnovno | Dugme (sve varijante, sa ikonicom, veličine, isključeno), Značka (stanja i oznaka), Avatar (po `--avatar`) |
| Polja | Tekst (sa ikonicom, lozinka, napomena, isključeno), Polje za tekst, Izbor, Prekidač i kvačica, Čipovi (filteri), Kod (2FA) |
| Kartica | Osnovna (sa podacima), Sa dugmetom u glavi, Kartica koja se otvara („Pronađi"), Sa ikonicom („Pozovite me"), Redovi u kartici |
| Osoba i poseta | Glava negovateljice (svako stanje), Ocena, Stanje sa njom, Posete (svaki status), Izveštaj posete, Oznake |
| Prozori | Drawer (`Modal`), Modal (`Dialog`), i svaki drawer porodice na primeru: ugovor, radni nalog, plan posete, informacije o negovateljici, sve posete, šta se desilo, pregled, sve verzije, završetak saradnje |
| Ostalo | Narandžasti deo, Glava stranice, Prazna stranica, Strane (paginacija), Podaci, Toast |

Podaci su isti primer kao u galeriji (`sampleCare` iz `src/screens/CardGallery.jsx`), pa su tu sva stanja koja aplikacija zna. Dugmad u pričama ne menjaju primer.

## Kako se radi QA

1. U traci gore izaberi širinu: **Telefon 375×812** ili **Desktop 1280×860** (iste širine kao provera iz `patterns.md` §13). Prozori su na telefonu bottom sheet.
2. Uporedi sa pravilima iz `docs/patterns.md`: razmaci na 4px, radiusi 4/8/16/24/32 i koncentrični uglovi, veličine teksta, varijante dugmadi, avatar visok koliko tekst pored njega.
3. Za mere (razmak, radius) koristi alat za merenje u pregledaču ili računate stilove; ne od oka.
4. **Dodir:** veličine na dodir (polja 16px, dugmad 44px) dolaze iz `@media (pointer: coarse)`, a širina u traci ih ne menja. Za njih otvori Storybook na telefonu (u istoj mreži: `npm run storybook -- --host 0.0.0.0`, pa adresa računara i port 6006) ili u pregledaču uključi emulaciju dodira.

## Nova komponenta ili novo stanje

Priče su u `src/stories/*.stories.jsx`, po grupama iz tabele. Nova komponenta ili novo stanje dobija priču u svojoj grupi: koristi pravu komponentu i pravi primer podataka, ne kopiju markupa. Provera da sve priče rade (bez grešaka na obe širine) je u dnevniku od 5. 10.
