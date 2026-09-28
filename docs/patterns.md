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
| Najmanji tekst | 12px za sve što se čita; 11px samo u znački (`.status-pill`) i u meta liniji (`.cg-meta`) |

**Koncentrični uglovi, primeri koji važe u kodu:**
- kartica r24, padding 16 → ono što je unutra i dodiruje ugao ima r8 (24 = 8 + 16);
- red u kartici je uvučen 8 → red ima r16 (24 = 16 + 8); dugme u redu, sa 8 paddinga reda → r8 (16 = 8 + 8).

**Izuzeci:** avatari i ikonice do 36px i čipovi do 28px visine ne moraju da budu koncentrični.

Ako neki raspored ne može da ispoštuje pravilo nijednim radiusom sa skale, raspored je pogrešan. Ukloni jedan nivo (vidi §6); ne izmišljaj radius.

---

## 2. Tipografija — šta je koje veličine

| Uloga | Klasa | Veličina / visina reda | Težina | Boja |
|---|---|---|---|---|
| Naslov stranice | `.view-title` | 16 / 24 | medium | primary |
| Podnaslov stranice | `.view-sub` | 12 / 18 | normal | secondary |
| Naslov grupe | `.section-title` | 12 / 16 | medium | secondary |
| Naslov kartice | `.doc-section-title` | 14 / 20 | medium | primary |
| Naslov reda u kartici | `.fam-row-title`, `.cg-name` | 12 / 16 | medium | primary |
| Tekst kartice | `.tip-body`, `.doc-p`, `.fam-sub`, `.rec-why` (isti stil) | 12 / 18 | normal | secondary |
| Oznaka u kartici | `.card-label` | 12 / 16 | medium | secondary |
| Napomena ispod polja ili kontrole | `.ag-hint`, `.tf-hint` | 12 / 16 | normal | secondary |

Za novi tekst kartice koristi `.tip-body`. Ne uvodi petu klasu istog izgleda.

Hijerarhija se ne preskače: naslov grupe je tiši od naslova kartice, a naslov reda je korak ispod naslova kartice. Kad je stavka sama kartica na stranici (negovateljica na „Pronađi", upit), naslov joj je 14px.

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
- `.back-link` je iznad naslova (12px, strelica). Nema drugog stila za „nazad".
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

- Ikonice u naslovu kartice: vidi §11 (odluka je na čekanju).
- Footer (`.panel-card-actions`) je uvek poslednji, dole levo, a dugmad su prirodne širine. Na telefonu dugmad dele širinu kartice (CSS to radi sam).
- `.panel-card-actions.is-end` (desno) je samo za dijaloge i drawer-e.

**Istaknuta kartica:** `.panel-card.is-attention` — narandžasta podloga, ivica od 1px, bez senke. Samo za tri stvari: ono što čeka na porodicu, Jovanino pismo i izmenu plana. Ne pravi drugu „istaknutu" varijantu.

**Grupa kartica** se koristi samo kad stranica ima više od jedne grupe:

```jsx
<section className="section">
  <h2 className="section-title">Plaćanje</h2>
  <div className="panel-card">…</div>
  <div className="panel-card">…</div>
</section>
```

**Prazna stranica:** `.empty` sa `.locked-title`, `.locked-note` i jednom akcijom.

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
- **Kartica koja ne predstavlja ništa što se otvara** (podešavanje, informacija, kontakt) nije klikabilna. Akcije su joj u footeru i vide se i na telefonu.
- **Dugme desno** ide samo u redu čiji sadržaj staje u dve linije. U kartici sa više teksta dugme ide u footer.

---

## 8. Podaci (oznaka — vrednost)

Vrsta vrednosti određuje raspored:

| Vrednost | Raspored | Klase | Primeri |
|---|---|---|---|
| Kratka (iznos, datum, stanje, broj) | oznaka levo, vrednost desno | `.bc-lines` › `.bc-line` › `.bc-line-label` + `.bc-line-value` | obračun posete, stanje kolačića, uslovi |
| Slobodan tekst (ime, adresa, odgovor) | oznaka iznad vrednosti, redovi razdvojeni linijom | `.facts.is-stacked` › `.fact` › `.fact-label` + `.fact-value` | profil, arhivirani plan |

- Oznaka je u oba slučaja 12px secondary, a vrednost primary.
- Slobodan tekst se prelama i nikad se ne seče tri tačke.
- **Jedini izuzetak je cenovnik partnera** (`.rec-prices`): naziv levo, redovna i Jovanina cena u koloni desno.

---

## 9. Dugmad

| Akcija | Varijanta |
|---|---|
| Dodaje ili menja (pretplati se, dodaj karticu, promeni lozinku, uključi, pošalji) | `primary` |
| Gasi ili otkazuje (otkaži pretplatu, isključi 2FA) — uvek prvo traži potvrdu | `secondary` |
| Briše nepovratno (obriši nalog) | `danger` |
| Sporedna akcija pored glavne u dijalogu („Otkaži", „Nazad") | `secondary` |

- **Varijanta zavisi od vrste akcije, ne od stanja.** Isto dugme ne menja boju kad se nešto podesi.
- **U dijalogu i drawer-u** akcije su dole desno (`.panel-card-actions.is-end`): prvo secondary, pa glavna.
- **Na ekranu na dodir** (`pointer: coarse`) sva dugmad, polja, redovi i čipovi imaju najmanje 44px. Tokeni `--button-size` i `--input-size` to rade sami, pa ne zadaji fiksnu visinu manju od 44 bez `(pointer: coarse)` pravila.
- Ikonice u dugmadima: vidi §11.

---

## 10. Stanje i polja

- **Stanje** se kaže samo značkom `.status-pill` sa jednim od modifikatora: `is-accepted` (zeleno, gotovo), `is-pending` (čeka), `is-declined` (ne), `is-muted` (neutralno), `is-attention` (narandžasto: poklapanje, izmenjeno).
- **Poklapanje** se svuda piše „Poklapanje · 97%", kao značka `is-attention`.
- **Polja** su samo iz `src/components/TextField.jsx`: `Field`, `Input` (opciono `icon`, `suffix`), `Password`, `TextArea`, `Select`. Nijedna forma nema svoje `<input>` ni native `<select>`.
- **Na dodir** su sva polja 16px (inače iOS zumira stranicu). To je već globalno pravilo; ne obaraj ga.

---

## 11. Ikonice — ODLUKA NA ČEKANJU

Za sada ikonice nemaju pravilo, i zato su nedosledne:
- u Podešavanjima neka dugmad imaju ikonicu („Dodaj karticu", „Uključi", „Obriši nalog"), a neka nemaju („Pretplatite se", „Promenite lozinku");
- „Pošalji poruku" ima ikonicu u planu, a na „Pronađi" nema;
- ikonice u naslovima kartica u Podešavanjima kolega je dodao 28. 9. (`0f734cd`), a sweep obrazaca ih je istog dana uklonio.

**Dok se ne odluči: ne dodaj i ne uklanjaj ikonice ni u naslovima ni u dugmadima.** Kad odluka padne, ovaj odeljak postaje pravilo.

Izuzetak koji već važi: dugme bez teksta (`iconOnly`) uvek ima ikonicu i `aria-label`.

---

## 12. Telefon

- **Prelomi:** ≤640px je telefon, ≤900px je uzak ekran (meni postaje fioka).
- **Paneli sa strane** (asistent, plan) su na uskom ekranu preko celog ekrana, bez radiusa.
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
- dodavanje ili uklanjanje ikonica dok §11 ne dobije odluku.
