import { eur } from '../lib/money';

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
    what: 'medicinska pomagala',
    discount: 5,
  },
};

// Doctors' visits, per reason for contact. Each is one visit someone can book.
const VISITS = {
  fall: [
    { title: 'Pregled fizijatra', who: 'dr Laura Nieminen, fizijatar', price: 140 },
    { title: 'Kućna poseta medicinske sestre posle pada', who: 'Koivu Klinikka, kućna nega', price: 95 },
    { title: 'Denzitometrija — gustina kostiju', who: 'Koivu Klinikka, dijagnostika', price: 120 },
  ],
  memory: [
    { title: 'Pregled neurologa', who: 'dr Mikko Korhonen, neurolog', price: 190 },
    { title: 'Test pamćenja sa psihologom', who: 'Sanna Lehtonen, klinički psiholog', price: 160 },
    { title: 'Krvna slika sa B12 i štitnom žlezdom', who: 'Koivu Klinikka, laboratorija', price: 85 },
  ],
  discharge: [
    { title: 'Kućna poseta lekara opšte prakse', who: 'dr Anna Virtanen', price: 220 },
    { title: 'Usklađivanje terapije sa internistom', who: 'dr Juha Mäkinen, internista', price: 170 },
    { title: 'Kontrolna laboratorija', who: 'Koivu Klinikka, laboratorija', price: 70 },
  ],
  medication: [
    { title: 'Pregled terapije kod interniste', who: 'dr Juha Mäkinen, internista', price: 170 },
    { title: 'EKG i merenje pritiska', who: 'Koivu Klinikka, kardiologija', price: 90 },
  ],
  diagnosis: [
    { title: 'Konsultacija sa specijalistom', who: 'Prema dijagnozi, Koivu Klinikka bira lekara', price: 190 },
    { title: 'Pregled interniste', who: 'dr Juha Mäkinen, internista', price: 170 },
  ],
  default: [
    { title: 'Preventivni pregled za starije', who: 'dr Anna Virtanen, opšta praksa', price: 250 },
    { title: 'Pregled interniste', who: 'dr Juha Mäkinen, internista', price: 170 },
  ],
};

export const visitsFor = (reasonId) => VISITS[reasonId] || VISITS.default;

// Aids, by how she moves. Only what her mobility answer calls for.
export function aidsFor(mobilityId) {
  const aids = [];
  if (mobilityId === 'bed') {
    aids.push(
      { title: 'Antidekubitni dušek', price: 390 },
      { title: 'Trapez za ustajanje iz kreveta', price: 160 }
    );
  } else if (mobilityId && mobilityId !== 'independent') {
    aids.push({ title: 'Hodalica sa točkićima i sedištem', price: 190 });
  }
  aids.push(
    { title: 'Stolica za tuširanje', price: 85 },
    { title: 'Merač pritiska za nadlakticu', price: 75 }
  );
  return aids;
}

// what they pay when the coordinator books it, to the whole euro, the way a
// price list is rounded
export const discounted = (price, percent) => Math.round((price * (100 - percent)) / 100);

export const price = eur;
