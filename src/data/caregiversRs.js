import { msg } from '../i18n';

// Caregivers in Serbia. There the family and the caregiver agree everything by
// phone, so she names no price and the platform keeps no agreement: what the
// family sees of her is who she is, when and how she can work, and, once she
// says yes, her phone and e-mail
// (docs/superpowers/specs/2026-10-19-porodica-srbija-design.md).
//
// The fields of the Serbian sign-up: a certificate from an accredited school
// (yes or no), courses, and the kind of work (`daily` visits or shifts,
// `shift24`). No classifications and no hourly range. Days are 0 (Monday) to 6.
const rs = (c) => ({ market: 'RS', classifications: [], ...c });

export const caregiversRs = [
  rs({
    id: 'milica',
    name: 'Milica Jovanović', // i18n-ignore
    initials: 'MJ',
    match: 96,
    rating: 4.8,
    reviews: 23,
    area: 'Vračar, Beograd', // i18n-ignore
    radius: 10,
    phone: '+381 63 555 0101',
    email: 'milica.jovanovic@mail.rs',
    certificate: true,
    courses: msg('Nega osoba sa demencijom'),
    engagement: ['daily'],
    languages: [msg('srpski'), msg('engleski')],
    education: msg('Srednja medicinska škola'),
    bio: msg('Šest godina radim sa starijima, najviše sa osobama sa demencijom. Strpljiva sam i volim da se dogovorim sa porodicom oko svega.'),
    days: [0, 1, 2, 3, 4],
    slots: ['morning', 'afternoon'],
  }),
  rs({ id: 'dragana', name: 'Dragana Nikolić', initials: 'DN', match: 94, rating: 4.9, reviews: 41, area: 'Zvezdara, Beograd', radius: 15, phone: '+381 64 210 3344', email: 'dragana.nikolic@mail.rs', certificate: true, courses: msg('Prva pomoć'), engagement: ['daily', 'shift24'], languages: [msg('srpski')], education: msg('Srednja medicinska škola'), bio: msg('Medicinska sestra u penziji. Radila sam dvadeset godina na gerijatriji, a sada negujem starije kod kuće.'), days: [0, 1, 2, 3, 4, 5], slots: ['morning', 'afternoon', 'evening'] }), // i18n-ignore
  rs({ id: 'snezana', name: 'Snežana Petrović', initials: 'SP', match: 91, rating: 4.7, reviews: 18, area: 'Novi Beograd', radius: 20, phone: '+381 65 300 7788', email: 'snezana.petrovic@mail.rs', certificate: false, courses: '', engagement: ['shift24'], languages: [msg('srpski'), msg('ruski')], education: msg('Srednja škola'), bio: msg('Radim kao gerontodomaćica sa stanovanjem kod korisnika. Kuvam, održavam kuću i pravim društvo.'), days: [0, 1, 2, 3, 4, 5, 6], slots: ['morning', 'afternoon', 'evening'] }), // i18n-ignore
  rs({ id: 'jasmina', name: 'Jasmina Ilić', initials: 'JI', match: 89, rating: 4.8, reviews: 29, area: 'Zemun, Beograd', radius: 10, phone: '+381 62 418 9021', email: 'jasmina.ilic@mail.rs', certificate: true, courses: msg('Nega nepokretnih osoba'), engagement: ['daily'], languages: [msg('srpski'), msg('engleski')], education: msg('Viša medicinska škola'), bio: msg('Iskusna sa nepokretnim i polupokretnim osobama: kupanje, presvlačenje, sprečavanje rana.'), days: [0, 1, 2, 3, 4], slots: ['morning'] }), // i18n-ignore
  rs({ id: 'gordana', name: 'Gordana Stojanović', initials: 'GS', match: 87, rating: 4.6, reviews: 12, area: 'Voždovac, Beograd', radius: 10, phone: '+381 63 777 4410', email: 'gordana.stojanovic@mail.rs', certificate: false, courses: msg('Kurs za gerontodomaćice'), engagement: ['daily'], languages: [msg('srpski')], education: msg('Srednja škola'), bio: msg('Pomažem oko kuće, nabavke i odlaska kod lekara. Vozim, pa mogu i da povezem.'), days: [1, 2, 3, 4, 5], slots: ['afternoon'] }), // i18n-ignore
  rs({ id: 'marija', name: 'Marija Đorđević', initials: 'MĐ', match: 86, rating: 5, reviews: 9, area: 'Palilula, Beograd', radius: 10, phone: '+381 64 509 6612', email: 'marija.djordjevic@mail.rs', certificate: true, courses: msg('Nega osoba sa demencijom'), engagement: ['daily'], languages: [msg('srpski'), msg('nemački')], education: msg('Fakultet'), bio: msg('Psihološkinja po struci. Radim sa starijima koji su usamljeni ili u ranoj fazi demencije.'), days: [0, 2, 4], slots: ['morning', 'afternoon'] }), // i18n-ignore
  rs({ id: 'vesna', name: 'Vesna Lazić', initials: 'VL', match: 84, rating: 4.7, reviews: 33, area: 'Čukarica, Beograd', radius: 15, phone: '+381 60 121 4455', email: 'vesna.lazic@mail.rs', certificate: true, courses: '', engagement: ['shift24'], languages: [msg('srpski')], education: msg('Srednja medicinska škola'), bio: msg('Radim smene od 24 sata, sedam dana pa sedam slobodna. Navikla sam na noćna dežurstva.'), days: [0, 1, 2, 3, 4, 5, 6], slots: ['morning', 'afternoon', 'evening'] }), // i18n-ignore
  rs({ id: 'biljana', name: 'Biljana Marković', initials: 'BM', match: 82, rating: 4.5, reviews: 15, area: 'Rakovica, Beograd', radius: 10, phone: '+381 66 830 2201', email: 'biljana.markovic@mail.rs', certificate: false, courses: msg('Prva pomoć'), engagement: ['daily'], languages: [msg('srpski')], education: msg('Srednja škola'), bio: msg('Volim da kuvam po dijeti i da šetam sa korisnicima. Dolazim ujutru, svaki radni dan.'), days: [0, 1, 2, 3, 4], slots: ['morning'] }), // i18n-ignore
  rs({ id: 'tanja', name: 'Tanja Popović', initials: 'TP', match: 80, rating: 4.8, reviews: 21, area: 'Stari grad, Beograd', radius: 5, phone: '+381 63 245 9087', email: 'tanja.popovic@mail.rs', certificate: true, courses: msg('Nega nepokretnih osoba'), engagement: ['daily', 'shift24'], languages: [msg('srpski'), msg('engleski')], education: msg('Viša medicinska škola'), bio: msg('Previjanje, terapija po rasporedu lekara i merenje pritiska i šećera. Sve zapisujem za porodicu.'), days: [1, 3, 5], slots: ['afternoon', 'evening'] }), // i18n-ignore
  rs({ id: 'zorica', name: 'Zorica Simić', initials: 'ZS', match: 78, rating: 4.6, reviews: 7, area: 'Banovo brdo, Beograd', radius: 10, phone: '+381 64 900 3312', email: 'zorica.simic@mail.rs', certificate: false, courses: '', engagement: ['daily'], languages: [msg('srpski')], education: msg('Osnovna škola'), bio: msg('Pomažem u kući i pravim društvo. Strpljiva sam i pouzdana, sa preporukama porodica.'), days: [0, 1, 2, 3, 4, 5], slots: ['morning', 'afternoon'] }), // i18n-ignore
  rs({ id: 'ljiljana', name: 'Ljiljana Kostić', initials: 'LK', match: 76, rating: 4.9, reviews: 38, area: 'Pančevo', radius: 30, phone: '+381 65 412 7765', email: 'ljiljana.kostic@mail.rs', certificate: true, courses: msg('Nega osoba sa demencijom'), engagement: ['shift24'], languages: [msg('srpski'), msg('mađarski')], education: msg('Srednja medicinska škola'), bio: msg('Spremna sam za rad i van Beograda i u inostranstvu. Godinama negujem osobe posle moždanog udara.'), days: [0, 1, 2, 3, 4, 5, 6], slots: ['morning', 'afternoon', 'evening'] }), // i18n-ignore
  rs({ id: 'nada', name: 'Nada Pavlović', initials: 'NP', match: 74, rating: 4.4, reviews: 11, area: 'Borča, Beograd', radius: 10, phone: '+381 62 333 5561', email: 'nada.pavlovic@mail.rs', certificate: false, courses: msg('Kurs za gerontodomaćice'), engagement: ['daily'], languages: [msg('srpski')], education: msg('Srednja škola'), bio: msg('Dolazim popodne: ručak, lekovi po rasporedu, šetnja i razgovor.'), days: [0, 1, 2, 3, 4], slots: ['afternoon'] }), // i18n-ignore
];
