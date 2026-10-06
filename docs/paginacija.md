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
| Sve posete (stranica) | Moja nega → „Sve posete" | „Prikaži još" po 20, po mesecima (zakazano na vrhu) | ✅ primenjeno |
| Predstoji | Moja nega | Pregled: 3, najbliže prvo, pa „Pogledaj sve (N)" na Posete | ✅ primenjeno |
| Sve posete (drawer) | Njena stranica | „Prikaži još" po 20 (otvorene prve, kao i do sada) | ✅ primenjeno |
| Šta se desilo (drawer) | Njena stranica | „Prikaži još" po 20, po danima | ✅ primenjeno |
| Posete i aktivnost klijenta | Strana negovateljice, stranica klijenta | „Prikaži još" po 10 (deo stranice) | ✅ primenjeno |
| Istorija razgovora | Bočni meni | Poslednjih 5, pa „Prikaži sve (N)" / „Prikaži manje"; otvoreni razgovor se uvek vidi | ✅ primenjeno |
| Vaši upiti | Stranica „Vaši upiti" | Sve (sa filterima) | ✅ tako je |
| Planovi nege | Stranica i bočni meni | Sve | ✅ tako je |
| Vaše negovateljice | Moja nega | Sve | ✅ tako je |
| Sve verzije ugovora (drawer) | Njena stranica | Sve | ✅ tako je |
| Čeka na vas | Moja nega | Sve (ono što čeka mora da se vidi) | ✅ tako je |
| Kolone table | Strana negovateljice, tabla | Sve, kolona se skroluje | ✅ tako je |
| Paneli u chatu | Upiti, Posete, Negovateljice | Sve, skroluje se u panelu | ✅ tako je; ako posete porastu, pregled + „Pogledaj sve" |

## Kako se proverava

U galeriji (`/?kartice`) je sekcija **„Duge liste"**: ista porodica godinu dana kasnije (7 zakazanih poseta, 59 poseta, 35 događaja). Na njoj se vide Predstoji sa „Pogledaj sve (7)", „Sve posete" po 20 i drawer-i „Sve posete" i „Šta se desilo" sa „Prikaži još".
