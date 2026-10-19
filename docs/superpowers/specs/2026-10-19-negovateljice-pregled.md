# Strana za negovateljice i dva tržišta: pregled (19. 10. 2026.)

Krovni dokument. Kaže šta pravimo, na koje delove je posao podeljen i kojim redom ide.

## Specovi i redosled izvršavanja

Svi delovi su dizajnirani 19. 10. Izvršavaju se ovim redom, jer svaki stoji na prethodnim. Svaki dobija plan implementacije (`docs/superpowers/plans/`) kad na njega dođe red. Dizajner posle prolazi kroz sve.

| # | Deo | Spec | Plan |
|---|---|---|---|
| 1 | Temelj | `2026-10-19-temelj-design.md` | `../plans/2026-10-19-temelj.md` |
| 2 | Porodica u Srbiji | `2026-10-19-porodica-srbija-design.md` | — |
| 3 | Negovateljica, Finska | `2026-10-19-negovateljica-finska-design.md` | — |
| 4 | Negovateljica, Srbija | `2026-10-19-negovateljica-srbija-design.md` | — |
| 5 | Registracija negovateljice | `2026-10-19-registracija-negovateljice-design.md` | — |

## Cilj

Prototip (bez servera, sve u pregledaču) dobija drugu stranu: negovateljica se registruje, prijavi i radi sa porodicom koja joj je stvarno poslala upit. Postoje dva tržišta, Finska i Srbija, sa različitim mehanizmom. Developeri prave aplikaciju 1:1 po prototipu.

- **Implementiramo mi**, a dizajner posle prolazi kroz sve i dorađuje.
- **Sve po `docs/patterns.md`:**
  - komponente, tokeni i boje, koncentrični uglovi;
  - prozor je na telefonu bottom sheet;
  - polja su iz `TextField.jsx`, greške ispod polja, dugme nikad isključeno zbog nepopunjenog polja;
  - filter je `ToggleGroup scroll`;
  - tekst je u `t()` sa en i fi prevodom;
  - provera iz §13 na desktopu i na 375×812.
- **Obrazac koga nema u pravilima** pravimo po našem sistemu. Upisuje se u `patterns.md` jednom rečenicom, sa oznakom „predlog, čeka dizajnera".

## Dva tržišta

| | Finska | Srbija |
|---|---|---|
| Šta porodica plaća platformi | pretplata Basic / Premium | jednokratni paket: mesečni (43 €) ili tromesečni (98 €), ne obnavlja se sam |
| Novac za negu | ide preko platforme: rezervacija, radni nalog, naplata posle 24 h, isplata negovateljici (Stripe) | ne ide preko platforme; dogovaraju se telefonom |
| Posle prihvaćenog upita | ugovor o nezi (verzije), plan posete, radni nalog, zarada | samo kontakt: porodica vidi telefon i e-mail negovateljice, negovateljica vidi profil klijenta sa kontaktom |
| „Moja nega" porodice | plan nege, a posle prihvaćenog ugovora pregled (dashboard) | uvek samo plan nege |
| Kartica u Podešavanjima porodice | „Način plaćanja" i „Pretplata" | samo „Paket" (koji, kada plaćen, koliko, do kada važi); kartica se ne čuva |
| Registracija negovateljice | 4 koraka, pa dokumenti i razgovor | 6 koraka, pa test ličnosti (62 para) i razgovor |
| Početna negovateljice | tabla (kanban): Novi upiti, Ugovor o nezi, Sledeća poseta, Radni nalozi | upiti: čeka / prihvaćeni / odbijeni |

Modeli plaćanja se menjaju dok se testira šta radi najbolje. Zato su paketi i pretplate (cena, trajanje, šta uključuju) samo podaci u jednom fajlu (`src/data/plans.js`), a ekrani ih samo čitaju.

## Podela na delove i redosled

1. **Temelj:**
   - jedno skladište za demo po tržištu, deljeno između porodice i negovateljice;
   - sinhronizacija dve kartice;
   - prijava kao negovateljica i demo nalozi;
   - prekidač tržišta;
   - Simulacija sa obe strane.

   Spec: `2026-10-19-temelj-design.md`.
2. **Porodica u Srbiji:**
   - „Moja nega" je samo plan;
   - nema pregleda, ugovora, poseta ni naplate;
   - paketi umesto pretplate, kartica „Paket" u Podešavanjima;
   - profil negovateljice sa telefonom i e-mailom kad prihvati;
   - srpske negovateljice na „Pronađi".
3. **Aplikacija negovateljice, Finska:**
   - tabla vraćena iz istorije (commit `005567c` ju je obrisao 17. 10.: `Board.jsx`, `BoardCard.jsx`, `ClientPage.jsx`, `AgreementForm.jsx`, `VisitPlanForm.jsx`, `WorkOrderForm.jsx`), ali vezana za pravo stanje umesto izmišljenih klijenata;
   - „Klijenti" (prihvaćeni / odbijeni), stranica klijenta sa posetama i ugovorom, drawer-i „Pregled" i „Šta se desilo";
   - ugovor (nova verzija, povlačenje), plan posete, radni nalog, završetak saradnje;
   - „Zarada";
   - „Moj profil" kao Podešavanja: grupe kartica sa `Facts` i „Izmenite", koje otvara modal;
   - „Kodeks ponašanja".
4. **Aplikacija negovateljice, Srbija:**
   - „Upiti": tri broja i filter čeka / prihvaćeni / odbijeni;
   - kartica upita (usluge, dani i doba dana, opština i godine; prihvati, odbij, profil);
   - profil klijenta: osnovno, kada treba pomoć, usluge, zdravstveno stanje, kontakt za hitne slučajeve, telefon i e-mail. Pravi se iz odgovora iz razgovora sa Minnom i iz kartona, ništa se ne upisuje dvaput;
   - profil sa dodatnim grupama „Zdravlje i navike" i „Kontakt za hitne slučajeve".
5. **Registracija negovateljice:**
   - **zajedničko:** „Ko ste?" (porodica ili negovateljica), izbor zemlje, e-mail i dve saglasnosti;
   - **Finska:** osnovno, profesija (klasifikacije sa oznakom da li traže dokument, obrazovanje, jezici, biografija), dostupnost (dani, doba dana, radijus, cena od–do), pregled; posle slanja dokumenti za klasifikacije koje ih traže;
   - **Srbija:** osnovno, kvalifikacije (sertifikat da/ne, kursevi, iskustvo), dostupnost (dnevne posete i/ili 24 h, dani, doba dana, rad u inostranstvu, radijus, napomena o tržišnoj ceni u RSD), zdravlje i navike, kontakt za hitne slučajeve, pregled; posle slanja test ličnosti (62 para osobina, u svakom se bira jedna; pitanja šalje korisnik);
   - **obe:** izbor kanala za razgovor sa koordinatorkom (WhatsApp, Viber, Google Meet / Zoom) i ekran „Hvala".

   Koraci forme su isti modali kao u profilu (deo 3 i 4), pa se polja prave jednom.

## Čeka na korisnika

- 62 para testa ličnosti. Do tada su u `src/data/personalityTest.js` privremeni parovi (deo 5).
- Paketi u Srbiji su sa `nanaprime.com/sr/pricing` (deo 2). Modeli se još testiraju, pa se menjaju samo u `plans.js`.

## Šta smo našli na slikama, a ne prenosimo

Greške postojeće aplikacije koje u novoj ne ponavljamo:

- **Naslovi i tekst:**
  - prvi korak forme ima naslov „Health and lifestyle";
  - placeholder biografije govori o zadacima i diplomama.
- **Pregled pred slanje:**
  - nema opštine;
  - dani nisu po redu.
- **Doba dana i dugmad:**
  - „Evening 22:00–06:00" je noć: kod nas je „veče" kako ga već imamo u `SLOTS` (`src/data/carePlan.js`);
  - dugme isključeno dok nešto nije izabrano: kod nas greška ispod polja.
- **Sat:** sumnja na UTC/Helsinki pomak u vremenima. Kod nas važi sat demoa.
