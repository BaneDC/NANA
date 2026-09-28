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
