# Deo 3: aplikacija negovateljice, Finska (19. 10. 2026.)

Deo 3 od 5 iz `2026-10-19-negovateljice-pregled.md`. Stoji na delu 1:
- skladište i sinhronizacija;
- uloga `caregiver`, kostur `CaregiverApp`;
- radnje u `caregiverCare.js` sa opcijama.

Zamenjuje privremenu stranicu „Upiti" iz dela 1 za tržište `FI`.

Izvori:
- dizajnerova tabla i stranica klijenta, obrisane 17. 10. (`git show 005567c^:src/screens/caregiver/Board.jsx`, `ClientPage.jsx`, `src/components/caregiver/*.jsx`);
- HTML dizajn `NANA Prime Billing.html`;
- slike postojeće aplikacije (opis u pregledu).

Ovde se ništa od toga ne kopira doslovno. Sve se slaže od naših komponenti, po `patterns.md`.

## Šta je gotovo kad je deo 3 gotov

1. **Ceo put kroz dve kartice, bez Simulacije.** Sanna (`?demo=negovateljica`) i porodica (`?demo`) u dve kartice:
   - upit;
   - prihvatanje;
   - ugovor (Sanna bira usluge i cenu);
   - porodica prihvati i doda karticu;
   - plan posete (Sanna bira dan, početak i trajanje);
   - poseta prođe („Prođe dan" u Simulaciji);
   - radni nalog (Sanna ga popuni);
   - naplata posle 24 sata;
   - poseta je u „Zaradi".
2. Svaka radnja na jednoj strani odmah se vidi na drugoj. Iznosi su isti: porodica vidi ceo iznos, a Sanna 90% od njega (`totalsFor`).
3. Tabla, „Klijenti", stranica klijenta, „Zarada" i „Moj profil" prolaze proveru iz §13 na 1440 i 375×812. Svaki prozor je na telefonu bottom sheet.

## Meni

„Tabla" (početna), „Klijenti", „Zarada", pa „Pomoć", „Podešavanja". Kartica naloga otvara „Moj profil" i uokviri se dok je on otvoren, kao kod porodice karton.
- Broj uz „Tabla" je zbir upita koji čekaju i radnih naloga koji nisu poslati.
- U skupljenom meniju sve radi kao kod porodice (§4).

## Klijenti negovateljice (podaci)

- **Klijent** je jedna porodica u obliku `person` (odgovori, karton, `care`) iz kog se čita sve što se vezuje za ovu negovateljicu.
- **Demo porodica** je u skladištu kao `person`.
- **Ostali klijenti** su u `clients` (deo 1), isti oblik. Novi `src/data/caregiverClients.js` ih pravi za demo, istim funkcijama kao `demoFill.js`: pozivi `askCaregiver`, `answerRequest`, `sendTerms`… redom, kako bi ih dve strane napravile, bez izmišljenog stanja.
- **Za Sannu, pored demo porodice:**
  - jedan novi upit (Eila Mäkelä);
  - jedan prihvaćen bez ugovora (Eero Virtanen);
  - jedna aktivna saradnja sa posetom za sutra;
  - jedna sa radnim nalogom koji čeka;
  - jedna završena;
  - jedan odbijen upit.

  Imena, godine i opštine su iz stare `caregiverBoard.js`.
- **Pomoćne funkcije** u `src/data/caregiverView.js` (nove, sa testovima):
  - `myClients(state, caregiverId) → [{ id, person, request, arrangement, stage }]`;
  - `stageOf(care, caregiverId) → 'request' | 'agreement' | 'active' | 'work-order' | 'ended' | 'declined'`;
  - `earnings(state, caregiverId, now) → { paidThisMonth, processing, reserved, paid: [visit…] }`;
  - `owes(care, caregiverId) → { kind, … } | null`: šta ona sledeće duguje, za narandžasti deo.
- Radnje nad „ostalim" klijentom idu istim `caregiverCare.js` funkcijama, nad njegovim `care`.

## Tabla

`src/screens/caregiver/Board.jsx`.

- **Glava:** „Vaša tabla", „{ime}, sve što čeka na vas, sleva nadesno, redom kojim se dešava."
- **Četiri broja:** četiri kartice sa brojem, kao `StatCard` na početnoj porodice (`Dashboard.jsx`). Komponenta se izvlači u `src/components/StatCard.jsx`, da je koriste obe strane. Raspored je četiri u redu, a uže dva po dva (`@container`):

| Broj | Oznaka | Napomena |
|---|---|---|
| upiti koji čekaju | „Za odgovor" | „Najstariji: {n} h / d", ili „Ništa ne čeka" |
| prihvaćeni bez poslatih uslova | „Ugovori za slanje" | „Blokira svaku posetu", ili „Sve poslato" |
| posete bez radnog naloga | „Neposlati radni nalozi" | „{iznos} nefakturisano" |
| njen neto ovog meseca | „Isplaćeno vam u {mesec}" | „{iznos} u obradi" |

- **Kolone:** klijent je u tačno jednoj, onoj koja kaže šta ona sledeće duguje (`stageOf`):

| Kolona (napomena ispod naslova) | Ko | Footer kartice |
|---|---|---|
| „Novi upiti" (Prihvati ili odbij) | upit čeka | „Prihvati" (`default`), „Odbij" (`secondary`, modal iz dela 1) |
| „Ugovor o nezi" (Koje usluge, i jedna cena po satu) | prihvaćen, a uslova nema ili su odbijeni; ili uslovi čekaju porodicu | „Pošalji ugovor" (`default`); dok uslovi čekaju porodicu, nema dugmeta i stoji značka „Čeka porodicu" (`warning`) |
| „Aktivno" (Saradnja je u toku) | uslovi važe i ne duguje radni nalog | „Pošalji plan posete" (`default`) kad `cannotPlan` vrati `null`; inače rečenica iz `cannotPlan`, bez dugmeta |
| „Radni nalozi" (Pošalji posle svake posete) | bar jedna poseta čeka njen radni nalog | „Pošalji radni nalog" (`default`) |

- **Kolona:**
  - **izgled:** siva podloga (`bg-muted`), r32, p8, a naslov sa brojem je kao naslov grupe (§2: 12, medium), 16 od leve ivice, kao naslov u narandžastom delu;
  - **kartice:** obične bele `Card` (r24, p16), 8 jedna od druge. Uglovi su koncentrični kao u narandžastom delu (§5: podloga r32 p8 oko kartice r24). Ovo je predlog za §12c;
  - **skrol:** kolona se skroluje sama, a tabla se ne skroluje kao stranica.
- **Kartica na tabli:**
  - glava: avatar, ime osobe (`CardLink`, otvara stranicu klijenta), značka stanja;
  - red ispod: opština · koliko čeka ili od kada;
  - jedan do tri reda `DataList` sa onim što ta kolona traži (sati i kada; cena; sledeća poseta; poseta za koju fali radni nalog i iznos);
  - `CardFooter` sa jednim dugmetom.
- **Prazna kolona:** jedna rečenica tekstom kartice (sivo):
  - „Trenutno nema novih upita."
  - „Nema ugovora koje treba postaviti."
  - „Još nema saradnji u toku."
  - „Nema šta da se fakturiše."
- **Na telefonu (≤640):**
  - kolone su jedan red čipova (`ToggleGroup scroll`, „Novi upiti 1" …);
  - ispod su kartice izabrane kolone; izabrana je prva neprazna;
  - četiri broja su dva po dva.
- **Kad se kartica pomeri u drugu kolonu** (posle radnje), pomeri se animacijom (`motion` `layout`, kao kod dizajnera), bez skakanja.

## Stranica klijenta

`src/screens/caregiver/ClientPage.jsx`.

- **`BackButton`:** „Tabla" ili „Klijenti", odakle je otvorena.
- **`PageHeader` sa `PagePerson`:**
  - avatar (inicijali osobe), ime, a ispod „{godine} · {opština} · od {datum}";
  - u `PageActions` ikonica-dugmad (`secondary`, `size="icon"`): „Pregled" (`IdCard`) i „Šta se desilo" (`History`), isto kao porodičina „njena stranica" (§7).
- **Narandžasti deo** (`Attention`), samo kad ona nešto duguje (`owes`). Jedna bela kartica sa rečenicom i jednim dugmetom:
  - „Radni nalog čeka": „Poseta {dan} {sati} je prošla. Porodica čeka radni nalog." › „Pošalji radni nalog";
  - „Pošaljite ugovor": „{ime porodice} je prihvatila saradnju. Posete počinju kad prihvati uslove." › „Pošalji ugovor";
  - „Uslovi čekaju porodicu": bez dugmeta;
  - „Prijava je kod koordinatorke": bez dugmeta, a kaže šta je porodica prijavila.
- **Kartica „Sledeća poseta":**
  - `DataList`: „Kada", „Šta", „Rezervisano porodici", „Vi dobijate";
  - footer: „Otkaži posetu" (`secondary`) dok je plan;
  - kad plana nema: „Pošalji plan posete" ili rečenica zašto ne može.
- **Kartica „Ugovor o nezi":**
  - verzija koja važi: „Vi dobijate {neto} € / h", „Porodica plaća {cena} € / h, PDV uključen", usluge po grupama (`ServiceChips grouped`), dodatni uslovi;
  - footer: „Predloži izmene" (`secondary`) i „Završi saradnju" (`secondary`). Dok nova verzija čeka: „Povuci predlog" (`secondary`) umesto „Predloži izmene";
  - „Sve verzije (N)" kao kod porodice (§7).
- **Kartica „Posete":**
  - redovi po mesecima (§8a): dan i sati, značka stanja, a desno njen iznos;
  - stanja: „Rezervisano", „Čeka radni nalog", „Kod porodice", „Prijava", „Plaćeno", „Otkazano";
  - red otvara drawer posete (plan ili radni nalog, kako je poslat), 10, pa „Prikaži još".
- **Drawer „Pregled"** (`Modal`):
  - dva broja (`Stats`): posete do sada, od kada;
  - „Kontakt": porodica (ime, srodstvo, telefon, e-mail), adresa;
  - „Kontakt za hitne slučajeve": iz kartona;
  - „Na šta paziti": rizici i alergije kao oznake, `FrailtyScale`;
  - „Svakodnevica": kretanje, samostalnost, podrška, iz odgovora preko `RECORD_PARTS`;
  - „Dogovorena nega": verzija koja važi.
- **Drawer „Šta se desilo":** `ActivityDrawer` nad `care.log` filtriranim na nju. Kad je reč o njoj, ona je „vi", a porodica „{ime}".

## Forme

Sve su `Dialog` sa delovima (§7). Delovi su 24 jedan od drugog, a ime dela je `Part`. Na telefonu su bottom sheet. Greške idu ispod polja preko `useCheck`, a dugme nije isključeno.

1. **„Ugovor o nezi"** (eyebrow: ime osobe; naslov: „Ugovor o nezi" ili „Nova verzija ugovora"):
   - **„Usluge":** čipovi u četiri grupe iz `serviceCatalog.js` (`ToggleGroup type="multiple"`, lome se u redove). Unapred je izabrano ono što porodica traži (`care.need.services`), a za novu verziju ono iz verzije koja važi. Greška: „Izaberite bar jednu uslugu.";
   - **„Cena po satu":** `Input` sa `suffix` „€/h", obavezno. Napomena: „Porodica plaća ovu cenu, PDV uključen. Vi dobijate {neto} € / h." Greška: „Najmanje 12 € / h.";
   - **„Dodatni uslovi"** i **„Poruka porodici":** `TextArea`, opciono;
   - za novu verziju, rečenica: „Verzija koja važi ostaje dok porodica ne prihvati novu. Nove posete čekaju do tada.";
   - futer: „Nazad", „Pošalji ugovor";
   - zove `sendTerms(id, { services, rate, terms, note })`.
2. **„Plan posete":**
   - **„Dan":** čipovi „Danas", „Sutra";
   - **„Početak":** `Select` na pola sata, a za danas samo vreme posle sadašnjeg;
   - **„Trajanje":** `Select` od 0,5 do 12 h;
   - **„Napomena":** opciono;
   - ispod `DataList`: „Kada" (dan, od–do), „Rezerviše se porodici", „Vi dobijate";
   - ako je početak za manje od sat vremena, `PaneHint`: „Ako porodica otkaže u poslednjem satu, plaća celu posetu.";
   - futer: „Nazad", „Pošalji plan posete";
   - zove `planVisit(id, { day, start, hours, notes })`.
3. **„Radni nalog":**
   - **„Sati":** `Select`, unapred planirano;
   - **„Urađeno":** čipovi usluga iz plana, sve uključene;
   - **„Kako je bila":** tri reda čipova (raspoloženje: Loše / Kao i obično / Dobro; ishrana i kretanje: Manje nego obično / Kao i obično / Više nego obično);
   - **„Šta ste zapisali":** `TextArea`, obavezno;
   - **„Nešto vas je zabrinulo?":** `Collapsible` sa `TextArea` i napomenom „Vidi samo koordinatorka.";
   - kad su sati veći od planiranih: „Sat više porodica mora da odobri. Do tada se naplaćuje planirano.";
   - futer: „Nazad", „Pošalji radni nalog";
   - zove `sendWorkOrder(visitId, { hours, mood, eating, moving, note, done, concern })`.
4. **Manji modali:**
   - **„Otkazati posetu?":** razlozi kao čipovi (HTML dizajn: „Porodica je otkazala", „Bolesna sam", „Hitan slučaj u porodici", „Nešto drugo"); futer „Nazad", „Otkaži posetu";
   - **„Poseta se nije desila":** razlozi („Niko nije bio kod kuće", „Porodica je otkazala istog dana", „Nisam mogla da dođem", „Bila sam bolesna"); zove `visitNotHappened`. Otvara se iz kartice posete koja čeka radni nalog, kao drugo dugme (`secondary`);
   - **„Završiti saradnju sa {ime}?":** „Zakazane posete se otkazuju i rezervacije vraćaju. Obavljene posete ostaju u evidenciji. Poseta koja je u toku mora prvo da se završi."; futer „Nastavi saradnju", „Završi saradnju" (`secondary`, jer gasi, §9); zove `caregiverEnds`.

## „Klijenti"

`src/screens/caregiver/Clients.jsx`.

- **Glava:** „Klijenti", „Svi koje ste prihvatili i svi upiti koje ste odbili. Tabla nosi ono što čeka, ovde je cela istorija."
- **Filter** (`ToggleGroup scroll`, 16 unutra kao na „Mojim upitima"): „Sada {n}", „Završeno {n}", „Odbijeni {n}".
- **Kartica:**
  - avatar, ime (`CardLink` na stranicu klijenta) i značka (`success` „Aktivno", `secondary` „Završeno", `destructive` „Odbijeno");
  - red ispod: opština · od {datum} · {cena} € / h · {n} poseta;
  - odbijeni nema link, a umesto reda ispod ima „Odbili ste {datum}: {razlog}".
- **Lista:** 10, pa „Prikaži još" (`useShowMore`).

## „Zarada"

`src/screens/caregiver/Earnings.jsx`.

- **Glava:** „Zarada", „Svaka plaćena poseta, od naplate porodici do isplate vama. Iznosi su vaš deo, posle provizije."
- **Ako Stripe nalog nije aktivan** (u demou: `user.payouts !== 'active'`; Simulacija ga uključuje): narandžasti deo „Isplate još nisu pokrenute", sa jednom karticom: „Da biste primali isplate, završite podešavanje Stripe naloga." › „Završite podešavanje" (`default`). U prototipu dugme samo uključuje isplate i kaže to toastom.
- **Kartica sa tri broja** (`Stats`, broj 24 / 32):
  - „Isplaćeno ovog meseca";
  - „U obradi" (naplata u 24 sata);
  - „Rezervisano za zakazane posete".
- **Kartica „Isplate i banka":** „Stripe vam šalje isplatu svake nedelje, na račun koji ste uneli kod njih." i „Isplate u Stripe-u" (`secondary`, link u novoj kartici).
- **„Plaćene posete":**
  - grupe po mesecu sa brojem (§8a);
  - red: ime klijenta, „{dan} · {sati}", desno njen iznos i „naplaćeno {datum}";
  - red otvara radni nalog (drawer);
  - 10, pa „Prikaži još".
- **U `patterns.md` §8:** „Nikad zbir plaćenog" važi za porodicu. Negovateljici se zbir zarade prikazuje, jer je to stranica o tome.

## „Moj profil"

`src/screens/caregiver/Profile.jsx`, složen kao Podešavanja.

- **Glava stranice:** `PagePerson` sa avatarom, imenom, „{opština} · {cena od–do}". U `PageActions` je prekidač „Primam nove upite" (`Switch` sa labelom). Isključen znači da je porodice ne vide na „Pronađi" i da joj ne mogu pisati.
- **Grupe** (`PageSection`). Svaka kartica ima `Facts`, a u `CardHeader` „Izmenite" (`secondary`) koje otvara `Dialog`:

| Kartica | `Facts` | Prozor „Izmenite" |
|---|---|---|
| „Lični podaci" | ime, datum rođenja, adresa, opština, telefon, e-mail (`note`: menja se preko koordinatorke) | adresa, opština (`Select`), telefon |
| „Profesija" | klasifikacije (oznake), obrazovanje, jezici, „O sebi" | obrazovanje (`Select`), jezici (čipovi), „O sebi" (`TextArea`); klasifikacije su tekst: „Menjaju se preko koordinatorke, zbog dokumenata." |
| „Dostupnost" | dani, doba dana, radijus, cena | dani (čipovi pon–ned), doba dana (čipovi, uz sate iz `SLOTS`), radijus (`Select`: 5, 10, 20, 30, 50 km), cena od–do (dva `Input`, „€/h"); napomena „Tržišna cena je oko 15–25 € / h."; greška kad je „od" veće od „do" |
| „Dokumenti" | red po dokumentu: naziv („Lähihoitaja todistus") i značka „Provereno" (`success`) ili „Čeka proveru" (`warning`) | nema; „Nov dokument šaljete koordinatorki." |

- **Prozori su komponente** u `src/components/caregiver/ProfileForms.jsx` (`PersonalForm`, `ProfessionForm`, `AvailabilityForm`). Registracija (deo 5) koristi ista polja.
- **Podaci profila** su na nalogu negovateljice (`user.profile`). Iz njega se pravi i njen zapis koji porodica vidi. `caregiverById` vraća zapis sa izmenama iz profila, ako je ona prijavljena u demou, pa porodica u drugoj kartici vidi nov opis.

## „Kodeks ponašanja"

- **Tekst** je sa slike postojeće aplikacije: uvod „U obavljanju posla negovateljice, zaposlena je dužna da:" i spisak. Stoji u `src/data/codeOfConduct.js`, na srpskom u `msg()`, sa en i fi prevodom.
- **Otvara se iz „Pomoći":** za negovateljicu `HelpDialog` ima, posle kontakta koordinatorke, deo „Pravila rada" sa redom „Kodeks ponašanja" (`Item` sa `ItemLink`). Red otvara `Dialog` „Kodeks ponašanja za negovateljice": `DialogDescription` i spisak (`CheckList` ili običan spisak tekstom kartice).

## Simulacija (strana negovateljice, Finska)

Iz dela 1, plus:
- „Stripe nalog je aktivan" (uključuje isplate);
- „Porodica odobri dodatni sat" / „odbije dodatni sat" (`answerExtra`);
- „Porodica potvrdi radni nalog" (`confirmVisit`, naplata odmah, bez čekanja 24 sata).

## Šta se upisuje u `patterns.md`

- **§12c (iz dela 1) dobija:** meni u Finskoj; tablu (kolone, kartica, telefon); stranicu klijenta; forme; „Klijenti"; „Zarada"; „Moj profil" kao Podešavanja (kartica sa `Facts` i „Izmenite" koje otvara prozor); kodeks.
- **§8:** zbir zarade se prikazuje negovateljici.
- **§13:** napomena da je tabla na telefonu jedan stubac sa čipovima, pa ne treba izuzetak za `overflow`.

## Provera

- Ceo put iz „Šta je gotovo", u dve kartice.
- Skript iz §13 na svakoj stranici i u svakom prozoru, na 1440 i 375×812.
- `node scripts/i18n-missing.mjs`, `npm test`, `npm run build`.
- **Testovi (`vitest`):**
  - `stageOf` za svako stanje;
  - `owes`;
  - `earnings` (neto po poseti, ovaj mesec, u obradi, rezervisano);
  - `myClients` (demo porodica i ostali, filtrirano na nju);
  - `caregiverClients` (napravljeno istim funkcijama, svaki klijent u očekivanoj koloni).
