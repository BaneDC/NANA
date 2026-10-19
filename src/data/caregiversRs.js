import { msg } from '../i18n';

// Caregivers in Serbia. There the family and the caregiver agree everything by
// phone, so she names no price and the platform keeps no agreement: what the
// family sees of her is who she is, when she can come, and, once she says yes,
// her phone and e-mail (docs/superpowers/specs/2026-10-19-negovateljice-pregled.md).
// One for now, the demo's; part 2 adds the rest and the market's own list.
export const caregiversRs = [
  {
    id: 'milica',
    market: 'RS',
    name: 'Milica Jovanović', // i18n-ignore: a name
    initials: 'MJ',
    phone: '+381 63 555 0101',
    email: 'milica.jovanovic@mail.rs',
    area: 'Vračar, Beograd', // i18n-ignore: a place
    radius: 10,
    rating: 4.8,
    reviews: 23,
    classifications: [],
    languages: [msg('srpski'), msg('engleski')],
    education: msg('Srednja medicinska škola'),
    bio: msg('Šest godina radim sa starijima, najviše sa osobama sa demencijom. Strpljiva sam i volim da se dogovorim sa porodicom oko svega.'),
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    slots: ['morning', 'afternoon'],
  },
];
