# Deo 2: porodica u Srbiji (19. 10. 2026.)

Deo 2 od 5 iz `2026-10-19-negovateljice-pregled.md`. Stoji na delu 1 (`2026-10-19-temelj-design.md`): tržište `RS`, srpska demo porodica, Milica i `caregiverById` već postoje.

U Srbiji porodica platformi plaća samo jednokratni paket, a sa negovateljicom se dogovara telefonom. Platforma zato ne zna ništa o ugovoru, posetama i novcu za negu. Ovaj deo menja porodičnu stranu tako da to i ne pominje.

Sve što zavisi od tržišta čita `market()` (`src/data/market.js`) na jednom mestu po pojmu. Ekrani ne pišu `if (market() === 'RS')` po sebi: pitaju podatak („ima li tržište ugovore", „koji paketi", „koje negovateljice").

## Šta je gotovo kad je deo 2 gotov

1. Demo porodica u Srbiji (`?demo=rs`) prođe ceo put i nigde ne vidi pretplatu, karticu, ugovor, plan posete, radni nalog, rezervaciju ni naplatu:
   - plan bez paketa;
   - izbor paketa;
   - upit Milici;
   - Milica prihvati;
   - njen telefon i e-mail;
   - paket istekne.
2. Finska porodica je ista kao pre. Provera iz §13 na galeriji i na `?demo` je čista.
3. Paketi su samo podaci u `src/data/plans.js`. Promena cene, trajanja ili teksta ne dira ekrane.

## Tržište kao podatak

Novo u `src/data/market.js`, uz `emergencyNumber`:

```js
// what the platform does in a market, asked by the screens instead of the market's name
export const marketHas = (what) => FEATURES[current]?.includes(what) ?? false;
// FI: ['agreements', 'visits', 'card', 'subscription']
// RS: ['package']
```

Ekrani pitaju:
- `marketHas('agreements')`: ugovori, posete, pregled na početnoj;
- `marketHas('card')`: „Način plaćanja", povezivanje kartice pri plaćanju;
- `marketHas('package')` ili `marketHas('subscription')`: koja kartica u Podešavanjima i kako se zove prozor za plaćanje.

## Paketi

U `src/data/plans.js`, umesto današnjeg srpskog plana (12,7 € mesečno):

| | `monthly` | `quarterly` |
|---|---|---|
| Naziv | „Mesečni paket" | „Tromesečni paket" |
| Podnaslov | „Fleksibilnost kada vam je potrebna" | „Više podrške. Više sigurnosti. Manje brige." |
| Cena | 43 € / 1 mesec | 98 € / 3 meseca; precrtano 129 €; „Uštedite 31 €" |
| Značka | — | „Najpopularnije" (`recommended: true`) |
| Za koga | „Za porodice koje žele brzo da pronađu pouzdanu negovateljicu, bez dugoročnih obaveza." | „Naš najpopularniji paket za porodice koje žele sigurnost, kontinuitet i ličnu podršku tokom dugoročnog zbrinjavanja." |
| Uključeno | „Pristup bazi proverenih negovateljica"; „Pomoć pri pronalaženju odgovarajuće negovateljice"; „Besplatan uvodni razgovor od 30 minuta sa koordinatorom"; „Direktna komunikacija sa negovateljicama"; „Zamena negovateljice u hitnim slučajevima, bez dodatnih troškova"; „Bez posrednika i skrivenih troškova"; „14-dnevna garancija povraćaja novca - ako ne pronađete odgovarajuću negovateljicu, vraćamo vam 100% novca" | `lead`: „Sve iz Mesečnog paketa, plus:"; „Prioritet pri pronalaženju negovateljice"; „Personalizovani plan nege prilagođen potrebama vaše porodice"; „Prioritetna podrška koordinatora kada vam je potrebna pomoć"; „Kontinuirana podrška u planiranju dugoročne nege"; „Pomoć pri organizaciji dodatnih usluga, kao što su lekar ili rehabilitacija"; „Personalizovani vodič za kućnu negu" |

- **Svaki paket ima `once: true`.** To znači „plaća se jednom, ne obnavlja se". Uz cenu stoji „Plaćate jednom, bez automatske obnove."
- **Precrtana cena i ušteda** su polja `was: 129` i `saving` (već postoji `planSaving`).
- **Oba paketa otključavaju isto:** upite, ceo plan i kontakt negovateljice koja je prihvatila. Razlike su usluge koordinatorke van aplikacije.
- **Tekst sa sajta ide u `msg()`** sa en i fi prevodom (engleski i finski tekst sa `nanaprime.com/en|fi/pricing` kad postoji, inače prevod).

## Prozor za izbor (`PaywallModal`)

Isti prozor i isti raspored kartica (§5 „Izbor plana"). Na tržištu sa paketima:
- naslov „Izaberite paket" (umesto „Izaberite pretplatu"), a dugme „Izaberite Mesečni paket" / „Izaberite Tromesečni paket";
- ispod cene „Plaćate jednom, bez automatske obnove." umesto rečenice o obnovi;
- na dnu prozora „Važi do {datum}. Ne obnavlja se sam." umesto uslova obnove. Nema rečenice da se kartica čuva za posete;
- plaćanje ne zove `linkCard`.

Dugme koje ga otvara iz plana nege ostaje „Otključajte ceo plan nege". „Plan" u naslovima i dalje znači samo plan nege (§5).

## Stanje paketa

`family.subscription` iz dela 1 nosi i paket: `{ planId, at }`. Za paket `renewalAt` znači „ističe" (isti račun: `at` + `months`).
- **Paket važi** dok je `Date.now() < renewalAt`. To je pravi sat, kao za pretplatu danas, a ne sat demoa (`care.now`).
- **Kad istekne:** `unlocked` postaje `false`. Upiti i kontakti se zaključavaju, a plan je ponovo zamućen kao bez paketa.
- **Paket se ne otkazuje i ne menja dok važi.**

## „Moja nega"

Stranica je uvek plan nege, isti raspored kao danas pre prihvaćenog ugovora (§4a). Bez `marketHas('agreements')` uslov `agreed` je uvek netačan, pa pregleda nema. Na vrhu je narandžasti deo po stanju:

| Stanje | Na vrhu |
|---|---|
| Niko nije pitan | „Sledeći korak", kao danas |
| Upit čeka | „Čeka se odgovor", kao danas |
| Svi pitani su odbili | „Stigli su odgovori", kao danas |
| Bar jedna je prihvatila, paket važi | **„Javite joj se"** (vidi ispod) |
| Paket je istekao, a bilo je upita | **„Paket je istekao"**: „Upiti i kontakti negovateljica su zaključani dok ne izaberete paket ponovo." i „Izaberite paket" (`default`) |

**„Javite joj se":**
- `Attention` sa rečenicom „Dogovorite se direktno: dane, sate i cenu. Koordinatorka je tu ako zatreba.". Ako je prihvatilo više njih, naslov je „Javite im se".
- Za svaku koja je prihvatila po jedna bela `Card`. U glavi su avatar, ime (`CardLink`, otvara profil) i „Prihvatila je {datum}".
- Ispod glave su dva reda kontakta, isti oblik kao `CoordinatorRows` (`src/components/PlanFooterBlocks.jsx`): „Telefon" kao `tel:` link i „E-mail" kao `mailto:` link. Svaki red je `Item asChild` sa `<a>` (§6).
- Stoji dok paket važi.
- **„Prihvatila je" u stanju** se zato menja: u Srbiji je to i dalje 1a-obaveštenje (§4a, §4b), ali bez „Čeka se ugovor o nezi" i „Čeka se plan prve posete", jer ih nema.

## „Moji upiti"

- **Upit koji čeka** dobija „Otkaži" (`secondary`) u istom mestu gde odbijeni ima „Pitaj ponovo". Dugme zove `withdrawRequest` iz dela 1. Posle otkazivanja ide toast „Upit je otkazan." (§10, upit nestaje sa liste).
- **Prihvaćen upit** u Srbiji kaže „{ime} je prihvatila. Telefon i e-mail su u njenom profilu.", a kartica otvara profil.
- **Bez važećeg paketa:** „Pitaj ponovo" i „Pošalji poruku" otvaraju prozor sa paketima, kao danas pretplata.

## Profil negovateljice u Srbiji (`Profile` u `FamilyDrawer.jsx`, `CaregiverHead`)

- **Bez cene i bez „Klasifikacija".** Umesto toga, u „Kvalifikacije": „Sertifikat negovateljice" (da / ne) i „Kursevi".
- **„Kada može da dolazi":** dani, doba dana, radijus i „Angažman" („Dnevne posete", „Smena 24 h", ili oboje).
- **„Kontakt":** telefon i e-mail su vidljivi samo kad je prihvatila **i** paket važi. Inače `MASKED_PHONE` / `MASKED_EMAIL` i „Telefon i e-mail vidite kad prihvati vaš upit."
- **Zaglavlje** (`CaregiverHead`): ocena, opština i radijus, bez cene.

## „Pronađi" i preporuke

- **Novo `src/data/caregiversRs.js`:** oko 12 negovateljica iz Beograda i okoline (Milica iz dela 1 je prva), sa poljima srpske registracije:
  - `certificate: boolean`, `courses: string`;
  - `engagement: ['daily'] | ['shift24'] | ['daily', 'shift24']`;
  - `days`, `slots`, `radius`, `languages`, `bio`, `education`, `rating`, `reviews`, `phone`, `email`, `area`, `match`;
  - bez `rateMin` / `rateMax` i bez `classifications`.
- **Novo u `src/data/carePlan.js`: `caregiversIn(market)`** vraća finsku ili srpsku listu. Koriste je:
  - „Pronađi" (`FindCaregiver.jsx`);
  - preporuke plana (`buildPlan`, deo sa `kind: 'caregivers'`) i `caregiversFor`;
  - asistent (`planCopilot.js`, spisak negovateljica u poruci sistema);
  - onboarding (`ImmersiveConversation.jsx`).
- **Kartica na „Pronađi" u Srbiji:** meta je ocena · opština · radijus, bez cene. Grupa oznaka je „Poklapa se", bez „Klasifikacija".
- **Razlozi poklapanja** (`matchReasons`) rade i sa srpskim poljima: dani, doba dana, angažman, sertifikat.

## Podešavanja, grupa „Plaćanje"

- **Bez `marketHas('card')`:** nema kartice „Način plaćanja".
- **Sa `marketHas('package')`:** umesto „Pretplata" je kartica **„Paket"**:

| Stanje | Kartica |
|---|---|
| Nikad kupljen | rečenica šta paket otključava („Upiti negovateljicama, ceo plan nege i kontakt negovateljice kad prihvati.") i „Izaberite paket" (`default`) |
| Važi | značka „Aktivan" (`success`); `DataRow` „Paket" (naziv), „Plaćeno" (datum · iznos), „Važi do" (datum); rečenica „Ne obnavlja se sam. Kad istekne, izaberite paket ponovo."; bez dugmeta |
| Istekao | značka „Istekao" (`secondary`); `DataRow` „Paket", „Važio do"; „Izaberite paket" (`default`) |

- **Podnaslov stranice** u Srbiji: „Nalog, paket, bezbednost, jezik i obaveštenja, privatnost."
- **Novi red u tabeli §9:** „Paket — „Izaberite paket" default — dok važi, bez dugmeta — paket se ne obnavlja i ne otkazuje".

## Tekstovi koji pominju ono čega u Srbiji nema

Svaki dobija srpsku varijantu ili se ne prikazuje kad `!marketHas('agreements')`:

- **`requestNote` / `requestFoot`** (`src/data/firstSteps.js`): „Slanje upita je deo paketa (od 43 €). Sam upit nikoga ne obavezuje…".
- **Asistent** (`src/lib/planCopilot.js:121,155`): u Srbiji, umesto „subscription" i „a visit is reserved on their card and charged after the work order…", piše „sending requests is part of their package; once a caregiver accepts, the family sees her phone and e-mail and they agree days, hours and pay directly; the platform takes no part in that".
- **`ChatPanes.jsx`** („Pretplata i plaćanje"): u Srbiji „Paket", sa istim redovima kao kartica u Podešavanjima.
- **`RequestsPage.jsx`:** „Ugovor i posete su na njenoj stranici" se ne pojavljuje u Srbiji.
- **`Dashboard.jsx`:** „Čeka se ugovor o nezi", „Čeka se plan prve posete", tri broja, „Predstoji", „Poslednja poseta", „Sve posete" se ne pojavljuju (pregled ne nastaje).
- **„Njena stranica"** (`CaregiverPage.jsx`) se u Srbiji ne otvara: nema saradnje na platformi. Gde danas vodi na nju, vodi na profil.

## Simulacija (porodica, Srbija)

- Iz dela 1 ostaje „prihvati / odbij upit".
- Dodaje se **„Paket ističe"**: pomera `subscription.at` unazad za trajanje paketa, pa posle klika paket ne važi. To je isti trik kojim danas „Dođe dan obnove pretplate" radi sa pravim datumima.
- „Dođe dan obnove pretplate", „Banka odbije naplatu" i „Kartica ističe" se na Srbiji ne prikazuju.

## Šta se upisuje u `patterns.md`

- **§4a:** red u tabeli stanja „Tržište bez ugovora (Srbija)": početna je uvek plan; „Javite joj se" i „Paket je istekao".
- **§5, „Izbor plana":** paketi (jednokratno, „Najpopularnije", precrtana cena).
- **§9:** red „Paket" u tabeli.
- **§8, tabela „Negovateljica: šta se o njoj prikazuje":** kolona ili napomena za Srbiju (bez cene i klasifikacija; sertifikat, kursevi, angažman).

## Provera

- `?demo=rs`: ceo put iz tačke 1 „Šta je gotovo".
- `?demo`: Finska ista kao pre, galerija ista.
- Skript iz §13 na svakoj stranici porodice u Srbiji i u prozoru za izbor paketa, na 1440 i 375×812.
- `node scripts/i18n-missing.mjs`, `npm test`, `npm run build`.
- **Testovi (`vitest`):**
  - `marketHas`;
  - `plansFor('RS')` (dva paketa, `once`, cene);
  - da li paket važi pre i posle `renewalAt`;
  - `caregiversIn('RS')`;
  - `matchReasons` sa srpskim poljima;
  - `requestNote` u Srbiji.
