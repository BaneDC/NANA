# Deo 5: registracija negovateljice (19. 10. 2026.)

Deo 5 od 5 iz `2026-10-19-negovateljice-pregled.md`. Stoji na delovima 1–4:
- „Ko ste?" i demo (deo 1);
- srpske i finske negovateljice, `caregiverById` (delovi 1 i 2);
- polja profila u `ProfileForms.jsx` i `profileGroups(market)` (delovi 3 i 4).

**Ovo je deo koji dizajner treba najviše da prođe.** Napravimo prvo najjednostavniju verziju koja radi i koja se lako menja. Sve što ovde nastaje, a nema ga u pravilima (koraci forme, traka napretka, test ličnosti, polje za fajl, izbor kartica), upisuje se u `patterns.md` sa oznakom „predlog, čeka dizajnera".

## Šta je gotovo kad je deo 5 gotov

1. **Finska.** Na `/`: „Napravi nalog" › „Negovateljica" › „Finska" › nalog › 4 koraka › dokumenti › razgovor › „Hvala". Posle toga negovateljica može da se prijavi i vidi da profil čeka razgovor.
2. **Srbija.** Isto: 6 koraka › test ličnosti (62 para) › razgovor › „Hvala".
3. **Aktivacija.** U Simulaciji „Koordinatorka aktivira profil". Posle toga je nova negovateljica na „Pronađi" kod porodice tog tržišta (druga kartica), i upit njoj stiže na njenu stranu.
4. Svaki korak prolazi proveru iz §13 na 1440 i 375×812, prazan i sa greškama.

## Tok

| Ekran | Finska | Srbija |
|---|---|---|
| „Ko ste?" (deo 1) | Negovateljica | Negovateljica |
| „Gde želite da radite?" | kartica-izbor „Finska" | kartica-izbor „Srbija" |
| Nalog | e-mail, lozinka, dve saglasnosti | isto |
| Forma | 4 koraka | 6 koraka |
| Posle slanja | dokumenti, pa razgovor | test ličnosti, pa razgovor |
| Kraj | „Hvala" | „Hvala" |

Svaki ekran je u istom okviru kao registracija porodice (`Register.jsx`: logo, kolona, ista širina, ista podloga).

### „Gde želite da radite?"

- „Izaberite zemlju u kojoj želite da negujete starije."
- Dve kartice-izbora: „Srbija" (ispod „Rad kao negovateljica u Srbiji") i „Finska" („Rad kao negovateljica u Finskoj").
- Izbor odmah vodi dalje. Kartica-izbor je `Card` sa `CardLink` (ceo je klikabilan, §7).
- „Nazad" vodi na „Ko ste?".

### Nalog

- „Prijavite se kao negovateljica", „Unesite podatke da započnete prijavu."
- **Polja** (`TextField.jsx`):
  - „E-mail" (obavezno, ispravna adresa);
  - „Lozinka" (`Password`, najmanje 8 karaktera, kao kod porodice). Na postojećoj aplikaciji je nema, a ovde je potrebna da bi prijava radila;
  - „Saglasnost za obradu podataka" i „Potvrđujem da su podaci tačni" (`Checkbox`, obavezne, `FieldError` ispod).
- „Nastavi" (`default`, `lg`, cela širina, kao „Napravi nalog").
- **Nalog se čuva** u `src/lib/account.js` sa `role: 'caregiver'`, `market` i `status: 'applying'`.

## Forma

- **Gore:**
  - sitan tekst „Korak {n} od {m}";
  - naslov koraka (`PageTitle`) i podnaslov (`PageDescription`);
  - ispod, traka napretka: siva traka visine 4, r4, a popunjeni deo je `bg-primary`. Novo je, predlog za dizajnera.
- **Prvi korak:** `PaneHint` „Za popunjavanje treba 10 do 20 minuta."
- **Telo:** bele kartice po grupama (`Card`, `CardTitle`), polja iz `TextField.jsx` i čipovi (`ToggleGroup`, lome se u redove jer se bira u formi, §12). Polja su ista kao u prozorima „Izmenite" (`src/components/caregiver/ProfileForms.jsx`): forme se crtaju i u koraku i u prozoru, sa istom proverom.
- **Futer:**
  - „Nazad" (`secondary`, od drugog koraka), „Dalje" (`default`), na poslednjem „Pošalji prijavu";
  - na telefonu je zakačen za dno, a na desktopu je ispod kartica, desno;
  - „Dalje" nije isključeno: greške se pokazuju na pritisak, fokus ide na prvo pogrešno polje (`useCheck`, §10).
- **Odgovori se čuvaju posle svakog „Dalje"** (`saveProgress` u `account.js`, kao porodični onboarding), pa ponovna prijava nastavlja gde je stala.

### Koraci, Finska

1. **„Osnovni podaci":**
   - ime i prezime (dva polja u redu, na telefonu jedno ispod drugog);
   - datum rođenja (`DateInput`);
   - adresa („Adresa iz lične karte");
   - opština (`Select` sa pretragom, finske opštine);
   - telefon (+358): novo polje `Phone` u `TextField.jsx` (izbor pozivnog broja i broj). Danas ga registracija porodice slaže sama od shadcn delova, što je tačka 5 u `docs/provera-pravila.md`. Ovde ga pravimo jer nam treba, a `Register.jsx` porodice prelazi na njega;
   - e-mail (iz naloga; `Fact` sa napomenom, ne polje).
2. **„Profesija":**
   - **„Klasifikacije":** četiri kartice-izbora, više njih: Hoiva-avustaja, Lähihoitaja, Sairaanhoitaja, Kotiavustaja, svaka sa jednim redom opisa i značkom „Treba dokument" (`warning`) ili „Ne treba dokument" (`secondary`). Izabrana kartica ima prsten u primarnoj boji, kao preporučeni plan. Kad je izabrana bar jedna koja traži dokument, `PaneHint`: „Dokumente za označene klasifikacije šaljete posle prijave.";
   - obrazovanje (`Select`);
   - jezici (čipovi);
   - „O sebi" (`TextArea`, placeholder „Ukratko opišite iskustvo, posebno sa starijima, i šta vas čini pouzdanom.").
3. **„Dostupnost":**
   - dani (čipovi pon–ned, bar jedan);
   - doba dana (čipovi sa satima, bar jedno);
   - radijus (`Select`);
   - cena od–do (dva `Input`, „€/h", „od" ≤ „do");
   - napomena „Tržišna cena je oko 15–25 € / h."
4. **„Pregled":**
   - po jedna kartica za svaki korak, sa `Facts` i „Izmenite" (`secondary`), koje vraća na taj korak;
   - opština je uključena (na postojećoj je falila), a dani su po redu.

### Koraci, Srbija

1. **„Osnovni podaci":** kao u Finskoj, telefon +381, srpske opštine.
2. **„Kvalifikacije":**
   - obrazovanje (`Select`: osnovna škola, srednja škola, fakultet, master, doktorat);
   - „Imate li sertifikat za negovateljicu?" (`Switch` „Sertifikat akreditovane škole");
   - kursevi (opciono);
   - „Iskustvo i veštine" (`TextArea`, obavezno; placeholder kao na postojećoj).
3. **„Dostupnost":**
   - angažman (kartice-izbori, više njih: „Dnevne posete / smene" (ispod „Po dogovoru, npr. 4 ili 8 sati, bez noćenja"), „Smena 24 h" (ispod „Ceo dan i noć, bez prekida"));
   - dani, doba dana;
   - napomena kad su izabrana dva ili više doba dana: „Izborom više delova dana kažete da prihvatate pojedinačne smene u to vreme, a ne neprekidan rad ceo dan.";
   - napomena kad su izabrana oba angažmana: „To znači da je smena od 24 sata vaš prvi izbor, a da ste otvoreni i za dnevne posete kod drugih korisnika kad niste na dužnosti.";
   - „Rad u inostranstvu" (`Switch`), radijus;
   - napomena „Tržišna cena je oko 1.000 RSD na sat i oko 6.000 RSD za 24 sata."
4. **„Zdravlje i navike":**
   - **„Lične navike":** pušite / pijete alkohol / rad uz kućne ljubimce, svako kao par čipova „Ne" / „Da", podrazumevano „Ne";
   - jezici;
   - **„Zdravlje":** alergije, fizička ograničenja, zdravstveni problemi koji otežavaju rad, osuđivanost, svako „Ne" / „Da";
   - **„Spremnost za rad"** (čipovi, više njih): rad sa osobama sa demencijom, sa nepokretnim, sa polupokretnim, pomoć pri kupanju, život sa starijom osobom;
   - „Šta ne želite da radite" (`TextArea`, opciono).
5. **„Kontakt za hitne slučajeve":**
   - „Ova osoba se kontaktira ako ne možemo da vas dobijemo ili ako je broj pogrešan.";
   - ime, srodstvo (`Select`), telefon (+381), adresa, sva obavezna.
6. **„Pregled":** kao u Finskoj.

## Posle slanja

### Dokumenti (Finska)

- „Dokumenti", „Za klasifikacije koje ste izabrali treba dokument."
- Po jedna `Card` za svaku izabranu klasifikaciju koja traži dokument (`CardTitle`: „Lähihoitaja todistus" ili „Sairaanhoitaja todistus").
- **U kartici je novo polje `FileField`** (dodaje se u `TextField.jsx` i u `patterns.md`): skriveni `<input type="file">` (PDF, JPG, PNG, do 10 MB) i naše dugme „Izaberite fajl" (`secondary`).
- **Kad je fajl izabran:** red sa imenom fajla i veličinom, „Promeni" (`secondary`) i „Ukloni" (`ghost`).
- **Ispod svih kartica:** `PaneHint` „Dokumenti se čuvaju bezbedno i brišu se posle provere."
- **„Dalje":** bez fajla greška ispod kartice „Dodajte dokument."
- **U prototipu** se pamti samo ime fajla, a fajl ne ide nigde.

### Test ličnosti (Srbija)

**Za početak sve na jednoj stranici (B).** Dizajner odlučuje da li ostaje tako ili ide jedan par po ekranu (A).

- „Test ličnosti", „62 para osobina".
- **Kartica „Uputstvo":** tekst sa postojeće aplikacije, prilagođen kliku umesto zaokruživanja: „U svakom paru izaberite osobinu koja vas bolje opisuje. Pre toga pročitajte šta koja znači. Svaki par gledajte za sebe: normalno je da istu osobinu ne birate uvek."
- **„Definicije osobina":** `Collapsible` sa strelicom, zatvoren. Unutra je 12 osobina (`Facts`: naziv iznad, opis ispod; bez velikih slova, za razliku od postojeće aplikacije).
- **Parovi:**
  - 62 male `Card` u mreži (tri u redu na širokom, jedna na telefonu);
  - u svakoj „Par {n}" (sitan tekst) i `ToggleGroup type="single"` sa dva čipa.
- **„Pošalji test":** kad fale parovi, greška ispod dugmeta „Ostalo je {n} parova bez izbora." i fokus na prvi prazan.
- **Pitanja** su u `src/data/personalityTest.js`: osobine (naziv, opis) i parovi (`[a, b]`). Dok korisnik ne pošalje prava, parovi su privremeni:
  - prvih šest su sa slike (srdačna / sklona pustolovini; ozlojeđena / stidljiva; nagla / sklona pustolovini; potištena / ozlojeđena; nagla / oprezna; grize se u sebi / oprezna);
  - ostalih 56 su prvih 56 od preostalih 60 parova 12 osobina (12 osobina daje 66 parova), stalnim redom.
- **Odgovori:** `[{ pair, choice: 0 | 1 }]` na nalogu. Rezultat se ne računa i ne prikazuje (to radi koordinatorka).

### Razgovor sa koordinatorkom (obe)

- „Zakažite razgovor", „Kratak video razgovor sa koordinatorkom je poslednji korak prijave."
- „Kako vam je najlakše?": čipovi „WhatsApp", „Viber", „Google Meet ili Zoom" (izbor jednog, obavezno). Ispod izabranog je rečenica: „Koordinatorka vam se javlja preko {kanal} da dogovorite vreme."
- „Zakaži razgovor" (`default`).

### „Hvala"

- Narandžasti deo „Hvala!" sa jednom karticom: „Profil se aktivira posle kratkog razgovora sa koordinatorkom. Javiće vam se preko {kanal} i reći sve što treba da znate. Posle toga možete da primate upite."
- „Na početnu" (`default`), koje vodi na stranu negovateljice.

## Nalog koji čeka razgovor

- **Prijava sa statusom `applying` ili `interview`** otvara stranu negovateljice sa narandžastim delom na vrhu početne:
  - „Prijava nije završena" (vodi nazad u formu);
  - ili „Profil se aktivira posle razgovora" (bez dugmeta).
- **Dok profil nije aktivan:** početna nema upite, profil i podešavanja rade, a na „Pronađi" kod porodice je nema.
- **Simulacija** (strana negovateljice): „Koordinatorka aktivira profil". Posle toga je status `active`, a njen zapis ulazi u listu tržišta (`caregiversIn(market)` čita i aktivne negovateljice registrovane u demou). Porodica u drugoj kartici je vidi na „Pronađi".

## Šta se upisuje u `patterns.md`

Sekcija „Registracija negovateljice", ceo kao predlog koji čeka dizajnera:
- koraci forme (gornji deo, traka napretka, futer, čuvanje);
- kartica-izbor (izbor zemlje, klasifikacije, angažman);
- `FileField`;
- test ličnosti (B, sa A kao alternativom);
- razgovor i „Hvala".

## Provera

- Oba toka iz „Šta je gotovo", i ponovna prijava usred forme.
- Skript iz §13 na svakom koraku, prazan i sa greškama, na 1440 i 375×812.
- `node scripts/i18n-missing.mjs`, `npm test`, `npm run build`.
- **Testovi (`vitest`):**
  - provera svakog koraka (šta je obavezno, cena od ≤ do, bar jedan dan);
  - `personalityTest`: 62 para, bez ponavljanja, prvih šest kao na slici;
  - aktivacija stavlja negovateljicu u `caregiversIn(market)`.
