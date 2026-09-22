import { bandOf } from './frailty';

// Question content follows the client's "Conversation Flow AI" document. It is not a
// flat questionnaire: three fixed sections estimate a Clinical Frailty Scale level,
// the fourth branches on that level, and the last asks what prompted the call.
//
// Question types:
//  - inputs: several free-text fields inside one card (Next button)
//  - single: pick one option, auto-advances
//  - multi:  pick several options, confirm with Next
//
// `when({ band, level })` makes a question conditional. Questions without it always ask.
export const steps = [
  {
    id: 'getting-to-know',
    intro:
      'Dobro došli u NANA Prime. Ja sam Jovana, vaša koordinatorka nege. Pre nego što vam preporučim bilo kakvu podršku, volela bih da upoznam vas i osobu o kojoj brinete.',
    questions: [
      {
        id: 'about-person',
        type: 'inputs',
        title: 'O kome se brinemo?',
        subtitle: 'Za sada samo osnovno — u detalje ćemo zajedno',
        shortTitle: 'O njoj/njemu',
        fields: [
          { id: 'name', label: 'Ime i prezime', placeholder: 'Milica Stevanović' },
          { id: 'age', label: 'Godine', placeholder: '84' },
          { id: 'city', label: 'Gde živi', placeholder: 'Vračar, Beograd' },
        ],
      },
      {
        id: 'about-you',
        type: 'inputs',
        title: 'A sa kim ja razgovaram?',
        subtitle: 'Da znamo koga da obaveštavamo',
        shortTitle: 'O vama',
        fields: [
          { id: 'your-name', label: 'Vaše ime', placeholder: 'Bogdan Stevanović' },
          { id: 'relation', label: 'Šta ste joj/mu', placeholder: 'Sin' },
          { id: 'your-phone', label: 'Vaš telefon', placeholder: '+381 60 123 45 67' },
        ],
      },
      {
        id: 'household',
        type: 'single',
        title: 'Ko još živi u domaćinstvu?',
        subtitle: 'Tako znamo koliko podrške već ima oko sebe',
        shortTitle: 'Domaćinstvo',
        options: [
          { id: 'alone', title: 'Živi sama', description: 'Niko drugi ne živi u kući' },
          { id: 'partner', title: 'Sa partnerom', description: 'Dvoje u domaćinstvu' },
          { id: 'family', title: 'Sa porodicom', description: 'Deca ili rođaci u kući' },
          { id: 'crowded', title: 'Troje ili više njih', description: 'Puna kuća' },
        ],
      },
      {
        id: 'home-condition',
        type: 'single',
        title: 'Kako biste opisali stanje stana?',
        subtitle: 'Bez osuđivanja — da znamo šta negovateljicu čeka kad uđe',
        shortTitle: 'Stanje stana',
        options: [
          { id: 'well-kept', title: 'Uredan', description: 'Čist i sređen' },
          { id: 'mostly-fine', title: 'Uglavnom u redu', description: 'Malo pomoći bi mnogo značilo' },
          { id: 'needs-help', title: 'Treba pomoć', description: 'Kućni poslovi izmiču' },
          { id: 'neglected', title: 'Zapušten', description: 'Postalo je teško da se išta održi' },
        ],
      },
    ],
  },

  {
    id: 'daily-life',
    intro:
      'Hvala. Sada kada smo se upoznali, volela bih da razumem kako danas izgleda njen svakodnevni život.',
    questions: [
      {
        id: 'mobility',
        type: 'single',
        title: 'Kako se trenutno kreće?',
        subtitle: 'Ono što je najbliže običnom danu',
        shortTitle: 'Kretanje',
        options: [
          { id: 'independent', title: 'Potpuno sama', short: 'Samostalna' },
          { id: 'stick', title: 'Uz štap', short: 'Štap' },
          { id: 'walker', title: 'Uz hodalicu', short: 'Hodalica' },
          { id: 'wheelchair', title: 'U kolicima', short: 'Kolica' },
          { id: 'bed', title: 'Uglavnom leži', short: 'Leži' },
        ],
      },
      {
        id: 'going-out',
        type: 'single',
        title: 'Može li sama da izađe iz stana?',
        subtitle: 'Niz stepenice, do prodavnice, tako nešto',
        shortTitle: 'Izlazak iz stana',
        options: [
          { id: 'easily', title: 'Bez problema', short: 'Bez problema' },
          { id: 'little-help', title: 'Uz malu pomoć', short: 'Uz malu pomoć' },
          { id: 'accompanied', title: 'Samo u pratnji', short: 'U pratnji' },
          { id: 'never-out', title: 'Ne izlazi', short: 'Ne izlazi' },
        ],
      },
      {
        id: 'daily-help',
        type: 'single',
        title: 'Koliko joj pomoći treba tokom dana?',
        subtitle: 'Običnog dana, ne lošeg',
        shortTitle: 'Pomoć tokom dana',
        options: [
          { id: 'none', title: 'Nimalo', short: 'Ništa' },
          { id: 'occasional', title: 'Povremeno', short: 'Povremeno' },
          { id: 'several-times', title: 'Više puta dnevno', short: 'Više puta' },
          { id: 'almost-constant', title: 'Skoro stalno', short: 'Skoro stalno' },
          { id: 'dependent', title: 'Potpuno zavisi od nekoga', short: 'Zavisna' },
        ],
      },
      {
        id: 'self-care',
        type: 'multi',
        // for a very frail person the honest answer is none of them, so this one
        // must be submittable empty
        allowEmpty: true,
        title: 'Šta od ovoga još može sama?',
        subtitle: 'Označite sve što radi bez pomoći',
        shortTitle: 'Radi sama',
        options: [
          { id: 'dressing', title: 'Da se obuče', short: 'Oblačenje' },
          { id: 'bathing', title: 'Da se okupa', short: 'Kupanje' },
          { id: 'toilet', title: 'Da ode do toaleta', short: 'Toalet' },
          { id: 'meals', title: 'Da spremi obrok', short: 'Obroci' },
          { id: 'medication', title: 'Da uzme lekove', short: 'Lekovi' },
        ],
      },
      {
        id: 'falls',
        type: 'single',
        title: 'Da li je padala u poslednjih godinu dana?',
        subtitle: 'Računajući i padove bez povrede',
        shortTitle: 'Padovi',
        options: [
          { id: 'none', title: 'Nijednom', short: 'Bez padova' },
          { id: 'once', title: 'Jednom', short: 'Jedan pad' },
          { id: 'more-than-once', title: 'Više puta', short: 'Više padova' },
        ],
      },
      {
        id: 'outdoors',
        type: 'single',
        title: 'Koliko često izađe napolje?',
        subtitle: 'Makar i da sedne ispred zgrade',
        shortTitle: 'Izlasci',
        options: [
          { id: 'daily', title: 'Skoro svaki dan', short: 'Svaki dan' },
          { id: 'weekly', title: 'Nekoliko puta nedeljno', short: 'Nedeljno' },
          { id: 'rarely', title: 'Retko', short: 'Retko' },
          { id: 'never', title: 'Nikad', short: 'Nikad' },
        ],
      },
      {
        id: 'slowing',
        type: 'single',
        title: 'Da li je primetno usporila poslednjih meseci?',
        subtitle: 'U poređenju sa pre godinu dana',
        shortTitle: 'Usporavanje',
        options: [
          { id: 'no', title: 'Ne baš', short: 'Bez promene' },
          { id: 'little', title: 'Malo', short: 'Malo' },
          { id: 'lot', title: 'Prilično', short: 'Mnogo' },
        ],
      },
      {
        id: 'overall',
        type: 'single',
        title: 'Kako biste je opisali uopšteno?',
        subtitle: 'Vaše reči znače više nego što mislite',
        shortTitle: 'Opšte stanje',
        options: [
          { id: 'active', title: 'Potpuno aktivna', short: 'Potpuno aktivna' },
          { id: 'independent', title: 'Uglavnom samostalna', short: 'Uglavnom samostalna' },
          { id: 'house-help', title: 'Treba joj pomoć oko kuće', short: 'Pomoć kod kuće' },
          { id: 'most-help', title: 'Treba joj pomoć oko većine stvari', short: 'Pomoć oko većine' },
          { id: 'dependent', title: 'Zavisi od drugih skoro u svemu', short: 'Zavisna' },
        ],
      },
    ],
  },

  {
    id: 'support',
    intro:
      'Sad mi je slika jasna. Još par pitanja i preporuka će biti precizna.',
    questions: [
      // ---- light: frailty 1–3, no medical detail needed ----
      {
        id: 'lifestyle',
        type: 'multi',
        allowOther: true,
        otherPlaceholder: 'Nešto drugo što bi pomoglo',
        when: ({ band }) => band === 'light',
        title: 'Šta bi joj sada najviše značilo?',
        subtitle: 'Izaberite sve što bi joj pomoglo da ostane ovakva kakva je',
        shortTitle: 'Šta bi pomoglo',
        options: [
          { id: 'company', title: 'Društvo i razgovor', short: 'Društvo' },
          { id: 'activities', title: 'Odlasci na društvene aktivnosti', short: 'Aktivnosti' },
          { id: 'transport', title: 'Prevoz do lekara', short: 'Prevoz' },
          { id: 'exercise', title: 'Da ostane fizički aktivna', short: 'Vežbanje' },
          { id: 'prevention', title: 'Redovne kontrole i prevencija', short: 'Prevencija' },
          { id: 'wellness', title: 'Wellness — masaža, fizioterapija', short: 'Wellness' },
        ],
      },

      // ---- moderate: frailty 4–5, who does the housework ----
      {
        id: 'household-tasks',
        type: 'multi',
        allowOther: true,
        otherPlaceholder: 'Nešto drugo što je postalo teško',
        when: ({ band }) => band === 'moderate',
        title: 'Rekli ste da joj treba pomoć oko kuće. Oko čega?',
        subtitle: 'Označite sve što je postalo teško',
        shortTitle: 'Oko kuće',
        options: [
          { id: 'cooking', title: 'Kuvanje', short: 'Kuvanje' },
          { id: 'laundry', title: 'Veš', short: 'Veš' },
          { id: 'shopping', title: 'Nabavka', short: 'Nabavka' },
          { id: 'cleaning', title: 'Čišćenje i pospremanje', short: 'Čišćenje' },
          { id: 'meds-admin', title: 'Vođenje računa o lekovima', short: 'Lekovi' },
        ],
      },
      {
        id: 'who-helps-now',
        type: 'single',
        when: ({ band }) => band === 'moderate',
        title: 'Ko to sada radi?',
        subtitle: 'Korisno je znati šta bismo preuzeli',
        shortTitle: 'Ko sad pomaže',
        options: [
          { id: 'family', title: 'Porodica, kad stigne', short: 'Porodica' },
          { id: 'neighbour', title: 'Komšinica ili prijateljica', short: 'Komšinica' },
          { id: 'paid', title: 'Neko plaćen privatno', short: 'Plaćena pomoć' },
          { id: 'nobody', title: 'Niko — ne radi se', short: 'Niko' },
        ],
      },

      // ---- high: frailty 6, personal care ----
      {
        id: 'personal-care',
        type: 'multi',
        allowOther: true,
        otherPlaceholder: 'Nešto drugo oko čega treba pomoć',
        when: ({ band }) => band === 'high',
        title: 'Oko čega joj treba pomoć rukama?',
        subtitle: 'Označite sve što danas važi',
        shortTitle: 'Lična nega',
        options: [
          { id: 'bathing', title: 'Kupanje', short: 'Kupanje' },
          { id: 'dressing', title: 'Oblačenje', short: 'Oblačenje' },
          { id: 'transfer', title: 'Ustajanje iz kreveta ili stolice', short: 'Ustajanje' },
          { id: 'stairs', title: 'Stepenice', short: 'Stepenice' },
          { id: 'incontinence', title: 'Inkontinencija', short: 'Inkontinencija' },
          { id: 'night-toilet', title: 'Odlazak do toaleta noću', short: 'Toalet noću' },
        ],
      },
      {
        id: 'fall-risk',
        type: 'single',
        when: ({ band }) => band === 'high',
        title: 'Koliko strahujete od pada?',
        subtitle: 'Osećaj vas obično ne vara',
        shortTitle: 'Rizik od pada',
        options: [
          { id: 'low', title: 'Ne naročito', short: 'Nizak' },
          { id: 'medium', title: 'Razmišljam o tome', short: 'Srednji' },
          { id: 'high', title: 'Mnogo — deluje kao pitanje dana', short: 'Visok' },
        ],
      },

      // ---- severe: frailty 7–8, nursing territory ----
      {
        id: 'bed-mobility',
        type: 'single',
        when: ({ band }) => band === 'severe',
        title: 'Može li sama da se okrene u krevetu?',
        subtitle: 'Okretanje, sedanje',
        shortTitle: 'Pokretljivost u krevetu',
        options: [
          { id: 'yes', title: 'Da, sama', short: 'Sama' },
          { id: 'some-help', title: 'Uz malu pomoć', short: 'Uz pomoć' },
          { id: 'full-help', title: 'Mora da se okreće', short: 'Mora da se okreće' },
        ],
      },
      {
        id: 'eating',
        type: 'single',
        when: ({ band }) => band === 'severe',
        title: 'Kako se snalazi sa hranom?',
        subtitle: 'Uključujući i probleme sa gutanjem',
        shortTitle: 'Ishrana',
        options: [
          { id: 'alone', title: 'Jede sama', short: 'Jede sama' },
          { id: 'help', title: 'Treba joj pomoć oko obroka', short: 'Treba pomoć' },
          { id: 'fed', title: 'Mora da se hrani', short: 'Mora da se hrani' },
          { id: 'swallowing', title: 'Ima problem sa gutanjem', short: 'Problem sa gutanjem' },
        ],
      },
      {
        id: 'pressure-sores',
        type: 'single',
        when: ({ band }) => band === 'severe',
        title: 'Ima li dekubitusa?',
        subtitle: 'Od ovoga zavisi da li treba i medicinska sestra',
        shortTitle: 'Dekubitusi',
        options: [
          { id: 'none', title: 'Nema', short: 'Ništa' },
          { id: 'early', title: 'Crvenilo ili plitka rana', short: 'Rana faza' },
          { id: 'deep', title: 'Duboka ili otvorena rana', short: 'Duboka rana' },
          { id: 'unsure', title: 'Nisam siguran', short: 'Nisam sigurna' },
        ],
      },
      {
        id: 'respiratory',
        type: 'multi',
        when: ({ band }) => band === 'severe',
        title: 'Ima li kod kuće podršku za disanje?',
        subtitle: 'Ostavite prazno ako nema',
        shortTitle: 'Podrška za disanje',
        options: [
          { id: 'oxygen', title: 'Kiseonik', short: 'Kiseonik' },
          { id: 'cpap', title: 'CPAP', short: 'CPAP' },
          { id: 'suction', title: 'Aspirator', short: 'Aspirator' },
          { id: 'none', title: 'Ništa od toga', short: 'Ništa' },
        ],
      },

      // ---- palliative: frailty 9 ----
      {
        id: 'palliative-needs',
        type: 'multi',
        allowOther: true,
        otherPlaceholder: 'Nešto drugo što bi pomoglo',
        when: ({ band }) => band === 'palliative',
        title: 'Šta bi porodici sada najviše pomoglo?',
        subtitle: 'Koordinatorka će u svakom slučaju biti uz vas',
        shortTitle: 'Potrebna podrška',
        options: [
          { id: 'nursing', title: 'Medicinska sestra koja redovno dolazi', short: 'Medicinska sestra' },
          { id: 'round-clock', title: 'Nega 24 sata kod kuće', short: 'Nega 24h' },
          { id: 'medication', title: 'Dostava lekova na kućnu adresu', short: 'Lekovi' },
          { id: 'equipment', title: 'Pomagala i potrošni materijal', short: 'Pomagala' },
          { id: 'spiritual', title: 'Duhovna podrška', short: 'Duhovna podrška' },
          { id: 'family', title: 'Podrška za porodicu', short: 'Podrška porodici' },
        ],
      },
    ],
  },

  {
    id: 'reason',
    intro: 'Još jedna stvar, i ona je najvažnija — zašto ste nam se javili baš sada?',
    questions: [
      {
        id: 'reason-for-contact',
        type: 'single',
        title: 'Šta vas je dovelo do nas?',
        subtitle: 'Dovoljno je ono najbliže',
        shortTitle: 'Razlog poziva',
        options: [
          { id: 'fall', title: 'Pala je', short: 'Pad' },
          { id: 'memory', title: 'Pamćenje joj se menja', short: 'Pamćenje' },
          { id: 'discharge', title: 'Vraća se kući iz bolnice', short: 'Otpust' },
          { id: 'loneliness', title: 'Previše je sama', short: 'Usamljenost' },
          { id: 'medication', title: 'Lekovi su postali teški za praćenje', short: 'Lekovi' },
          { id: 'diagnosis', title: 'Dijagnoza — šlog, Parkinson, kancer', short: 'Dijagnoza' },
          { id: 'home-help', title: 'Kuća joj je postala prevelika', short: 'Pomoć u kući' },
          { id: 'respite', title: 'Porodici treba predah', short: 'Predah' },
          { id: 'daily-living', title: 'Svakodnevni život traži podršku', short: 'Svakodnevica' },
        ],
      },
      {
        id: 'onset',
        type: 'single',
        title: 'Da li se to desilo naglo ili postepeno?',
        subtitle: 'Nagle promene obično traže drugačiji pristup',
        shortTitle: 'Kako je počelo',
        options: [
          { id: 'sudden', title: 'Naglo, u poslednjih par nedelja', short: 'Naglo' },
          { id: 'gradual', title: 'Postepeno, mesecima', short: 'Postepeno' },
          { id: 'long-standing', title: 'Tako je već dugo', short: 'Odavno ovako' },
        ],
      },
      {
        id: 'hospitalisation',
        type: 'single',
        title: 'Da li je bila u bolnici?',
        subtitle: 'Nedavni otpust menja šta prvo organizujemo',
        shortTitle: 'Boravak u bolnici',
        options: [
          { id: 'recent', title: 'Da, u poslednjih mesec dana', short: 'Nedavno' },
          { id: 'older', title: 'Da, ali odavno', short: 'Odavno' },
          { id: 'none', title: 'Ne', short: 'Ništa' },
        ],
      },
      {
        id: 'family-goal',
        type: 'inputs',
        title: 'Šta bi za vas bio dobar ishod?',
        subtitle: 'Svojim rečima — od ovoga zavisi sve što predlažemo',
        shortTitle: 'Vaš cilj',
        fields: [
          {
            id: 'goal',
            label: 'Čemu se nadate',
            placeholder: 'Da bezbedno ostane kod kuće',
          },
          {
            id: 'worry',
            label: 'Šta vas najviše brine',
            placeholder: 'Da opet padne dok sam na poslu',
            optional: true,
          },
        ],
      },
    ],
  },
];

// Frailty is estimated from the second section, so branching questions can only be
// resolved once those answers exist.
export function flowContext(answers, level) {
  return { level: level ?? null, band: level ? bandOf(level) : null };
}

export function questionApplies(question, ctx) {
  if (!question.when) return true;
  if (!ctx.band) return false; // not enough answered to know which branch yet
  return question.when(ctx);
}

export function applicableQuestions(step, ctx) {
  return step.questions.filter((q) => questionApplies(q, ctx));
}

export const questions = steps.flatMap((s) => s.questions);

export const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));

// Titles of the picked option(s) for a question, used to summarise answers.
export function optionTitles(questionId, answer) {
  const q = questionById[questionId];
  if (!q || !answer) return [];
  if (q.type === 'single') {
    return q.options.filter((o) => o.id === answer.optionId).map((o) => o.title);
  }
  if (q.type === 'multi') {
    const titles = q.options.filter((o) => answer.optionIds?.includes(o.id)).map((o) => o.title);
    // whatever the user typed into the "something else" row is an answer like any
    // other — it must not stop at the card it was entered in
    if (answer.other?.trim()) titles.push(answer.other.trim());
    return titles;
  }
  return [];
}
