# Porodica: tržište i opština pre naloga, kraći put i dijaspora

16. 11. 2026, Branislav. Dizajn za izradu; plan se piše posle odobrenja. Prvu verziju pravimo mi, dizajner je posle doteruje.

## Zašto

Porodica danas nigde ne bira tržište: izvodi se iz linka sa sajta ili iz jezika, a zemlja naloga iz pozivnog broja telefona. Negovateljica ga bira na nalogu („Gde želite da radite?"). Na produkciji porodica pre naloga bira Srbiju, Finsku ili dijasporu, pa opštinu, i odmah vidi koliko negovateljica imamo u toj opštini.

Taj broj je razlog da čovek napravi nalog. Oko 90% ljudi i dalje dolazi zbog negovateljice. Ako ih pustimo da popune sve, pa im tek onda kažemo da u njihovoj opštini nemamo nikoga, biće ljuti, i s pravom.

Od tada je glavni proizvod postao AI plan nege. On ostaje podrazumevan: klijent često ni sam ne zna šta mu treba, pa ga ne teramo da bira. Ali ko je siguran da hoće samo negovateljicu treba da stigne do liste mnogo brže. Dijaspora (osoba živi van Srbije i Finske) ide samo tim kraćim putem, jer tamo nemamo partnere, nego samo negovateljice koje putuju kod klijenta.

## Ciljevi

- Porodica na `/signup/family` prvo kaže gde živi osoba kojoj treba nega (Srbija, Finska, u inostranstvu), po istim pravilima po kojima negovateljica bira tržište.
- Za Srbiju i Finsku bira opštinu i pre ijednog ličnog podatka vidi koliko negovateljica imamo u njoj.
- Plan nege ostaje podrazumevan put kroz razgovor sa Minnom.
- Postoji kraći put „samo negovateljica": nekoliko pitanja, pa lista negovateljica.
- Dijaspora ide samo kraćim putem, vidi samo negovateljice koje rade u inostranstvu i plaća pakete Srbije.
- Posle kraćeg puta klijent i negovateljica vide iste ekrane kao danas, sa manje podataka.

## Nije cilj

- Zaseban ekran za zemlju i zaseban ekran za opštinu pre naloga (kao na produkciji). Sve je na strani naloga.
- Ekran „Šta vam treba?" na kom klijent bira između plana i negovateljice.
- Aplikacija bez plana. Kraći put pravi mali plan, pa sve što danas polazi od plana radi dalje.
- Treće skladište i treći demo nalog za dijasporu.
- Pravo javljanje („javićemo vam kad se neka prijavi"): u prototipu je to samo rečenica.
- Konačan izgled. Poštuje se `docs/patterns.md`, a dizajner doteruje posle.

## Šta bi bio promašaj

- Čovek upiše lične podatke, pa tek posle sazna da u njegovoj opštini nemamo nikoga.
- Plan nege izgleda kao prepreka između čoveka i liste koju smo mu obećali brojem.
- Kraći put ostavi prazne grupe ili prazne ekrane kod klijenta ili kod negovateljice.
- Minna ponovo pita nešto što je već rečeno na nalogu (opština, ime, telefon).
- Dijaspori se ponudi partner ili negovateljica koja ne radi u inostranstvu.

## Načini koje smo razmotrili

**Gde su tržište, opština i broj**

- *Na strani naloga, na vrhu forme* (izabrano). Isto pravilo kao kod negovateljice, nema ekrana više. Forma je duža.
- *Zaseban korak pre naloga, kao na produkciji.* Broj ima svoj ekran, ali to je ekran više, a kod negovateljice je takav ekran ukinut 12. 11.
- *Opštinu pita Minna, a broj je njen odgovor.* Odbačeno: broj bi došao posle naloga, a on mora pre.

**Kako se ulazi u kraći put**

- *Jedan od Minninih početnih predloga* (izabrano). Ko ga ne izabere, ide na ceo plan, pa niko ne mora da bira.
- *Pitanje „Šta vam treba?" posle naloga.* Odbačeno: tera klijenta da odluči pre nego što zna šta plan donosi.
- *Kratko za sve, plan kao nastavak.* Odbačeno: plan nege treba da ostane podrazumevan.

**Šta kraći put ostavlja za sobom**

- *Mali plan od onoga što je pitano* (izabrano). Isti ekrani, manje podataka, „Dopunite plan nege" nastavlja razgovor.
- *Aplikacija bez plana.* Odbačeno: sve u aplikaciji polazi od toga da plan postoji.

**Dijaspora**

- *Tržište Srbija sa oznakom na nalogu* (izabrano, odluka Claude-a). Plaća pakete Srbije, piše srpskim negovateljicama, posle prihvaćenog upita razmenjuju se samo kontakti. Sve to Srbija već radi.
- *Treće tržište sa svojim skladištem i demo nalogom.* Odbačeno: mnogo posla, a ne donosi ništa što oznaka ne daje.

## Deo 1: tržište, opština i broj na nalogu porodice

Strana je `/signup/family` (`FamilySignUp` u `src/screens/Register.jsx`). Na vrhu kartice, pre imena:

```
Gde živi osoba kojoj treba nega? *
  ( ) Srbija
  ( ) Finska
  ( ) U inostranstvu

Opština *                                  ← samo za Srbiju i Finsku
  [ Pretražite opštine                ▾ ]
  U ovoj opštini trenutno imamo 12 negovateljica.

Ime *            Prezime *
Email *
…
```

**Izbor tržišta** je radio, jedno ispod drugog, kao „Gde želite da radite?" kod negovateljice (`Radios`, §10). Već je izabran kad se zna, istim redom kao kod nje: tržište iz linka sa sajta (`?market=sr|fi|diaspora`, u prototipu red „Za demo: tržište" na „Ko ste?"), inače jezik (srpski › Srbija, finski › Finska), a na engleskom bez linka ništa nije izabrano. „U inostranstvu" se nikad ne bira po jeziku, samo linkom ili rukom. Red „Za demo: tržište" ne dobija dijasporu: ona se bira na formi.

**Opština** je `Combobox` sa istim spiskom koji koristi prijava negovateljice (`municipalityGroups` u `src/data/caregiverProfile.js`). Pojavi se kad je izabrana Srbija ili Finska. Promena tržišta je briše. Obavezna je.

**Broj** stoji ispod polja opštine, čim je opština izabrana:

- jedna ili više: „U ovoj opštini trenutno imamo {n} negovateljica." (sa oblicima za jedninu i množinu, kao ostali brojevi u aplikaciji);
- nijedna: „U ovoj opštini trenutno nemamo negovateljicu. Možemo da napravimo plan nege i javimo vam čim se neka prijavi."

Nula ne zaustavlja registraciju: nalog može da se napravi i tada.

**Lista poštuje nulu** (odluka Branislava, 16. 11.). Porodici iz opštine sa nulom „Pronađi negovateljicu" i preporuka „negovateljice" u planu pokazuju prazno stanje sa istom rečenicom, a ne demo spisak. U ostalim opštinama lista ostaje demo spisak kakav je danas, bez filtera po mestu: broj je izmišljen, pa se sa listom ne poklapa.

**U inostranstvu** nema opštinu. Umesto nje, ispod izbora stoji: „Imamo negovateljice iz Srbije koje dolaze kod klijenta u inostranstvo. Napravite nalog da ih vidite."

**Odakle broj.** Demo negovateljica ima dvanaestak po tržištu, pa bi iskren broj bio nula skoro svuda. Zato je broj u prototipu izmišljen, u jednom fajlu (`src/data/caregiverCounts.js`): stalan za istu opštinu, veći u velikim gradovima, a nula u nekoliko opština da se vidi i taj slučaj. Na produkciji ga daje server. *(Odluka Claude-a.)*

**Šta se čuva na nalogu.** `country` više ne dolazi iz pozivnog broja telefona, nego iz izbora: Srbija i dijaspora daju `RS`, Finska `FI`. Dijaspora dodaje `abroad: true`. Opština se čuva kao `municipality`. Pozivni broj telefona se i dalje sam postavi po tržištu (+381 ili +358; za dijasporu +381) dok ga ona ne promeni, ali više ne odlučuje ni o čemu.

**Posle naloga se tržište ne menja** (kao kod negovateljice, kad forma krene). Opština može: ona je samo podatak o osobi i menja se tamo gde se danas menja „Gde živi".

**Minna ne pita ponovo.** Opština sa naloga je već upisana u odgovor „O kome se brinemo?" kao „Gde živi", onako kako su danas već upisani ime i telefon onoga ko piše. Minna zato u tom pitanju traži samo ime i godine. Danas se pitanje smatra odgovorenim čim ima ijedno polje, pa to mora da se gleda po polju: pitanje sa upisanom opštinom, a bez imena i godina, i dalje se postavlja, i prvi ekran sa početnim predlozima se i dalje vidi.

## Deo 2: kraći put

### Ulaz

Prvi ekran razgovora već ima početne predloge (`STARTERS` u `src/data/flow.sr.js`). Predlog „Treba mi neko u stanu nekoliko puta nedeljno" zamenjuje se sa:

- naslov: „Treba mi samo negovateljica"
- podnaslov: „Nekoliko pitanja, pa negovateljice u njenom kraju"

Ko izabere taj predlog, ulazi u kraći put. Ostali predlozi i slobodno pisanje vode na ceo plan, kao danas. Ako neko u slobodnom tekstu jasno kaže da hoće samo negovateljicu, Minna sme da pređe na kraći put; ako nije jasno, ostaje na planu. *(Odluka Claude-a.)*

Koji je put izabran čuva se uz osobu (`person.path`: `'plan'` ili `'caregiver'`). Put, opština i oznaka dijaspore moraju da prežive osvežavanje i kod pravog naloga, pa se čuvaju tamo gde se danas čuva napredak razgovora, odnosno nalog.

### Pitanja

U prototipu je spisak onoga što Minna treba da sazna zadat u `src/data/flow.js`, jer se plan računa iz tih podataka; kako i kojim redom pita, odlučuje ona. (Na produkciji će AI odlučivati i šta i koliko pita.) Kraći put je kraći spisak:

| # | Pitanje | Šta se saznaje | Novo |
|---|---|---|---|
| 1 | O kome se brinemo? | ime, godine (opština je već tu; za dijasporu: zemlja i grad) | ne |
| 2 | A sa kim ja razgovaram? | samo šta ste joj/mu (ime i telefon su sa naloga) | ne |
| 3 | Oko čega joj treba pomoć? | više odgovora: lična nega, obroci, lekovi, društvo, nabavka i obaveze, kućni poslovi, šetnje, pomoć pri kretanju | da |
| 4 | Kada i koliko vam treba? | odgovor jednom rečenicom, iz koje Minna izdvaja: kojim danima, u koje doba dana, koliko sati po dolasku; u Srbiji i dijaspori i da li su to dnevne posete ili 24 sata | da |
| 5 | Kako se trenutno kreće? | postojeće pitanje, jedan odgovor | ne |

Pet pitanja, naspram dvadesetak u celom planu. Pitanje 4 je vrsta koja već postoji (`inputs`: bez kartica, čovek odgovori rečenicom, a Minna izdvoji polja), pa je jedno pitanje, a ne tri. Ono što čovek usput kaže beleži se kao napomena, kao i danas.

**Pitanje 4 je i u celom planu** (odluka Branislava, 16. 11.: oba puta pitaju koliko negovateljica treba). Današnji ceo plan to ne pita, nego raspored pogađa iz „Koliko joj pomoći treba tokom dana?". Od sada ga pita, a pogađanje ostaje samo dok odgovora nema.

### Šta nastaje

- **Potreba** (`care.need`: usluge, raspored kao tekst, sati po dolasku i sati nedeljno, iz kojih negovateljica u Finskoj polazi kad piše uslove) se čita iz pitanja 3 i 4, a ne izvodi se. Sati su oni koje je porodica rekla; ništa se ne pretpostavlja. Sati nedeljno = broj dana × sati po dolasku. Ako porodica nije rekla sate, to polje ostaje prazno i negovateljica ga upisuje u uslove. Kod „24 sata" raspored je „24 sata", a sati se ne računaju (Srbija nema uslove ni naplatu).
- **Mali plan.** `buildPlan` za kraći put daje sažetak iz onoga što znamo (ko je, gde živi, kako se kreće, šta treba i kada, ko je kontakt) i jednu preporuku: negovateljice. Nema procene krhkosti, rizika, partnera, saveta ni pisma koje se na njih poziva. Delovi kojih nema se ne crtaju, ne stoje prazni.
- **Kraj razgovora** je isti ekran sažetka kao danas, kraći, pa aplikacija.
- **„Moja nega"** pokazuje taj mali plan istim karticama. Na dnu je kartica „Dopunite plan nege": jedna rečenica šta plan donosi (procena stanja, saveti, usluge partnera) i dugme „Dopunite plan" (`default`). U dijaspori te kartice nema.
- **„Pronađi negovateljicu"** radi kao danas. Paywall, pretplata (Finska) i paketi (Srbija) se ne menjaju.

### Dopuna do celog plana

„Dopunite plan" otvara razgovor sa asistentom koji se u aplikaciji pojavljuje desno (odluka Branislava, 16. 11.), a ne vraća porodicu u onboarding. Asistent već ume da menja odgovore iz kojih se plan pravi (`propose_changes` u `src/lib/planCopilot.js`, kroz `src/data/planEdits.js`). Kad se otvori odavde, on vodi: postavlja redom pitanja celog plana koja još nisu odgovorena i upisuje odgovore. Pitanja 1 do 5 se ne ponavljaju.

**Mali plan važi dok se ceo ne završi.** Ko odgovori na deo pitanja i izađe i dalje vidi mali plan, a to isto vidi i negovateljica: ceo plan od pola odgovora dao bi procenu, rizike i partnere ni iz čega. Tek kad je odgovoreno poslednje pitanje celog plana, mali plan se zameni celim, a kartica „Dopunite plan nege" nestaje. Do tada kartica ostaje, sa dugmetom „Nastavite" umesto „Dopunite plan". Zato se čuvaju dve stvari: koja pitanja se postavljaju (`person.path`) i koji plan se crta (mali dok ceo nije gotov). Istorija plana se pri dopuni ne briše. *(Odluka Claude-a.)*

### Šta vidi negovateljica

Iste kartice i isti profil klijenta (`AboutFamily` u `src/screens/caregiver/ClientProfile.jsx`, kartica upita u `RequestsRs.jsx`, tabla u Finskoj). „Ukratko" je kraće, „Šta je potrebno" ima usluge i raspored, odgovori su samo oni koji postoje, a grupa bez podataka se ne crta.

## Deo 3: dijaspora

Dijaspora je nalog na tržištu Srbija sa `abroad: true`.

- **Razgovor:** samo kraći put, bez početnih predloga i bez izbora. Minna počinje od prvog pitanja. U pitanju 1 umesto opštine traži zemlju i grad.
- **Negovateljice:** samo srpske kojima je „Rad u inostranstvu" uključen (`abroad` na profilu). Gde se danas piše opština i radijus („Vračar, do 10 km"), za dijasporu piše „Radi u inostranstvu".
- **Plan:** mali plan, bez kartice „Dopunite plan nege" i bez partnera.
- **Plaćanje i kontakt:** paketi Srbije; posle prihvaćenog upita porodica vidi telefon i e-mail negovateljice, a ona profil klijenta. Kao Srbija.
- **Demo:** nema posebnog demo naloga. Dijaspora se u demou dobija registracijom. Porodica koja se registruje čuva stanje samo u svom tabu (tako je i danas), pa njen upit ne stiže na demo nalog negovateljice: na njega se odgovara kroz Simulaciju. Da se kraći put i dijaspora ipak vide sa strane negovateljice, demo negovateljice dobijaju gotove klijente (odluka Branislava, 16. 11.): Sanna i Milica po jednu porodicu sa kraćeg puta, a Milica i jednu iz dijaspore (`src/data/caregiverClients.js`). Demo negovateljica Srbije (Milica) radi u inostranstvu, da upit dijaspore ima kome da stigne. Bar polovina srpskih demo negovateljica ima `abroad: true`.
- **Kod negovateljice:** na kartici upita i u profilu klijenta umesto opštine stoje zemlja i grad.

## Odluke donete u izradi (Claude, 16. 11.)

- **`/?demo&kratko`** otvara demo porodicu koja je tražila samo negovateljicu (mali plan), uvezanu sa demo negovateljicom kao i obična. Nije bilo u dizajnu; dodato da se kraći put vidi bez razgovora sa AI-jem.
- **Rečenica za nulu u aplikaciji je kraća od one na nalogu**, jer porodica tada već ima plan: „U vašoj opštini trenutno nemamo negovateljicu" i „Javićemo vam čim se neka prijavi. Do tada vam koordinatorka može pomoći da nađete drugo rešenje.".
- **Uslovi ugovora u Finskoj polaze od uobičajenih sati kad porodica nije rekla sate**, jer forma uslova nema polje za sate. Dizajn je tražio da ostanu prazni.
- **Koji je put izabran čuva se kao podešavanje modula** (`src/data/path.js`, kao tržište u `market.js`), a da li je plan mali čita se iz samih odgovora, pa to znaju svi ekrani, i strana negovateljice.
- **Tržište iz linka za negovateljicu ostaje samo `sr` ili `fi`**; `diaspora` čita samo nalog porodice.

## Šta se još dira

- `docs/patterns.md`: §10 (izbor tržišta i broj ispod opštine na nalogu porodice), §12 (kraći put, dijaspora, kartica „Dopunite plan nege"). Upisuje se pre nego što se obrazac koristi.
- Prevodi (`src/i18n/en`, `src/i18n/fi`) za sve nove rečenice.
- `docs/changes/` za dan izrade.
- Testovi uz podatke: broj po opštini, potreba iz direktnih odgovora, mali plan bez praznih delova, preostala pitanja po putu, filter negovateljica za dijasporu.
- Onboarding (`Immersive*`, `imm-*`) se ovde menja po izričitom zadatku: početni predlog, spisak pitanja po putu i kraći sažetak. Njegov izgled se ne dira.
- Asistent u aplikaciji (`src/lib/planCopilot.js`, `src/components/KitAssistant.jsx`): način rada „dopuna plana".

## Redosled

Na jednoj grani (`porodica-trziste-kraci-put`), redom: deo 1, deo 2, deo 3. Svaki deo radi sam za sebe i može da se pregleda pre sledećeg. Na `main` se spaja kad Branislav kaže.

## Ostavljeno onome ko gradi

- Tačne brojke u `caregiverCounts.js` i koje opštine imaju nulu.
- Tačne rečenice Minnih pitanja 3 i 4 i njihovi kratki oblici.
- Kako asistent upisuje odgovore pri dopuni plana: danas izmene predlaže na potvrdu, a ovde ne sme da traži potvrdu za svako pitanje.
- Kako `buildPlan` deli zajednički deo između malog i celog plana.
- Kako se put (`person.path`) prenosi modelu: spiskom preostalih pitanja, kao i danas.
- Raspored polja na telefonu, po `docs/patterns.md`.
