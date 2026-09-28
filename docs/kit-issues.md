# Šta treba srediti u inline-chat-kit-u

Stvari koje smo našli u kitu dok smo ga koristili u NANA Prime. Kod nas su zaobiđene, ali im je mesto u kitu.

## „…" meni u headeru ne može da se zatvori (0.59.0)

`Header` ispod 520px širine sklapa akcije u „…" meni (`Tt` u `ChatExperience-*.js`). Meni se zatvara samo na Escape, klik na stavku ili `onBlur` samog menija. To ne pokriva dva najčešća slučaja:

1. **Ponovni tap na „…".** Pritisak premesti fokus sa stavke menija na dugme → meni se zatvori na blur → `onClick` na dugmetu uradi `i(e => !e)` i odmah ga ponovo otvori. Za korisnika: meni ne može da se zatvori.
2. **Tap pored menija.** Na iOS-u tap na nešto što ne prima fokus ne pomera fokus, pa nema blur-a i meni ostaje otvoren.

**Predlog:** zatvaranje na `pointerdown` van menija i dugmeta (document listener dok je meni otvoren), a na dugmetu `onMouseDown={e => open && e.preventDefault()}` da pritisak ne izazove blur.

**Kod nas:** `src/lib/kitMenus.js` radi upravo to spolja. Kad kit ovo popravi, fajl i poziv u `main.jsx` se brišu.

## Dugmad su 38px, a na dodir treba bar 44px

Header akcije i „…" su 38px (`size="m"`). Na telefonu je minimum za tap 44px (Apple HIG; WCAG 2.5.5). Predlog: na `(pointer: coarse)` dugmad kita idu na 44px, kao što font već ide na 16px.

**Kod nas:** prepisano u `app.css` na `(pointer: coarse)`.

## Docked chat: sve se pomera kad se pošalje poruka (0.59.0)

Header i input jesu fiksirani (`composer="docked"`, `fill="container"`) — to radi. Ono što „skače" je model slanja, izmereno na desktopu u Razgovoru i u bočnom panelu asistenta:

1. **Poruka putuje.** Posle Enter-a pojavi se kao mehurić iznad inputa, pa preleti na vrh konverzacije. Dok leti, `…` se već učitava gore — dve stvari se kreću u suprotnim smerovima.
2. **Konverzacija skoči.** Novo pitanje se kači na vrh (`anchorOffset`), pa prethodni odgovor izleti sa ekrana u jednom koraku (scrollTop 0 → 444). Ispod pitanja ostaje prazan prostor rezervisan za odgovor, koji se skupi kad odgovor stigne (scrollHeight 1508 → 1188).
3. **Naslov u headeru se menja** u tekst pitanja koje se trenutno čita, umesto naslova koji host zada („Asistent", „Razgovor").
4. **Input se pomeri ~15px** nagore pri slanju i vrati kad stigne odgovor (828 → 813 → 828).

Nijedno od ovoga ne može da se isključi propovima: `animationConfig` menja samo opruge, a `anchorOffset` samo koliko ispod vrha pitanje staje.

**Predlog — klasičan način rada kao opcija:**
- poruka se doda na kraj, a feed se glatko spusti do dna, bez rezervisanog praznog prostora (npr. `anchor="end"`);
- poruka se pojavi na svom mestu u konverzaciji, a input se samo isprazni — bez leta (npr. `bubbleTravel={false}`);
- naslov u headeru ostaje onaj koji je host zadao;
- input iste visine pre, tokom i posle slanja.
