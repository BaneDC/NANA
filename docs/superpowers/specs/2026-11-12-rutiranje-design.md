# Rutiranje: svaka stranica ima svoju adresu

12. 11. 2026, Branislav. Dizajn za izradu; plan se piše posle odobrenja.

## Zašto

Cela aplikacija je danas na jednoj adresi (`/`). Koji je ekran otvoren zna samo memorija (`view` u `App.jsx`, `openId` u `CaregiverApp.jsx`, `screen` u `caregiver/SignUp.jsx`, `who` / `mode` / `forgot` u `Register.jsx`). Zato browser „back" izlazi iz aplikacije, osvežavanje vraća na početnu, a link na stranicu ne postoji.

Hoćemo da se kroz aplikaciju ide i browser back-om, pa da „Nazad" dugmad jednog dana mogu skoro svuda da nestanu. **To se ne radi sada:** nijedno dugme se ne uklanja, samo se popiše gde se pojavljuju, da Branislav i dizajner odluče (posebno za telefon, gde se browser back slabo vidi).

## Ciljevi

- Svaka stranica i svaki korak prijave i registracije imaju svoju adresu.
- Browser back i forward idu kroz te adrese i rade isto što i naša dugmad „Nazad".
- Osvežavanje ostaje na istoj stranici (u demo-u; vidi „Pravila").
- Spisak svih „Nazad" dugmadi za dizajnera.

## Nije cilj

- **Drawer-i i modali nemaju adresu** (odluka Branislava). Otvaraju se i zatvaraju kao do sada.
- **Porodični AI onboarding je jedna adresa** (`/onboarding`), a ne pitanje po pitanje. **Test ličnosti je jedna adresa**, ne par po par (odluka Branislava).
- Ne uklanja se nijedno „Nazad" dugme. Ne menja se izgled.
- Razgovori asistenta (`c1`, `c2`…) ne dobijaju svoje adrese: žive samo u memoriji i ne preživljavaju osvežavanje.

## Šta bi bio promašaj

- Back koji vodi negde gde naše „Nazad" ne bi (npr. iz aplikacije nazad u formu registracije, ili na prazan ekran).
- Adresa koja se ne poklapa sa ekranom (osvežiš i dobiješ nešto drugo, bez preusmeravanja).
- Izgubljen rad: back u prijavi koji briše upisano.
- Pokvaren postojeći tok (demo ulaz `?demo=…&trziste=…`, promena jezika na prvom ekranu prijave, `/?kartice`).

## Adrese (odluka: na engleskom, iste za sva tri jezika)

Imena prate postojeća imena ekrana u kodu.

### Pre prijave

| Adresa | Ekran (danas) |
|---|---|
| `/signup` | „Ko ste?" (`Register` › `SignUp`, `who === null`) |
| `/signup/family` | registracija porodice (`who === 'family'`) |
| `/signup/caregiver` | „Gde želite da radite?", sa jezikom (`screen === 'country'`) |
| `/signup/caregiver/account` | nalog (`'account'`) |
| `/signup/caregiver/form` | forma u delovima (`'form'`; delovi nemaju svoje adrese) |
| `/signup/caregiver/review` | pregled (`'review'`) |
| `/signup/caregiver/documents` | dokumenti, samo Finska kad treba sertifikat (`'documents'`) |
| `/signup/caregiver/test` | test ličnosti, samo Srbija (`'test'`) |
| `/signup/caregiver/interview` | „Zakažite razgovor" (`'interview'`) |
| `/signup/caregiver/thanks` | „Hvala!" (`'thanks'`) |
| `/signin` | prijava (`mode === 'sign-in'`) |
| `/signin/verify` | drugi korak prijave, 2FA (`TwoFactorStep`, `pending`) |
| `/signin/reset` | „Nova lozinka" (`forgot`); „Proverite email" je ista adresa |

### Porodica

| Adresa | Ekran (`view` u `App.jsx`) |
|---|---|
| `/onboarding` | AI onboarding preko celog ekrana (`variant === 'ai'`) |
| `/chat` | Razgovor (`'chat'`) |
| `/dashboard` | Moja nega (`'dashboard'`) |
| `/caregivers/:id` | stranica negovateljice (`'caregiver'` + `openCaregiver`) |
| `/requests` | Moji upiti (`'requests'`) |
| `/find-caregiver` | Pronađi negovateljicu (`'find-caregiver'`) |
| `/record` | karton (`'record'`) |
| `/settings` | Podešavanja (`'settings'`) |

### Negovateljica (`CaregiverApp.jsx`)

| Adresa | Ekran |
|---|---|
| `/board` | Tabla (Finska) |
| `/requests` | Upiti (Srbija) |
| `/clients` | Klijenti (Finska) |
| `/clients/:id` | klijent ili upit (`'client'` + `openId`; Srbija i Finska) |
| `/earnings` | Zarada |
| `/profile` | Moj profil |
| `/settings` | Podešavanja |

`/requests` i `/settings` znače svoj ekran po ulozi koja je prijavljena.

`/` vodi na početnu uloge: neprijavljen → `/signup`, porodica → `/dashboard` (ili `/onboarding` dok plan ne postoji, kao danas), negovateljica → `/board` (Finska) ili `/requests` (Srbija). Preusmeravanje zamenjuje adresu (`replace`), ne dodaje korak u istoriju.

## Pravila

1. **Svaki prelaz na drugu stranicu ili korak dodaje korak u istoriju** (push). Back vraća prethodnu adresu i ekran se crta po njoj. Isto rade sva postojeća dugmad (meni, kartice, „Nazad", „Dalje"): ona samo menjaju adresu.
2. **Postojeća „Nazad" dugmad ostaju i vode na isto mesto kao danas.** Ako je prethodni korak u istoriji baš to mesto, „Nazad" ide jedan korak nazad (kao browser back), da posle njega browser back ne bi vodio napred na stranicu sa koje se izašlo. Ako nije (stranica otvorena iz linka, pa pre nje nema ničega), dodaje nov korak ka tom mestu. *(Odluka Claude-a.)*
3. **„Nazad" kod klijenta kaže odakle se došlo** („Tabla" ili „Klijenti"). Danas to pamti `from`; posle se to čuva uz korak istorije (history state), a bez njega je „Tabla".
4. **Ulazak u aplikaciju posle prijave ili registracije zamenjuje adresu** (`replace`), da back sa početne ne vodi u formu. Prijavljen korisnik koji ipak stigne na `/signup…` ili `/signin…` (back kroz stariju istoriju) preusmerava se na svoju početnu.
5. **Neprijavljen na adresi iz aplikacije** ide na `/signin`; posle prijave na svoju početnu (ne pamti se gde je hteo; to je moguće proširenje).
6. **Nepoznata adresa, ili adresa druge uloge ili tržišta** (`/board` za porodicu, `/documents` u Srbiji, `/clients/x` koji ne postoji) preusmerava se na početnu uloge, sa `replace`.
7. **Prijava negovateljice čuva upisano kroz back i forward**, jer forma ostaje u memoriji dok se ide kroz korake. **Prijava se nastavlja gde je stala, i posle osvežavanja i posle zatvorenog pregledača** (odluka Branislava, 12. 11.; na produkciji to radi link iz mejla koji važi nedelju dana, u prototipu bez mejla): forma (nalog, delovi, test, dokumenti po imenu fajla, kanal) i poslednji provereni korak čuvaju se u `localStorage` tog pregledača, najviše 7 dana, dok se prijava ne pošalje. Kad se negovateljica vrati (bilo koja adresa `/signup/caregiver…`, ili „Negovateljica" na „Ko ste?"), otvara se taj korak sa upisanim. Posle slanja, ili posle 7 dana, nacrt se briše. Korak koji se otvori bez sačuvanih podataka (nov tab, ili `/signup/caregiver/thanks` bez slanja) vraća se na prvi korak, `/signup/caregiver`, sa `replace`. Forward ne preskače proveru: korak dalje od poslednjeg proverenog vraća se na poslednji provereni. **Posle slanja prijave** („Zakaži razgovor") `/signup/caregiver/thanks` zamenjuje adresu, a koraci pre njega se preusmeravaju na „Hvala!", da se poslata prijava ne otvara ponovo za izmenu. *(Odluka Claude-a.)*
8. **Osvežavanje:** demo ostaje na istoj adresi (uloga i tržište su u `sessionStorage`, stanje u `localStorage`). Pravi nalog se ni danas ne pamti posle osvežavanja, pa ide na `/signin` (pravilo 5).
9. **Drawer ili modal otvoren pri back-u** se zatvara zajedno sa stranicom, kao kad bi se kliknulo na meni. Nema svoj korak u istoriji.
10. **Demo ulaz** `?demo=…&trziste=…` ostaje u adresi na svakoj stranici (prelazi menjaju samo putanju, upit ostaje), pa se demo prepoznaje kao danas, osvežavanje ostaje demo, a ista kartica bez `?demo` i dalje vodi na pravu registraciju. Jednokratni `&puno` se posle prvog čitanja skida. `/?kartice` (galerija kartica) ostaje kako jeste. *(Odluka Claude-a.)*
11. **Promena jezika** ponovo crta aplikaciju (`key={lang}`), a adresa ostaje, pa negovateljica ostaje na `/signup/caregiver`. Trik sa `sessionStorage` `nana.signup` u `Register.jsx` i `SignUp.jsx` tada nije potreban.
12. **Skrol:** nova stranica počinje od vrha; back ne mora da vrati skrol gde je bio (moguće proširenje).
13. **Naslov taba** se ne menja po stranici (moguće proširenje).
14. **Porodica bez plana ne vidi aplikaciju** (odluka Branislava, 12. 11.): dok onboarding ne napravi plan (summary na kraju razgovora), nema menija ni stranica. Svaka adresa porodice (`/chat`, `/dashboard`…) tada vodi na `/onboarding` (`replace`). Stanje „Razgovor" sa „Upoznavanje nije završeno" i „Nastavite razgovor" (`App.jsx`) se uklanja. Prozor za API ključ (samo prototip) je deo `/onboarding`; „Odustani" u njemu vodi na prijavu (`/signin`), a ne u aplikaciju. Kad plan postoji, `/onboarding` vodi na `/dashboard`, a završetak razgovora menja adresu (`replace`), pa back ne vraća u završen razgovor.

15. **Onboarding porodice se takođe nastavlja gde je stala** (odluka Branislava, 12. 11.). To već postoji: odgovori se čuvaju uz nalog (`saveProgress` / `loadProgress`, `src/lib/account.js`), a ponovna prijava naloga bez plana otvara onboarding sa sačuvanim odgovorima, i posle zatvorenog pregledača. Sa rutiranjem to ostaje tako. Treba proveriti da Minna nastavlja od prvog pitanja bez odgovora, a ne od početka; ako ne, popravlja se u ovom poslu.

## Izrada (odluke i šta je prepušteno)

- **Bez nove biblioteke** (odluka Claude-a, Branislav može da promeni): mala sopstvena kuka nad History API-jem (`pushState`, `replaceState`, `popstate`), npr. `src/lib/route.js` sa `parse(path) → { page, id }` i `href(page, id)`, i `useRoute()` koja vraća trenutnu adresu i `navigate(to, { replace, state })`. Aplikacija je već građena oko `view`, pa se `view` i `openId` / `openCaregiver` / `screen` / `who` / `mode` / `forgot` / `pending` izvode iz adrese umesto da žive u `useState`. React Router bi tražio prepravku strukture za isti rezultat.
- **Vercel:** sve adrese moraju da vrate `index.html` (rewrite u `vercel.json`; `middleware.js` sa lozinkom i dalje ide na svaki zahtev). Vite dev to već radi.
- **Kako se kod deli i kojim redom** prepušteno je planu. Predlog reda: kuka i tabela adresa → negovateljica → porodica → prijava i registracija.
- **Provera:** testovi (vitest) za `parse` / `href` i za preusmeravanja (pravila 4–7); puppeteer na 1440 i 375 za svaku adresu: otvori je direktno, klikni dalje, back, forward, osveži. Uz to §13 provera na stranicama koje su menjane, i `scripts/i18n-missing.mjs` 0.
- **Grana:** `rutiranje`, ne `main`. Spaja se kad Branislav kaže.
- **Upis:** `docs/changes/` za taj dan. U `docs/patterns.md` §4 (stranica) kratko pravilo: svaka stranica ima adresu, back browser-a je isto što i „Nazad".

## Spisak „Nazad" dugmadi (za dizajnera, ništa se ne uklanja)

Upisuje se u `docs/changes/` za taj dan, u „Za dizajnera", u obliku tabele: gde je, kako izgleda, kuda vodi, šta bi browser back uradio umesto njega. Polazni spisak (da se proveri u kodu i dopuni):

- **Stranice:** `BackButton` na stranici negovateljice (porodica, „Moja nega"), na stranici klijenta (Finska, „Tabla" / „Klijenti") i na stranici upita (`ClientProfile`, „Upiti" / „Tabla" / „Klijenti").
- **Koraci prijave negovateljice:** „Nazad" na „Gde želite da radite?", na nalogu, na posle-pregleda stranama (`pageButtons` u `SignUp.jsx`), u testu ličnosti (dva mesta u `PersonalityTest.jsx`).
- **Prijava i registracija:** „Nazad na prijavu" (nova lozinka, poslat link; i u `CardGallery`), povratak iz 2FA koraka, iz prijave negovateljice na „Ko ste?".
- **Ne ulaze u spisak stranica, ali da se vide:** „Nazad" unutar drawer-a i modala (`FamilyDrawer`, `caregiver/Forms.jsx`, `ProfileForms.jsx`, `TwoFactorSetup`, `ApiKeyPanel`, `PaywallModal` „Nazad na poruku"). To su koraci unutar prozora, nemaju adresu, i browser back ih ne zamenjuje.
