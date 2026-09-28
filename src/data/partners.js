// The partners a care plan sends people to, and what each of them costs.
//
// Medigroup is a real partner and does the doctors' visits. Everyone else here is
// invented for the prototype, and so are the doctors' names and every price — they
// are shaped like the real thing so the card can be judged, and get replaced when
// the contracts are known.
//
// The discount is the reason to book through us: the coordinator books it, the
// partner gives the family a lower price. Not every recommendation has one — the
// changes around the flat are advice, not a purchase — so only these do.

export const PARTNERS = {
  medigroup: {
    name: 'Medigroup',
    logo: '/partners/medigroup.png',
    discount: 10,
  },
  oslonac: {
    name: 'Oslonac',
    what: 'medicinska pomagala',
    discount: 5,
  },
};

// Doctors' visits, per reason for contact. Each is one visit someone can book.
const VISITS = {
  fall: [
    { title: 'Pregled fizijatra', who: 'dr Jelena Marković, fizijatar', price: 4200 },
    { title: 'Kućna poseta medicinske sestre posle pada', who: 'Medigroup patronaža', price: 3500 },
    { title: 'Denzitometrija — gustina kostiju', who: 'Medigroup dijagnostika', price: 3900 },
  ],
  memory: [
    { title: 'Pregled neurologa', who: 'dr Nikola Stanković, neurolog', price: 5200 },
    { title: 'Test pamćenja sa psihologom', who: 'Milica Ilić, klinički psiholog', price: 3800 },
    { title: 'Krvna slika sa B12 i štitnom žlezdom', who: 'Medigroup laboratorija', price: 2900 },
  ],
  discharge: [
    { title: 'Kućna poseta lekara opšte prakse', who: 'dr Ana Jovanović', price: 6500 },
    { title: 'Usklađivanje terapije sa internistom', who: 'dr Marko Đorđević, internista', price: 4800 },
    { title: 'Kontrolna laboratorija', who: 'Medigroup laboratorija', price: 2600 },
  ],
  medication: [
    { title: 'Pregled terapije kod interniste', who: 'dr Marko Đorđević, internista', price: 4800 },
    { title: 'EKG i merenje pritiska', who: 'Medigroup kardiologija', price: 1900 },
  ],
  diagnosis: [
    { title: 'Konsultacija sa specijalistom', who: 'Prema dijagnozi, Medigroup bira lekara', price: 5500 },
    { title: 'Pregled interniste', who: 'dr Marko Đorđević, internista', price: 4800 },
  ],
  default: [
    { title: 'Preventivni pregled za starije', who: 'dr Ana Jovanović, opšta praksa', price: 8900 },
    { title: 'Pregled interniste', who: 'dr Marko Đorđević, internista', price: 4800 },
  ],
};

export const visitsFor = (reasonId) => VISITS[reasonId] || VISITS.default;

// Aids, by how she moves. Only what her mobility answer calls for.
export function aidsFor(mobilityId) {
  const aids = [];
  if (mobilityId === 'bed') {
    aids.push(
      { title: 'Antidekubitni dušek', price: 18900 },
      { title: 'Trapez za ustajanje iz kreveta', price: 6900 }
    );
  } else if (mobilityId && mobilityId !== 'independent') {
    aids.push({ title: 'Hodalica sa točkićima i sedištem', price: 7900 });
  }
  aids.push(
    { title: 'Stolica za tuširanje', price: 5400 },
    { title: 'Merač pritiska za nadlakticu', price: 4600 }
  );
  return aids;
}

// what they pay when the coordinator books it, rounded the way a price list is
export const discounted = (price, percent) => Math.round((price * (100 - percent)) / 100 / 10) * 10;

export const rsd = (n) => `${n.toLocaleString('sr-RS')} RSD`;
