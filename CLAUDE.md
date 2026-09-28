# NANA Prime — uputstvo za agente

React 18 + Vite prototip (porodica i negovateljica). Na njemu rade dvoje ljudi i njihovi agenti. Ovaj fajl važi za oba.

## Interfejs: `docs/patterns.md` je obavezan

Pre svake izmene interfejsa pročitaj `docs/patterns.md` i prati ga doslovno. To je specifikacija, a ne predlog. Najvažnije iz nje:

- **Jedna kartica** (`.panel-card`: r24, p16, gap 8). Naslov kartice je 14px (`.doc-section-title`), a naslov grupe 12px sivo (`.section-title`).
- **Koncentrični uglovi:** spoljni radius = unutrašnji radius + padding. Radiusi su samo 4 / 8 / 16 / 24 / 32, a razmaci deljivi sa 4.
- **Stavka unutar kartice je red**, nikad kutija sa ivicom ili senkom (§6).
- **Kartica ili red koji otvara detalje je ceo klikabilan** (`.is-clickable` + `.card-link`). Na telefonu takva kartica nema dugme, nego strelicu; akcija je u detaljima (§7).
- **Dugmad:** `primary` za dodavanje i menjanje, `secondary` za gašenje i otkazivanje, `danger` samo za brisanje. Na dodir sve ima najmanje 44px.
- **Polja** su samo iz `src/components/TextField.jsx`.
- **Bez velikih slova.** Onboarding (`Immersive*`, `imm-*`) ima svoj jezik i ne dira se bez izričitog zadatka.
- **Ikonice (§11):** u Podešavanjima dugme sa tekstom nema ikonicu. Van Podešavanja odluka je na čekanju, pa ih ne dodaj i ne uklanjaj.
- **Obrazac koji ne postoji** prvo se upiše u `docs/patterns.md`, pa se tek onda koristi.
- **Posle izmene** pokreni proveru iz §13 na desktopu i na 375×812. Očekuje se nula prekršaja.

Sve se meri u pregledaču (izračunate vrednosti), a ne od oka.

## Rad u timu

- **Pre početka povuci `main`.** Pre push-a opet povuci.
- **Novi posao ide na novu granu.** Na `main` se spaja samo kad to kaže čovek.
- **Pre izmene koja prolazi kroz više fajlova ili menja pravilo** (čišćenje, preimenovanje, primena obrasca svuda) pogledaj šta je druga osoba skoro radila u tim fajlovima (`git log -p` od poslednjeg rada, i njene stavke u `docs/changes/`). Ako bi izmena poništila nešto njeno, prvo pitaj.
- **Svaki dan upiši šta je promenjeno** u `docs/changes/GGGG-MM-DD.md`, na srpskom, da druga osoba posle pull-a zna šta je novo.
- **Problemi u `inline-chat-kit`-u** se opisuju u `docs/kit-issues.md` (šta, gde, merenje, predlog). Popravljaju se u kitu, a kod nas samo zaobilaze.
- **API ključ** je samo u `.env.local` (u `.gitignore`). Nikad se ne ispisuje i ne commit-uje.
