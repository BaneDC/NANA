import { msg } from '../i18n';

// The personality test of the Serbian sign-up: in each pair of traits she
// picks the one that describes her better. The twelve traits and their
// definitions are the live platform's (a screenshot, 19. 10.). The real 62
// pairs are still to come from the team: until then the first six are the ones
// the screenshot shows and the rest are the other pairs of the same twelve, in
// a fixed order (docs/superpowers/specs/2026-10-19-registracija-negovateljice-design.md).
export const TRAITS = [
  { id: 'warm', name: msg('srdačna osoba'), text: msg('Neposredna, lako izražava svoju simpatiju prema drugima.') },
  { id: 'adventurous', name: msg('sklona pustolovini'), text: msg('Uživa u promenama. Privlači je sve što je novo i uzbudljivo.') },
  { id: 'resentful', name: msg('ozlojeđena'), text: msg('Razdražljiva, naprasita, prgava, lako plane. Lako izražava osećanje besa.') },
  { id: 'shy', name: msg('stidljiva'), text: msg('Bojažljiva je u prisustvu novih ljudi i u novim situacijama.') },
  { id: 'impulsive', name: msg('nagla'), text: msg('Reaguje trenutno, ne razmišljajući o posledicama. Lako izražava svoja osećanja.') },
  { id: 'gloomy', name: msg('potištena'), text: msg('Često je neraspoložena, tmurna i razočarana.') },
  { id: 'careful', name: msg('oprezna'), text: msg('Vodi računa o svom ponašanju, jer se boji da joj se ne dogodi nešto nepredviđeno i neprijatno.') },
  { id: 'brooding', name: msg('grize se u sebi'), text: msg('Muči je nezadovoljstvo, a ne može da ga otvoreno izrazi. Često je mrzovoljna.') },
  { id: 'sociable', name: msg('društvena'), text: msg('Prijatno joj je sa drugim ljudima. Voli da bude u društvu.') },
  { id: 'argumentative', name: msg('sklona prepirci'), text: msg('Skoro uvek traži dokaze, pa to izaziva raspravljanje.') },
  { id: 'obedient', name: msg('poslušna'), text: msg('Najčešće bez protivljenja učini ono što se od nje traži.') },
  { id: 'insecure', name: msg('nesigurna u sebe'), text: msg('Od silne brige kakav će utisak ostaviti može da bude neuspešna, a sobom nezadovoljna.') },
];

const FIRST = [
  ['warm', 'adventurous'],
  ['resentful', 'shy'],
  ['impulsive', 'adventurous'],
  ['gloomy', 'resentful'],
  ['impulsive', 'careful'],
  ['brooding', 'careful'],
];
const key = ([a, b]) => [a, b].sort().join('|');
const seen = new Set(FIRST.map(key));
const REST = [];
TRAITS.forEach((a, i) => TRAITS.slice(i + 1).forEach((b) => !seen.has(key([a.id, b.id])) && REST.push([a.id, b.id])));

export const PAIRS = [...FIRST, ...REST].slice(0, 62);
export const traitOf = (id) => TRAITS.find((x) => x.id === id);
