# Obrasci interfejsa — specifikacija

Ovo je jedini izvor istine za to kako se slaže interfejs NANA Prime (porodica i negovateljica). Važi za ljude i za agente.

**Pre svake izmene interfejsa:**
1. Pronađi obrazac u ovom dokumentu i upotrebi njegove klase i komponente, tačno kako su opisane.
2. Ako obrasca nema, prvo ga dodaj ovde (šta je, kada se koristi, mere, markup), pa ga tek onda koristi u kodu.
3. Ne uvodi novu klasu za nešto što ovde već postoji, ni kad izgleda „skoro isto".
4. Posle izmene pokreni proveru iz §13. Rezultat mora biti nula prekršaja.

Onboarding (`src/screens/Immersive*.jsx`, klase `imm-*`) ima svoj vizuelni jezik i ova pravila ga ne menjaju. Ne diraj ga ako zadatak nije izričito o onboardingu.

---

## 1. Temelji

| Pravilo | Vrednost |
|---|---|
| Mreža | svaki razmak je deljiv sa 4 |
| Radiusi | samo 4 / 8 / 16 / 24 / 32 (`--radius-sm/lg/2xl/3xl/4xl`) |
| Koncentrični uglovi | **spoljni radius = unutrašnji radius + padding između njih** |
| Boje | samo tokeni iz `src/styles/tokens.css`, bez hex vrednosti u komponentama |
| Jedna podloga, jedna boja teksta | na istoj podlozi tekst iste uloge ima istu boju; na narandžastoj podlozi tekst je u boji te podloge (`--color-primary-700`) |
| Velika slova | nikad (`text-transform: uppercase` je zabranjen van onboardinga) |
| Najmanji tekst | 12px za sve što se čita; 11px samo u znački (`.status-pill`), u oznaci (`.cg-tag`) i u meta liniji (`.cg-meta`) |

**Koncentrični uglovi, primeri koji važe u kodu:**
- kartica r24, padding 16 → ono što je unutra i dodiruje ugao ima r8 (24 = 8 + 16);
- red u kartici je uvučen 8 → red ima r16 (24 = 16 + 8); dugme u redu, sa 8 paddinga reda → r8 (16 = 8 + 8).

**Izuzeci:** avatari i ikonice do 36px i čipovi do 28px visine ne moraju da budu koncentrični.

Ako neki raspored ne može da ispoštuje pravilo nijednim radiusom sa skale, raspored je pogrešan. Ukloni jedan nivo (vidi §6); ne izmišljaj radius.

---

## 2. Tipografija — šta je koje veličine

Dve skale: sa mišem i na dodir (`pointer: coarse`). Na dodir je sve osim sitnog teksta jedan korak veće. Polja moraju biti 16px (inače iOS zumira), pa je osnovni tekst 14, da polje bude samo jedan korak iznad. Skala je u tokenima (`tokens.css`); klase je ne biraju same.

| Uloga | Klasa | Miš | Dodir | Težina | Boja |
|---|---|---|---|---|---|
| Naslov stranice | `.view-title` | 16 / 24 | 20 / 28 | medium | primary |
| Naslov kartice | `.doc-section-title` | 14 / 20 | 16 / 24 | medium | primary |
| Polje, chat | `TextField`, composer | 12 / 16 (chat 14 / 20) | 16 / 24 | normal | primary |
| Naslov reda u kartici | `.fam-row-title`, `.cg-name` | 12 / 16 | 14 / 20 | medium | primary |
| Tekst kartice, podnaslov stranice | `.tip-body`, `.doc-p`, `.fam-sub`, `.rec-why`, `.view-sub` | 12 / 18 | 14 / 20 | normal | secondary |
| Dugme | `.btn` | 12 | 14 | medium | — |
| Sitan tekst: naslov grupe, oznaka, napomena, meta, eyebrow | `.section-title`, `.card-label`, `.tf-label`, `.fact-label`, `.ag-hint`, `.tf-hint`, `.cg-meta`, `.doc-eyebrow` | 12 / 16 | 12 / 16 | medium ili normal | secondary |
| Značka | `.status-pill` | 11 | 11 | medium | po stanju |

**Tokeni:**
- `--text-xs-*` (tekst), `--text-sm-*` (naslovi kartica) i `--text-base-*` (naslov stranice) rastu na dodir.
- `--text-small-*` je sitan tekst i ne raste.
- `--text-body-leading` je visina reda paragrafa: 18, a na dodir 20.
- Novi sitan tekst uvek ide na `--text-small-*`, a nikad na `--text-xs-*`.

**Onboarding** (`.immersive`) zaključava tokene na skali sa mišem, jer ima svoj vizuelni jezik.

Za novi tekst kartice koristi `.tip-body`. Ne uvodi novu klasu istog izgleda.

Hijerarhija se ne preskače: naslov grupe je tiši od naslova kartice, a naslov reda je korak ispod naslova kartice. Kad je stavka sama kartica na stranici (negovateljica na „Pronađi", upit), naslov joj je veličine naslova kartice.

---

## 3. Razmaci

| Odnos | Razmak |
|---|---|
| Između elemenata stranice (`.view`) | 12 |
| Između kartica u listi ili grupi (`.view-list`, `.section`) | 8 |
| Od naslova grupe do prve kartice | 12 (`.section-title` ima margin-bottom 4 + gap 8) |
| Između grupa | 32 (`.view > .section + .section`) |
| Unutar kartice, između delova | 8 (gap kartice) |
| Unutar grupe sadržaja (npr. ime i ocena) | 4 |
| Između grupa sadržaja u kartici | 12 |
| Od sadržaja do footera kartice | 16; kod kartice negovateljice 24 |

---

## 4. Stranica

```jsx
<div className="view">
  <div className="view-head">
    <div className="view-head-text">
      <button type="button" className="back-link" onClick={onBack}>…</button>{/* samo ako postoji nazad */}
      <h1 className="view-title">Naslov</h1>
      <p className="view-sub">Jedna rečenica šta je ovde.</p>
    </div>
    <div className="view-head-actions">{/* akcije stranice, desno */}</div>
  </div>
  …
</div>
```

- Akcije stranice su samo u `.view-head`, desno.
- **„Pitaj asistenta" na uskom ekranu (≤900px)** stoji u gornjoj traci, pored logoa i dugmeta za meni, uvek na istom mestu. Iz glave stranice se tada sklanja (CSS to radi preko klase `.ask-assistant`). U Razgovoru ga nema, jer je chat već asistent.
- **Dugačak tekst ne ide u isti red sa dugmetom.** Ako pored dugmeta nema mesta za tekst u jednom redu, dugme ide na drugo mesto (u traku, u footer), a ne gura tekst u uzak stubac.
- `.back-link` je iznad naslova (12px, strelica), **12px od onoga ispod njega**, i kad je u `.view-head-text` i kad stoji sam iznad glave stranice (`.view > .back-link`). Nema drugog stila za „nazad". Širok je koliko njegov tekst, i na telefonu, gde je zaglavlje grid: zona dodira ne sme da pređe na prazan prostor desno od njega.
- **Stranica iz bočnog menija nema „nazad".** „Nazad" imaju samo stranice koje se otvaraju iz druge stranice (njena stranica, sve posete, plan).
- **Akcija koja je u bočnom meniju ne ponavlja se u glavi stranice** („Pronađi negovateljicu" nije u Mojoj nezi ni u Vašim upitima). Izuzetak je prazna stranica ili kartica „Sledeći korak", gde je to jedini sledeći korak.
- **Stranica osobe** (avatar pored imena, `.fam-person`): avatar je poravnat po vrhu sa imenom. Na telefonu avatar i ime zauzimaju ceo red, a akcija stranice (npr. telefon) je ispod njih, 12px niže.
- Na telefonu (≤640px) su naslov i akcije u istom redu, a podnaslov je ispod njih celom širinom. To rešava CSS; ne menjaj markup.
- Pretraga i filteri stoje direktno na stranici (`<Field><Input icon={Search} … /></Field>`), nikad u kartici.

---

## 5. Kartica i grupa kartica

**Postoji jedna kartica:** `.panel-card` — bela, r24, padding 16, gap 8, senka `--shadow-card`. Nema drugih klasa za karticu. Ako treba nešto posebno, dodaje se modifikator na `.panel-card`.

```jsx
<section className="panel-card">
  <div className="panel-card-head">
    <p className="doc-section-title">Naslov kartice</p>
    <span className="status-pill is-muted">Stanje</span>   {/* opciono, desno */}
    {/* opciono, desno: ikonica-dugme, npr. <Button variant="secondary" iconOnly aria-label="Izmeni">…</Button> */}
  </div>
  <p className="tip-body">Šta ova kartica kaže.</p>
  <div className="panel-card-actions">                    {/* footer, dole levo */}
    <Button variant="primary">Akcija</Button>
  </div>
</section>
```

- Ikonice u naslovu kartice: vidi §11.
- Footer (`.panel-card-actions`) je uvek poslednji, dole levo, a dugmad su prirodne širine. Na telefonu dugmad dele širinu kartice (CSS to radi sam).
- `.panel-card-actions.is-end` (desno) je samo za dijaloge i drawer-e.

**Istaknuta kartica:** `.panel-card.is-attention` — narandžasta podloga, ivica od 1px, bez senke. Samo za tri stvari: ono što čeka na porodicu, Minnino pismo i izmenu plana. Ne pravi drugu „istaknutu" varijantu.

**Grupa kartica** se koristi samo kad stranica ima više od jedne grupe:

```jsx
<section className="section">
  <h2 className="section-title">Plaćanje</h2>
  <div className="panel-card">…</div>
  <div className="panel-card">…</div>
</section>
```

**Prazna stranica:** `.empty` sa `.locked-title`, `.locked-note` i jednom akcijom.

**Izbor plana** (`PaywallModal`, `.modal.is-plans`):
- Svaki plan je `.panel-card.pw-plan-card` sa svim sadržajem: naziv, cena (24px), ušteda kao značka, rečenica za koga je, spisak šta uključuje i dugme „Izaberite" + naziv plana („Izaberite Premium"). Naslov dijaloga je „Izaberite pretplatu", a dugme koje ga otvara iz plana nege „Otključajte ceo plan nege": u naslovima i dugmadima „plan" znači samo plan nege, da se dva značenja ne sretnu na istom putu.
- Kartice su jedna pored druge (`.pw-plan-grid`), a na telefonu jedna ispod druge, sa preporučenom prvom.
- Preporučeni plan (`recommended` u `src/data/plans.js`) ima prsten u primarnoj boji (`.is-recommended`), značku „Najpopularniji" i primary dugme; ostali imaju secondary.
- Ovo je jedini obrazac gde je dugme u footeru kartice preko cele širine i spušteno na dno kartice, da se dugmad poravnaju kad su spiskovi različite dužine.
- Ceo tekst planova je u `src/data/plans.js`, a ne u komponenti.

---

## 6. Red unutar kartice

Stavka unutar kartice (negovateljica u preporuci, poseta, upit, kanal kontakta) je **red**, a ne kutija sa ivicom i ne kartica u kartici.

Mere (sve radi CSS u bloku „Rows inside a card" u `app.css`):
- red zalazi 8px u padding kartice: `margin: 0 -8px`;
- padding reda je 16 gore i dole i 8 sa strane;
- radius reda je 16 (vidi se samo na hover-u);
- između redova je linija od 1px, uvučena 8 da bude poravnata sa tekstom;
- na hover (samo red koji se otvara): podloga `--surface-2`, linije iznad i ispod se sklanjaju, ime dobija `--color-primary-700`.

Klase redova koje ovo već dobijaju: `.caregiver` (bez `.is-wide`), `.fam-row`, `.contact-row`, `.fam-visit`, `.visit`. Kontejneri: `.rec-providers`, `.fam-rows`, `.contact-rows`, `.fam-visits`, `.visit-list`.

**Poravnanje u redu (`.fam-row`):** sve počinje od prve linije. Avatar je poravnat po vrhu sa naslovom, a ono desno (dugme, broj, strelica) počinje u istoj visini kao naslov. Ništa se ne centrira po visini reda, jer red sa oznakama ima tri i više linija.

**Stanje u redu** je kratka značka pored naslova (`.fam-row-title` › `.status-pill`), a ne poseban red. Kod posete značka kaže samo korak („Plan posete", „Radni nalog stigao", „Plaćeno"), jer iznos desno već kaže šta je sa novcem, a linija ispod kaže ostalo. Iznos koji je rezervisan za posetu stoji u liniji ispod datuma (`.fam-row-body.is-inline`).

Za novu vrstu reda dodaj njenu klasu u te `:is(…)` selektore. Ne piši joj posebnu ivicu, podlogu, senku ili radius.

**Zabranjeno:** kutija sa ivicom ili senkom unutar kartice. To je treći nivo uglova i ne može da ispoštuje §1.

---

## 7. Šta se klikne

**Kartica ili red koji predstavlja nešto sa svojim detaljima** (negovateljica, plan, poseta) ceo je klikabilan i otvara te detalje.

```jsx
<div className="caregiver is-wide is-clickable">               {/* ili red: className="caregiver is-clickable" */}
  <div className="cg-avatar">VM</div>
  <div className="cg-main">
    <div className="cg-top">
      <button type="button" className="cg-name card-link" onClick={openDetails}>Vesna Mitrović</button>
      <span className="status-pill is-attention">Poklapanje · 97%</span>
      <ChevronRight className="card-go" size={16} strokeWidth={1.75} aria-hidden="true" />
    </div>
    …
    <div className="panel-card-actions">                        {/* kod reda: dugme je direktno u redu, desno */}
      <Button variant="primary" className="card-action" onClick={act}>Pošalji poruku</Button>
    </div>
  </div>
</div>
```

- `.is-clickable` na kartici ili redu, a `.card-link` na imenu. Ime je pravo `<button>`: `::after` ga razvlači preko cele kartice, pa radi i tastatura i čitač ekrana.
- Dugme u takvoj kartici ima `.card-action` i uvek radi samo ono što kaže, iznad linka. Ne stavljaj `onClick` na div kartice.
- **Desktop:**
  - kartica ima akciju u footeru;
  - red ima akciju desno;
  - hover: kartica se uokviri, a red posivi.
- **Telefon (≤640px):**
  - `.card-action` se ne prikazuje, nego `.card-go` (strelica);
  - tap otvara detalje, pa **detalji moraju imati istu akciju** (profil negovateljice ima „Pošalji poruku");
  - pre nego što sakriješ akciju, proveri da je ima u detaljima.
- **Grupa koja se sklapa** (npr. grupa kolačića): ceo njen gornji deo (naziv, stanje, opis) otvara i zatvara grupu. Naziv je dugme razvučeno preko tog dela (`.ck-summary` + `.ck-open`). Prekidač stoji iznad i samo menja stanje. Spisak koji se otvori nije deo mete, pa se čitanjem ne zatvara.
- **Kartica koja ne predstavlja ništa što se otvara** (podešavanje, informacija, kontakt) nije klikabilna. Akcije su joj u footeru i vide se i na telefonu.
- **Dugme desno** ide samo u redu čiji sadržaj staje u dve linije. U kartici sa više teksta dugme ide u footer.
- **Red koji nešto otvara** (`.fam-row.is-clickable`, `.fam-visit.is-clickable`): naslov je `.card-link`, dugme desno je `.card-action` i kaže isto, a na telefonu ga menja `.card-go`. Tako su redovi u Mojoj nezi („Čeka na vas", „Predstoji", „Vaše negovateljice") i posete. Red ima jednu akciju; „Njena stranica" pored „Pogledaj plan posete" je bila druga, a njena stranica je jedan klik dalje preko reda „Vaše negovateljice".
- **Red koji otvara njenu stranicu i nema dugme** (Vaše negovateljice) ima stalnu strelicu desno (`.fam-row-chevron`). Broj pored nje (`.fam-row-side`) se na telefonu ne prikazuje.

---

## 8. Podaci (oznaka — vrednost)

Vrsta vrednosti određuje raspored:

| Vrednost | Raspored | Klase | Primeri |
|---|---|---|---|
| Kratka (iznos, datum, stanje, broj) | oznaka levo, vrednost desno | `.bc-lines` › `.bc-line` › `.bc-line-label` + `.bc-line-value` | obračun posete, stanje kolačića, uslovi |
| Slobodan tekst (ime, adresa, odgovor) | oznaka iznad vrednosti, redovi razdvojeni linijom | `.facts.is-stacked` › `.fact` › `.fact-label` + `.fact-value` | profil, arhivirani plan |

- Oznaka je u oba slučaja 12px secondary, a vrednost primary.
- Slobodan tekst se prelama i nikad se ne seče tri tačke.
- **Jedini izuzetak je cenovnik partnera** (`.rec-prices`): naziv levo, redovna i Minnina cena u koloni desno.

### Negovateljica: šta se o njoj prikazuje

U Finskoj zakon ograničava šta smemo da prikupimo o negovateljici, pa se prikazuje **samo ono što ona popunjava u formi na platformi**. Ništa se ne izmišlja preko toga.

| Podatak | Kartica („Pronađi") | Red (preporuka u planu, chat) | Profil (drawer) |
|---|---|---|---|
| Ocena i broj ocena, ili „Nova" | meta | meta | zaglavlje |
| Cena od–do (`16–20 €/h`) | meta | meta | zaglavlje, „Kada može da dolazi" |
| Opština (nikad adresa) i radijus | meta | meta | eyebrow |
| Razlozi poklapanja (do tri, sa kvačicom) | ispod mete | — | — |
| Klasifikacije (finski nazivi) | `.cg-tag` | — | čipovi „Klasifikacije" |
| Biografija | — | — | citat |
| Obrazovanje, jezici | — | — | „Kvalifikacije" |
| Dani (`pon–pet`), doba dana sa satima, radijus | — | — | „Kada može da dolazi" |
| Telefon, e-mail | — | — | „Kontakt", zamaskirano do pretplate |

- **Klasifikacije** su četiri, uvek finskim imenom: Hoiva-avustaja, Lähihoitaja, Sairaanhoitaja, Kotiavustaja. Stoje na mestu nekadašnjeg „Čime se bavi".
- **Doba dana** su tri, kao u formi: jutro 06–14, popodne 14–22, veče 22–06. Nege od 24 sata nema.
- **Nema:** godina iskustva, spiska veština, tačne udaljenosti, noćnih smena kao posebne stavke.
- Podaci i pomoćne funkcije (`daysText`, `slotsText`, `ratingText`, `matchReasons`, `SLOTS`) su u `src/data/carePlan.js`. Komponenta ih ne sastavlja sama.

---

## 9. Dugmad

| Akcija | Varijanta |
|---|---|
| Podešava nešto što nedostaje (pretplati se, dodaj karticu, uključi, pošalji) | `primary` |
| Menja nešto što je već podešeno (promeni karticu, promeni lozinku) | `secondary` |
| Gasi ili otkazuje (otkaži pretplatu, isključi 2FA) — uvek prvo traži potvrdu | `secondary` |
| Briše nepovratno (obriši nalog) | `danger` |
| Sporedna akcija pored glavne u dijalogu („Otkaži", „Nazad") | `secondary` |

- **Varijanta zavisi od vrste akcije, ne od stanja.** Isto dugme ne menja boju kad se nešto podesi. Dugme promeni izgled samo kad se promeni i akcija koju nudi:

  | Kartica | Pre | Posle | Zašto |
  |---|---|---|---|
  | Pretplata | „Pretplatite se" — primary | „Otkaži pretplatu" — secondary | akcija postaje otkazivanje |
  | Dvofaktorska prijava | „Uključi" — primary | „Isključi" — secondary | akcija postaje gašenje |
  | Način plaćanja | „Dodaj karticu" — primary | „Promeni karticu" — secondary | kartica je podešena, a menjanje je održavanje, ne preporuka |
  | Lozinka | „Promenite lozinku" — secondary | isto | lozinka uvek postoji, pa je ovo uvek menjanje |
  | Kolačići | „Podešavanja kolačića" — primary | isto | nema stanja |
  | Nalog | „Preuzmi moje podatke" — secondary; „Obriši nalog" — danger | isto | preuzimanje nije preporuka, samo mogućnost |
- **U dijalogu i drawer-u** akcije su dole desno (`.panel-card-actions.is-end`): prvo secondary, pa glavna.
- **Na ekranu na dodir** (`pointer: coarse`) sva dugmad, polja, redovi i čipovi imaju najmanje 44px. Tokeni `--button-size` i `--input-size` to rade sami, pa ne zadaji fiksnu visinu manju od 44 bez `(pointer: coarse)` pravila.
- Ikonice u dugmadima: vidi §11.

---

## 10. Stanje i polja

- **Čip je samo za ono što se bira.** `.svc` (ivica, a popunjen kad je izabran) je dugme: izbor usluga u ugovoru, filteri, odgovor u tri reči, jezik. **Ono što se samo čita** (usluge iz ugovora, šta je urađeno na poseti, šta će raditi, klasifikacije negovateljice, šta je porodica tražila) je oznaka: komponenta `Tags` (`src/components/Tags.jsx`, `.cg-tags` › `.cg-tag`), siva podloga, bez ivice i bez kvačice. Ono što je izostavljeno je `.cg-tag.is-off` i to kaže rečima („— ovog puta ne"). `ServiceChips` crta oznake. Oznake u redu stoje 12px ispod teksta reda, a u kartici 8px ispod naslova.
- **Stanje** se kaže samo značkom `.status-pill` sa jednim od modifikatora: `is-accepted` (zeleno, gotovo), `is-pending` (čeka), `is-declined` (ne), `is-muted` (neutralno), `is-attention` (narandžasto: poklapanje, izmenjeno).
- **Poklapanje** se svuda piše „Poklapanje · 97%", kao značka `is-attention`.
- **Polja** su samo iz `src/components/TextField.jsx`: `Field`, `Input` (opciono `icon`, `suffix`), `Password`, `TextArea`, `Select`. Nijedna forma nema svoje `<input>` ni native `<select>`.
- **Na dodir je svako polje najmanje 16px**, i `input`/`textarea`/`select` i svaki `contenteditable` (composer u chatu je `contenteditable`). Ispod 16px iOS zumira stranicu kad se polje fokusira i ostavi je zumiranu. To je globalno pravilo sa `!important`; ne obaraj ga, ni preko `--ick-*` promenljivih kita.
- **Chat na dodir:** composer, poslata poruka i odgovor su svi 16/24 (sa mišem 14/20). Uvek su iste veličine.
- **Zaštita na iOS-u:** `src/lib/iosZoom.js` dodaje `maximum-scale=1` u viewport samo na iPhone-u i iPad-u, pa Safari ne zumira pri fokusu ni kad bi neko polje ipak ispalo ispod 16px. Ručno zumiranje prstima i dalje radi. Na Androidu se ne dodaje, jer bi tamo isključilo ručno zumiranje.
- **Traka sa strelicama i „Gotovo" iznad tastature** na iOS-u je Safarijeva i sajt ne može da je ukloni.

---

## 11. Ikonice

**Podešavanja (odlučeno 28. 9.):** dugme sa tekstom nema ikonicu. To važi za stranicu i za sve njene dijaloge i drawer-e (kartica, lozinka, 2FA, kolačići). Izbor jezika pokazuje podloga čipa, bez kvačice.

**Ostatak aplikacije — ODLUKA NA ČEKANJU:** tamo su ikonice još nedosledne („Pošalji poruku" ima ikonicu u planu, a na „Pronađi" nema). Dok se ne odluči, ne dodaj i ne uklanjaj ikonice van Podešavanja. Ne dodaj ni ikonice u naslove kartica: kolega ih je dodao 28. 9. (`0f734cd`), sweep obrazaca ih je istog dana uklonio, a konačna odluka još nije pala.

**Ikonica ostaje uvek:**
- dugme bez teksta (`iconOnly`), uz `aria-label`;
- strelica koja pokazuje da li je nešto otvoreno ili zatvoreno (disclosure);
- „Pitaj asistenta", ista komponenta na svim stranicama;
- kvačice u listama i u znački stanja, jer to nisu dugmad.

## 12. Telefon

- **Prelomi:** ≤640px je telefon, ≤900px je uzak ekran (meni postaje fioka).
- **Paneli sa strane** (asistent, plan) su na uskom ekranu preko celog ekrana, bez radiusa.
- **Svaki dijalog je na telefonu drawer:** i drawer-i (`Modal`) i centrirani dijalog (`.modal`, izbor plana i poruka negovateljici) zauzimaju celu visinu, 8px od ivica ekrana, sa radiusom 24 i paddingom 16. Sadržaj se skroluje, a poslednji red dugmadi je zakačen na dno sa linijom iznad. Na desktopu je drawer sa strane, a centrirani dijalog u sredini.
- **Ništa ne sme da izlazi van ekrana** na 375px.
- Pravila za telefon iz §4, §5, §7 i §9 rešava CSS. Markup je isti na svim širinama.

---

## 13. Provera — obavezno posle izmene interfejsa

Otvori stranicu u pregledaču i u konzoli pokreni skript ispod, na desktopu i na 375×812. Rezultat mora biti prazan niz za `concentric`, `caps` i `overflow`, a `cards` i `titles` moraju imati samo vrednosti iz ovog dokumenta.

```js
(() => {
  const root = document.querySelector('.chat-container') || document.body;
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const exempt = (e) => e.closest('.cg-avatar') || e.matches('.status-pill, .cg-tag, .cg-avatar');
  const concentric = [];
  root.querySelectorAll('*').forEach((e) => {
    const s = getComputedStyle(e), r = parseFloat(s.borderTopLeftRadius), box = e.getBoundingClientRect();
    if (!r || box.width < 40 || box.height < 36 || exempt(e)) return;
    for (let p = e.parentElement; p && p !== root; p = p.parentElement) {
      const ps = getComputedStyle(p), pr = parseFloat(ps.borderTopLeftRadius);
      if (pr && (ps.backgroundColor !== 'rgba(0, 0, 0, 0)' || ps.boxShadow !== 'none' || parseFloat(ps.borderTopWidth) > 0)) {
        const pb = p.getBoundingClientRect(), gap = box.left - pb.left;
        if (gap <= pr && box.top - pb.top <= pr + 40 && Math.abs(pr - (r + gap)) > 1)
          concentric.push([e.className.toString().slice(0, 30), r, p.className.toString().slice(0, 30), pr, Math.round(gap)]);
        break;
      }
    }
  });
  const uniq = (a) => [...new Set(a)];
  return {
    concentric,
    caps: uniq([...root.querySelectorAll('*')].filter((e) => vis(e) && !e.closest('[class*="imm-"]') && getComputedStyle(e).textTransform === 'uppercase').map((e) => e.className.toString())),
    overflow: uniq([...root.querySelectorAll('*')].filter((e) => vis(e) && e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.app-nav')).map((e) => e.className.toString())).slice(0, 10),
    cards: uniq([...root.querySelectorAll('.panel-card, .caregiver.is-wide, .plan-row')].filter(vis).map((e) => { const s = getComputedStyle(e); return `${s.borderTopLeftRadius}/${s.paddingTop}`; })),
    titles: uniq([...root.querySelectorAll('.doc-section-title, .section-title, .fam-row-title')].filter(vis).map((e) => `${e.className.split(' ')[0]} ${getComputedStyle(e).fontSize}`)),
  };
})();
```

Očekivano: `cards` → `24px/16px`; `titles` → `doc-section-title 14px`, `section-title 12px`, `fam-row-title 12px` (14px samo za naslov kartice koja je sama stavka).

---

## 14. Zabranjeno — kratko

- druga klasa za karticu, kutija sa ivicom ili senkom u kartici, radius van skale;
- velika slova van onboardinga;
- `onClick` na div kartice umesto `.card-link`;
- sakrivena akcija na telefonu koje nema u detaljima;
- `primary` za gašenje ili otkazivanje, ili boja dugmeta po stanju;
- svoje `<input>` ili native `<select>` umesto `TextField`;
- hex boje u komponentama, razmak koji nije deljiv sa 4;
- pretraga ili jedno polje u kartici;
- ikonica u dugmetu sa tekstom u Podešavanjima; dodavanje ili uklanjanje ikonica van Podešavanja dok §11 ne dobije odluku.
