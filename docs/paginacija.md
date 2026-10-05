# Duge liste: kako su rešene

Stanje 5. 10. 2026, posle prelaska na shadcn (grana `shadcn-app`). Ništa od ovoga nije menjano u prelasku: spisak samo kaže šta postoji.

## Rešeno

| Lista | Gde | Kako |
|---|---|---|
| Negovateljice | Pronađi negovateljicu | Paginacija, **10 po strani** (shadcn `Pagination`: strelice i brojevi strana) |
| Sve posete | Moja nega → „Sve posete" | **8**, pa „Prikaži još N" dodaje još 8 na istoj stranici |
| Posete jedne negovateljice | Njena stranica, kartica „Posete" | **10**, pa „Pogledaj sve (N)" otvara drawer „Sve posete" |
| Negovateljice u preporuci | Plan nege | **5**, pa „Pogledajte još negovateljica" vodi na „Pronađi" |
| Poslednja poseta | Moja nega | Samo **1**, pa „Sve posete" vodi na stranicu sa svim posetama |

## Nije rešeno (prikazuje se sve)

| Lista | Gde | Napomena |
|---|---|---|
| Predstoji | Moja nega | Sve zakazane posete. Pri dužoj saradnji ih može biti mnogo: **najverovatnije mesto gde fali**. |
| Čeka na vas | Moja nega | Sve što čeka. Obično kratko. |
| Vaše negovateljice | Moja nega | Sve saradnje, i završene. |
| Vaši upiti | Stranica „Vaši upiti" | Svi upiti, sa filterima (čeka, prihvaćeno, odbijeno), bez ograničenja broja. |
| Planovi nege | Stranica i bočni meni | Svi planovi. |
| Istorija razgovora | Bočni meni | Svi razgovori. |
| Sve posete (drawer) | Njena stranica | Sve posete jedne negovateljice, skroluje se. |
| Šta se desilo (drawer) | Njena stranica | Sve stavke po danima, sa filterima; raste sa svakim događajem. |
| Sve verzije ugovora (drawer) | Njena stranica | Sve verzije. Obično ih je malo. |
| Posete i Aktivnost | Strana negovateljice, stranica klijenta | Sve posete i sva aktivnost jedne porodice. |
| Kolone table | Strana negovateljice, tabla | Sve kartice; kolona se skroluje. |
| Paneli u chatu | Upiti, Posete, Negovateljice | Sve, skroluje se u panelu. |

## Za dizajnera

1. Postoje **tri obrasca**: paginacija (Pronađi), „Prikaži još" (Sve posete) i „Pogledaj sve" u drawer-u (njena stranica). U `patterns.md` je opisan samo poslednji, i samo za posete na njenoj stranici. Opšte pravilo (koji obrazac kada, posle koliko stavki) ne postoji.
2. Kandidati za ograničenje, po tome koliko mogu da porastu: **Predstoji** na Mojoj nezi, **„Šta se desilo"**, **Vaši upiti** i **posete i aktivnost kod klijenta** na strani negovateljice.
