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
| Čipovi i značke | nikad pun krug (999px): čip (`.svc`, 32–44px) r8, značka i oznaka (`.status-pill`, `.cg-tag`, 20px) r4 |
| Velika slova | nikad (`text-transform: uppercase` je zabranjen van onboardinga) |
| Najmanji tekst | 12px za sve što se čita; 11px samo u znački (`.status-pill`) i u meta liniji (`.cg-meta`) |

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

**Rečenica u redu** (linija ispod posete, napomena na dnu stranice) je tekst kartice: 12 / 14 na dodir. Kratka oznaka pored broja („rezervisano", „Plaćenih poseta") je sitan tekst, 12. Ništa od toga nije 11.

Hijerarhija se ne preskače: naslov grupe je tiši od naslova kartice, a naslov reda je korak ispod naslova kartice. Kad je stavka sama kartica na stranici (negovateljica na „Pronađi", upit), naslov joj je veličine naslova kartice.

---

## 3. Razmaci

| Odnos | Razmak |
|---|---|
| Između elemenata stranice (`.view`), tj. kartica jedne ispod druge | 12 (odlučeno 2. 10.; 16 je bilo previše) |
| Između kartica u listi ili grupi (`.view-list`, `.section`) | 12 (bilo je 8) |
| Od naslova grupe do prve kartice | 12 (gap grupe) |
| Između grupa | 32 (`.view > .section + .section`: gap 12 + 20) |
| Od ivice panela do sadržaja stranice | 24 sa svih strana (`.view`; na telefonu 16) |
| Unutar kartice, između delova | 8 (gap kartice) |
| Unutar grupe sadržaja (npr. ime i ocena) | 4 |
| Između grupa sadržaja u kartici | 12 |
| Od sadržaja do footera kartice | 16 |

---

## 4. Stranica

```jsx
<div className="view">
  <BackButton label="Moja nega" onClick={onBack} />   {/* samo ako postoji nazad */}
  <div className="view-head">
    <div className="view-head-text">
      <h1 className="view-title">Naslov</h1>
      <p className="view-sub">Jedna rečenica šta je ovde.</p>
    </div>
    <div className="view-head-actions">{/* akcije stranice, desno */}</div>
  </div>
  …
</div>
```

- Akcije stranice su samo u `.view-head`, desno. **Između teksta glave i dugmeta je 32**, da dugačak podnaslov ne dolazi do dugmeta. Stranica ima 24 gore kao i sa strane, pa dugme stoji podjednako daleko od vrha i od ivice panela, u njegovom uglu.
- **„Pitaj asistenta" na uskom ekranu (≤900px)** stoji u gornjoj traci, pored logoa i dugmeta za meni, uvek na istom mestu. Iz glave stranice se tada sklanja (CSS to radi preko klase `.ask-assistant`). U Razgovoru ga nema, jer je chat već asistent.
- **Dugačak tekst ne ide u isti red sa dugmetom.** Ako pored dugmeta nema mesta za tekst u jednom redu, dugme ide na drugo mesto (u traku, u footer), a ne gura tekst u uzak stubac.
- **Ikonica-dugme u glavi stranice** (`secondary iconOnly`: „Pošalji plan", „Pregled", „Šta se desilo") je visoka koliko dugme sa tekstom pored nje (32, na dodir 44), a ne koliko čip (28).
- **„Nazad" je `BackButton`** (`src/components/BackButton.jsx`): naše `ghost` dugme sa strelicom, uvek prvo na stranici, pre `.view-head`. **16 iznad i 16 ispod** (stranica tada ima 16 gore umesto 24; ispod je gap stranice 12 i 4 dugmeta). Strelica je na levoj ivici stranice, a padding dugmeta izlazi u marginu. Nema drugog stila za „nazad" (stari `.back-link` je uklonjen).
- **Bočni meni:** „Novi razgovor" je dugme (`secondary`, cela širina, sa „+") i jedino on započinje razgovor. Ispod njega je **„Istorija razgovora"** (odlučeno 2. 10.; ranije „Razgovor"): ceo red samo otvara i zatvara spisak ranijih razgovora i ne vodi nigde, a strelica je na kraju reda. Po defaultu je zatvoren. Prazan spisak kaže „Još nema razgovora.". „Vaši upiti" je svoja stavka, sa brojem upita koji čekaju odgovor.
- **Stranica iz bočnog menija nema „nazad".** „Nazad" imaju samo stranice koje se otvaraju iz druge stranice (njena stranica, sve posete, plan).
- **Akcija koja je u bočnom meniju ne ponavlja se u glavi stranice** („Pronađi negovateljicu" nije u Mojoj nezi ni u Vašim upitima). Izuzetak je prazna stranica ili kartica „Sledeći korak", gde je to jedini sledeći korak.
- **Stranica osobe** (avatar pored imena, `.fam-person`): avatar je poravnat po vrhu sa imenom. Na telefonu avatar i ime zauzimaju ceo red, a akcija stranice (npr. telefon) je ispod njih, 12px niže.
- Na telefonu (≤640px) su naslov i akcije u istom redu, a podnaslov je ispod njih celom širinom. To rešava CSS; ne menjaj markup.
- Pretraga i filteri stoje direktno na stranici (`<Field><Input icon={Search} … /></Field>`), nikad u kartici. „Pronađi negovateljicu" za sada nema pretragu (odlučeno 2. 10.): lista je poređana po poklapanju sa planom, sa stranama po 10.
- **Broj u bočnom meniju** kaže samo da nešto stiglo i čeka porodicu: „Moja nega" broji ono što čeka na nju (novi uslovi ili ugovor, radni nalog, dodatni sati; `waitingOnYou`), a „Vaši upiti" odgovore koje još nije videla (prihvatila ili odbila; `unseenAnswers`). Poslat upit se ne broji. Otvaranjem „Vaših upita" odgovori su viđeni.

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

**Narandžasti deo (odlučeno 1. 10.):** `Attention` (`src/components/Attention.jsx`, `.attention`). Narandžasto je podloga oko belih kartica, a ne kartica: naslov (i rečenica) stoje na narandžastom, u njegovoj boji (`--color-primary-700`), a sve što deo drži su obične bele `.panel-card` sa senkom.

```jsx
<Attention title="Čeka na vas" sub="Jedna rečenica šta je ovde.">
  <div className="panel-card is-row is-clickable">…</div>   {/* stavka koja nešto otvara */}
  <div className="panel-card">…</div>                       {/* tekst i dugme */}
</Attention>
```

- Mere: r32, padding 8, ivica od 1px nacrtana unutra (ne uzima od 8), 8 između kartica. Kartica unutra je r24 (32 = 24 + 8). Naslov je 16 od vrha i 24 od leve ivice, tamo gde je tekst kartica, i 12 iznad prve kartice.
- Stavka koja nešto otvara je `.panel-card.is-row.is-clickable`: avatar, naslov kartice kao `.card-link` (14), tekst, dugme desno (`.card-action`), na telefonu strelica.
- Glava može biti i nešto drugo (`head`): Minnino pismo ima avatar i „Sakrij poruku", izmena plana ikonicu.
- Samo za: ono što čeka na porodicu („Čeka na vas", sledeći korak na njenoj stranici), „Sledeći korak" pre prvog upita, „Upoznavanje nije završeno", Minnino pismo i izmenu plana. Nema druge narandžaste kartice; `.panel-card.is-attention` više ne postoji.

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
- padding reda je 8 sa svih strana, pa je podloga na hover-u isto daleko od teksta gore, dole i sa strane (odlučeno 1. 10.; bilo je 16 gore i dole a 8 sa strane);
- između redova je 8, a linija od 1px je na sredini tog razmaka, uvučena 8 da bude poravnata sa tekstom;
- radius reda je 16 (vidi se samo na hover-u);
- na hover (samo red koji se otvara): podloga `--surface-2`, linije iznad i ispod se sklanjaju, ime dobija `--color-primary-700`, a oznake (`.cg-tag`) u njemu postanu bele, da ne nestanu u sivom.

Klase redova koje ovo već dobijaju: `.caregiver` (bez `.is-wide`), `.fam-row`, `.contact-row`, `.fam-visit`, `.visit`. Kontejneri: `.rec-providers`, `.fam-rows`, `.contact-rows`, `.fam-visits`, `.visit-list`.

**Poravnanje u redu (`.fam-row`):** sve počinje od prve linije. Avatar je poravnat po vrhu sa naslovom, a ono desno (dugme, broj, strelica) počinje u istoj visini kao naslov. Ništa se ne centrira po visini reda, jer red sa oznakama ima tri i više linija.

**Stanje u redu** je kratka značka pored naslova (`.fam-row-title` › `.status-pill`), a ne poseban red. Kod posete značka kaže samo korak („Plan posete", „Radni nalog stigao", „Plaćeno"), jer iznos desno već kaže šta je sa novcem, a linija ispod kaže ostalo. Iznos posete stoji u liniji ispod datuma kao oznaka (`.fam-row-body.is-inline` › `.cg-tag`): „54 € rezervisano" u „Predstoji", „54 € naplaćeno" u poslednjoj poseti. Oznaka je ista kao sve ostale oznake (bez ikonice), a ne značka.

Za novu vrstu reda dodaj njenu klasu u te `:is(…)` selektore. Ne piši joj posebnu ivicu, podlogu, senku ili radius.

**Kartica koja se završava redovima** ima 16 od teksta poslednjeg reda do donje ivice, kao 16 od vrha do naslova. Poslednji red ulazi 8 u padding kartice, pa je njegova podloga na hover-u 8 od dna kao i sa strane (24 = 16 + 8). Ako posle redova ide footer (npr. „Prikaži još"), on je 16 od teksta poslednjeg reda. CSS to radi sam.

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
  - kartica ima akciju u footeru; **izuzetak je kartica negovateljice na „Pronađi"**: dugme („Pošalji poruku") ili stanje („Već dolazi", „Čeka odgovor") je gore desno, u visini imena;
  - red ima akciju desno;
  - hover: kartica se uokviri, a red posivi.
- **Telefon (≤640px):**
  - `.card-action` se ne prikazuje, nego `.card-go` (strelica);
  - tap otvara detalje, pa **detalji moraju imati istu akciju** (profil negovateljice ima „Pošalji poruku");
  - pre nego što sakriješ akciju, proveri da je ima u detaljima.
  - **izuzetak je kartica negovateljice na „Pronađi":** „Pošalji poruku" je posebna akcija od otvaranja detalja, pa na telefonu ostaje, ispod sadržaja kartice, poravnata sa tekstom i široka koliko on, a strelica gore ostaje i kaže da tap otvara profil. Stanje („Već dolazi", „Čeka odgovor") stoji na istom mestu.
- **Grupa koja se sklapa** (npr. grupa kolačića): ceo njen gornji deo (naziv, stanje, opis) otvara i zatvara grupu. Naziv je dugme razvučeno preko tog dela (`.ck-summary` + `.ck-open`). Prekidač stoji iznad i samo menja stanje. Spisak koji se otvori nije deo mete, pa se čitanjem ne zatvara.
### Drawer ili modal (odlučeno 30. 9.)

- **Drawer** (`Modal`, sa strane) je za **detalje**: kad treba prikazati više o nečemu, a akcija nije jedino što je bitno. Ugovor o nezi, radni nalog, plan posete, profil negovateljice. Drawer može imati akciju koja završava pregled (npr. „Prihvati uslove", „Sve je u redu — plati sada").
- **Modal** (`Dialog`, `src/components/Dialog.jsx`, u sredini) je za **akciju**: završi saradnju, pretplati se, uključi ili isključi nešto, promeni lozinku, dodaj karticu, podesi kolačiće, pošalji plan, otkaži posetu, prijavi da nešto nije u redu, odbij uslove, a na strani negovateljice pošalji ugovor, isplaniraj posetu i pošalji radni nalog. Izbor pretplate (`PaywallModal`) je takođe modal.
- `Dialog` ima isti ugovor kao `Modal` (`eyebrow`, `title`, `wide`, `dismissible`, `onClose`, a sadržaj se završava redom akcija `.panel-card-actions.is-end`), pa ekran prelazi iz jednog u drugo promenom imena.
- **Akcija iz drawer-a otvara modal preko drawer-a** („Otkaži posetu" iz plana posete, „Nešto nije u redu" iz radnog naloga, „Odbij" iz ugovora). Drawer ostaje ispod; Escape i „Nazad" zatvaraju samo modal. Kad modal vodi dalje („Pogledaj radni nalog" iz „Završiti saradnju?"), on se zatvara i otvara se drawer.
- Mere modala: 440 širok (`wide`: 560), padding 24, radius 24, delovi 12 jedan od drugog, red akcija 16 ispod sadržaja i zakačen za dno dok se dugačak sadržaj skroluje.
- Na telefonu su oba bottom sheet (§12).
- **Klik van drawer-a ili modala ga zatvara samo ako je i pritisak počeo van njega** (`src/lib/backdropClose.js`, u `Modal`, `Dialog` i `PaywallModal`). Kad se iz polja razvlači ili selektuje tekst pa se miš pusti van prozora, prozor ostaje otvoren. Svaki novi prozor sa pozadinom koristi isti `useBackdropClose`.

- **Kartica koja ne predstavlja ništa što se otvara** (podešavanje, informacija, kontakt) nije klikabilna. Akcije su joj u footeru i vide se i na telefonu.
- **Dugme desno** ide samo u redu čiji sadržaj staje u dve linije. U kartici sa više teksta dugme ide u footer.
- **Red koji nešto otvara** (`.fam-row.is-clickable`, `.fam-visit.is-clickable`): naslov je `.card-link`, dugme desno je `.card-action` i kaže isto, a na telefonu ga menja `.card-go`. Tako su redovi u Mojoj nezi („Čeka na vas", „Predstoji", „Vaše negovateljice") i posete. Red ima jednu akciju; „Njena stranica" pored „Pogledaj plan posete" je bila druga, a njena stranica je jedan klik dalje preko reda „Vaše negovateljice".
- **Poseta** ima tri dela (datum i sati, izveštaj, rečenica šta je sa njom i dugme), 12 jedan od drugog, pa joj je dugme ispod rečenice, levo, kao footer kartice, a ne desno.
- **Izveštaj posete** (`VisitReport` u `src/components/family/FamilyDrawer.jsx`) je uvek isti, gde god se prikazuje na stranici: delovi sa imenom, 12 jedan od drugog: „Urađeno" (oznake, samo u poslednjoj poseti), „Kako je bila" (oznake „Raspoloženje: dobro", „Ishrana: kao i obično", „Kretanje: kao i obično", bez ikonice) i „Sanna je zapisala" (običan tekst). U radnom nalogu (drawer) „Kako je bila" su iste oznake.
- **„Sve posete" i „Svi upiti"** u glavi kartice su `Button` `secondary` (sa strelicom, kao i ranije), desno. **„Prikaži još"** je `Button` `secondary` u footeru, levo. Nema dugmeta-linka ni dugmeta koje je samo tekst.
- **Red koji otvara njenu stranicu i nema dugme** (Vaše negovateljice) ima stalnu strelicu desno (`.fam-row-chevron`). Broj pored nje (`.fam-row-side`) se na telefonu ne prikazuje.
- **Posete na njenoj stranici:** najviše 10, a ako ih ima više, „Pogledaj sve (N)" (`secondary`, dole levo) otvara drawer „Sve posete" sa svim njenim posetama (`kind: 'visits'`). Redosled je isti (`herVisits`): prvo ono što je u toku, pa izmireno.
- **„Šta se desilo"** (odlučeno 3. 10., izmenjeno 5. 10.): sve što se desilo sa negom, najnovije prvo (`care.log`, upisuju ga `familyCare` i `sim`). Otvara se **ikonicom u glavi stranice** (`History`, `secondary iconOnly`, `aria-label` i `title` „Šta se desilo"): na Mojoj nezi levo od „Pitaj asistenta", za sve negovateljice (u liniji ispod stoji i njeno ime); na njenoj stranici pored broja telefona, samo za nju. Nema kartice na stranici. Drawer (`kind: 'activity'`) ima filtere (Sve, Upiti, Ugovor, Posete, Novac) i stavke po danima. Stavka je red bez akcije: naslov (`.fam-row-title`), pa linija „ko · kada" (`vi`, njeno ime ili `koordinatorka`) i rečenica šta tačno. Naslov nikad ne menja njeno ime po padežu („Poslali ste upit", ne „Poslali ste upit Sanni").
- **Pregled negovateljice** (`kind: 'overview'`): ikonica u glavi njene stranice (`IdCard`, „Pregled"), između telefona i „Šta se desilo". Posete i plaćeno do sada, cena, ocena; kontakt (telefon se skriva kad se saradnja završi); klasifikacije; šta pokriva po ugovoru koji važi, po grupama; kako se plaća.
- **Sve verzije ugovora** (`kind: 'versions'`, „Sve verzije (N)" u footeru kartice „Ugovor o nezi", samo kad ih ima više od jedne): svaka verzija sa značkom stanja (važi, čeka vaš odgovor, zamenjena, odbijena, povučena, završena) i šta je promenila u odnosu na prethodnu.
- **Sledeći korak na njenoj stranici** pokriva i: prihvatila je a ugovor još nije stigao; uslovi su odbijeni ili povučeni (ništa ne važi); poseta je obavljena a radni nalog još nije stigao; dodatni sati čekaju odgovor; saradnja je završena (dugme „Ponovo sarađujte"); ponovni upit čeka, prihvaćen ili odbijen („Pitaj ponovo").
- **Ponovo pitati** (odlučeno 3. 10.): posle odbijenog upita („Pitaj ponovo" na kartici upita i u profilu) i posle završene saradnje („Ponovo sarađujte" na njenoj stranici i u profilu) porodica može ponovo da piše, istim prozorom za poruku. Ne obnavlja se stari ugovor: ona šalje nove uslove, a raniji period ostaje u „Ukratko" kao „Ranije". Na „Pronađi" kartica i dalje pokazuje samo značku („Dolazila ranije", „Odbila"); tap otvara profil, a profil ima „Njena stranica" i „Ponovo sarađujte" ili „Pitaj ponovo".
- **Stanje sa negovateljicom** (`standingWith` u `src/data/familyCare.js`, značka `Standing`, `src/components/Standing.jsx`) je ista značka svuda gde je ona: kartica na „Pronađi", red u preporuci plana, vrh njenog profila. „Već dolazi", „Ugovor čeka vas", „Dolazila ranije", „Upit poslat …", „Prihvatila", „Odbila". Stoji na mestu dugmeta „Pošalji poruku"; na telefonu ispod teksta reda, poravnata sa njim. U profilu je ispod cene, gore, a ne u footeru (footer tada nema dugmad).

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
| Razlozi poklapanja (do tri) | grupa oznaka „Poklapa se" ispod mete | — | — |
| Stanje sa porodicom („Već dolazi", „Upit poslat …") | značka gore desno | značka desno | značka ispod cene, gore |
| Klasifikacije (finski nazivi) | grupa oznaka „Klasifikacije" | — | oznake „Klasifikacije" |
| Biografija | — | — | „O sebi", običan tekst |
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
- **Dugmad chat kita** (`inline-chat-kit`) crta kit, a ne `Button`, pa su u `app.css` („The chat kit's buttons, drawn as ours") obučena kao naša, po ulozi: „Pošalji" je `primary`; „Zaustavi", akcije u zaglavlju chata, „…", predlozi pitanja i koraci pitanja su `secondary`; kopiraj, ponovo i ocena odgovora su `ghost`. Iste visine (32, glif 28, na dodir 44), ugao 8, tekst 12 / 14 na dodir. Novo dugme koje mi dajemo kitu (kartice u chatu) je uvek naš `Button`.

---

## 10. Stanje i polja

- **Čip je samo za ono što se bira.** `.svc` (ivica, a popunjen kad je izabran) je dugme: izbor usluga u ugovoru, filteri, odgovor u tri reči, jezik. **Ono što se samo čita** (usluge iz ugovora, šta je urađeno na poseti, šta će raditi, zašto se negovateljica poklapa, njene klasifikacije, šta je porodica tražila) je oznaka: komponenta `Tags` (`src/components/Tags.jsx`, `.cg-tags` › `.cg-tag`), siva podloga, bez ivice i **bez ikonice** (ni kvačice), 12px. Ono što je izostavljeno je `.cg-tag.is-off` i to kaže rečima („— ovog puta ne"). `ServiceChips` crta oznake.
- **Usluge su iz jednog kataloga** (`src/data/serviceCatalog.js`, odlučeno 3. 10.): 57 usluga u 4 grupe, kao u aplikaciji za negovateljice (Pomoć u svakodnevici, Lična nega i kuća, Praktična nega, Medicinska nega). Ugovor, plan posete, radni nalog i pregled ih prikazuju po grupama (`ServiceChips grouped`: ime grupe, pa oznake). Red negovateljice na Mojoj nezi pokazuje samo imena grupa, a ceo spisak je na njenoj stranici. Ceo katalog (svih 57) se vidi samo u formi gde negovateljica bira šta nudi.
- **Dodatni sati** (odlučeno 3. 10.): radni nalog sa više sati nego što je rezervisano naplaćuje samo rezervisano. Višak je deo „Dodatni sati" u radnom nalogu sa „Odbij dodatne sate" (secondary) i „Odobri X €" (primary), a do odgovora je i stavka u „Čeka na vas". Manje sati: naplaćuje se koliko je radila, a razlika se vraća („Vraća se" u obračunu).
- **Grupa oznaka uvek kaže šta je:** ime grupe (`label`, 12px sivo), a ispod njega oznake, 4 razmaka, kao jedna grupa (`.tag-row`). Sledeća grupa je 12 niže (`.tag-rows`). Primeri: „Poklapa se" i „Klasifikacije" na kartici negovateljice, „Usluge" u redu negovateljice i u ugovoru, „Urađeno" u poslednjoj poseti. U drawer-u ime grupe je `.ag-label` sekcije, pa se `label` ne zadaje.
- Grupa oznaka u redu stoji 12px ispod teksta reda.
- **Ono što je neko napisao** (beleška negovateljice, njena poruka uz uslove, „O sebi", vaša poruka u upitu, ono što ste prijavili) je **običan tekst ispod imena dela**: `Group` sa `text` (`src/components/Tags.jsx`, `.tag-row-text`: 12 / 18, boja vrednosti), a u drawer-u `.ag-label` pa `.doc-p`. **Nikad uvučen citat u kurzivu** sa linijom levo (stari `.fam-quote` je uklonjen).
- **Stanje** se kaže samo značkom `.status-pill` sa jednim od modifikatora: `is-accepted` (zeleno, gotovo), `is-pending` (čeka), `is-declined` (ne), `is-muted` (neutralno), `is-attention` (narandžasto: poklapanje, izmenjeno).
- **Poklapanje** se svuda piše „Poklapanje · 97%", kao značka `is-attention`.
- **Polja** su samo iz `src/components/TextField.jsx`: `Field`, `Input` (opciono `icon`, `suffix`), `Password`, `TextArea`, `Select`. Nijedna forma nema svoje `<input>` ni native `<select>`.
- **`TextArea` se razvlači samo na dole**, od visine sa kojom se otvara (`rows`, to je i minimum). Polje nema svoju gornju granicu, jer koliko teksta treba zavisi od polja. Granicu daje prozor: sadržaj se skroluje, a red dugmadi je zakačen za dno (§7), pa ga polje ne može izgurati. Zato svaki prozor sa poljem mora biti `Dialog` ili `.modal.is-dialog`. U širinu se ne razvlači. Na telefonu ručice nema.
- **Na dodir je svako polje najmanje 16px**, i `input`/`textarea`/`select` i svaki `contenteditable` (composer u chatu je `contenteditable`). Ispod 16px iOS zumira stranicu kad se polje fokusira i ostavi je zumiranu. To je globalno pravilo sa `!important`; ne obaraj ga, ni preko `--ick-*` promenljivih kita.
- **Chat na dodir:** composer, poslata poruka i odgovor su svi 16/24 (sa mišem 14/20). Uvek su iste veličine.
- **Zaštita na iOS-u:** `src/lib/iosZoom.js` dodaje `maximum-scale=1` u viewport samo na iPhone-u i iPad-u, pa Safari ne zumira pri fokusu ni kad bi neko polje ipak ispalo ispod 16px. Ručno zumiranje prstima i dalje radi. Na Androidu se ne dodaje, jer bi tamo isključilo ručno zumiranje.
- **Traka sa strelicama i „Gotovo" iznad tastature** na iOS-u je Safarijeva i sajt ne može da je ukloni.
- **Tastatura u chatu pomera samo composer** (`src/lib/keyboardViewport.js`, samo za composer chata, `.nana-chat [contenteditable]`):
  - Safari na iOS-u, kad se tapne polje, skroluje celu stranicu do kraja dokumenta za visinu tastature, i to se ne može zaustaviti kad krene (vraćanje iz skripte kasni frejm i header poskoči ~300pt).
  - Zato se tap na composer preuzima: composer se na trenutak podigne daleko iznad ekrana, dobije fokus i vrati se u sledećem frejmu. Safari ga zatekne „vidljivog" i ne skroluje stranicu.
  - Kad tastatura krene, aplikacija postane visoka koliko tastatura ostavi (`--app-height`, na `html`/`body`/`#root` i na panelima sa strane koji su na telefonu fiksirani): header stoji, composer sedi na tastaturi, poslednja poruka je iznad composera.
  - Ostaje: pri nekim ponovnim otvaranjima (ne prvom) Safari sam pomeri stranicu ~4–35pt na ~0,25s i vrati je. To se desi pre nego što stranica sazna za tastaturu i ne zavisi od toga gde je composer. Isto pomeranje Safari radi i na običnom polju (pretraga negovateljica). Iz stranice se ne može ukloniti.
  - **Sva ostala polja** (forme, pretraga, dijalozi) imaju Safarijevo ponašanje: stranica se pomeri da se polje vidi. Tako rade forme svuda.
  - **Kako se testira:** `?kbdebug` u adresi prikazuje brojeve (visina vidljivog dela, pomeranje, `--app-height`) i poslednje događaje (fokus, tastatura, skrol stranice). Za merenje: iOS Simulator, snimak ekrana (`xcrun simctl io <uređaj> recordVideo`), frejmovi kroz `ffmpeg`, i po frejmu se prati visina loga u headeru. Header ne sme da se pomeri ni u jednom frejmu, osim gore opisanog Safarijevog pomeranja.
- **Posle slanja poruke na telefonu tastatura se zatvara** (`dropKeyboardAfterSend`), da se vide i pitanje i odgovor. Sa mišem fokus ostaje u composeru.

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
- **Na telefonu je svaki prozor bottom sheet (odlučeno 2. 10.):** drawer (`Modal`), modal (`Dialog`) i izbor plana i poruka negovateljici (`PaywallModal`). Dolazi odozdo, visok je koliko mu treba sadržaj, a najviše do 48px od vrha ekrana (tu se vidi stranica). Gornji uglovi r24, dno na ivici ekrana, preko cele širine, padding 16, na vrhu ručica (36×4). Sadržaj se skroluje, a poslednji red dugmadi je zakačen na dno. **Prevlačenjem glave nadole se zatvara** (preko 96px ili brzim pokretom; kraće se vrati). Sve to radi `useSheet` (`src/lib/sheet.js`), pa novi prozor koristi isti hook. Na desktopu je drawer sa strane, a modal u sredini.
- **Toast** je na telefonu širok koliko ekran (16 od ivica), na desktopu koliko tekst, do 520, uvek u sredini. Radius 16, ne pun krug.
- **Ništa ne sme da izlazi van ekrana** na 375px.
- Pravila za telefon iz §4, §5, §7 i §9 rešava CSS. Markup je isti na svim širinama.

---

## 12a. Simulacija (samo demo)

Ova aplikacija je samo porodična, pa sve što bi uradile negovateljice i koordinatorka radi skriveni drawer **„Simulacija"** (`src/components/family/SimPanel.jsx`, funkcije u `src/data/sim.js`). Otvara se i zatvara sa **Ctrl+H** (na Mac-u takođe Ctrl, ne Cmd). Ništa se ne dešava samo od sebe: nema više automatskog odgovora posle 6 s ni prve posete posle 5 s.

- **Vreme:** „Prođe sat" i „Prođe dan". Stanje ima svoj sat (`care.now`, počinje 11. 8. 2026. u 08:00). Iz njega se računaju „Danas / Sutra / Juče", koliko je do posete (kasno otkazivanje u poslednjem satu) i koliko je ostalo od 24 sata. Kad dođe vreme posete, ona čeka radni nalog; radni nalog koji niko ne prijavi za 24 sata se naplati.
- **Negovateljica:** prihvati ili odbij upit (sa razlogom), pošalji ugovor ili nove uslove, povuci predlog, plan posete za sutra ili za pola sata, radni nalog kako je planirano / sat manje / sat više, poseta se nije desila, otkaže posetu, završi saradnju.
- **Koordinatorka:** reši prijavu (radni nalog: naplati kako je poslato, umanji za sat, ne naplaćuj; plan: plan ostaje, otkaži posetu).
- Pravila kao u aplikaciji za negovateljice: jedan plan posete u isto vreme; nijedan dok novi uslovi čekaju, dok je prijava otvorena ili dok prošla poseta čeka radni nalog; najviše dva nenaplaćena radna naloga. Zašto plan ne može, drawer kaže ispod dugmeta.
- Drawer je alat za demo, ne deo proizvoda: ne ide u galeriju i ne proverava se skriptom iz §13. Dugmad su `secondary`, grupe su `.wo-choice`.

---

## 13. Provera — obavezno posle izmene interfejsa

**Sve kartice na jednoj stranici:** `/?kartice` (ili „Za pregled: sve kartice na jednoj stranici" ispod prijave). Stranica (`src/screens/CardGallery.jsx`) renderuje prave ekrane sa primerom podataka u kom je svaka kartica u svakom stanju, pa se kartice porede jedna pored druge. Novi ekran sa karticama dodaj i tamo.

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

Na `/?kartice` skript uzima `.chat-container` strane negovateljice za koren, pa tamo pokreni telo funkcije nad svakim `.gallery-frame` (umesto `root`), a tablu negovateljice (`.board`, skroluje se vodoravno) izuzmi iz `overflow`.

Očekivano: `cards` → `24px/16px`; `titles` → `doc-section-title 14px`, `section-title 12px`, `fam-row-title 12px` (14px samo za naslov kartice koja je sama stavka).

---

## 14. Zabranjeno — kratko

- druga klasa za karticu, kutija sa ivicom ili senkom u kartici, radius van skale;
- narandžasta kartica sa sadržajem direktno na narandžastom (sadržaj ide u belu karticu u `Attention`);
- uvučen citat u kurzivu; tekst kao dugme-link umesto `Button`;
- velika slova van onboardinga;
- duga crta (—) u tekstu interfejsa: piše se kratka (-), a prazna vrednost je takođe „-". Raspon ostaje sa – (`16–20 €/h`, `09:00–12:00`);
- `onClick` na div kartice umesto `.card-link`;
- sakrivena akcija na telefonu koje nema u detaljima;
- `primary` za gašenje ili otkazivanje, ili boja dugmeta po stanju;
- svoje `<input>` ili native `<select>` umesto `TextField`;
- hex boje u komponentama, razmak koji nije deljiv sa 4;
- pretraga ili jedno polje u kartici;
- ikonica u dugmetu sa tekstom u Podešavanjima; dodavanje ili uklanjanje ikonica van Podešavanja dok §11 ne dobije odluku.
