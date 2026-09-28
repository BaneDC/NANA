# Obrasci — jedno pravilo za svaku stvar

Isti sadržaj se u aplikaciji uvek slaže na isti način. Kad nešto novo pravimo, prvo tražimo obrazac ovde; ako ga nema, dodajemo ga ovde pre nego što ga upotrebimo na drugom mestu.

Sve mere su na mreži od 4px. Radijusi su samo 4 / 8 / 16 / 24 / 32, a unutrašnji radius je spoljašnji minus padding. Nigde nema velikih slova (onboarding je izuzetak i ne diramo ga).

## 1. Stranica

- **Glava stranice** (`.view-head`): naslov 16px medium, ispod podnaslov 12px sivo. Akcije stranice su desno u glavi.
- **Nazad** (`.back-link`): 12px sivo sa strelicom, iznad naslova. Jedan izgled na svim stranicama.

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
- **Akcije kartice** (`.panel-card-actions`): dole levo, prirodne širine. Na telefonu dele širinu kartice.

**Istaknuta kartica** (`.panel-card.is-attention`) služi za ono što čeka na porodicu, za Jovanino pismo i za izmenu plana. Ima narandžastu podlogu, ivicu od 1px, nema senku i koristi tekst u boji podloge. Postoji samo jedna ovakva, ne tri.

## 4. Stavke (negovateljice, posete, upiti, kanali kontakta)

- Stavka **sama na stranici** je kartica (pravilo 3). Primeri: negovateljica na „Pronađi", plan na „Planovi nege".
- Stavka **unutar kartice** je red: bela podloga, ivica od 1px, radius 8, padding 12, bez senke. Naslov reda je 12px medium, jedan korak ispod naslova kartice.
- Akcija stavke je desno u redu, a na telefonu ispod, preko cele širine.

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
