# Deo 1, temelj: zajedničko stanje, uloge, tržište i Simulacija (19. 10. 2026.)

Deo 1 od 5 iz `2026-10-19-negovateljice-pregled.md`. Posle njega porodica i negovateljica rade nad istim podacima, u istoj ili u dve kartice pregledača, na tržištu koje se bira za demo. Ekrani negovateljice (delovi 3 i 4) i srpska porodica (deo 2) se ovde ne prave. Ovde nastaje samo ono na čemu stoje.

## Šta je gotovo kad je deo 1 gotov

1. **Dva demo naloga u dve kartice.** Porodica u jednoj kartici pošalje upit Sanni. U drugoj kartici, prijavljenoj kao Sanna, upit se pojavi bez osvežavanja. Sanna ga prihvati, a kod porodice „Moji upiti" odmah pokazuje „Prihvatila".
2. **Osvežavanje stranice ne briše stanje.** „Počni ispočetka" u Simulaciji ga vraća na početak.
3. **Prekidač tržišta FI / SR** menja skladište, demo naloge i ono što Simulacija nudi.
4. **Simulacija sa strane porodice radi kao danas.** Sa strane negovateljice nudi ono što bi uradile porodica i koordinatorka.
5. **Negovateljica ima samo kostur aplikacije:** meni, „Pomoć", „Podešavanja", karticu naloga. Početna je za sada jednostavan spisak upita sa „Prihvati" i „Odbij". Tabla dolazi u delu 3.
6. **Ništa na porodičnoj strani se ne menja izgledom.** Provera iz §13 je i dalje čista, a prevodi su potpuni (`node scripts/i18n-missing.mjs`).

## Stanje

### Šta se deli

Danas je sve o porodici u jednom objektu `person` u `App.jsx` (`src/data/person.js`): odgovori iz razgovora sa Minnom, beleške, plan, karton (`record`), izmene plana (`log`) i nega (`care`: upiti, ugovori, posete, dnevnik, sat `now`, kartica, pretplata). Negovateljici trebaju i odgovori, jer se profil klijenta pravi iz njih (delovi 3 i 4). Zato se deli **ceo `person`**, a ne samo `care`.

### Skladište

Novi modul `src/data/store.js`, jedini koji čita i piše deljeno stanje:

```
localStorage['nana.demo.<trziste>'] = {
  v: 1,                    // verzija oblika; drugačija verzija znači početak ispočetka
  person,                  // demo porodica, isti oblik kao danas
  clients: [...],          // ostali klijenti demo negovateljice (deo 3 ih puni; u delu 1 prazno)
}
```

- `<trziste>` je `fi` ili `sr`. Svako tržište ima svoje skladište, pa prelazak ne meša podatke.
- **API:** `load(market)`, `save(market, state)`, `subscribe(market, fn)`, `reset(market)`.
- **Gde se poziva:** `App.jsx` čita stanje pri pokretanju, a umesto `useState` za `person` koristi hook `useShared(market)`. Taj hook vraća `[state, update]`. `update(fn)` primeni čistu funkciju, upiše rezultat i javi drugoj kartici.
- **Nalog nije u ovom skladištu:** prijava i lozinka su u `src/lib/account.js`, kao i sada.

### Sinhronizacija dve kartice

- Posle svakog upisa: `BroadcastChannel('nana.demo')` šalje `{ market }`.
- Kartica koja to primi, a ima isto tržište, ponovo pročita `localStorage` i postavi stanje.
- Kao rezerva služi i događaj `storage`, jer ga pregledač šalje drugim karticama sam.
- Ako obe kartice menjaju u isto vreme, pobeđuje poslednji upis. Za demo je to dovoljno.
- Kartica ne sme da vrati poruku na poruku. Primljeno stanje se samo postavi, bez ponovnog upisa.

### Početak

| Ulaz | Stanje |
|---|---|
| Skladište tržišta postoji | čita se kakvo jeste |
| `?demo` i nema skladišta | demo porodica kao danas (`demoPerson`) |
| `?demo&puno` | uvek ispočetka, popunjen primer (`fillCare`); upiše se u skladište |
| Pravi nalog (registracija) | kao danas: `newPerson()` za tog korisnika, samo za porodicu |

Do sada se stanje nije pamtilo posle osvežavanja. To je bilo namerno samo za karton („karton se ne čuva između prijava", `patterns.md` §10a). Za demo sa dve kartice mora da se pamti, pa se ta rečenica u §10a menja: demo stanje se pamti dok se ne izabere „Počni ispočetka".

## Radnje negovateljice

- **Jedan izvor:** funkcije iz `src/data/sim.js` koje rade ono što radi negovateljica prelaze u novi `src/data/caregiverCare.js`:
  - `answerRequest`, `sendTerms`, `withdrawTerms`, `planVisit`, `sendWorkOrder`, `visitNotHappened`, `caregiverEnds`;
  - pravila za njih: `canSendTerms`, `cannotPlan`.
- **Bez kopija:** Simulacija ih uvozi odatle, a aplikacija negovateljice zove iste funkcije. U `sim.js` ostaje ono što radi koordinatorka i sat: `resolveQuery`, `passTime`, `declineCard`, `expireCard`.
- **Danas te funkcije same biraju vrednosti:** cenu (sredina njenog raspona), usluge (iz plana), sutra u 9, sat više ili manje. Ekrani negovateljice moraju da ih zadaju sami. Zato svaka dobija opcioni drugi argument sa tim vrednostima, na primer `sendTerms(caregiverId, { services, rate, note })` i `planVisit(caregiverId, { day, start, hours })`. Bez njega radi kao danas, pa Simulacija ostaje ista.
- **Radnje porodice** (`askCaregiver`, `agreeTerms`, `declineTerms`, `linkCard`, otkazivanje posete, prijava problema) ostaju u `familyCare.js`. Simulacija sa strane negovateljice zove njih.

## Uloge i nalozi

- **Uloga je deo naloga:** `user.role` je `family` ili `caregiver`. Polje već postoji i danas je uvek `family`.
- **Negovateljica ima i `caregiverId`:** njen zapis među negovateljicama u `src/data/carePlan.js`.
- **Ekran za prijavu je isti za obe uloge.** Posle prijave `App.jsx` grana po ulozi: porodica dobija današnju aplikaciju, a negovateljica `src/screens/caregiver/CaregiverApp.jsx` (novi kostur, vidi ispod).
- **Demo nalozi:**

| Tržište | Porodica | Negovateljica |
|---|---|---|
| FI | današnji demo (Anna, briga o Aino, Helsinki) | Sanna Virtanen (`sanna`) |
| SR | nova demo porodica iz Beograda (u delu 1 samo nalog i odgovori; ekrani su deo 2) | nova negovateljica iz Beograda (u delu 1 samo zapis i nalog) |

- **Adrese za direktan ulaz:**
  - `?demo` je porodica, Finska (kao danas);
  - `?demo=negovateljica` je negovateljica;
  - `&trziste=sr` znači Srbija;
  - postojeći `?demo=rs` ostaje i znači isto što i `?demo&trziste=sr`.

## Prijava i registracija

- Na ekranu za prijavu i za registraciju, uz postojeće „Za demo: jezik", dolaze:
  - „Za demo: tržište" sa izborom **Finska / Srbija**, u istom obliku kao izbor jezika;
  - dva linka: „Za demo: porodica" i „Za demo: negovateljica".
- „Napravi nalog" pre forme pita **„Ko ste?"**: porodica ili negovateljica.
  - Porodica nastavlja kao danas.
  - Negovateljica u delu 1 dobija rečenicu da registracija negovateljica stiže uskoro i link na demo nalog. Forma je deo 5.

## Kostur aplikacije negovateljice

`CaregiverApp.jsx` koristi iste delove kao porodična strana: `Sidebar` (`AppNav` sa stavkama po ulozi), `Page`, kartica naloga na dnu menija, `HelpDialog`, `Settings` (sa delovima koji važe za svakoga: lozinka, 2FA, jezik, kolačići).

| Tržište | Stavke menija u delu 1 | Kasnije |
|---|---|---|
| FI | „Upiti" (privremena početna), „Pomoć", „Podešavanja" | deo 3: „Tabla" umesto „Upiti", „Klijenti", „Zarada" |
| SR | „Upiti", „Pomoć", „Podešavanja" | deo 4: puna stranica upita |

**Privremena početna „Upiti":**
- Svaki upit demo porodice ovoj negovateljici je kartica sa avatarom porodice, ko i kada pita i porukom, po §7.
- Upit koji čeka ima „Prihvati" (`default`) i „Odbij" (`secondary`). „Odbij" otvara modal sa razlogom (`DECLINE_REASONS`).
- Prazna stranica je po §5: „Još nema upita".
- Ovo je dovoljno da se dokaže tok. Deo 3 i deo 4 je zamenjuju.

## Tržište

- **`src/data/market.js` ostaje izvor.** Do sada je tržište dolazilo samo iz države na registraciji. Sada ga za demo postavlja i prekidač, a važi za celu karticu dok se ne promeni.
- **Šta prekidač radi:** promena tržišta prebaci skladište i prijavi demo nalog iste uloge na tom tržištu.
- **Nazivi:** u kodu `FI` i `RS`, kao danas (`market()`). U adresi i u skladištu `fi` i `sr`, kako ih korisnik izgovara.
- **U delu 1 tržište menja samo ono što već menja:** hitan broj i pretplatu. Uz to, Simulacija ne nudi ugovor, posete ni novac na tržištu `RS` (vidi ispod). Sve ostalo što Srbija menja je deo 2 i deo 4.

## Simulacija

- **Panel:** jedan drawer kao danas (`SimPanel.jsx`, `Ctrl+H`, na telefonu stavka menija), na obe strane.
- **Na vrhu panela, za obe uloge:**
  - **Tržište:** Finska / Srbija;
  - **Vreme:** „Prođe sat", „Prođe dan" (sat je u skladištu, pa ga obe kartice vide isto);
  - **„Pređi na drugu stranu":** u istoj kartici prijavi demo nalog druge uloge;
  - **„Počni ispočetka"** i **„Popuni primer nege":** samo za tržište na kome si.
- **Ispod toga, po ulozi:**
  - **Porodica:** sve što panel nudi danas (negovateljica i koordinatorka), sa funkcijama iz `caregiverCare.js`.
  - **Negovateljica:** ono što bi uradile porodica i koordinatorka. Porodica: pošalji upit ovoj negovateljici, prihvati ili odbij uslove, poveži karticu, otkaži posetu, „Nešto nije u redu". Koordinatorka: reši prijavu. Uz svaku radnju piše zašto se ne može kad se ne može, kao danas.
- **Na tržištu `RS`:**
  - sa strane porodice: samo „prihvati / odbij upit";
  - sa strane negovateljice: samo „pošalji upit" i „otkaži upit".
- **Pravila za panel:** panel je alat za demo, ne deo proizvoda (§12a). Dugmad su `secondary`, u redovima sa razmakom 8. Ne proverava se skriptom iz §13.

## Šta se upisuje u `patterns.md`

- **§12a:** Simulacija je na obe strane; tržište, prelazak na drugu stranu i „Počni ispočetka".
- **§10a:** demo stanje se pamti dok se ne izabere „Počni ispočetka".
- **Nova kratka sekcija „Negovateljica":**
  - uloga po nalogu, isti kostur i komponente kao porodica;
  - meni po tržištu;
  - privremena početna „Upiti", sa oznakom da je deo 3 i 4 zamenjuju.
- **`CLAUDE.md`:** prva rečenica više nije „samo strana porodice", nego „porodica i negovateljica; koordinatorka se simulira".

## Provera

- **Ručno, u dve kartice:** sve tačke iz „Šta je gotovo" za FI i za SR. Uz to osvežavanje stranice usred toka i „Počni ispočetka".
- **Provera iz §13:** na porodičnoj strani (galerija `/?kartice`) i na kosturu negovateljice, na desktopu i na 375×812, nula prekršaja.
- **Prevodi:** `node scripts/i18n-missing.mjs`, nula.
- **Build:** `npm run build` prolazi.

## Van dela 1

Tabla, klijenti i zarada, profil i njegovi modali, srpska porodica i paketi, srpski upiti i profil klijenta, registracija negovateljice i test ličnosti. Sve to je u delovima 2–5.
