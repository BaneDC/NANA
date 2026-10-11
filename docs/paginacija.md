# Duge liste: obrasci i stanje

Pravilo je u `docs/patterns.md` §8a (odlučeno 6. 10.): lista duža od onoga što prvo pokazuje dobija „Prikaži još", koje dodaje po 10 na istom mestu. Nikad drawer ni druga stranica za ostatak. Numerisana paginacija je samo na „Pronađi". **Izuzetak je početna** (odlučeno 12. 10., `docs/patterns.md` §4a): kartica pokazuje najviše 3 reda, a dugme u glavi kartice otvara drawer sa svima.

## Liste

| Lista | Gde | Obrazac | Stanje |
|---|---|---|---|
| Negovateljice | Pronađi negovateljicu | Paginacija, 10 po strani | ✅ |
| Predstoji | Moja nega | 3, najbliže prvo; „Sve zakazane" u glavi otvara drawer „Zakazane posete" (10, pa „Prikaži još") | ✅ |
| Posete jedne negovateljice | Njena stranica, kartica „Posete" | 10, pa „Prikaži još" po 10 (drawer „Sve posete" uklonjen) | ✅ |
| Sve posete | Moja nega → „Sve posete" | 10, pa „Prikaži još" po 10; zakazano na vrhu, pa po mesecima | ✅ |
| Šta se desilo (drawer) | Njena stranica | 10, pa „Prikaži još" po 10; po danima | ✅ |
| Posete i aktivnost klijenta | Strana negovateljice, stranica klijenta | 10, pa „Prikaži još" po 10 | ✅ |
| Istorija razgovora | Bočni meni | 5, pa „Prikaži još" po 10; otvoreni razgovor se uvek vidi | ✅ |
| Poslednja poseta | Moja nega | 1; „Sve posete" u glavi otvara drawer „Sve posete" | ✅ |
| Negovateljice u preporuci | Plan nege | 5; „Pogledajte još negovateljica" je veza na „Pronađi" (pretraga) | ✅ |
| Moji upiti | Stranica „Moji upiti" | Sve (sa filterima) | ✅ |
| Vaše negovateljice | Moja nega | 3, prvo one koje dolaze; „Sve negovateljice" u glavi otvara drawer | ✅ |
| Ponude partnera | Moja nega | 3; „Sve ponude" u glavi otvara drawer | ✅ |
| Sve verzije ugovora (drawer) | Njena stranica | Sve | ✅ |
| Čeka na vas | Moja nega | Sve (ono što čeka mora da se vidi) | ✅ |
| Kolone table | Strana negovateljice, tabla | Sve, kolona se skroluje | ✅ |
| Paneli u chatu | Upiti, Posete, Negovateljice | Sve, skroluje se u panelu | ✅ |

## Kako se proverava

U galeriji (`/?kartice`) je sekcija **„Duge liste"**: ista porodica godinu dana kasnije (7 zakazanih poseta, 59 poseta, 35 događaja). Na njoj se na početnoj vide kartice sa po 3 reda i dugmetom u glavi (8 zakazanih poseta, 5 negovateljica, 5 ponuda), svako otvara svoj drawer. Tu su i „Sve posete", posete na njenoj stranici i „Šta se desilo", svaki sa „Prikaži još 10".
