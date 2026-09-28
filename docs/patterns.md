# Obrasci — jedno pravilo za svaku stvar

Isti sadržaj se u aplikaciji uvek slaže na isti način. Kad nešto novo pravimo, prvo tražimo obrazac ovde; ako ga nema, dodajemo ga ovde pre nego što ga upotrebimo na drugom mestu.

Sve mere su na mreži od 4px. Radijusi su samo 4 / 8 / 16 / 24 / 32, a unutrašnji radius je spoljašnji minus padding. Nigde nema velikih slova (onboarding je izuzetak i ne diramo ga).

## 1. Stranica

- **Glava stranice** (`.view-head`): naslov 16px medium, ispod podnaslov 12px sivo. Akcije stranice su desno u glavi. Na telefonu su naslov i akcije u istom redu, a podnaslov je ispod njih, celom širinom.
- **Nazad** (`.back-link`): 12px sivo sa strelicom, iznad naslova. Jedan izgled na svim stranicama.
- **Pretraga i filteri** stoje na stranici, ne u kartici. Kartica oko jednog polja je okvir oko okvira.

## 2. Grupa kartica

Samo kad stranica ima više od jedne grupe (plan nege, podešavanja).

- Naslov grupe (`.section-title`): 12px medium, siv, napisan normalno.
- Razmaci: 8px između kartica, 12px od naslova grupe do kartica, 32px između grupa.
- Naslov grupe je tiši od naslova kartice. Grupa samo imenuje, a čitaju se kartice.

## 3. Kartica

Postoji jedna kartica (`.panel-card`): bela, radius 24, padding 16, razmak 8, senka kartice.

- **Glava kartice** (`.panel-card-head`): naslov (`.doc-section-title`, 14px medium), a desno značka stanja i/ili ikonica-dugme (npr. olovka za izmenu). U naslovu nema ikonice.
- **Tekst kartice:** 12px, visina reda 18, siv.
- **Oznaka u kartici** (`.card-label`) iznad dela koji imenuje, npr. „Zašto ovo preporučujemo": 12px medium, siva.
- **Akcije kartice** (`.panel-card-actions`) su footer kartice: dole levo, prirodne širine, 16px od sadržaja (duplo od 8 između redova sadržaja), da se čitaju kao kraj kartice, a ne kao još jedan red. Na telefonu dele širinu kartice.
- **Sadržaj kartice u grupama:** ono što ide zajedno stoji na 4–8px, a grupe su na 12px. Kartica negovateljice: ko je (ime, ocena — 4px), kakva je (opis, oznake — 8px), pa footer na 24px.

**Istaknuta kartica** (`.panel-card.is-attention`) služi za ono što čeka na porodicu, za Jovanino pismo i za izmenu plana. Ima narandžastu podlogu, ivicu od 1px, nema senku i koristi tekst u boji podloge. Postoji samo jedna ovakva, ne tri.

## 4. Stavke (negovateljice, posete, upiti, kanali kontakta)

- Stavka **sama na stranici** je kartica (pravilo 3). Primeri: negovateljica na „Pronađi", plan na „Planovi nege".
- Stavka **unutar kartice** je red, a ne kutija u kutiji. Red ima padding 16 gore i dole i 8 sa strane, a zalazi 8px u padding kartice. Između redova je linija od 1px, poravnata sa tekstom. Naslov reda je 12px medium, jedan korak ispod naslova kartice.
- **Hover** na redu koji se otvara: siva podloga radiusa 16, linije oko reda se sklanjaju, a ime dobija boju. Uglovi se slažu: kartica 24 = red 16 + 8 uvučeno, a red 16 = dugme 8 + 8 paddinga.

  Razlog je pravilo radiusa: unutrašnji radius + padding = spoljni radius. Kutija sa ivicom u kartici (kartica 24, kutija 8, dugme 8 u njoj) nije mogla da ga ispoštuje ni sa jednim radiusom na skali. Red koji zalazi 8px u karticu može.

**Šta se klikne:**
- Kartica ili red koji predstavlja nešto sa svojim detaljima (negovateljica, plan, poseta) je **ceo klikabilan** i otvara detalje. Ime je link koji se razvlači preko cele kartice (`.is-clickable` + `.card-link`). Na hover se kartica uokviri, a ime dobije boju.
- **Akcija** na takvoj kartici (npr. „Pošalji poruku"):
  - na kartici: u footeru, dole levo, poravnata sa tekstom;
  - u redu unutar kartice: desno u redu;
  - akcija ima prednost nad klikom na karticu, pa klik na dugme radi samo ono što dugme kaže.
- **Na telefonu** takva kartica nema dugme, nego strelicu desno (`.card-go`). Tap otvara detalje, a ista akcija je tamo. Deset dugmadi „Pošalji poruku" jedno ispod drugog na telefonu nisu izbor.
- Kartica koja ne predstavlja ništa što se otvara (podešavanje, informacija) nije klikabilna. Akcije su joj u footeru i ostaju i na telefonu.
- Dugme desno samo u redu, kad sadržaj reda staje u dve linije. U kartici sa više teksta (bio, oznake) dugme ide u footer.

## 5. Podaci (oznaka — vrednost)

Vrsta podatka određuje kako se slaže:

- **Kratka vrednost** (iznos, datum, stanje, broj): u jednom redu, oznaka levo, vrednost desno (`.bc-line`). Primeri: obračun posete, stanje kolačića, uslovi ugovora.
- **Slobodan tekst** (ime, adresa, odgovor): oznaka iznad vrednosti, redovi razdvojeni linijom (`.facts.is-stacked`). Vrednost se prelama i nikad se ne seče tri tačke. Primeri: profil, arhivirani plan.

Oznaka je u oba slučaja 12px sivo, a vrednost je tamna.

**Cenovnik partnera** je jedini izuzetak: naziv i ko radi levo, a obe cene u koloni desno, redovi razdvojeni linijom.

## 6. Dugmad

- **Primary** za sve što dodaje ili menja.
- **Secondary** za ono što gasi ili otkazuje (i to uvek prvo pita).
- **Crveno** samo za brisanje naloga.
- **U dijalogu:** dole desno, prvo secondary („Otkaži"), pa glavna akcija.
- **Na ekranu na dodir** sva dugmad, polja i redovi imaju najmanje 44px.

## 7. Stanje

- **Značka** (`.status-pill`) je jedini način da se kaže stanje: „Aktivna", „Nije podešeno", „Poklapanje · 97%". Poklapanje je značka i na planu i na „Pronađi".
- **Prazna stranica** (`.empty`) je siva površina sa naslovom, rečenicom i jednom akcijom.

## 8. Polja

Jedno polje (`components/TextField.jsx`): `Field`, `Input`, `Password`, `TextArea`, `Select`. Nijedna forma nema svoje polje.
