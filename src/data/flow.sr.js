// Serbian copy for the AI conversation variant.
//
// Kept as an overlay rather than folded into flow.js: the classic and immersive
// variants stay English to match the Figma file, and the question ids — which the
// frailty scoring, the branching and the care plan all read — must not move. Only
// the words change here.

export const Q = {
  'about-person': {
    title: 'O kome se brinemo?',
    short: 'O njoj/njemu',
    fields: { name: 'Ime i prezime', age: 'Godine', city: 'Gde živi' },
  },
  'about-you': {
    title: 'A sa kim ja razgovaram?',
    short: 'O vama',
    fields: { 'your-name': 'Vaše ime', relation: 'Šta ste joj/mu', 'your-phone': 'Vaš telefon' },
  },
  household: {
    title: 'Ko još živi u domaćinstvu?',
    short: 'Domaćinstvo',
    options: {
      alone: 'Živi sama',
      partner: 'Sa partnerom',
      family: 'Sa porodicom',
      crowded: 'Troje ili više njih',
    },
  },
  'home-condition': {
    title: 'Kako biste opisali stanje stana?',
    short: 'Stanje stana',
    options: {
      'well-kept': 'Uredan',
      'mostly-fine': 'Uglavnom u redu',
      'needs-help': 'Treba pomoć',
      neglected: 'Zapušten',
    },
  },

  mobility: {
    title: 'Kako se trenutno kreće?',
    short: 'Kretanje',
    options: {
      independent: 'Potpuno sama',
      stick: 'Uz štap',
      walker: 'Uz hodalicu',
      wheelchair: 'U kolicima',
      bed: 'Uglavnom leži',
    },
  },
  'going-out': {
    title: 'Može li sama da izađe iz stana?',
    short: 'Izlazak iz stana',
    options: {
      easily: 'Bez problema',
      'little-help': 'Uz malu pomoć',
      accompanied: 'Samo u pratnji',
      'never-out': 'Ne izlazi',
    },
  },
  'daily-help': {
    title: 'Koliko joj pomoći treba tokom dana?',
    short: 'Pomoć tokom dana',
    options: {
      none: 'Nimalo',
      occasional: 'Povremeno',
      'several-times': 'Više puta dnevno',
      'almost-constant': 'Skoro stalno',
      dependent: 'Potpuno zavisi od nekoga',
    },
  },
  'self-care': {
    title: 'Šta od ovoga još može sama?',
    short: 'Radi sama',
    options: {
      dressing: 'Da se obuče',
      bathing: 'Da se okupa',
      toilet: 'Da ode do toaleta',
      meals: 'Da spremi obrok',
      medication: 'Da uzme lekove',
    },
    empty: 'Ništa od ovoga',
  },
  falls: {
    title: 'Da li je padala u poslednjih godinu dana?',
    short: 'Padovi',
    options: { none: 'Nijednom', once: 'Jednom', 'more-than-once': 'Više puta' },
  },
  outdoors: {
    title: 'Koliko često izađe napolje?',
    short: 'Izlasci',
    options: { daily: 'Skoro svaki dan', weekly: 'Nekoliko puta nedeljno', rarely: 'Retko', never: 'Nikad' },
  },
  slowing: {
    title: 'Da li je primetno usporila poslednjih meseci?',
    short: 'Usporavanje',
    options: { no: 'Ne baš', little: 'Malo', lot: 'Prilično' },
  },
  overall: {
    title: 'Kako biste je opisali uopšteno?',
    short: 'Opšte stanje',
    options: {
      active: 'Potpuno aktivna',
      independent: 'Uglavnom samostalna',
      'house-help': 'Treba joj pomoć oko kuće',
      'most-help': 'Treba joj pomoć oko većine stvari',
      dependent: 'Zavisi od drugih skoro u svemu',
    },
  },

  lifestyle: {
    title: 'Šta bi joj sada najviše značilo?',
    short: 'Šta bi pomoglo',
    options: {
      company: 'Društvo i razgovor',
      activities: 'Odlasci na društvene aktivnosti',
      transport: 'Prevoz do lekara',
      exercise: 'Da ostane fizički aktivna',
      prevention: 'Redovne kontrole i prevencija',
      wellness: 'Wellness — masaža, fizioterapija',
    },
    other: 'Nešto drugo što bi pomoglo',
  },
  'household-tasks': {
    title: 'Rekli ste da joj treba pomoć oko kuće. Oko čega?',
    short: 'Oko kuće',
    options: {
      cooking: 'Kuvanje',
      laundry: 'Veš',
      shopping: 'Nabavka',
      cleaning: 'Čišćenje i pospremanje',
      'meds-admin': 'Vođenje računa o lekovima',
    },
    other: 'Nešto drugo što joj je postalo teško',
  },
  'who-helps-now': {
    title: 'Ko to sada radi?',
    short: 'Ko sad pomaže',
    options: {
      family: 'Porodica, kad stigne',
      neighbour: 'Komšinica ili prijateljica',
      paid: 'Neko plaćen privatno',
      nobody: 'Niko — ne radi se',
    },
  },
  'personal-care': {
    title: 'Oko čega joj treba pomoć rukama?',
    short: 'Lična nega',
    options: {
      bathing: 'Kupanje',
      dressing: 'Oblačenje',
      transfer: 'Ustajanje iz kreveta ili stolice',
      stairs: 'Stepenice',
      incontinence: 'Inkontinencija',
      'night-toilet': 'Odlazak do toaleta noću',
    },
    other: 'Nešto drugo oko čega joj treba pomoć',
  },
  'fall-risk': {
    title: 'Koliko strahujete od pada?',
    short: 'Rizik od pada',
    options: {
      low: 'Ne naročito',
      medium: 'Razmišljam o tome',
      high: 'Mnogo — deluje kao pitanje dana',
    },
  },
  'bed-mobility': {
    title: 'Može li sama da se okrene u krevetu?',
    short: 'Pokretljivost u krevetu',
    options: { yes: 'Da, sama', 'some-help': 'Uz malu pomoć', 'full-help': 'Mora da se okreće' },
  },
  eating: {
    title: 'Kako se snalazi sa hranom?',
    short: 'Ishrana',
    options: {
      alone: 'Jede sama',
      help: 'Treba joj pomoć oko obroka',
      fed: 'Mora da se hrani',
      swallowing: 'Ima problem sa gutanjem',
    },
  },
  'pressure-sores': {
    title: 'Ima li dekubitusa?',
    short: 'Dekubitusi',
    options: {
      none: 'Nema',
      early: 'Crvenilo ili plitka rana',
      deep: 'Duboka ili otvorena rana',
      unsure: 'Nisam siguran',
    },
  },
  respiratory: {
    title: 'Ima li kod kuće podršku za disanje?',
    short: 'Podrška za disanje',
    options: { oxygen: 'Kiseonik', cpap: 'CPAP', suction: 'Aspirator', none: 'Ništa od toga' },
  },
  'palliative-needs': {
    title: 'Šta bi porodici sada najviše pomoglo?',
    short: 'Potrebna podrška',
    options: {
      nursing: 'Medicinska sestra koja redovno dolazi',
      'round-clock': 'Nega 24 sata kod kuće',
      medication: 'Dostava lekova na kućnu adresu',
      equipment: 'Pomagala i potrošni materijal',
      spiritual: 'Duhovna podrška',
      family: 'Podrška za porodicu',
    },
    other: 'Nešto drugo što bi pomoglo',
  },

  'reason-for-contact': {
    title: 'Šta vas je dovelo do nas?',
    short: 'Razlog poziva',
    options: {
      fall: 'Pala je',
      memory: 'Pamćenje joj se menja',
      discharge: 'Vraća se kući iz bolnice',
      loneliness: 'Previše je sama',
      medication: 'Lekovi su postali teški za praćenje',
      diagnosis: 'Dijagnoza — šlog, Parkinson, kancer',
      'home-help': 'Kuća joj je postala prevelika',
      respite: 'Porodici treba predah',
      'daily-living': 'Svakodnevni život traži podršku',
    },
  },
  onset: {
    title: 'Da li se to desilo naglo ili postepeno?',
    short: 'Kako je počelo',
    options: {
      sudden: 'Naglo, u poslednjih par nedelja',
      gradual: 'Postepeno, mesecima',
      'long-standing': 'Tako je već dugo',
    },
  },
  hospitalisation: {
    title: 'Da li je bila u bolnici?',
    short: 'Boravak u bolnici',
    options: { recent: 'Da, u poslednjih mesec dana', older: 'Da, ali odavno', none: 'Ne' },
  },
  'family-goal': {
    title: 'Šta bi za vas bio dobar ishod?',
    short: 'Vaš cilj',
    fields: { goal: 'Čemu se nadate', worry: 'Šta vas najviše brine' },
  },
};

// Section lead-ins, for the model to draw on rather than invent from nothing.
export const STEP_INTRO = {
  'getting-to-know':
    'Dobro došli u NANA Prime. Ja sam Jovana, vaš koordinator nege. Pre nego što vam preporučim bilo kakvu podršku, volela bih da upoznam vas i osobu o kojoj brinete.',
  'daily-life':
    'Hvala. Sada kada smo se upoznali, volela bih da razumem kako izgleda njihov svakodnevni dan.',
  support: 'Sad mi je slika jasna. Još par pitanja i preporuka će biti precizna.',
  reason: 'Još jedna stvar, i ona je najvažnija — zašto ste nam se javili baš sada?',
};

export const CFS_SR = {
  1: { label: 'Veoma vitalna', blurb: 'Aktivna, energična i motivisana. Redovno vežba i među najvitalnijima je za svoje godine.' },
  2: { label: 'Vitalna', blurb: 'Bez aktivnih simptoma bolesti, ali manje vitalna nego prva kategorija. Aktivna povremeno, npr. sezonski.' },
  3: { label: 'Dobro se snalazi', blurb: 'Zdravstveni problemi su pod kontrolom. Nije redovno aktivna izvan uobičajenih šetnji.' },
  4: { label: 'Ranjiva', blurb: 'Nije zavisna od drugih iz dana u dan, ali je simptomi često ograničavaju. Često „usporena" ili umorna tokom dana.' },
  5: { label: 'Blago krhka', blurb: 'Usporavanje je vidljivije. Treba joj pomoć oko obaveza, kuće, prevoza i težih poslova; često i oko lekova.' },
  6: { label: 'Umereno krhka', blurb: 'Treba joj pomoć oko svih aktivnosti van kuće i oko domaćinstva. Često ima problem sa stepenicama, kupanjem i oblačenjem.' },
  7: { label: 'Izrazito krhka', blurb: 'Potpuno zavisna od drugih oko lične nege, iz bilo kog razloga. Stabilna i bez visokog rizika u narednih šest meseci.' },
  8: { label: 'Veoma izrazito krhka', blurb: 'Potpuno zavisna i pri kraju života. Po pravilu se ne bi oporavila ni od lakše bolesti.' },
  9: { label: 'Terminalno bolesna', blurb: 'Pri kraju života, sa očekivanim trajanjem ispod šest meseci, bez druge izražene krhkosti.' },
};

// Openers for the blank first screen. The empty page is right for someone who
// knows what to say; these are for everyone staring at it not knowing where to
// start. Each one is sent as the user's first message, so Jovana picks it up
// like anything else the person could have typed.
export const STARTERS = [
  {
    id: 'plan',
    title: 'Želim plan za svoju majku',
    sub: 'Krenemo od njenih podataka, pa razgovaramo',
  },
  {
    id: 'changed',
    title: 'Nešto se promenilo i zabrinut sam',
    sub: 'Pad, zbunjenost, loša nedelja — recite mi šta se desilo',
  },
  {
    id: 'help',
    title: 'Treba mi neko u stanu nekoliko puta nedeljno',
    sub: 'Negovateljice u njenom kraju i koliko koštaju',
  },
  {
    id: 'abroad',
    title: 'Živim u inostranstvu i ne znam odakle da počnem',
    sub: 'Videćemo šta može da se organizuje i bez vas tamo',
  },
];

// Where you are, instead of how many questions are left. The count was a promise
// the flow cannot keep: `follow_up` screens are not in the question list, so the
// number froze while screens went by.
export const SECTION = {
  'getting-to-know': 'Upoznavanje',
  'daily-life': 'Svakodnevni život',
  support: 'Kakva podrška',
  reason: 'Zašto ste se javili',
};

// Why we ask — for the questions a family might reasonably wonder about. These
// are not shown as written: they go into Jovana's instructions as the house's
// own reasoning, and she decides per conversation whether a question needs one
// and words it around what the family has told her. A name, an age, how she
// gets around explain themselves and have none on purpose; a reason under every
// question is a reason nobody reads.
export const WHY = {
  'about-you': 'Da bi vas negovateljica mogla odmah dobiti ako se tokom posete nešto desi.',
  household:
    'Ako živi sama, negovateljica je često prva koja primeti promenu; ako živi sa nekim, sa njim dogovaramo ko šta preuzima.',
  'home-condition': 'Da znamo da li negovateljica prvo treba da sredi stan, pa tek onda da uđe u svakodnevnu rutinu.',
  'daily-help': 'Po ovome procenjujemo koliko je poseta nedeljno stvarno potrebno — ni previše, ni premalo.',
  'self-care': 'Ono što još može sama ne preuzimamo od nje, da to ne izgubi — pomažemo samo tamo gde treba.',
  falls:
    'Posle jednog pada raste rizik od sledećeg; ako je padala, prvo proveravamo stan i kretanje, pa tek onda krećemo sa negom.',
  outdoors:
    'Da znamo da li je usamljenost deo slike — tada negovateljica nije samo pomoć u kući, nego i društvo i razlog da izađe.',
  slowing: 'Da znamo da li se stanje menja, i da li plan pravimo za danas ili za narednih nekoliko meseci.',
  'who-helps-now': 'Da znamo koga rasterećujemo, i šta ne sme da stane dok ne krenemo.',
  'personal-care':
    'Za kupanje, premeštanje i inkontinenciju biramo negovateljicu koja je to već radila — to se ne uči na licu mesta.',
  'fall-risk': 'Vaš osećaj je često tačniji od svakog upitnika; ako strahujete od pada, prevenciju stavljamo na prvo mesto.',
  'bed-mobility':
    'Ko ne može sam da se okrene, mora redovno da se okreće i noću — to menja koliko često neko mora da bude uz nju.',
  eating: 'Ako ima problem sa gutanjem, hrana se priprema drugačije i obrok traži nekoga ko zna kako.',
  'pressure-sores': 'Od ovoga zavisi da li je dovoljna negovateljica, ili treba da dolazi i medicinska sestra.',
  respiratory: 'Kiseonik i aparati za disanje traže nekoga ko je obučen da radi sa njima.',
  onset: 'Nagla promena traži brzu reakciju i često lekara, a postepena dugoročan plan.',
  hospitalisation:
    'Prve nedelje posle bolnice su najosetljivije — tada prvo usklađujemo lekove i negu sa otpusnom listom.',
};

// Follow-ups are where a reason matters most: the question was on no list, the
// family's own answer opened it, and nothing tells them why Jovana picked up on
// that particular thing. The first one is the client's own example, word for
// word bar the diacritics.
export const WHY_FOLLOW_UPS = [
  {
    kad: 'porodica pomene demenciju',
    pitanje: 'Da li je demencija u epizodama ili u kontinuitetu?',
    obrazlozenje:
      'Ovo nam je potrebno da znamo da li sa bakom treba da se rade mentalne vežbe, ili se sa porodicom dogovaraju priče koje se konstantno ponavljaju baki.',
  },
  {
    kad: 'pomene Parkinsonovu bolest',
    pitanje: 'Da li su joj simptomi jači u neko određeno doba dana?',
    obrazlozenje: 'Da posete zakažemo onda kada joj je najteže, a ne kada je nama zgodno.',
  },
  {
    kad: 'niko od porodice ne živi blizu',
    pitanje: 'Ima li neko ko može da stigne do nje za pola sata ako zatreba?',
    obrazlozenje: 'Ako niko nije blizu, sa negovateljicom unapred dogovaramo koga zove i šta sme sama da odluči.',
  },
  {
    kad: 'pomene dijabetes',
    pitanje: 'Da li sama meri šećer i daje sebi insulin?',
    obrazlozenje: 'Od ovoga zavisi da li je dovoljna negovateljica, ili nam za insulin treba i medicinska sestra.',
  },
];
