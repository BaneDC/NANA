# Obrasci interfejsa — specifikacija

Ovo je jedini izvor istine za to kako se slaže interfejs NANA Prime (porodica i negovateljica). Važi za ljude i za agente.

**Pre svake izmene interfejsa:**
1. Pronađi obrazac u ovom dokumentu i upotrebi njegove klase i komponente, tačno kako su opisane.
2. Ako obrasca nema, prvo ga dodaj ovde (šta je, kada se koristi, mere, markup), pa ga tek onda koristi u kodu.
3. Ne uvodi novu klasu za nešto što ovde već postoji, ni kad izgleda „skoro isto".
4. Posle izmene pokreni proveru iz §13. Rezultat mora biti nula prekršaja.

Onboarding (`src/screens/Immersive*.jsx`, klase `imm-*`) ima svoj vizuelni jezik i ova pravila ga ne menjaju. Ne diraj ga ako zadatak nije izričito o onboardingu.

Onboarding na telefonu (odlučeno 6. 10.):
- dugme za istoriju razgovora je kvadrat (32, na dodir 44);
- istorija razgovora je isti stakleni panel kao na desktopu (podloga, ivica, senka, radius 24), a ponaša se kao bottom sheet: dolazi odozdo, visok je 98% ekrana i prevlačenjem nadole se zatvara; iza njega se ništa ne zatamnjuje. Glava je kao u svakom sheet-u na telefonu: 24 od vrha (ručica je na 8), 16 sa strane, naslov (14 medium, normalnim slovima) na sredini dugmeta za zatvaranje, a dugme je isto kao u ostalim prozorima (`paneCloseClass`, 28, na dodir 44), i na desktopu;
- pitanje i podnaslov ispod njega su 8 jedno od drugog;
- poslednji red prvog ekrana („Ako je hitno…") je najmanje 16 od dna (`padding-bottom` na `.imm-urgent`; odlučeno 8. 10.);
- velika dugmad („Dalje", „Pošalji", „Pogledaj ceo plan") imaju radius kartica, 16;
- „Pošalji" na prvom ekranu je široko koliko polje iznad njega;
- carousel sa fotografijama na registraciji i prijavi se na užem ekranu srazmerno smanji (sve četiri slike i visina), da se vidi ceo kao na desktopu;
- na pregledu plana prvo se ispiše Minnina rečenica, pa se ostalo pojavljuje redom odozgo nadole.

---

## 0. Komponente: shadcn i Tailwind

Interfejs je napravljen od **shadcn/ui** komponenti (`src/components/ui/`), prilagođenih ovim pravilima, a raspored je u **Tailwind** klasama. Developeri aplikaciju prave u Next.js-u sa shadcn-om, pa stranicu mogu da prenesu kakva jeste. Imena varijanti su shadcn-ova, a izgled je ovaj iz dokumenta.

- Komponente u `src/components/ui/` se menjaju direktno, kako shadcn i preporučuje. **Ne pokreći `shadcn add … --overwrite`** na postojećoj komponenti: to vraća izvorni izgled. Nova komponenta se dodaje bez `--overwrite`, pa se prilagodi ovom dokumentu.
- Vrednosti dolaze iz `src/styles/tokens.css`, kao Tailwind klase (`src/styles/index.css`): `text-xs` (12, na dodir 14), `text-sm` (14 / 16), `text-base` (16 / 20), `text-small` (sitan tekst, 12, ne raste), `text-badge` (11), `leading-body` (red paragrafa), `bg-muted`, `text-muted-foreground`, `bg-primary-50` … `text-primary-700`, `bg-success-muted text-success` (i `warning`, `destructive`), `shadow-card`. Ništa se ne kuca ručno.
- Prelomi: `phone:` (≤640) i `narrow:` (≤900), kao u §12. `pointer-coarse:` je dodir.
- Nova stranica ili komponenta: samo shadcn komponente i Tailwind klase, bez novih klasa u CSS fajlovima. `app.css` više ne postoji: globalna pravila su u `src/styles/base.css`, onboarding u `src/styles/onboarding.css`, a ono čime oblačimo chat kit u `src/styles/chat-kit.css`.
- Pre pravljenja nečeg svog, proveri shadcn katalog (Field, InputGroup, InputOTP, Collapsible, Item…; `Empty` ne, prazna stranica je §5).

| Šta | Komponenta | Bilo je |
|---|---|---|
| Stranica, glava, grupa | `Page`, `PageHeader`, `PageHeaderText`, `PageTitle`, `PageDescription`, `PageActions`, `PageSection` (`src/components/page.jsx`) | `.view`, `.view-head`, `.section` |
| Kartica | `Card`, `CardHeader`, `CardTitle`, `CardAction`, `CardDescription`, `CardFooter` | `.panel-card`, `.panel-card-head`, `.doc-section-title`, `.tip-body`, `.panel-card-actions` |
| Značka i oznaka | `Badge` (`success`, `warning`, `destructive`, `secondary`, `default`; `tag`) | `.status-pill`, `.cg-tag` |
| Dugme | `Button` iz `@/components/ui/button` (`default`, `secondary`, `ghost`, `destructive`; `size`: `default`, `lg`, `icon`) | `Button` iz `src/components/Button.jsx`, `.btn` |
| Čipovi za izbor | `ToggleGroup` + `ToggleGroupItem` (ili `Toggle`) | `.svc` |
| Tabovi (dva prikaza iste stvari) | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` (`@/components/ui/tabs`) | — |
| Prekidač | `Switch` | `.switch`, `.toggle-row` |
| Modal | `Dialog` (`src/components/Dialog.jsx`) sa `DialogDescription` i `DialogFooter` | `.modal.is-dialog`, `.doc-p`, `.panel-card-actions.is-end` |
| Drawer | `Modal` (`src/components/Modal.jsx`) sa `SheetFooter` | `.drawer`, `.drawer-body` |
| Bottom sheet na telefonu | `Drawer` (vaul), sam ga biraju `Dialog` i `Modal` | `useSheet` |
| Polja | `Field`, `Input`, `Password`, `TextArea`, `Select`, `DateInput` iz `src/components/TextField.jsx` (iznutra shadcn `Field`, `Input`, `InputGroup`, `Textarea`, `Select`, `Popover` + `Calendar`) | `.text-field`, `.tf-*` |
| Kod od šest cifara | `InputOTP` | `.tf-code` |
| Nešto što se rasklapa | `Collapsible` | — |
| Oznaka — vrednost | `DataList` › `DataRow` (`src/components/data-list.jsx`) | `.bc-lines` › `.bc-line` |
| Spisak sa kvačicama | `CheckList` (`src/components/data-list.jsx`) | `.paywall-list` |
| Oznaka iznad vrednosti | `Facts` › `Fact` (`src/components/data-list.jsx`) | `.facts.is-stacked` › `.fact` |
| Red u kartici | `ItemGroup` › `Item` (`ItemContent`, `ItemTitle`, `ItemDescription`) | `.fam-rows`, `.rec-providers`, `.contact-rows` › `.fam-row`, `.caregiver`, `.contact-row` |
| Ime koje otvara red ili karticu | `ItemLink` (red), `CardLink` (kartica) | `.card-link` |
| Dugme koje kaže isto što i link (nema ga na telefonu) | `ItemAction` | `.card-action` |
| Avatar sa inicijalima | `Avatar` + `AvatarFallback`, visina iz `--avatar` | `.cg-avatar` |
| Narandžasti deo | `Attention` (`AttentionHead`, `AttentionTitle`, `AttentionDescription`) | `.attention` |
| Prazna stranica | `Attention` sa belom `Card` (`CardDescription`, `CardFooter`), kao na Mojoj nezi (§5) | `.empty`, `.locked-title`, `.locked-note`; shadcn `Empty` (siva ploča) je uklonjen |
| Strane (Pronađi) | `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext` | `.pager`, `.pager-page` |
| Grupe oznaka | `Groups` › `Tags` / `Group` (`src/components/Tags.jsx`) | `.tag-rows` › `.tag-row` |
| Delovi drawer-a i modala | `PaneLabel`, `PaneHint`, `Callout`, `ReportRows` › `ReportRow`, `Concern`, `Total`, `Stats` › `Stat` (`src/components/pane.jsx`) | `.ag-label`, `.ag-hint`, `.fam-callout`, `.report-rows`, `.visit-concern`, `.bc-total`, `.fam-stats` |
| Stranica osobe (avatar uz ime) | `PagePerson` u `PageHeader` (`src/components/page.jsx`) | `.fam-person` |
| Deo modala (ime dela, pa sadržaj 8 ispod) | `Part`, `PartText` (`src/components/pane.jsx`) | lokalni `Part` u `MoveDialog` |
| Skala krhkosti (kartica) | `FrailtyScale` (`src/components/FrailtyScale.jsx`), ista u pregledu plana i u kartonu | — |
| Bočni meni | shadcn `Sidebar` (`@/components/ui/sidebar`), sklopljen u `src/components/AppNav.jsx`: `SidebarMenuButton` za red, `SidebarMenuAction` za strelicu „Planova nege", `SidebarMenuBadge` za broj, `SidebarMenuSub` za spisak koji se sklapa (`Collapsible`). Na uskom ekranu (≤900) je fioka sleva, a otvara je `SidebarTrigger`. | `.app-nav`, `.nav-item`, `.nav-sub`, `.nav-badge` |
| Saglasnost (registracija) | `Checkbox` | `.reg-check`, `.reg-box` |

---

## 1. Temelji

| Pravilo | Vrednost |
|---|---|
| Mreža | svaki razmak je deljiv sa 4 |
| Radiusi | samo 4 / 8 / 16 / 24 / 32 (`--radius-sm/lg/2xl/3xl/4xl`) |
| Koncentrični uglovi | **spoljni radius = unutrašnji radius + padding između njih** |
| Boje | samo tokeni iz `src/styles/tokens.css`, bez hex vrednosti u komponentama |
| Jedna podloga, jedna boja teksta | na istoj podlozi tekst iste uloge ima istu boju; na narandžastoj podlozi tekst je u boji te podloge (`--color-primary-700`) |
| Čipovi i značke | nikad pun krug (999px): čip (`ToggleGroupItem`, 32–44px) r8, značka i oznaka (`Badge`, 20px) r4 |
| Velika slova | nikad, ni u onboardingu (`text-transform: uppercase` je zabranjen svuda; odlučeno 8. 10.) |
| Najmanji tekst | 12px za sve što se čita; 11px samo u znački (`Badge`) i u meta liniji (`text-[11px]`, ocena i mesto negovateljice) |

**Koncentrični uglovi, primeri koji važe u kodu:**
- kartica r24, padding 16 → ono što je unutra i dodiruje ugao ima r8 (24 = 8 + 16);
- red u kartici je uvučen 8 → red ima r16 (24 = 16 + 8); dugme u redu, sa 8 paddinga reda → r8 (16 = 8 + 8).

**Izuzeci:** avatari i ikonice do 36px i čipovi do 28px visine ne moraju da budu koncentrični. Avatar veći od 36 (na dodir je većina) mora.

Ako neki raspored ne može da ispoštuje pravilo nijednim radiusom sa skale, raspored je pogrešan. Ukloni jedan nivo (vidi §6); ne izmišljaj radius.

---

## 2. Tipografija — šta je koje veličine

Dve skale: sa mišem i na dodir (`pointer: coarse`). Na dodir je sve osim sitnog teksta jedan korak veće. Polja moraju biti 16px (inače iOS zumira), pa je osnovni tekst 14, da polje bude samo jedan korak iznad. Skala je u tokenima (`tokens.css`); klase je ne biraju same.

| Uloga | Klasa | Miš | Dodir | Težina | Boja |
|---|---|---|---|---|---|
| Naslov stranice | `PageTitle` (`text-base`) | 16 / 24 | 20 / 28 | medium | primary |
| Naslov kartice | `CardTitle` (`text-sm`) | 14 / 20 | 16 / 24 | medium | primary |
| Polje, chat | `TextField`, composer | 12 / 16 (chat 14 / 20) | 16 / 24 | normal | primary |
| Naslov reda u kartici | `ItemTitle` (`text-xs font-medium`) | 12 / 16 | 14 / 20 | medium | primary |
| Tekst kartice, podnaslov stranice | `CardDescription`, `DialogDescription`, `PageDescription`, `ItemDescription` (`text-xs leading-body`) | 12 / 18 | 14 / 20 | normal | secondary |
| Dugme | `Button` | 12 | 14 | normal (odlučeno 5. 10.) | — |
| Sitan tekst: naslov grupe, oznaka, napomena, meta, eyebrow | `text-small`: naslov u `PageSection`, `FieldLabel`, `FieldDescription`, `DialogEyebrow`, `PaneLabel`, `PaneHint`, oznaka u `Fact`, `Group` | 12 / 16 | 12 / 16 | medium ili normal | secondary |
| Značka | `Badge` (`text-badge`) | 11 | 11 | medium | po stanju |

**Tokeni:**
- `--text-xs-*` (tekst), `--text-sm-*` (naslovi kartica) i `--text-base-*` (naslov stranice) rastu na dodir.
- `--text-small-*` je sitan tekst i ne raste.
- `--text-body-leading` je visina reda paragrafa: 18, a na dodir 20.
- Novi sitan tekst uvek ide na `--text-small-*`, a nikad na `--text-xs-*`.

**Onboarding** (`.immersive`) zaključava tokene na skali sa mišem, jer ima svoj vizuelni jezik.

Za novi tekst kartice koristi `CardDescription` (u prozoru `DialogDescription`). Ne uvodi novu klasu istog izgleda.

**Rečenica u redu** (linija ispod posete, napomena na dnu stranice) je tekst kartice: 12 / 14 na dodir. Kratka oznaka pored broja („rezervisano", „Plaćenih poseta") je sitan tekst, 12. Ništa od toga nije 11.

Hijerarhija se ne preskače: naslov grupe je tiši od naslova kartice, a naslov reda je korak ispod naslova kartice. Kad je stavka sama kartica na stranici (negovateljica na „Pronađi", upit), naslov joj je veličine naslova kartice.

---

## 3. Razmaci

| Odnos | Razmak |
|---|---|
| Između elemenata stranice (`Page`), tj. kartica jedne ispod druge | 12 (odlučeno 2. 10.; 16 je bilo previše) |
| Između kartica u listi ili grupi (`PageSection`, lista kartica) | 12 (bilo je 8) |
| Od naslova grupe do prve kartice | 12 (gap grupe) |
| Između grupa | 32 (`PageSection` + `PageSection`: gap 12 + 20) |
| Od ivice panela do sadržaja stranice | 24 sa svih strana (`Page`; na telefonu 16) |
| Unutar kartice, između delova | 8 (gap kartice) |
| Od glave sa avatarom do sadržaja ispod nje preko cele širine (kartica na tabli, poruka negovateljici, profil) | 20 (gap 8 + 12) |
| Unutar grupe sadržaja (npr. ime i ocena) | 4 |
| Između grupa sadržaja u kartici | 12 |
| Od sadržaja do footera kartice | 16 |

---

## 4. Stranica

```jsx
<Page>
  <BackButton label="Moja nega" onClick={onBack} />   {/* samo ako postoji nazad */}
  <PageHeader>
    <PageHeaderText>
      <PageTitle>Naslov</PageTitle>
      <PageDescription>Jedna rečenica šta je ovde.</PageDescription>
    </PageHeaderText>
    <PageActions>{/* akcije stranice, desno */}</PageActions>
  </PageHeader>
  …
</Page>
```

Sve je u `src/components/page.jsx`. Stranica se skroluje, najviše je 720 široka, a delovi su 12 jedan od drugog.

- **Stranica ne klizi u stranu kad naraste** (odlučeno 9. 10.): mesto za skrolbar je uvek čuvano, sa obe strane (`scrollbar-gutter: stable both-edges` na `Page`), pa kad sadržaj pređe visinu ekrana (drugi tab, „Prikaži još") ništa se ne pomera, a stubac ostaje u sredini.

- Akcije stranice su samo u `PageHeader`, desno. **Između teksta glave i dugmeta je 32**, da dugačak podnaslov ne dolazi do dugmeta. Stranica ima 24 gore kao i sa strane, pa dugme stoji podjednako daleko od vrha i od ivice panela, u njegovom uglu.
- **„Pitaj asistenta" je samo na Mojoj nezi, na jednom planu nege i na medicinskom kartonu** (odlučeno 8. 10.; karton dodat 10. 10.). Podešavanja, Profil, Planovi nege, Pronađi negovateljicu i ostale stranice ga nemaju.
- **„Pitaj asistenta" na uskom ekranu (≤900px)** stoji u gornjoj traci, pored logoa i dugmeta za meni, uvek na istom mestu. Iz glave stranice se tada sklanja (`AskAssistant` to radi sam, kad je u `PageHeader`). U Razgovoru ga nema, jer je chat već asistent.
- **Dugačak tekst ne ide u isti red sa dugmetom.** Ako pored dugmeta nema mesta za tekst u jednom redu, dugme ide na drugo mesto (u traku, u footer), a ne gura tekst u uzak stubac.
- **Ikonica-dugme u glavi stranice** (`secondary`, `size="icon"`, u `PageActions`: „Pošalji plan", „Pregled", „Šta se desilo") je visoka koliko dugme sa tekstom pored nje (32, na dodir 44), a ne koliko čip (28).
- **„Nazad" je `BackButton`** (`src/components/BackButton.jsx`): naše `ghost` dugme sa strelicom, uvek prvo na stranici, pre `PageHeader`. **16 iznad i 16 ispod** (stranica tada ima 16 gore umesto 24; ispod je gap stranice 12 i 4 dugmeta). Strelica je na levoj ivici stranice, a padding dugmeta izlazi u marginu. Nema drugog stila za „nazad" (stari „nazad" link je uklonjen).
- **Bočni meni:** „Novi razgovor" je dugme (`secondary`, cela širina, sa „+") i jedino on započinje razgovor. Ispod njega je **„Istorija razgovora"** (odlučeno 2. 10.; ranije „Razgovor"): ceo red samo otvara i zatvara spisak ranijih razgovora i ne vodi nigde, a strelica je na kraju reda. Po defaultu je zatvoren. Prazan spisak kaže „Još nema razgovora.". „Moji upiti" je svoja stavka, sa brojem upita koji čekaju odgovor.
- **Stranica iz bočnog menija nema „nazad".** „Nazad" imaju samo stranice koje se otvaraju iz druge stranice (njena stranica, sve posete, plan).
- **Akcija koja je u bočnom meniju ne ponavlja se u glavi stranice** („Pronađi negovateljicu" nije u Mojoj nezi ni u Mojim upitima). Izuzetak je prazna stranica ili kartica „Sledeći korak", gde je to jedini sledeći korak.
- **Moja nega pre prve saradnje (odlučeno 5. 10.):** Moja nega nema karticu „Moji upiti"; upiti su samo na stranici „Moji upiti". Dok nije poslat nijedan upit, narandžasti deo „Sledeći korak" ima samo „Pronađi negovateljicu". Čim je poslat prvi upit, a još niko ne dolazi, isti deo kaže gde su stvari („Čeka se odgovor": ko još nije odgovorio; „Stigli su odgovori": svi su odbili) i ima samo „Pogledaj upite", koji vodi na „Moji upiti"; „Pronađi negovateljicu" se tu više ne nudi (ostaje u meniju). Kad neko dolazi, stranica je o njoj i o upitima ne govori.
- **Stranica osobe** (avatar pored imena, `PagePerson`): avatar je poravnat po vrhu sa imenom. Na telefonu avatar i ime zauzimaju ceo red, a akcija stranice (npr. telefon) je ispod njih, 12px niže.
- Na telefonu (≤640px) su naslov i akcije u istom redu, a podnaslov je ispod njih celom širinom. To rešava `PageHeader`; ne menjaj markup.
- Pretraga i filteri stoje direktno na stranici (`<Field><Input icon={Search} … /></Field>`), nikad u kartici. „Pronađi negovateljicu" za sada nema pretragu (odlučeno 2. 10.): lista je poređana po poklapanju sa planom, sa stranama po 10.
- **Broj u bočnom meniju** kaže samo da nešto stiglo i čeka porodicu: „Moja nega" broji ono što čeka na nju (novi uslovi ili ugovor, radni nalog, dodatni sati; `waitingOnYou`), a „Moji upiti" odgovore koje još nije videla (prihvatila ili odbila; `unseenAnswers`). Poslat upit se ne broji. Otvaranjem „Mojih upita" odgovori su viđeni.

---

## 5. Kartica i grupa kartica

**Postoji jedna kartica:** `Card` — bela, r24, padding 16, gap 8, senka `shadow-card`. Nema druge kartice. Ako treba nešto posebno, dodaju se Tailwind klase na `Card`.

```jsx
<Card>
  <CardHeader>
    <CardTitle>Naslov kartice</CardTitle>
    <CardAction>                                          {/* opciono, desno */}
      <Badge variant="secondary">Stanje</Badge>
      {/* ili ikonica-dugme: <Button variant="secondary" size="icon" aria-label="Izmeni">…</Button> */}
    </CardAction>
  </CardHeader>
  <CardDescription>Šta ova kartica kaže.</CardDescription>
  <CardFooter>                                            {/* footer, dole levo */}
    <Button>Akcija</Button>
  </CardFooter>
</Card>
```

- Ikonice u naslovu kartice: vidi §11.
- **Glava kartice na telefonu:** naslov zauzima red koji mu treba i ne lomi se pored duge značke ili dugmeta. Kad ne staju zajedno, značka ili dugme idu ispod naslova, levo, 8 niže; kad staju, ostaju desno.
- Footer (`CardFooter`) je uvek poslednji, dole levo, 16 ispod sadržaja, a dugmad su prirodne širine. Na telefonu dugmad dele širinu kartice (`CardFooter` to radi sam).
- Red dugmadi desno je samo u dijalozima i drawer-ima (`DialogFooter`, `SheetFooter`).

**Narandžasti deo (odlučeno 1. 10.):** `Attention` (`src/components/Attention.jsx`). Narandžasto je podloga oko belih kartica, a ne kartica: naslov (i rečenica) stoje na narandžastom, u njegovoj boji (`--color-primary-700`), a sve što deo drži su obične bele `Card` sa senkom.

```jsx
<Attention title="Čeka na vas" sub="Jedna rečenica šta je ovde.">
  <Card>…<CardLink>…</CardLink>…</Card>   {/* stavka koja nešto otvara */}
  <Card>…</Card>                           {/* tekst i dugme */}
</Attention>
```

- Mere: r32, padding 8, ivica od 1px nacrtana unutra (ne uzima od 8), 8 između kartica. Kartica unutra je r24 (32 = 24 + 8). Naslov je 16 od vrha i 24 od leve ivice, tamo gde je tekst kartica, i 12 iznad prve kartice. Rečenica ispod naslova je 8 ispod njega, kao ispod svakog naslova (odlučeno 6. 10.; bilo je 4).
- Stavka koja nešto otvara je `Card` u redu (avatar levo): naslov kartice kao `CardLink` (14), tekst, dugme desno. **U „Čeka na vas" dugme ostaje i na telefonu** (odlučeno 6. 10.): narandžasti deo je inače informativan, pa dugme kaže šta treba uraditi („Pogledaj uslove", „Pogledaj radni nalog"). Na telefonu je ispod sadržaja, u koloni teksta i široko koliko ona, 16 ispod, kao kod kartice upita.
- Glava može biti i nešto drugo (`head`): Minnino pismo ima avatar i „Sakrij poruku", izmena plana ikonicu.
- **Prazna stranica je isto ovo** (odlučeno 6. 10.): svaka prazna stranica izgleda kao „Sledeći korak" na Mojoj nezi. Naslov kaže šta nedostaje („Još niste poslali nijedan upit", „Nema aktivnog plana", „Ovde još nema ničega"), a bela kartica ispod rečenicu šta da se uradi i jedno dugme levo u `CardFooter`. Prazno bez akcije je ista stvar bez dugmeta (kao „Ništa ne čeka"). Siva ploča `Empty` je uklonjena iz projekta (6. 10.) i ne vraća se.
- Samo za: ono što čeka na porodicu („Čeka na vas"), obaveštenje gde su stvari (sledeći korak na njenoj stranici **uvek, i kad nema dugmeta** — „Ništa ne čeka", „Prihvatila je", „Uslovi su odbijeni"…; „Ništa ne čeka" na Mojoj nezi; „Čeka se odgovor" i „Stigli su odgovori"), „Sledeći korak" pre prvog upita, „Upoznavanje nije završeno", Minnino pismo i izmenu plana. Obaveštenje bez dugmeta je i dalje narandžasti deo sa belom karticom, a ne bela kartica sama. Nema druge narandžaste kartice.

**Grupa kartica** se koristi samo kad stranica ima više od jedne grupe:

```jsx
<PageSection title="Plaćanje">
  <Card>…</Card>
  <Card>…</Card>
</PageSection>
```

**Prazna stranica:** `Attention` sa naslovom šta nedostaje i belom karticom (rečenica i jedno dugme), kao „Sledeći korak" na Mojoj nezi (§5).

**Izbor plana** (`PaywallModal`, `Dialog` širok 880, sa jednim planom 480):
- Svaki plan je `Card` sa svim sadržajem: naziv, cena (24px), ušteda kao značka, rečenica za koga je, spisak šta uključuje i dugme „Izaberite" + naziv plana („Izaberite Premium"). Naslov dijaloga je „Izaberite pretplatu", a dugme koje ga otvara iz plana nege „Otključajte ceo plan nege": u naslovima i dugmadima „plan" znači samo plan nege, da se dva značenja ne sretnu na istom putu.
- Kartice su jedna pored druge (mreža, najmanje 280 po kartici), a na telefonu jedna ispod druge, sa preporučenom prvom.
- Preporučeni plan (`recommended` u `src/data/plans.js`) ima prsten u primarnoj boji, značku „Najpopularniji" i primary dugme; ostali imaju secondary.
- Ovo je jedini obrazac gde je dugme u footeru kartice preko cele širine i spušteno na dno kartice, da se dugmad poravnaju kad su spiskovi različite dužine.
- Ceo tekst planova je u `src/data/plans.js`, a ne u komponenti.

---

## 6. Red unutar kartice

Stavka unutar kartice (negovateljica u preporuci, poseta, upit, kanal kontakta) je **red**, a ne kutija sa ivicom i ne kartica u kartici.

Red je `Item` u `ItemGroup` (`src/components/ui/item.jsx`). Mere (sve radi `Item` sam):
- red zalazi 8px u padding kartice: `margin: 0 -8px`;
- padding reda je 8 sa svih strana, pa je podloga na hover-u isto daleko od teksta gore, dole i sa strane (odlučeno 1. 10.; bilo je 16 gore i dole a 8 sa strane);
- između redova je 16, a linija od 1px je na sredini tog razmaka, uvučena 8 da bude poravnata sa tekstom; tekst je tako 16 od linije (odlučeno 5. 10.; bilo je 8 između redova, 12 od linije);
- radius reda je 16 (vidi se samo na hover-u);
- na hover (samo red koji se otvara): podloga `--surface-2`, linije iznad i ispod se sklanjaju, ime dobija `--color-primary-700`, a oznake (`Badge variant="tag"`) u njemu postanu bele, da ne nestanu u sivom.

```jsx
<ItemGroup>
  <Item className="items-start gap-3 [--avatar:…]">
    <Avatar><AvatarFallback>SV</AvatarFallback></Avatar>
    <ItemContent>
      <ItemTitle><ItemLink onClick={open}>Sanna Virtanen</ItemLink><Badge>…</Badge></ItemTitle>
      <ItemDescription>…</ItemDescription>
    </ItemContent>
    <ItemAction><Button>Pošalji poruku</Button></ItemAction>
  </Item>
</ItemGroup>
```

Red koji je sam link (kontakt koordinatorke) je `<Item asChild><a href=…>…</a></Item>`.

**Kartica sa avatarom (odlučeno 5. 10.):** sve što kartica kaže stoji u koloni teksta, ispod imena i reda ispod njega, a avatar je sam levo, kao u redovima na Mojoj nezi. Delovi su 12 jedan od drugog, a stanje je značka pored imena. Jedno dugme je **na desktopu gore desno**, u visini imena (16 od ivice, koncentrično sa uglom), a **na telefonu ispod sadržaja**, u koloni teksta i široko koliko ona, 16 ispod. Tako je kartica upita („Moji upiti"), po istoj logici kao kartica na „Pronađi".

**Kartica upita (odlučeno 5. 10.)** je cela klikabilna (ime je `CardLink`): kad saradnja postoji, otvara njenu stranicu, a inače njen profil. Nema dugme za otvaranje („Pogledaj saradnju" je uklonjeno). Jedino dugme je **„Pitaj ponovo"**, samo na odbijenom upitu kad sme ponovo da joj se piše (`canAsk`), jer šalje novi upit, a ne otvara nešto; zato ostaje i na telefonu. Izuzetak je kartica klijenta na tabli negovateljice: kolona je preuska, pa je sadržaj ispod glave preko cele širine, 20 od nje.

**Avatar uz ime (odlučeno 5. 10., svuda):** avatar je visok koliko naslov i prvi red ispod njega zajedno (red naslova + 8 + prvi red), poravnat po vrhu sa naslovom, 12 od teksta, radius 8 (r4 u kartici table negovateljice, koja je r16 sa 12 paddinga). Visinu daje `--avatar` na mestu gde avatar stoji, iz tokena za tekst, pa raste zajedno sa tekstom na dodir:

| Gde | Naslov + red ispod | Miš / dodir |
|---|---|---|
| Red u kartici (`Item`: Predstoji, poslednja poseta, Vaše negovateljice, Moji upiti, chat) | 12 i rečenica | 42 / 48 |
| Negovateljica u planu (`CaregiverRow`) | 12 i meta | 40 / 44 |
| Kartica na „Pronađi", glava detalja | 14 i meta | 44 / 48 |
| Kartica u „Čeka na vas", upit (Moji upiti) | 14 i rečenica | 46 / 52 |
| Njena stranica, klijent na strani negovateljice | naslov stranice i podnaslov | 42 / 48 |
| Minnino pismo; kartica na tabli; poruka negovateljici | ime i sitan red | 32 / 36; 36 / 40 |
| Ko je prijavljen (meni, traka negovateljice) | ime i e-mail | 30 / 34 |

**Naslov → red ispod je 8** (odlučeno 5. 10.; bilo je 4, pa je značka pored imena ležala na oceni ispod). Kolona teksta ima razmak 4, a naslov dobija još 4 svoje margine (`mb-1`), pa ostali delovi kolone ostaju gde su. U redu posete, gde kolona nema razmak, naslov ima `mb-2`.

Značka u naslovu reda (20) ne povećava red od 16, nego prelazi preko njega, pa naslov ostaje u visini avatara. Kad se naslov prelomi u dva reda, avatar ostaje poravnat sa vrhom. Novo mesto sa avatarom dobija svoj `--avatar` po ovom pravilu; avatar nema fiksnu veličinu.

**Poravnanje u redu (`Item`):** sve počinje od prve linije. Avatar je poravnat po vrhu sa naslovom, a ono desno (dugme, broj, strelica) počinje u istoj visini kao naslov. Ništa se ne centrira po visini reda, jer red sa oznakama ima tri i više linija.

**Stanje u redu** je kratka značka pored naslova (`Badge` u `ItemTitle`), a ne poseban red. Kod posete značka kaže samo korak („Plan posete", „Radni nalog stigao", „Plaćeno"), jer iznos desno već kaže šta je sa novcem, a linija ispod kaže ostalo. Iznos posete stoji u liniji ispod datuma kao oznaka (`Badge variant="tag"`): „54 € rezervisano" u „Predstoji", „54 € naplaćeno" u poslednjoj poseti. Oznaka je ista kao sve ostale oznake (bez ikonice), a ne značka.

Nova vrsta reda je `Item`. Ne piši joj posebnu ivicu, podlogu, senku ili radius.

**Kartica koja se završava redovima** ima 16 od teksta poslednjeg reda do donje ivice, kao 16 od vrha do naslova. Poslednji red ulazi 8 u padding kartice, pa je njegova podloga na hover-u 8 od dna kao i sa strane (24 = 16 + 8). Ako posle redova ide footer (npr. „Prikaži još"), on je 16 od teksta poslednjeg reda. CSS to radi sam.

**Zabranjeno:** kutija sa ivicom ili senkom unutar kartice. To je treći nivo uglova i ne može da ispoštuje §1.

---

## 7. Šta se klikne

**Kartica ili red koji predstavlja nešto sa svojim detaljima** (negovateljica, plan, poseta) ceo je klikabilan i otvara te detalje.

```jsx
<Card className="flex-row items-start gap-3 [--avatar:…]">     {/* ili red: <Item> u <ItemGroup> */}
  <Avatar><AvatarFallback>VM</AvatarFallback></Avatar>
  <div className="flex min-w-0 flex-1 flex-col gap-1">
    <p className="text-sm font-medium">
      <CardLink onClick={openDetails}>Vesna Mitrović</CardLink>      {/* u redu: <ItemLink> */}
    </p>
    …
  </div>
  <ItemAction>                                                   {/* dugme koje kaže isto što i link */}
    <Button onClick={act}>Pošalji poruku</Button>
  </ItemAction>
</Card>
```

- Ime je `ItemLink` u redu, a `CardLink` u kartici. Ime je pravo `<button>`: `::after` ga razvlači preko celog reda ili kartice, pa radi i tastatura i čitač ekrana. `Item` i `Card` same prepoznaju da imaju link (hover, fokus, kursor).
- Dugme i značka u takvom redu ili kartici stoje iznad linka i rade samo ono što kažu. Dugme koje kaže isto što i link je u `ItemAction` (na telefonu ga nema). Ne stavljaj `onClick` na div kartice.
- **Desktop:**
  - kartica ima akciju u footeru; **izuzetak je kartica negovateljice na „Pronađi"**: dugme („Pošalji poruku") ili stanje („Već dolazi", „Čeka odgovor") je gore desno, u visini imena;
  - red ima akciju desno;
  - hover: kartica se uokviri, a red posivi. Ništa se ne pojavljuje samo na hover-u: nema strelice ni ikonice koja izađe kad se pređe mišem (odlučeno 6. 10.; kartica plana je imala strelicu ↗).
- **Telefon (≤640px):**
  - `ItemAction` se ne prikazuje, a **nema ni strelice** (odlučeno 5. 10.): kartica ili red se otvara tapom. Izuzetak su kartice u „Čeka na vas" (§5), čije dugme ostaje;
  - tap otvara detalje, pa **detalji moraju imati istu akciju** (profil negovateljice ima „Pošalji poruku");
  - pre nego što sakriješ akciju, proveri da je ima u detaljima.
  - **izuzetak je kartica negovateljice na „Pronađi":** „Pošalji poruku" je posebna akcija od otvaranja detalja, pa na telefonu ostaje, ispod sadržaja kartice, poravnata sa tekstom i široka koliko on. Tap na karticu otvara profil kao i svaka kartica. Stanje („Već dolazi", „Čeka odgovor") stoji na istom mestu.
- **Grupa koja se sklapa** (npr. grupa kolačića): ceo njen gornji deo (naziv, stanje, opis) otvara i zatvara grupu. Naziv je dugme razvučeno preko tog dela (`::after`), u shadcn `Collapsible`. Prekidač stoji iznad i samo menja stanje. Spisak koji se otvori nije deo mete, pa se čitanjem ne zatvara.
### Drawer ili modal (odlučeno 30. 9.)

- **Drawer** (`Modal`, sa strane; shadcn `Sheet`) je za **detalje**: kad treba prikazati više o nečemu, a akcija nije jedino što je bitno. Ugovor o nezi, radni nalog, plan posete, profil negovateljice. Drawer može imati akciju koja završava pregled (npr. „Prihvati uslove", „Sve je u redu — plati sada").
- **Modal** (`Dialog`, `src/components/Dialog.jsx`, u sredini; shadcn `Dialog`) je za **akciju**: završi saradnju, pretplati se, uključi ili isključi nešto, promeni lozinku, dodaj karticu, podesi kolačiće, pošalji plan, otkaži posetu, prijavi da nešto nije u redu, odbij uslove, a na strani negovateljice pošalji ugovor, isplaniraj posetu i pošalji radni nalog. Izbor pretplate (`PaywallModal`) je takođe modal.
- `Dialog` ima isti ugovor kao `Modal` (`eyebrow`, `title`, `wide`, `dismissible`, `onClose`, `open`), pa ekran prelazi iz jednog u drugo promenom imena. Tekst u modalu je `DialogDescription`, a modal se završava redom akcija `DialogFooter`; drawer se završava sa `SheetFooter`.
- **Akcija iz drawer-a otvara modal preko drawer-a** („Otkaži posetu" iz plana posete, „Nešto nije u redu" iz radnog naloga, „Odbij" iz ugovora). Drawer ostaje ispod; Escape i „Nazad" zatvaraju samo modal. Kad modal vodi dalje („Pogledaj radni nalog" iz „Završiti saradnju?"), on se zatvara i otvara se drawer.
- Mere modala: 440 širok (`wide`: 560), padding 24, radius 24, delovi 12 jedan od drugog, red akcija 16 ispod sadržaja i zakačen za dno dok se dugačak sadržaj skroluje.
- **Glava modala je jedna grupa** (odlučeno 9. 10.): eyebrow iznad naslova, a X pored njih, na sredini ta dva reda, sa desnom ivicom na 24 (gde i dugmad u footeru). Rečenica o tome šta je ovo (`description` na `Dialog`) je deo glave: 4 ispod naslova, i ne ulazi u kolonu X-a (40 desno, na telefonu 48), pa se lomi pre nego što dođe ispod dugmeta. Na telefonu X postavlja sheet (§12). Glava po meri (`header`) zadržava X u uglu.
- **Modal sa više delova** (izbor, datum, posledice; npr. „Gde sada živi?"): glava, pa telo, pa footer, grupisani samo razmakom, bez linija. Telo je 24 ispod glave, delovi su 24 jedan od drugog, a svaki je ime dela (12, sivo, medium, kao naslov grupe na stranici) i, 8 ispod, ono što drži. Redovi u delu (npr. negovateljice) su 16 jedan od drugog, bez linija između. Footer je 24 ispod tela.
- **Izbor u modalu menja sadržaj na mestu.** Jedan izbor je izabran od početka (najčešći), a drugi izbor menja samo delove ispod njega: novi ulaze iz prozirnog (200 ms), a modal raste ili se skuplja do njih (`AutoHeight`, `src/components/AutoHeight.jsx`: 250 ms, `ease-out-strong`), umesto da skoči kao da se otvorio novi.
- Na telefonu su oba bottom sheet (§12).
- **Klik van drawer-a ili modala ga zatvara samo ako je i pritisak počeo van njega.** Kad se iz polja razvlači ili selektuje tekst pa se miš pusti van prozora, prozor ostaje otvoren. shadcn (Radix) to radi sam, jer zatvara na pritisak van prozora, a ne na klik. Novi prozor se pravi od `Dialog` ili `Modal`, pa to dobija sam.
- **Kad se prozor otvori, fokus je na prozoru** (ili na polju sa `autoFocus`), a ne na prvom dugmetu, da nijedno dugme ne izgleda kao da je izabrano tastaturom.
- **Otvara se i zatvara preko `open`**, kao svaki shadcn prozor: `<Dialog open={otvoren} onClose={…}>`. Prozor ostaje u kodu i kad je zatvoren, pa shadcn odigra i animaciju zatvaranja. Kad prozor drži formu ili prikazuje nešto što se pri zatvaranju briše (koji je drawer otvoren), to se drži dok se ne zatvori `useKept` (`src/hooks/use-kept.js`): `{kept && <PasswordModal open={passwordOpen} …/>}`. Sledeće otvaranje kreće ispočetka. Ne uklanjaj prozor iz koda da bi ga zatvorio (`{x && <Dialog/>}`), jer onda nema animacije zatvaranja.
- **Animacije:** modal dolazi odozdo i malo uvećan, na opruzi (`ease-spring-dialog`, 490 ms); drawer dolazi 28 sa desna (`ease-spring-pane`, 430 ms), a odlazi kratkom krivom (160 ms). Pozadina se pojavljuje za 180 ms. Na telefonu je to shadcn `Drawer` sa svojom animacijom.

- **Kartica koja ne predstavlja ništa što se otvara** (podešavanje, informacija, kontakt) nije klikabilna. Akcije su joj u footeru i vide se i na telefonu.
- **Dugme desno** ide samo u redu čiji sadržaj staje u dve linije. U kartici sa više teksta dugme ide u footer.
- **Red koji nešto otvara** (`Item` sa `ItemLink`): naslov je `ItemLink`, dugme desno je u `ItemAction` i kaže isto; na telefonu ga nema, a red se otvara tapom. Tako su redovi u Mojoj nezi („Čeka na vas", „Predstoji", „Vaše negovateljice") i posete. Red ima jednu akciju; „Njena stranica" pored „Pogledaj plan posete" je bila druga, a njena stranica je jedan klik dalje preko reda „Vaše negovateljice".
- **Poseta** ima tri dela (datum i sati, izveštaj, rečenica šta je sa njom i dugme), 12 jedan od drugog, pa joj je dugme ispod rečenice, levo, kao footer kartice, a ne desno.
- **Izveštaj posete** (`VisitReport` u `src/components/family/FamilyDrawer.jsx`) je uvek isti, gde god se prikazuje na stranici: delovi sa imenom, 12 jedan od drugog: „Urađeno" (oznake, samo u poslednjoj poseti), „Kako je bila" (oznake „Raspoloženje: dobro", „Ishrana: kao i obično", „Kretanje: kao i obično", bez ikonice) i „Sanna je zapisala" (običan tekst). U radnom nalogu (drawer) „Kako je bila" su iste oznake.
- **„Sve posete" i „Svi upiti"** u glavi kartice su `Button` `secondary` (sa strelicom, kao i ranije), desno, a redovi ispod glave sa dugmetom počinju 8 niže (24 od dugmeta do teksta prvog reda). **„Prikaži još"** je `Button` `secondary` u footeru, levo. Nema dugmeta-linka ni dugmeta koje je samo tekst.
- **Red koji otvara njenu stranicu i nema dugme** (Vaše negovateljice) ima strelicu desno, samo na širem ekranu (`phone:hidden`). Broj pored nje se na telefonu ne prikazuje.
- **Posete na njenoj stranici:** prvih 10, pa „Prikaži još" dodaje po 10 na istom mestu (§8a; drawer „Sve posete" je uklonjen 6. 10.). Redosled je `herVisits`: prvo ono što je u toku, pa izmireno.
- **„Šta se desilo"** (odlučeno 3. 10., izmenjeno 5. 10.): sve što se desilo sa negom, najnovije prvo (`care.log`, upisuju ga `familyCare` i `sim`). Otvara se **ikonicom u glavi stranice** (`History`, `secondary iconOnly`, `aria-label` i `title` „Šta se desilo"): samo na njenoj stranici, pored broja telefona, i samo za nju, kao u prototipu (ikonica sa Moje nege je uklonjena 5. 10.). Nema kartice na stranici. Drawer (`kind: 'activity'`) ima filtere (Sve, Upiti, Ugovor, Posete, Novac), ispod njih „N stavki · najnovije prvo", i stavke po danima, sa brojem stavki pored dana. Stavka je red bez akcije (`Item`): naslov, pa linija „ko · kada" (`vi`, njeno ime ili `koordinatorka`) i rečenica šta tačno. Naslov nikad ne menja njeno ime po padežu („Poslali ste upit", ne „Poslali ste upit Sanni").
- **Pregled negovateljice** (`kind: 'overview'`, izmenjeno 5. 10. po prototipu): ikonica u glavi njene stranice (`IdCard`, „Pregled"), između telefona i „Šta se desilo". Redom: dva broja (posete do sada, ispod koliko je zakazano; koliko traju zajedno, ispod od kada), „Kontakt" (telefon, e-mail, opština, jezici; telefon i e-mail se skrivaju kad se saradnja završi), „Dogovorena nega" (verzija koja važi, cena po satu, usluge po grupama, dodatni uslovi; **samo dok ugovor važi i ne čekaju novi uslovi**), „Kvalifikacije" (klasifikacije, obrazovanje), „O negovateljici", „Ocene", „Kako se plaća". Bez zbira plaćenog (vidi §8).
- **Sve verzije ugovora** (`kind: 'versions'`, „Sve verzije (N)" u footeru kartice „Ugovor o nezi", samo kad ih ima više od jedne): svaka verzija sa značkom stanja (važi, čeka vaš odgovor, zamenjena, odbijena, povučena, završena) i šta je promenila u odnosu na prethodnu.
- **Sledeći korak na njenoj stranici** pokriva i: prihvatila je a ugovor još nije stigao; uslovi su odbijeni ili povučeni (ništa ne važi); poseta je obavljena a radni nalog još nije stigao; dodatni sati čekaju odgovor; saradnja je završena (dugme „Ponovo sarađujte"); ponovni upit čeka, prihvaćen ili odbijen („Pitaj ponovo").
- **Ponovo pitati** (odlučeno 3. 10.): posle odbijenog upita („Pitaj ponovo" na kartici upita i u profilu) i posle završene saradnje („Ponovo sarađujte" na njenoj stranici i u profilu) porodica može ponovo da piše, istim prozorom za poruku. Ne obnavlja se stari ugovor: ona šalje nove uslove, a raniji period ostaje u „Ukratko" kao „Ranije". Na „Pronađi" kartica i dalje pokazuje samo značku („Dolazila ranije", „Odbila"); tap otvara profil, a profil ima „Njena stranica" i „Ponovo sarađujte" ili „Pitaj ponovo".
- **Stanje sa negovateljicom** (`standingWith` u `src/data/familyCare.js`, značka `Standing`, `src/components/Standing.jsx`) je ista značka svuda gde je ona: kartica na „Pronađi", red u preporuci plana, vrh njenog profila. „Već dolazi", „Ugovor čeka vas", „Dolazila ranije", „Upit poslat …", „Prihvatila", „Odbila". Stoji na mestu dugmeta „Pošalji poruku"; na telefonu ispod teksta reda, poravnata sa njim. U profilu je ispod cene, gore, a ne u footeru (footer tada nema dugmad).

---

## 8. Podaci (oznaka — vrednost)

Vrsta vrednosti određuje raspored:

| Vrednost | Raspored | Klase | Primeri |
|---|---|---|---|
| Kratka (iznos, datum, stanje, broj) | oznaka levo, vrednost desno | `DataList` › `DataRow` (`src/components/data-list.jsx`) | obračun posete, stanje kolačića, uslovi |
| Slobodan tekst (ime, adresa, odgovor) | oznaka iznad vrednosti, redovi razdvojeni linijom | `Facts` › `Fact` | profil |

- Oznaka je u oba slučaja 12px secondary, a vrednost primary.
- Slobodan tekst se prelama i nikad se ne seče tri tačke.
- **Ispod naslova kartice `Facts` počinje 20 niže** (odlučeno 9. 10.): 8 kartice i 12 više, pa je naslov jasno naslov kartice, a prvi red jedan od redova (između redova je 12, linija, 12). `Facts` to radi sam kad stoji odmah posle `CardHeader`: kartice u Profilu i „Vaši odgovori" u pregledu plana.
- **Jedini izuzetak je cenovnik partnera** (u `RecommendationCard`): naziv levo, redovna i Minnina cena u koloni desno.
- **Dva broja na vrhu pregleda** (`Stats` › `Stat`, `src/components/pane.jsx`): broj 24 / 32 medium kao cena na kartici plana, ispod oznaka i napomena, dva stupca, bez kutije oko njih. Za sada samo u pregledu negovateljice.
- **PDV u radnom nalogu** (odlučeno 6. 10.): cena koju porodica vidi već sadrži PDV (25,5%, finski), pa se ništa ne dodaje. Ispod ukupnog iznosa radnog naloga i ispod rezervisanog iznosa u planu posete stoji red „Od toga PDV (25,5%)" sa iznosom, kao na računu (`vatIn`, `vatText`). Cena po satu svuda gde se prikazuje ugovor (kartica „Ugovor o nezi", novi uslovi, pregled, sve verzije) kaže „18 € / h, PDV uključen" (`rateText`). Sve je u `src/data/familyCare.js`. Kod otkazane posete i iznosa 0 reda sa PDV-om nema.
- **Nikad zbir plaćenog** (odlučeno 5. 10.): porodici se ne prikazuje koliko je ukupno platila, ni do sada, ni po mesecu, ni po negovateljici. Iznos stoji samo uz pojedinačnu posetu (rezervisano, biće naplaćeno, naplaćeno) i uz ono što se sada dešava („Rezervisano za zakazane posete", „Naplaćuje se sada" u Podešavanjima). Broj poseta je u redu, zbir novca nije.

### Negovateljica: šta se o njoj prikazuje

U Finskoj zakon ograničava šta smemo da prikupimo o negovateljici, pa se prikazuje **samo ono što ona popunjava u formi na platformi**. Ništa se ne izmišlja preko toga.

| Podatak | Kartica („Pronađi") | Red (preporuka u planu, chat) | Profil (drawer) |
|---|---|---|---|
| Ocena i broj ocena, ili „Nova" | meta | meta | zaglavlje |

**Ocena** se svuda piše isto (`Rating`, `src/components/Rating.jsx`): broj, pa zvezdica, pa broj ocena: „4,9 ★ (64)". Ko još nema ocena je „Nova", bez zvezdice.

**Detalji negovateljice** (drawer profila, njen panel u chatu) imaju naslov „Informacije o negovateljici", a ispod njega glavu kao njena kartica na „Pronađi" (`CaregiverHead`, `src/components/CaregiverHead.jsx`): avatar, pa ime (14) i „Poklapanje" pored njega, a ispod ocena, cena, opština i radijus, pa stanje sa porodicom. Avatar je visok koliko ime i red ispod njega (§6), 44 sa mišem, 48 na dodir. Isto na kartici na „Pronađi"; ono što na telefonu stoji ispod teksta kartice (dugme, stanje) poravnato je sa imenom (`--cg-indent`). **Na telefonu** su „Poklapanje", ime i ocena svako u svom redu, tim redom: „Poklapanje" 4 iznad imena, ocena 8 ispod njega (pored avatara ime i značka nisu stajali u jedan red); avatar ostaje iste visine, poravnat sa prvim redom. Isto u glavi detalja.
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

## 8a. Duge liste (odlučeno 6. 10.)

Lista koja je duža od onoga što prvo pokazuje **ne otvara drawer niti drugu stranicu za ostatak**: ispod nje je „Prikaži još N" (`secondary`, dole levo), koje dodaje **sledećih 10 na istom mestu**, pa opet 10, dok ne stanu sve. Nema „Pogledaj sve" za ostatak liste. Spisak svake liste i šta je primenjeno je u `docs/paginacija.md`.

| Vrsta liste | Prvo pokazuje | Liste |
|---|---|---|
| **Lista na stranici, uz drugi sadržaj** | koliko staje u taj deo, pa „Prikaži još" po 10 | Predstoji (3), posete na njenoj stranici (10), istorija razgovora u meniju (5) |
| **Puna lista koja raste sa vremenom** | 10, najnovije prvo (po mesecu ili danu gde postoji), pa „Prikaži još" po 10 | Sve posete (stranica), Šta se desilo, posete i aktivnost klijenta na strani negovateljice |
| **Pretraga, poređenje** | numerisana paginacija (`Pagination`), 10 po strani | samo „Pronađi negovateljicu" |
| **Kratka lista po prirodi** | sve, bez ograničenja | Moji upiti, Planovi nege, verzije ugovora, Vaše negovateljice |

- Numerisana paginacija je samo za pretragu: tu se negovateljice porede, ide se napred-nazad i vraća na isto mesto. Kroz posete i događaje se ne ide „na stranu 4".
- „Prikaži još" kaže koliko dodaje („Prikaži još 10", na kraju „Prikaži još 3").
- Kod: `useShowMore(items, { first, reset })` (`src/hooks/use-show-more.js`, korak `LIST_STEP` = 10) i dugme `ShowMore` (`src/components/ShowMore.jsx`). Nova lista koristi njih, ne svoje stanje.
- **Veza na drugu stranicu nije produžetak liste:** „Sve posete" u glavi kartice poslednje posete vodi na stranicu Posete, a „Pogledajte još negovateljica" u planu na „Pronađi". To ostaje.
- Na stranici „Sve posete" ono što je zakazano posle sutra je grupa „Zakazano" na vrhu, pa „Ove nedelje", pa meseci.
- Kratka lista koja izraste (npr. mnogo upita) dobija „Prikaži još", ne paginaciju.

## 9. Dugmad

| Akcija | Varijanta |
|---|---|
| Podešava nešto što nedostaje (pretplati se, dodaj karticu, uključi, pošalji) | `default` (narandžasto; ranije `primary`) |
| Menja nešto što je već podešeno (promeni karticu, promeni lozinku) | `secondary` |
| Gasi ili otkazuje (otkaži pretplatu, isključi 2FA) — uvek prvo traži potvrdu | `secondary` |
| Briše nepovratno (obriši nalog) | `destructive` (ranije `danger`) |
| Sporedna akcija pored glavne u dijalogu („Otkaži", „Nazad") | `secondary` |

- **Varijanta zavisi od vrste akcije, ne od stanja.** Isto dugme ne menja boju kad se nešto podesi. Dugme promeni izgled samo kad se promeni i akcija koju nudi:

  | Kartica | Pre | Posle | Zašto |
  |---|---|---|---|
  | Pretplata | „Pretplatite se" — default | „Otkaži pretplatu" — secondary | akcija postaje otkazivanje |
  | Dvofaktorska prijava | „Uključi" — default | „Isključi" — secondary | akcija postaje gašenje |
  | Način plaćanja | „Dodaj karticu" — default | „Promeni karticu" — secondary | kartica je podešena, a menjanje je održavanje, ne preporuka |
  | Lozinka | „Promenite lozinku" — secondary | isto | lozinka uvek postoji, pa je ovo uvek menjanje |
  | Kolačići | „Podešavanja kolačića" — default | isto | nema stanja |
- **U dijalogu i drawer-u** akcije su dole desno (`DialogFooter`, `SheetFooter`): prvo secondary, pa glavna.
- `Button` je iz `@/components/ui/button`. Varijante: `default` (narandžasto, glavna radnja), `secondary`, `ghost` (tiha radnja pored `secondary`, npr. „Odbij sve"), `destructive`. Veličine: `default` (32), `lg` (40, samo ekrani preko celog prozora), `icon` (28; u `PageActions` 32). Na pritisak se smanji na 97%.
- **Na ekranu na dodir** (`pointer: coarse`) sva dugmad, polja, redovi i čipovi imaju najmanje 44px. Tokeni `--button-size` i `--input-size` to rade sami, pa ne zadaji fiksnu visinu manju od 44 bez `pointer-coarse:` varijante.
- Ikonice u dugmadima: vidi §11.
- **Dugmad chat kita** (`inline-chat-kit`) crta kit, a ne `Button`, pa su u `src/styles/chat-kit.css` („The chat kit's buttons, drawn as ours"; van CSS slojeva, kao i kitov CSS, inače ga ne nadjačavaju) obučena kao naša, po ulozi: „Pošalji" je `primary`; „Zaustavi", akcije u zaglavlju chata, „…", predlozi pitanja i koraci pitanja su `secondary`; kopiraj, ponovo i ocena odgovora su `ghost`. Iste visine (32, glif 28, na dodir 44), ugao 8, tekst 12 / 14 na dodir. Novo dugme koje mi dajemo kitu (kartice u chatu) je uvek naš `Button`.

---

## 10. Stanje i polja

- **Tabovi su za to gde si, čipovi za ono što biraš** (odlučeno 9. 10.). Dva ili više prikaza iste stvari, od kojih se vidi jedan, su shadcn `Tabs`: siva traka visine dugmeta, bela kartica za izabrani prikaz (plan nege: „Plan nege" / „Pregled i odgovori"). Filteri i izbor ostaju čipovi. **Bela kartica je jedan komad koji klizi** do izabranog taba (250 ms, `ease-out-strong`), a boja natpisa se menja uz nju; ne gasi se jedan pa pali drugi. Svi prikazi ostaju u kodu (`forceMount`), pa povratak zatiče prikaz kako je ostavljen i ništa u njemu ne igra ulaznu animaciju ponovo; skriveni nemaju visinu i ne mogu se dohvatiti mišem, tasterom Tab ni čitačem. Izabrani ulazi iz prozirnog i 4 niže (200 ms), a stari nestaje odmah, pa se dva nikad ne preklapaju.
- **Čip je samo za ono što se bira.** `ToggleGroupItem` (ivica, a popunjen kad je izabran) je dugme: izbor usluga u ugovoru, filteri, odgovor u tri reči, jezik. **Ono što se samo čita** (usluge iz ugovora, šta je urađeno na poseti, šta će raditi, zašto se negovateljica poklapa, njene klasifikacije, šta je porodica tražila) je oznaka: komponenta `Tags` (`src/components/Tags.jsx`, oznaka je `Badge variant="tag"`), siva podloga, bez ivice i **bez ikonice** (ni kvačice), 12px. Ono što je izostavljeno je bleđa oznaka (`off`) i to kaže rečima („— ovog puta ne"). `ServiceChips` crta oznake.
- **Usluge su iz jednog kataloga** (`src/data/serviceCatalog.js`, odlučeno 3. 10.): 57 usluga u 4 grupe, kao u aplikaciji za negovateljice (Pomoć u svakodnevici, Lična nega i kuća, Praktična nega, Medicinska nega). Ugovor, plan posete, radni nalog i pregled ih prikazuju po grupama (`ServiceChips grouped`: ime grupe, pa oznake). Red negovateljice na Mojoj nezi pokazuje samo imena grupa, a ceo spisak je na njenoj stranici. Ceo katalog (svih 57) se vidi samo u formi gde negovateljica bira šta nudi.
- **Dodatni sati** (odlučeno 3. 10.): radni nalog sa više sati nego što je rezervisano naplaćuje samo rezervisano. Višak je deo „Dodatni sati" u radnom nalogu sa „Odbij dodatne sate" (secondary) i „Odobri X €" (primary), a do odgovora je i stavka u „Čeka na vas". Manje sati: naplaćuje se koliko je radila, a razlika se vraća („Vraća se" u obračunu).
- **Grupa oznaka uvek kaže šta je:** ime grupe (`label`, 12px sivo), a ispod njega oznake, 4 razmaka, kao jedna grupa (`Group`). Sledeća grupa je 12 niže (`Groups`). Primeri: „Poklapa se" i „Klasifikacije" na kartici negovateljice, „Usluge" u redu negovateljice i u ugovoru, „Urađeno" u poslednjoj poseti. U drawer-u ime grupe je `PaneLabel` sekcije, pa se `label` ne zadaje.
- Grupa oznaka u redu stoji 12px ispod teksta reda.
- **Ono što je neko napisao** (beleška negovateljice, njena poruka uz uslove, „O sebi", vaša poruka u upitu, ono što ste prijavili) je **običan tekst ispod imena dela**: `Group` sa `text` (`src/components/Tags.jsx`: 12 / 18, boja vrednosti), a u drawer-u `PaneLabel` pa `SheetDescription`. **Nikad uvučen citat u kurzivu** sa linijom levo (stari citat je uklonjen).
- Tekst značke počinje velikim slovom („Važi", „Čeka vaš odgovor"), kao i sve značke.
- **Stanje** se kaže samo značkom `Badge` sa jednom od varijanti: `success` (zeleno, gotovo; ranije `is-accepted`), `warning` (čeka; `is-pending`), `destructive` (ne; `is-declined`), `secondary` (neutralno; `is-muted`), `default` (narandžasto: poklapanje, izmenjeno; `is-attention`). Oznaka je `Badge variant="tag"`.
- **Poklapanje** se svuda piše „Poklapanje · 97%", kao značka `Badge` `default`.
- **Polja** su samo iz `src/components/TextField.jsx`: `Field`, `Input` (opciono `icon`, `suffix`), `Password`, `TextArea`, `Select`, `DateInput`. Iznutra su shadcn `Field`, `FieldLabel`, `FieldDescription`, `Input`, `InputGroup`, `Textarea` i `Select`. Nijedna forma nema svoje `<input>` ni native `<select>`.
- Labela je iznad polja, napomena ispod; obe su uvučene 12, da počnu gde i tekst u polju. **U modalu na desktopu** polje izlazi 12 u padding sa obe strane, pa labela i tekst u polju počinju tamo gde i naslov modala (odlučeno 9. 10.; `Dialog` to radi sam). Na telefonu ne, jer bi polje bilo 4 od ivice ekrana.
- **Datum se bira iz kalendara, ne kuca** (odlučeno 9. 10.): `DateInput`. Polje izgleda kao `Select`, ikonica kalendara na kraju, a izabrani dan piše kako se kaže („20. avgusta 2026"). Otvara mesec 4 ispod polja, poravnat sa njegovim desnim krajem (gde je ikonica kalendara) i širok pola polja (najmanje 268, na dodir 324) (`Popover`: r16, p8; raste iz polja, sa 97%, 150 ms); dani dele širinu. Mesec počinje velikim slovom („Avgust 2026"). Dani su 36 (44 na dodir), r8; nedelja počinje ponedeljkom; današnji dan je narandžast, izabrani popunjen, a oni koji ne mogu da se izaberu sivi (`from`, `to`). Danas je dan prototipa (`dateOfToday`), ne sat računara. Izbor dana zatvara kalendar. Tako su „Od kada" i „Do kada" u „Gde sada živi?".
- **Gde živi** se bira, ne kuca (odlučeno 9. 10.): grad iz spiska gradova gde radimo (`src/data/places.js`), uz neobavezan deo grada, ili „Drugo mesto" i njegovo ime.
- **Modal sa jednim tekstualnim poljem** (odlučeno 5. 10.): polje nema labelu. Šta ide u njega kažu naslov modala i placeholder; labela ide u `aria-label`, za čitač ekrana. Tako su „Šta nije u redu?" kod radnog naloga i plana posete, poruka negovateljici i drugi razlog otkazivanja. Kad modal ima dva ili više polja (slanje plana), svako ima labelu. Polje je 36 (44 na dodir). Na fokusu polje dobija narandžastu ivicu, bez prstena. Lozinka uvek ima oko za prikaz.
- **Prijava sa dvofaktorskom zaštitom** (odlučeno 8. 10.): posle tačnog emaila i lozinke ide drugi korak na istom ekranu, istog izgleda kao prijava: naslov „Dvofaktorska prijava", šest kućica (`CodeInput`): kad se upiše šesta cifra, kod se šalje sam, a pogrešan se briše da se odmah upiše ponovo. Ispod je red „Koristite rezervni kod" (`secondary`) i „Potvrdi" (pola-pola; na telefonu svako koliko mu treba), pa „Nazad na prijavu". Rezervni kod se upisuje u polje i šalje sa „Potvrdi"; svaki važi jednom. Rezervni kodovi se čuvaju samo heširani, kao lozinka (`hashBackupCodes`, `spendBackupCode` u `src/lib/account.js`).
- **Gde živi osoba o kojoj brinemo** (odlučeno 9. 10., prototip): promena u Profilu se ne čuva odmah, nego otvara „Gde sada živi?" (`src/components/MoveDialog.jsx`) sa tri izbora, od kojih je „Seli se" izabran od početka. **Seli se**: od kada, i pre potvrde za svaku negovateljicu da li dolazi i dalje (nova adresa u njenom radijusu) ili ne (saradnja se završava na dan selidbe, zakazane posete posle toga se otkazuju, rezervisano se vraća); upiti onima van domašaja se povlače; plan ostaje, a osvežavaju se negovateljice na „Pronađi" i lokalne preporuke. Mesto gde još ne radimo se ne potvrđuje: zove koordinatorka. **Ispravka**: samo se sačuva. **Privremeno je negde drugde** (bolnica, rehabilitacija, kod porodice): adresa ostaje, posete se pauziraju do datuma. Bez novog onboarding-a.
- **Kod od šest cifara** je `InputOTP` i dobija fokus čim se pojavi (uključivanje i isključivanje 2FA, prijava): tri i tri kućice (44×52, na telefonu 40×48), kratka crta između, a kućica u koju ide sledeća cifra ima narandžastu ivicu dok je polje u fokusu. Labela „Kod iz aplikacije" je sitan tekst iznad.
- **Prekidač** (`Switch`) je za podešavanje koje je uključeno ili isključeno. Ceo red je labela (naziv, opis ispod, prekidač desno), pa klik bilo gde u redu menja stanje. Podešavanje koje se ne može menjati (neophodni kolačići) i dalje ima prekidač, da lista izgleda kao celina, ali je on `disabled`: bleđi je i ne pomera se, pa se vidi da ne može da se isključi (odlučeno 5. 10.).
- **Nešto što se rasklapa** (grupa kolačića, ručni unos 2FA ključa) je `Collapsible` ili dugme sa `aria-expanded`, sa strelicom koja se okreće kad je otvoreno.
- **`TextArea` se razvlači samo na dole**, od visine sa kojom se otvara (`rows`, to je i minimum). Polje nema svoju gornju granicu, jer koliko teksta treba zavisi od polja. Granicu daje prozor: sadržaj se skroluje, a red dugmadi je zakačen za dno (§7), pa ga polje ne može izgurati. Zato svaki prozor sa poljem mora biti `Dialog`. U širinu se ne razvlači. Na telefonu ručice nema.
- **Bez plavog okvira na pritisak:** pregledačev „tap highlight" je isključen za sve (`index.css`). Na pritisak odgovara samo dugme, smanjenjem na 97%. Dug pritisak na delu koji je ceo dugme (glava grupe kolačića) ne selektuje tekst (`select-none`).
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

## 10a. Medicinski karton (prototip, odlučeno 10. 10.)

Stranica o osobi o kojoj se brine (`src/screens/MedicalRecord.jsx`, podaci i logika u `src/data/record.js`). Plan nege je napisan za jedan trenutak i jednu potrebu; karton je ko je ona, bez obzira na plan. Otvara se **karticom naloga u dnu bočnog menija** (ime i avatar onoga ko je prijavljen); kartica se na hover i dok je karton otvoren uokviri, kao svaka kartica koja nešto otvara. Stranica je iz menija, pa nema „nazad".

- **Glava** je stranica osobe (`PagePerson`): avatar, ime, a ispod „Medicinski karton · 84 godine · Töölö, Helsinki". Desno je „Pitaj asistenta" (§4), kao na Mojoj nezi; prazan karton ga nema.
- **Dva prikaza iste stvari, tabovi (§10):** „Stanje sada" i „Istorija".
- **Stanje sada**, grupe redom: „Ukratko" („Na šta paziti": rizici iz plana i alergije, kao oznake; skala krhkosti), „Svakodnevica" (kretanje i samostalnost; podrška koja joj treba), „Zdravlje" (dijagnoze i stanja, lekovi, alergije, pomagala), „Osnovno" (lični podaci; kontakt osoba), „Povod" (kako je počelo).
- **Naslov grupe je u kartonu uvučen 16**, pa počinje tamo gde i tekst u karticama ispod njega (odlučeno 10. 10.; za sada samo ovde, na ostalim stranicama je na ivici kartice).
- **Karton ne čuva ništa dva puta.** Delovi iz razgovora sa Minnom (lični podaci, svakodnevica, podrška, povod) čitaju se iz istih odgovora iz kojih se pravi plan (`RECORD_PARTS`), pa izmena u kartonu jeste izmena odgovora i plan se pravi ponovo. Samo ono što razgovor ne pita (dijagnoze, lekovi, alergije, pomagala; `HEALTH`) karton čuva sam.
- **Deo iz odgovora** je kartica sa `Facts` i olovkom u glavi (`secondary`, `size="icon"`, kao u Profilu). Šta još nije upisano je „-", a koliko toga ima kaže značka u glavi („Nije upisano: 2").
- **Spisak u „Zdravlju"** je kartica sa redovima (`Item`, §6): ime zapisa je `ItemLink` i otvara zapis, ispod je napomena i od kada. Novi zapis se dodaje dugmetom „+" u glavi (`secondary`, `size="icon"`, sa `aria-label`). Prazan spisak to kaže jednom rečenicom.
- **Ništa se ne čuva dok se kuca, i ništa se ne briše.** Svaka izmena ide kroz svoj prozor i ostavlja red u istoriji.

**Izmena dela iz odgovora** (`src/components/RecordChangeDialog.jsx`, modal `wide`) ima dva koraka u istom modalu, a drugi se menja na mestu (`AutoHeight`, §7):

1. **„Šta se promenilo?"**: redovi tog dela kao polja, **jedno ispod drugog** (ne u dve kolone), istim redom kao na kartici. Jedan izbor je `Select`, više njih su čipovi; prvi čip u redu počinje na ivici polja, kao input, pa mu tekst stoji ispod labele. „Dalje" radi tek kad se nešto razlikuje. „Gde živi" se ovde ne menja (selidba ima svoj tok u Profilu, §10).
2. **„Šta ova izmena menja"**, pre nego što se išta upiše, u delovima (`Part`, 24 jedan od drugog): „Šta upisujete" (`ChangeRows`: bilo → sada); „Šta je u pitanju" (čipovi „Stanje se promenilo", izabran od početka, i „Ispravka"); „Od kada" (`DateInput`, do danas, samo za promenu stanja); „Šta ovo menja": nivo krhkosti (značka `warning` „4 → 5"), plan nege (značka „Menja se" i koji se delovi pišu ponovo, ili „Ostaje isti"), koliko nege plan sada traži, šta je novo u „Na šta paziti", koja se pitanja otvaraju ili više ne važe, i da negovateljice koje dolaze dobijaju obaveštenje. Sve to se računa iz istih funkcija koje prave plan (`recordImpact`), ne piše se napamet.

Footer: „Otkaži" i „Dalje", pa „Nazad" i **„Upiši u karton"**. Potvrda upisuje red u istoriju i pravi plan ponovo; plan zatim pokazuje „Plan je izmenjen" sa „Poništi izmene" kao i za svaku izmenu, a karton na vrhu ima narandžasti deo „Plan nege je izmenjen" sa „Pogledaj plan nege". Poništavanje vraća vrednosti i **upisuje se u istoriju** („Izmene su poništene"), ne briše red.

**Zapis u „Zdravlju"** (`src/components/RecordEntryDialog.jsx`) ima jedan korak, jer se plan ne piše iz tih spiskova, i modal to kaže („Plan nege ostaje isti…"). Nov zapis: naziv, napomena i od kada (poslednja dva nisu obavezna). Postojeći zapis prvo pita šta je u pitanju, kao „Gde sada živi?": **„Izmena"** (izabrana od početka), **„Više ne važi"** („Više ne uzima", „Više ne koristi"; od kada; zapis se sklanja sa spiska i ostaje u istoriji) ili **„Ispravka"**. Dugme kaže šta radi: „Upiši u karton", „Upiši izmenu", „Zaključi zapis", „Sačuvaj ispravku".

**Istorija** je jedna kartica: „N stavki · najnovije prvo", pa redovi bez akcije (`Item`): naslov sa značkom vrste („Otvoren", „Upisano", „Promena stanja", „Ispravka", „Zaključeno", „Poništeno", „Sa posete"; `secondary`, a promena stanja `default`), ispod „ko · kada" (`vi`, `Minna` ili ime negovateljice), pa šta tačno. U nju ulaze i **zapažanja sa poseta** iz radnih naloga (raspoloženje, ishrana, kretanje, beleška), čitana iz poseta, ne prepisana. Prvih 10, pa „Prikaži još" (§8a).

Prototip: karton se ne čuva između prijava (osim onoga što je u odgovorima), a obaveštenje negovateljici je samo rečenica.

---

## 11. Ikonice

**Podešavanja (odlučeno 28. 9.):** dugme sa tekstom nema ikonicu. To važi za stranicu i za sve njene dijaloge i drawer-e (kartica, lozinka, 2FA, kolačići). Izbor jezika pokazuje podloga čipa, bez kvačice.

**Ostatak aplikacije — ODLUKA NA ČEKANJU:** tamo su ikonice još nedosledne („Pošalji poruku" ima ikonicu u planu, a na „Pronađi" nema). Dok se ne odluči, ne dodaj i ne uklanjaj ikonice van Podešavanja. Ne dodaj ni ikonice u naslove kartica: kolega ih je dodao 28. 9. (`0f734cd`), sweep obrazaca ih je istog dana uklonio, a konačna odluka još nije pala.

**Ikonica ostaje uvek:**
- dugme bez teksta (`iconOnly`), uz `aria-label`;
- strelica koja pokazuje da li je nešto otvoreno ili zatvoreno (disclosure);
- „Pitaj asistenta", ista komponenta gde postoji (Moja nega, plan nege, medicinski karton);
- kvačice u listama i u znački stanja, jer to nisu dugmad.

## 12. Telefon

- **Prelomi:** ≤640px je telefon, ≤900px je uzak ekran (meni postaje fioka).
- **Paneli sa strane** (asistent, plan) su na uskom ekranu preko celog ekrana, bez radiusa.
- **Na telefonu je svaki prozor bottom sheet (odlučeno 2. 10.):** drawer (`Modal`), modal (`Dialog`) i izbor plana i poruka negovateljici (`PaywallModal`). Dolazi odozdo, visok je koliko mu treba sadržaj, a najviše do 48px od vrha ekrana (tu se vidi stranica). Gornji uglovi r24, dno na ivici ekrana, preko cele širine, padding 16, na vrhu ručica (36×4). Sadržaj se skroluje, a poslednji red dugmadi je zakačen na dno. **Prevlačenjem glave nadole se zatvara** (preko 96px ili brzim pokretom; kraće se vrati). To je shadcn `Drawer` (vaul, `handleOnly`, sa `DrawerHandle` preko glave), a biraju ga sami `Dialog` i `Modal` kad je ekran telefon (`useIsPhone`, `src/hooks/use-phone.js`); prag od 96px računa `useCloseThreshold` (`src/lib/sheet.js`). Novi prozor se pravi od `Dialog` ili `Modal`, pa to dobija sam. Na desktopu je drawer sa strane, a modal u sredini.
- **Glava sheet-a na telefonu:** naslov je na sredini dugmeta za zatvaranje (44). U drawer-u je glava centrirana po visini; u modalu je dugme 16 od ivice i na sredini glave (eyebrow i naslov, ili avatar sa dva reda, 40), a kod izbora plana na sredini naslova.
- **Toast** je na telefonu **gore**, širok koliko ekran (16 od ivica), i dolazi odozgo nadole; na desktopu je dole, koliko tekst, do 520, u sredini. Radius 16, ne pun krug.
- **Ništa ne sme da izlazi van ekrana** na 375px.
- Pravila za telefon iz §4, §5, §7 i §9 rešava CSS. Markup je isti na svim širinama.

---

## 12a. Simulacija (samo demo)

Ova aplikacija je samo porodična, pa sve što bi uradile negovateljice i koordinatorka radi skriveni drawer **„Simulacija"** (`src/components/family/SimPanel.jsx`, funkcije u `src/data/sim.js`). Otvara se i zatvara sa **Ctrl+H** (na Mac-u takođe Ctrl, ne Cmd). Ništa se ne dešava samo od sebe: nema više automatskog odgovora posle 6 s ni prve posete posle 5 s.

- **Vreme:** „Prođe sat" i „Prođe dan". Stanje ima svoj sat (`care.now`, počinje 11. 8. 2026. u 08:00). Iz njega se računaju „Danas / Sutra / Juče", koliko je do posete (kasno otkazivanje u poslednjem satu) i koliko je ostalo od 24 sata. Kad dođe vreme posete, ona čeka radni nalog; radni nalog koji niko ne prijavi za 24 sata se naplati.
- **Negovateljica:** prihvati ili odbij upit (sa razlogom), pošalji ugovor ili nove uslove, povuci predlog, plan posete za sutra ili za pola sata, radni nalog kako je planirano / sat manje / sat više, poseta se nije desila, otkaže posetu, završi saradnju.
- **Koordinatorka:** reši prijavu (radni nalog: naplati kako je poslato, umanji za sat, ne naplaćuj; plan: plan ostaje, otkaži posetu).
- Pravila kao u aplikaciji za negovateljice: jedan plan posete u isto vreme; nijedan dok novi uslovi čekaju, dok je prijava otvorena ili dok prošla poseta čeka radni nalog; najviše dva nenaplaćena radna naloga. Zašto plan ne može, drawer kaže ispod dugmeta.
- Drawer je alat za demo, ne deo proizvoda: ne ide u galeriju i ne proverava se skriptom iz §13. Dugmad su `secondary`, u redovima sa razmakom 8.

---

## 13. Provera — obavezno posle izmene interfejsa

**Sve kartice na jednoj stranici:** `/?kartice` (ili „Za pregled: sve kartice na jednoj stranici" ispod prijave). Stranica (`src/screens/CardGallery.jsx`) renderuje prave ekrane sa primerom podataka u kom je svaka kartica u svakom stanju, pa se kartice porede jedna pored druge. Novi ekran sa karticama dodaj i tamo.

**Svaka komponenta sama:** Storybook, `npm run storybook` → http://localhost:6006 (`docs/storybook.md`). Nova komponenta ili novo stanje dobija priču u `src/stories/`.

Otvori stranicu u pregledaču i u konzoli pokreni skript ispod, na desktopu i na 375×812. Rezultat mora biti prazan niz za `concentric`, `caps` i `overflow`, a `cards` i `titles` moraju imati samo vrednosti iz ovog dokumenta.

```js
(() => {
  const root = document.querySelector('[data-slot=app-pane]') || document.body;
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const name = (e) => (e.dataset?.slot ? `[${e.dataset.slot}] ` : '') + e.className.toString().slice(0, 30);
  // §1: avatars up to 36 are exempt, larger ones nest like anything else; badges and tags are 20 tall
  const exempt = (e) => e.parentElement?.closest('[data-slot=avatar]') || e.matches('[data-slot=badge]') || (e.matches('[data-slot=avatar]') && e.getBoundingClientRect().width <= 36);
  const concentric = [];
  root.querySelectorAll('*').forEach((e) => {
    const s = getComputedStyle(e), r = parseFloat(s.borderTopLeftRadius), box = e.getBoundingClientRect();
    if (!r || box.width < 40 || box.height < 36 || exempt(e)) return;
    for (let p = e.parentElement; p && p !== root; p = p.parentElement) {
      const ps = getComputedStyle(p), pr = parseFloat(ps.borderTopLeftRadius);
      if (pr && (ps.backgroundColor !== 'rgba(0, 0, 0, 0)' || ps.boxShadow !== 'none' || parseFloat(ps.borderTopWidth) > 0)) {
        const pb = p.getBoundingClientRect(), gap = box.left - pb.left;
        if (gap <= pr && box.top - pb.top <= pr + 40 && Math.abs(pr - (r + gap)) > 1) concentric.push([name(e), r, name(p), pr, Math.round(gap)]);
        break;
      }
    }
  });
  const uniq = (a) => [...new Set(a)];
  return {
    concentric,
    caps: uniq([...root.querySelectorAll('*')].filter((e) => vis(e) && getComputedStyle(e).textTransform === 'uppercase').map(name)),
    overflow: uniq([...root.querySelectorAll('*')].filter((e) => vis(e) && e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('[data-slot=sidebar]')).map(name)).slice(0, 10),
    cards: uniq([...root.querySelectorAll('[data-slot=card]')].filter(vis).map((e) => { const s = getComputedStyle(e); return `${s.borderTopLeftRadius}/${s.paddingTop}`; })),
    titles: uniq([...root.querySelectorAll('[data-slot=card-title], [data-slot=page-section] > h2')].filter(vis).map((e) => `${e.dataset.slot || 'section-title'} ${getComputedStyle(e).fontSize}`)),
  };
})();
```

Na `/?kartice` skript uzima glavni panel strane negovateljice (`AppPane`, `[data-slot=app-pane]`) za koren, pa tamo pokreni telo funkcije nad svakim okvirom galerije (`[data-slot=gallery-frame]`, umesto `root`), a tablu negovateljice (skroluje se vodoravno) izuzmi iz `overflow`.

Skript prepoznaje komponente po njihovom `data-slot` atributu (`[data-slot=card]`, `[data-slot=card-title]`, `[data-slot=badge]`, `[data-slot=avatar]`), a ne po klasama: shadcn komponente klase nemaju. Ako skript ne nađe nijednu karticu (`cards: []`), proveri da li je selektor tačan, inače bi stranica „prošla" a da ništa nije izmereno.

Očekivano: `cards` → `24px/16px`; `titles` → `card-title 14px` i `section-title 12px` (na dodir je naslov kartice 16px). Kartica na tabli negovateljice je r16 sa 12 paddinga i nije `Card`.

---

## 14. Zabranjeno — kratko

- druga klasa za karticu, kutija sa ivicom ili senkom u kartici, radius van skale;
- narandžasta kartica sa sadržajem direktno na narandžastom (sadržaj ide u belu karticu u `Attention`);
- uvučen citat u kurzivu; tekst kao dugme-link umesto `Button`;
- velika slova (nigde, ni u onboardingu);
- duga crta (—) u tekstu interfejsa: piše se kratka (-), a prazna vrednost je takođe „-". Raspon ostaje sa – (`16–20 €/h`, `09:00–12:00`);
- `onClick` na div kartice umesto `CardLink` / `ItemLink`;
- sakrivena akcija na telefonu koje nema u detaljima;
- `default` (narandžasto) za gašenje ili otkazivanje, ili boja dugmeta po stanju;
- svoje `<input>` ili native `<select>` umesto `TextField`;
- `shadcn add … --overwrite` na komponenti koja je već prilagođena;
- nova klasa u CSS fajlu (sve je Tailwind, osim onboardinga i chat kita);
- hex boje u komponentama, razmak koji nije deljiv sa 4;
- pretraga ili jedno polje u kartici;
- ikonica u dugmetu sa tekstom u Podešavanjima; dodavanje ili uklanjanje ikonica van Podešavanja dok §11 ne dobije odluku.
