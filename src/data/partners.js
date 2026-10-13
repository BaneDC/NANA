import { eur } from '../lib/money';
import { msg, t } from '../i18n';

// The partners a care plan sends people to, and what each of them costs.
//
// The demo is a family in Helsinki, so the partners are Finnish, and all of them
// are invented for the prototype: Koivu Klinikka, Tukiväline, the doctors'
// names and every price. The prices are shaped like Helsinki's private clinics
// and aid shops so the card can be judged, and get replaced when real partners
// and contracts are known. (In Serbia the doctors' partner is Medigroup.)
//
// The discount is the reason to book through us: the coordinator books it, the
// partner gives the family a lower price. Not every recommendation has one — the
// changes around the flat are advice, not a purchase — so only these do.

export const PARTNERS = {
  koivu: {
    name: 'Koivu Klinikka',
    logo: '/partners/koivu-klinikka.png',
    discount: 10,
  },
  tukivaline: {
    name: 'Tukiväline',
    what: msg('medicinska pomagala'),
    discount: 5,
  },
};

// Doctors' visits, per reason for contact. Each is one visit someone can book.
const VISITS = {
  fall: [
    { title: msg('Pregled fizijatra'), who: msg('dr Laura Nieminen, fizijatar'), price: 140 },
    { title: msg('Kućna poseta medicinske sestre posle pada'), who: msg('Koivu Klinikka, kućna nega'), price: 95 },
    { title: msg('Denzitometrija - gustina kostiju'), who: msg('Koivu Klinikka, dijagnostika'), price: 120 },
  ],
  memory: [
    { title: msg('Pregled neurologa'), who: msg('dr Mikko Korhonen, neurolog'), price: 190 },
    { title: msg('Test pamćenja sa psihologom'), who: msg('Sanna Lehtonen, klinički psiholog'), price: 160 },
    { title: msg('Krvna slika sa B12 i štitnom žlezdom'), who: msg('Koivu Klinikka, laboratorija'), price: 85 },
  ],
  discharge: [
    { title: msg('Kućna poseta lekara opšte prakse'), who: msg('dr Anna Virtanen'), price: 220 },
    { title: msg('Usklađivanje terapije sa internistom'), who: msg('dr Juha Mäkinen, internista'), price: 170 },
    { title: msg('Kontrolna laboratorija'), who: msg('Koivu Klinikka, laboratorija'), price: 70 },
  ],
  medication: [
    { title: msg('Pregled terapije kod interniste'), who: msg('dr Juha Mäkinen, internista'), price: 170 },
    { title: msg('EKG i merenje pritiska'), who: msg('Koivu Klinikka, kardiologija'), price: 90 },
  ],
  diagnosis: [
    { title: msg('Konsultacija sa specijalistom'), who: msg('Prema dijagnozi, Koivu Klinikka bira lekara'), price: 190 },
    { title: msg('Pregled interniste'), who: msg('dr Juha Mäkinen, internista'), price: 170 },
  ],
  default: [
    { title: msg('Preventivni pregled za starije'), who: msg('dr Anna Virtanen, opšta praksa'), price: 250 },
    { title: msg('Pregled interniste'), who: msg('dr Juha Mäkinen, internista'), price: 170 },
  ],
};

// in the language being read: the plan keeps them as they were when it was built
const said = (item) => ({ ...item, title: t(item.title), ...(item.who ? { who: t(item.who) } : {}) });

export const visitsFor = (reasonId) => (VISITS[reasonId] || VISITS.default).map(said);

// Aids, by how she moves. Only what her mobility answer calls for.
export function aidsFor(mobilityId) {
  const aids = [];
  if (mobilityId === 'bed') {
    aids.push(
      { title: msg('Antidekubitni dušek'), price: 390 },
      { title: msg('Trapez za ustajanje iz kreveta'), price: 160 }
    );
  } else if (mobilityId && mobilityId !== 'independent') {
    aids.push({ title: msg('Hodalica sa točkićima i sedištem'), price: 190 });
  }
  aids.push(
    { title: msg('Stolica za tuširanje'), price: 85 },
    { title: msg('Merač pritiska za nadlakticu'), price: 75 }
  );
  return aids.map(said);
}

// what they pay when the coordinator books it, to the whole euro, the way a
// price list is rounded
export const discounted = (price, percent) => Math.round((price * (100 - percent)) / 100);

export const price = eur;
