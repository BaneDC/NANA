# Jedan plan nege: odluka i šta treba uraditi

Dogovoreno 10. 10. Ovaj dokument kaže šta smo odlučili, zašto, kako je sada u kodu i šta treba promeniti. Pravila iz njega se upisuju u `docs/patterns.md` kad se urade.

## Ukratko

- Jedna osoba ima **jedan plan nege**. On se menja kad se nešto promeni, a novi plan se ne pravi.
- Nema liste planova, dugmeta „Novi plan" ni verzija plana.
- Umesto istorije sa verzijama postoji **spisak izmena**: šta je i kada promenjeno. Otvara se kao drawer sa stranice plana, kao „Šta se desilo" na stranici negovateljice.
- Nema vraćanja na stariju verziju. Ostaje samo „Poništi" za poslednju izmenu, koje već postoji.
- Ime je **„Plan nege"**, u jednini, svuda, i u onboardingu.

## Zašto

Danas je model nedosledan. UI nudi više planova („Planovi nege", „Novi plan"), a poslovno pravilo i podaci podržavaju samo jedan:

- Jedan nalog je jedna starija osoba. Ko brine o baki i deki, pravi dva naloga.
- „Novi plan" je u kodu zamišljen kao *plan za drugu osobu* (`newPlan` u `App.jsx`). Postojeći plan ide u arhivu, a razgovor kreće ispočetka.
- Istovremeno može da postoji samo jedan aktivan plan. Negovateljice, upiti, ugovori i posete vezani su za nalog, a ne za plan.
- Arhivirani planovi su tako, u stvari, stariji planovi **iste** osobe. To su verzije koje se tako ne zovu.

Stanje starije osobe se menja postepeno: pad, bolnica, oporavak, pogoršanje. Jedan plan koji prati te promene verniji je stvarnosti od niza odvojenih planova.

## Odluke

### 1. Jedan plan nege po osobi

- U bočnom meniju je jedna stavka, **„Plan nege"**, umesto „Planovi nege" sa listom koja se otvara.
- Stranica sa listom planova nestaje. Ostaje samo prazno stanje dok plana još nema: „Još nema plana nege", sa dugmetom „Idi na razgovor" (§5).
- Dugme „Novi plan" nestaje, a sa njim i arhiva planova.
- Na stranici plana nestaje „Nazad: Planovi nege", jer liste više nema. Nestaje i značka „Aktivan", jer drugog plana nema. **Urađeno.**

### 2. Ime: „Plan nege", u jednini

- Razmatrali smo „Care journey" (na srpskom „Tok nege"). Odustali smo, jer se preklapa sa **„Moja nega"**, koja već prikazuje šta se dešava sa negom (posete, negovateljice). Plan je dokument u okviru toga. Treće ime za isti prostor bi zbunjivalo.
- Jednina sama kaže da je plan jedan, a spisak izmena kaže da se menja.
- **Urađeno:** onboarding je govorio „Vaš plan podrške" i „Plan podrške je spreman.". Sada kaže „Vaš plan nege" i „Plan nege je spreman.", a isto je promenjeno u uputstvima za Minnu (`src/data/conversation.js`). „Nivo podrške" u preporuci ostaje, jer to nije ime plana.

### 3. Bez verzija i bez vraćanja na stariju verziju

Zašto nema vraćanja:
- Okolnosti se menjaju samo napred. Ako je posle pada nivo krhkosti 5, plan sa nivoom 4 ne vraća baku u stanje od pre pada. Ako je izmena bila greška, ispravlja se odgovor, a plan prati ispravku.
- Upiti i ugovori su poslati po trenutnom planu. Vraćanje bi ih bez upozorenja razdvojilo od plana.
- Čuva se samo spisak izmena, a ne celi stari planovi, pa nema ni na šta da se vrati. Tako je jednostavnije.

Jedini stvarni slučaj je greška odmah posle izmene („nisam to hteo"). Za to **već postoji „Poništi izmene"** u kartici „Plan je izmenjen" na vrhu plana (`PlanChangeBanner`, `undoPlanChange` u `App.jsx`). To ostaje kako jeste.

### 4. Spisak izmena („Izmene plana")

Nije klasična istorija, nego spisak: **šta je i kada promenjeno**.

**Kako izgleda:** isti obrazac kao „Šta se desilo" na stranici negovateljice (`docs/patterns.md` §7, `ActivityDrawer`):
- Otvara se ikonicom `History` u glavi stranice plana, sa `aria-label` i `title` „Izmene plana".
- Drawer je naslovljen „Izmene plana", sa imenom osobe kao eyebrow.
- Stavke idu po danima, najnovije prvo, sa brojem stavki pored dana.
- Stavka je red bez akcije (`Item`): naslov, pa linija „odakle · kada", pa šta tačno.
- Filteri ne trebaju, jer je stavki malo.

**Primer:**

> **Danas**
> **Plan nege je izmenjen**
> u razgovoru sa Minnom · 14:05
> Kretanje: Štap → Hodalica. Nivo krhkosti: 4 · Ranjiva → 5 · Blago krhka. U planu se promenilo: Minnino pismo, „Lična nega".
>
> **24. septembra**
> **Plan nege je izmenjen**
> ručno · 18:40
> Gde živi: Töölö → Kallio. *(sa selidbom, vidi „Gde sada živi?")*
>
> **3. septembra**
> **Plan nege je napravljen**
> u razgovoru sa Minnom · 10:12

**Šta ulazi u spisak:**

| Događaj | U spisak? |
|---|---|
| Plan je napravljen (kraj onboardinga) | da, prva stavka |
| Izmena posle koje plan kaže nešto drugo: nivo krhkosti, preporuke, Minnino pismo, rizici, usluge | da |
| Selidba, bolnica, pauza | da |
| Ispravka bez uticaja na plan: telefon, slovna greška, adresa u istom kraju | ne |
| Izmena koja je odmah poništena („Poništi izmene") | ne, briše se iz spiska |

Kriterijum već može da se izračuna. `planDiff` (`src/data/planEdits.js`) vraća koji su se delovi plana promenili (`touched`), a `describeChanges` vraća promenjene odgovore (pre → posle) i nivo krhkosti pre i posle. Ako je `touched` prazan i nivo se nije promenio, izmena ne ulazi u spisak. Isti podaci već pune karticu „Plan je izmenjen", pa stavka u spisku kaže isto što i ona, samo kraće i sa datumom.

**Stavke se ne otvaraju i ne vraćaju.**

**Glava stranice plana:** umesto datuma i značke „Aktivan" piše „Napravljen 3. septembra · izmenjen danas".

### 5. Tab „Pregled i odgovori"

Pregled je **uvek trenutni**, a ne zamrznut početni snimak. U kodu je već tako: `PlanOverview` računa sve iz trenutnih odgovora (`planOverview(answers)`).

Šta treba dodati ili odlučiti:

| Situacija | Kako je sada | Predlog |
|---|---|---|
| Odgovor je promenjen | ne vidi se da je promenjen | uz odgovor sitno „izmenjeno 24. septembra", iz spiska izmena |
| Nivo krhkosti se promenio, pa neka pitanja više ne važe | `reconcile` **briše** te odgovore iz podataka | ne prikazuju se. Treba odlučiti da li se čuvaju, da se vrate ako se nivo vrati |
| Nova pitanja koja važe za novi nivo | stoje kao „Nije odgovoreno", jedno ispod drugog | jedan red umesto toga: „Minna ima još 3 pitanja za novi nivo", sa dugmetom koje otvara bočni panel asistenta |
| „Javili ste nam se posle pada…" | stoji kao da je danas | to je razlog prvog javljanja, sa datumom: „Prvi put ste nam se javili 3. septembra, posle pada…" |

### 6. Dogovori mimo platforme

Porodica i negovateljica se dogovaraju i mimo platforme. Negovateljica je obavezna samo da šalje ugovor o nezi, plan posete i radne naloge. Mnogi neće ažurirati plan kad se nešto promeni, **i to je u redu**. Zato jasno razdvajamo:

- **Plan nege kaže šta je potrebno.** Služi da se nađe negovateljica i da ona zna kome dolazi.
- **Ugovor, posete i radni nalozi kažu šta je dogovoreno i šta se dešava.** To šalje negovateljica, i to je istina o nezi.

Promene iz ugovora (npr. „sada 3 posete nedeljno") **ne prepisujemo** u plan. To su dve različite stvari, a sinhronizacija bi bila komplikovana bez stvarne koristi.

Zastareo plan smeta samo kad se šalje **novi upit**, jer upit šalje plan novoj negovateljici. Samo tada, i samo ako je plan stariji od oko tri meseca, pitamo jednom: „Plan je od 3. juna. Da li je i dalje tačan?", sa dugmadima „Tačan je, pošalji" i „Ispravi sa Minnom". Bez podsetnika i bez guranja na drugim mestima.

### 7. Model podataka

**Ovo se ne vidi u interfejsu.** Opisuje šta je ispod, da bi developeri znali na šta ciljamo.

Sada:

```
nalog (user)
├── odgovori + beleške ──► plan (ne čuva se, izračuna se svaki put: buildPlan)
├── nega: upiti, negovateljice, ugovori, posete, novac (care)
└── arhiva planova (threads), iz koje se stari planovi ponovo izračunavaju
```

- „Osoba" ne postoji kao celina. To je samo jedan odgovor (`about-person`) među ostalima.
- Plan i nega su odvojeni. Ugovor ne zna po kom planu je napravljen.

Cilj:

```
nalog
└── osoba (ko je, gde živi)
    ├── odgovori + beleške ──► plan (izračunat, jedan)
    ├── izmene plana (spisak: šta, kada, odakle)
    └── nega (upiti, ugovori, posete)
```

Za sada je jedna osoba po nalogu, i UI se ne menja zbog toga. Kad osoba postane celina u podacima, „baka i deka" kasnije ne traže prepravku svega. To je čest slučaj (par koji živi zajedno, sa istom negovateljicom) i verovatno će doći na red.

## Šta je urađeno u kodu (grana `plan-nege`)

Podaci i ruta, bez novog izgleda:

- **Model podataka** je kao u tački 7. Osoba je jedna celina (`src/data/person.js`): odgovori, beleške, da li je plan napravljen, spisak izmena i nega. Plan se ne čuva, nego se izračunava iz odgovora i beleški (`planOf`). U `App.jsx` je stanje `person`, a `setAnswers`, `setNotes` i `setCare` upisuju u nju, pa ostatak koda radi kao pre.
- **Spisak izmena se puni** (`src/data/planLog.js`). Prva stavka nastaje kad onboarding napravi plan. Nova stavka nastaje u `changePlan` samo ako posle izmene plan kaže nešto drugo. „Poništi izmene" vraća i spisak. Spisak se čuva uz napredak naloga, a demo ima dve stavke: plan napravljen pre 5 nedelja, i promenu kretanja („Potpuno sama → Uz štap", nivo 3 → 4) pre 16 dana.
- **Jedna ruta plana.** U bočnom meniju je jedna stavka „Plan nege", koja otvara plan, a dok plana nema prazno stanje (`NoPlan` u `PlanDetail.jsx`). Stranica liste (`Plans.jsx`), „Novi plan", arhiva planova i „Nazad: Planovi nege" su uklonjeni, kao i grane za arhivirani plan u `PlanContents`.
- **Bez značke „Aktivan".** U glavi plana je samo datum kad je plan napravljen, iz spiska izmena (ranije je tu uvek stajao današnji datum).

## Šta ostaje dizajneru

Urađeno je samo ono ispod interfejsa (vidi gore). Ostaje i izgled i deo funkcionalnosti.

### Funkcionalno

| Šta | Šta treba da radi | Šta već postoji |
|---|---|---|
| Drawer „Izmene plana" | otvara se sa stranice plana i prikazuje stavke iz spiska izmena, po danima, najnovije prvo | podaci su u `person.log` (`App.jsx`: `planLog`), oblik je ispod |
| „izmenjeno <datum>" uz odgovor u „Pregled i odgovori" | za svako pitanje naći datum poslednje izmene i prikazati ga uz odgovor | `changedOn(log)` u `src/data/planLog.js` vraća datum po pitanju |
| „Minna ima još N pitanja" | izbrojati pitanja koja važe za trenutni nivo a nemaju odgovor; dugme otvara bočni panel asistenta | `planQuestions(answers)` u `src/data/planEdits.js` daje pitanja i odgovore |
| „Prvi put ste nam se javili <datum>…" | uz razlog javljanja staviti datum kad je plan napravljen | stavka `kind: 'created'` u spisku izmena |
| Provera pri slanju upita: „Plan je od <datum>. Da li je i dalje tačan?" | pre slanja upita, ako je plan stariji od oko 3 meseca, jednom pitati; „Tačan je, pošalji" ili „Ispravi sa Minnom" | nije urađeno; datum poslednje izmene je prva stavka u spisku |
| Odgovori koji više ne važe posle promene nivoa | sada se brišu (`reconcile` u `src/data/dependencies.js`); ako odlučite da se čuvaju, menja se ta logika | nije odlučeno |
| Minna u bočnom panelu posle promene nivoa | proveriti da li sama postavi nova pitanja, kao u onboardingu; ako ne, dodati | nije provereno |

Selidba („Gde sada živi?") već prolazi kroz istu izmenu plana (`onEditAnswers` → `changePlan`), pa se upisuje u spisak bez dodatnog posla, ako posle nje plan kaže nešto drugo.

### Izgled

| Gde | Šta |
|---|---|
| novi drawer „Izmene plana" | po obrascu `ActivityDrawer` / `ActivityRows` (`src/components/family/`), sa pravim datumima umesto dana simulacije; primer stavki je u tački 4 |
| `src/screens/PlanDetail.jsx` | ikonica „Izmene plana" (`History`) u glavi; tekst glave „Napravljen … · izmenjen …" |
| `src/components/PlanOverview.jsx` | kako izgledaju „izmenjeno <datum>", red za nova pitanja i datum uz razlog javljanja |
| prazno stanje plana | `NoPlan` u `PlanDetail.jsx` je zasad isti tekst kao stara prazna lista |
| provera pri slanju upita | modal ili korak u postojećem prozoru za poruku |
| `docs/patterns.md` | pravilo za drawer „Izmene plana" (uz „Šta se desilo" u §7) |

### Šta sada može da se proba

Spisak izmena se još nigde ne prikazuje. Kad se plan izmeni, plan se izračuna ponovo i na vrhu se pojavi postojeća kartica „Plan je izmenjen", kao i pre. Stavka se upiše u podatke i vidi se samo u konzoli pregledača (`localStorage`, ključ `nana.progress.<email>`, polje `planLog`). Izmena koja ne menja plan (npr. „Ćerka" → „Sin" u glavnom kontaktu) se ne upisuje, po pravilu iz tačke 4.

Oblik stavke u spisku (`src/data/planLog.js`):

```js
{ id, at /* ms */, kind: 'created' | 'changed', source: 'assistant' | 'manual' | 'both',
  rows /* describeChanges: pitanje, pre, posle */, frailty /* { before, after } ili null */,
  touched /* planDiff: šta se u planu promenilo */, saved /* nove beleške */ }
```

## Otvoreno

- **Koliko star plan** traži proveru pri slanju upita: tri meseca je predlog.
- **Ikonica „Izmene plana":** ikonice van Podešavanja su na čekanju (§11), ali isti obrazac već postoji za „Šta se desilo", pa se predlaže ista ikonica `History`.
- **Baka i deka:** nije za sada. Treba odlučiti kad, i da li ista negovateljica i jedna pretplata pokrivaju oboje.
