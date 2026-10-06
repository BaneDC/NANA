# Duge liste: obrasci i stanje

Pravilo je u `docs/patterns.md` §8a (odlučeno 6. 10.): obrazac zavisi od vrste liste. Ovde je svaka lista, obrazac koji dobija i da li je to već primenjeno.

## Obrasci

| Obrazac | Kada | Kako |
|---|---|---|
| **Pregled + „Pogledaj sve"** | deo veće liste na stranici, uz drugi sadržaj | prvih nekoliko, pa dugme vodi na punu listu (stranica ili drawer) |
| **„Prikaži još"** | puna lista koja raste sa vremenom | grupisano po mesecu ili danu, najnovije prvo, pa još 10–20 na istom mestu |
| **Numerisana paginacija** | pretraga i poređenje | shadcn `Pagination`, 10 po strani; samo „Pronađi" |
| **Sve** | kratka lista po prirodi | bez ograničenja |

## Liste

| Lista | Gde | Obrazac | Stanje |
|---|---|---|---|
| Negovateljice | Pronađi negovateljicu | Paginacija, 10 po strani | ✅ primenjeno |
| Poslednja poseta | Moja nega | Pregled: 1, pa „Sve posete" | ✅ primenjeno |
| Posete jedne negovateljice | Njena stranica, kartica „Posete" | Pregled: 10, pa „Pogledaj sve (N)" u drawer | ✅ primenjeno |
| Negovateljice u preporuci | Plan nege | Pregled: 5, pa „Pogledajte još negovateljica" na „Pronađi" | ✅ primenjeno |
| Sve posete (stranica) | Moja nega → „Sve posete" | „Prikaži još", po mesecima | ✅ primenjeno (8 po koraku) |
| **Predstoji** | Moja nega | Pregled: 3–5, pa „Sve posete" | ❌ prikazuje sve zakazane |
| **Sve posete (drawer)** | Njena stranica | „Prikaži još", po mesecima | ❌ prikazuje sve, skroluje se |
| **Šta se desilo (drawer)** | Njena stranica | „Prikaži još", po danima (već grupisano) | ❌ prikazuje sve |
| **Posete i aktivnost klijenta** | Strana negovateljice, stranica klijenta | „Prikaži još", po mesecu ili danu | ❌ prikazuje sve |
| **Istorija razgovora** | Bočni meni | Pregled: 5–10, pa „Prikaži sve" | ❌ prikazuje sve |
| Vaši upiti | Stranica „Vaši upiti" | Sve (sa filterima) | ✅ tako je |
| Planovi nege | Stranica i bočni meni | Sve | ✅ tako je |
| Vaše negovateljice | Moja nega | Sve | ✅ tako je |
| Sve verzije ugovora (drawer) | Njena stranica | Sve | ✅ tako je |
| Čeka na vas | Moja nega | Sve (ono što čeka mora da se vidi) | ✅ tako je |
| Kolone table | Strana negovateljice, tabla | Sve, kolona se skroluje | ✅ tako je |
| Paneli u chatu | Upiti, Posete, Negovateljice | Sve, skroluje se u panelu | ✅ tako je; ako posete porastu, pregled + „Pogledaj sve" |

## Šta ostaje da se uradi

1. **Predstoji** na Mojoj nezi: prvih 3–5, pa „Sve posete". Najverovatnije mesto gde lista naraste.
2. **„Prikaži još"** u drawer-ima „Sve posete" i „Šta se desilo", i u posetama i aktivnosti klijenta na strani negovateljice.
3. **Istorija razgovora** u meniju: poslednjih 5–10, pa „Prikaži sve".
4. Korak „Prikaži još" na stranici „Sve posete" je 8; po pravilu je 10–20. Odlučiti da li se izjednačava.
