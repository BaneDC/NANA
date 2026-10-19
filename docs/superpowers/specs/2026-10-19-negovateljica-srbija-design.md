# Deo 4: aplikacija negovateljice, Srbija (19. 10. 2026.)

Deo 4 od 5 iz `2026-10-19-negovateljice-pregled.md`. Stoji na delovima 1, 2 i 3:
- skladište, uloga, `caregiverCare.js` (deo 1);
- `marketHas`, srpske negovateljice (deo 2);
- `myClients`, forme profila, kodeks, `StatCard` (deo 3).

Zamenjuje privremenu stranicu „Upiti" iz dela 1 za tržište `RS`.

U Srbiji se preko platforme ne dogovara ništa osim upita: negovateljica prihvati ili odbije, a posle toga ona i porodica vide kontakt jedna druge i dogovaraju se telefonom.

## Šta je gotovo kad je deo 4 gotov

1. **Ceo put kroz dve kartice.** Milica (`?demo=negovateljica&trziste=sr`) i porodica (`?demo=rs`):
   - porodica pošalje upit;
   - Milica ga vidi sa svim što porodica traži i otvori profil klijenta, još bez kontakta;
   - prihvati;
   - Milica vidi telefon, e-mail, adresu i kontakt za hitne slučajeve;
   - porodica vidi „Javite joj se" sa njenim telefonom i e-mailom (deo 2).
2. Nigde na strani negovateljice u Srbiji nema ugovora, posete, cene, zarade ni Stripe-a.
3. Svaka stranica i prozor prolaze proveru iz §13 na 1440 i 375×812.

## Meni

„Upiti" (početna), „Pomoć", „Podešavanja". Kartica naloga otvara „Moj profil". Broj uz „Upiti" je broj upita koji čekaju.

## „Upiti"

`src/screens/caregiver/RequestsRs.jsx`.

- **Glava:** „Dobro došli, {ime}", „Porodice koje su vam pisale, i gde je svaki upit."
- **Filter** (`ToggleGroup scroll`, 16 unutra, broj u čipu):
  - „Čeka {n}", „Prihvaćeni {n}", „Odbijeni {n}";
  - izabran je „Čeka" ako u njemu ima nešto, inače „Prihvaćeni".
- **Bez tri obojene pločice** sa postojeće aplikacije: ponavljaju brojeve iz čipova, a obojene kartice nisu u pravilima.
- **Kartica upita koji čeka** (`Card`):
  - glava: avatar (inicijali osobe), ime osobe (`CardLink`, otvara profil klijenta), značka „Čeka vaš odgovor" (`warning`);
  - red ispod: „{godine} · {opština} · upit {kada}";
  - `Groups`: „Potrebne usluge" (oznake iz `care.need.services`), „Kada" (oznake dana i doba dana iz `care.need.schedule`), „Poruka porodice" (tekst, kad postoji);
  - `CardFooter`: „Prihvati" (`default`), „Odbij" (`secondary`, modal „Odbiti upit?" iz dela 1). Dugmad ostaju i na telefonu: rade nešto drugo od otvaranja profila (§7, kao „Pošalji poruku" na „Pronađi").
- **Kartica prihvaćenog upita:**
  - značka „Prihvatili ste" (`success`);
  - ispod grupa, deo „Kontakt porodice": dva reda kao linkovi, „Telefon" (`tel:`) i „E-mail" (`mailto:`), sa imenom porodice. Isti oblik kao `CoordinatorRows` (`Item asChild` sa `<a>`, §6);
  - bez `CardFooter`.
- **Kartica odbijenog upita:** značka „Odbili ste" (`destructive`), red „Odbili ste {datum}: {razlog}", bez linka.
- **Prazno:** narandžasti deo „Još nema upita" sa karticom „Kad vam porodica pošalje upit, stiže ovde zajedno sa planom nege." (§5).
- **Lista:** 10, pa „Prikaži još" (§8a).

## Profil klijenta

`src/screens/caregiver/ClientProfile.jsx`.

- **`BackButton`** „Upiti".
- **`PageHeader` sa `PagePerson`:** avatar, ime osobe, „{godine} · {opština}".
- **Dok upit čeka:** narandžasti deo „Čeka vaš odgovor" sa jednom karticom: „{ime porodice} vas pita da li možete da preuzmete negu." › „Prihvati" (`default`), „Odbij" (`secondary`).
- **Kartice** (dve kolone na širem stupcu, `@container`, kao početna porodice). Sve se čita iz `answers` i `record` porodice preko `RECORD_PARTS` i `src/data/record.js`, bez novog upisivanja:

| Kartica | Sadržaj |
|---|---|
| „Osnovno" (`Facts`) | opština; sa kim živi (`household`); ljubimci i pušenje samo ako ih odgovori imaju |
| „Kada je potrebna pomoć" | dani i doba dana (oznake), koliko sati nedeljno |
| „Potrebne usluge" | oznake po grupama (`ServiceChips grouped`) |
| „Zdravstveno stanje" (`DataList`, vrednost kao značka `tag`) | samo stavke koje odgovori pokrivaju: kretanje, oblačenje i higijena, ishrana, padovi, orijentacija, skala krhkosti (`FrailtyScale`). Ništa izmišljeno. Za ono što razgovor ne pita (sluh, vid, gutanje) nema reda |
| „Kontakt porodice" | ime i srodstvo, telefon, e-mail, adresa (redovi su linkovi). Pre prihvatanja: „Kontakt vidite kad prihvatite upit." |
| „Kontakt za hitne slučajeve" | iz kartona (kontakt osoba). Pre prihvatanja se ne prikazuje |

- **Odbijen upit** ne otvara profil: kartica na „Upitima" nema link.

## „Moj profil"

Ista stranica i isti obrazac kao u delu 3 (`Profile.jsx`, kartica sa `Facts` i „Izmenite" koje otvara `Dialog`). Grupe zavise od tržišta: `profileGroups(market)` u `src/data/caregiverProfile.js`.

| Kartica | `Facts` | Prozor „Izmenite" |
|---|---|---|
| „Lični podaci" | ime, datum rođenja, adresa, opština, telefon, e-mail | adresa, opština, telefon |
| „Kvalifikacije" | obrazovanje, „Sertifikat negovateljice" (Da / Ne), kursevi, „Iskustvo i veštine" | obrazovanje (`Select`: osnovna škola, srednja škola, fakultet, master, doktorat), sertifikat (`Switch`), kursevi (`Input`), iskustvo (`TextArea`) |
| „Dostupnost" | angažman, dani, doba dana, rad u inostranstvu, radijus | angažman (čipovi, više njih: „Dnevne posete", „Smena 24 h"), dani, doba dana, „Rad u inostranstvu" (`Switch`), radijus (`Select`); napomene iz registracije (vidi deo 5); `PaneHint` „Tržišna cena je oko 1.000 RSD na sat i oko 6.000 RSD za 24 sata." |
| „Zdravlje i navike" | pušenje, alkohol, rad uz ljubimce, jezici, alergije, fizička ograničenja, zdravstveni problemi, osuđivanost, spremnost za rad (oznake), šta ne želi da radi | da / ne kao čipovi u paru, jezici (čipovi), spremnost za rad (čipovi, više njih), „Šta ne želite da radite" (`TextArea`) |
| „Kontakt za hitne slučajeve" | ime, srodstvo, telefon, adresa | ista polja, sva obavezna |

- **Glava:** prekidač „Primam nove upite", kao u Finskoj.
- **Prozori** su u `src/components/caregiver/ProfileForms.jsx`, uz finske, sa poljima po tržištu. Registracija (deo 5) koristi iste.

## Ostalo

- **Podešavanja:** kao u delu 1, bez grupe „Plaćanje".
- **„Pomoć" i „Kodeks ponašanja":** kao u delu 3.
- **Simulacija:** iz dela 1 (pošalji upit, otkaži upit), za Milicu.

## Šta se upisuje u `patterns.md`

§12c dobija Srbiju:
- meni;
- „Upiti" bez pločica sa brojevima;
- kartica upita sa kontaktom posle prihvatanja;
- profil klijenta iz odgovora i kartona, kontakt tek posle prihvatanja;
- grupe profila po tržištu.

## Provera

- Ceo put iz „Šta je gotovo", u dve kartice.
- Skript iz §13 na „Upitima" (prazno, čeka, prihvaćen, odbijen), profilu klijenta (pre i posle prihvatanja), „Mom profilu" i svakom prozoru „Izmenite", na 1440 i 375×812.
- `node scripts/i18n-missing.mjs`, `npm test`, `npm run build`.
- **Testovi (`vitest`):**
  - `profileGroups('RS')` i `profileGroups('FI')`;
  - čitanje zdravstvenog stanja iz odgovora: samo stavke koje postoje;
  - kontakt porodice je skriven dok upit nije prihvaćen.
