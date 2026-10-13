import { bandOf } from './frailty';
import { msg } from '../i18n';

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
      msg('Dobro došli u NANA Prime. Ja sam Minna, vaša koordinatorka nege. Pre nego što vam preporučim bilo kakvu podršku, volela bih da upoznam vas i osobu o kojoj brinete.'),
    questions: [
      {
        id: 'about-person',
        type: 'inputs',
        title: msg('O kome se brinemo?'),
        subtitle: msg('Za sada samo osnovno - u detalje ćemo zajedno'),
        shortTitle: msg('O njoj/njemu'),
        fields: [
          { id: 'name', label: msg('Ime i prezime'), placeholder: 'Aino Korhonen' },
          { id: 'age', label: msg('Godine'), placeholder: '84' },
          { id: 'city', label: msg('Gde živi'), placeholder: 'Töölö, Helsinki' },
        ],
      },
      {
        id: 'about-you',
        type: 'inputs',
        title: msg('A sa kim ja razgovaram?'),
        subtitle: msg('Da znamo koga da obaveštavamo'),
        shortTitle: msg('O vama'),
        fields: [
          { id: 'your-name', label: msg('Vaše ime'), placeholder: 'Anna Korhonen' },
          { id: 'relation', label: msg('Šta ste joj/mu'), placeholder: msg('Sin') },
          { id: 'your-phone', label: msg('Vaš telefon'), placeholder: '+358 40 123 4567' },
        ],
      },
      {
        id: 'household',
        type: 'single',
        title: msg('Ko još živi u domaćinstvu?'),
        subtitle: msg('Tako znamo koliko podrške već ima oko sebe'),
        shortTitle: msg('Domaćinstvo'),
        options: [
          { id: 'alone', title: msg('Živi sama'), description: msg('Niko drugi ne živi u kući') },
          { id: 'partner', title: msg('Sa partnerom'), description: msg('Dvoje u domaćinstvu') },
          { id: 'family', title: msg('Sa porodicom'), description: msg('Deca ili rođaci u kući') },
          { id: 'crowded', title: msg('Troje ili više njih'), description: msg('Puna kuća') },
        ],
      },
      {
        id: 'home-condition',
        type: 'single',
        title: msg('Kako biste opisali stanje stana?'),
        subtitle: msg('Bez osuđivanja - da znamo šta negovateljicu čeka kad uđe'),
        shortTitle: msg('Stanje stana'),
        options: [
          { id: 'well-kept', title: msg('Uredan'), description: msg('Čist i sređen') },
          { id: 'mostly-fine', title: msg('Uglavnom u redu'), description: msg('Malo pomoći bi mnogo značilo') },
          { id: 'needs-help', title: msg('Treba pomoć'), description: msg('Kućni poslovi izmiču') },
          { id: 'neglected', title: msg('Zapušten'), description: msg('Postalo je teško da se išta održi') },
        ],
      },
    ],
  },

  {
    id: 'daily-life',
    intro:
      msg('Hvala. Sada kada smo se upoznali, volela bih da razumem kako danas izgleda njen svakodnevni život.'),
    questions: [
      {
        id: 'mobility',
        type: 'single',
        title: msg('Kako se trenutno kreće?'),
        subtitle: msg('Ono što je najbliže običnom danu'),
        shortTitle: msg('Kretanje'),
        options: [
          { id: 'independent', title: msg('Potpuno sama'), short: msg('Samostalna') },
          { id: 'stick', title: msg('Uz štap'), short: msg('Štap') },
          { id: 'walker', title: msg('Uz hodalicu'), short: msg('Hodalica') },
          { id: 'wheelchair', title: msg('U kolicima'), short: msg('Kolica') },
          { id: 'bed', title: msg('Uglavnom leži'), short: msg('Leži') },
        ],
      },
      {
        id: 'going-out',
        type: 'single',
        title: msg('Može li sama da izađe iz stana?'),
        subtitle: msg('Niz stepenice, do prodavnice, tako nešto'),
        shortTitle: msg('Izlazak iz stana'),
        options: [
          { id: 'easily', title: msg('Bez problema'), short: msg('Bez problema') },
          { id: 'little-help', title: msg('Uz malu pomoć'), short: msg('Uz malu pomoć') },
          { id: 'accompanied', title: msg('Samo u pratnji'), short: msg('U pratnji') },
          { id: 'never-out', title: msg('Ne izlazi'), short: msg('Ne izlazi') },
        ],
      },
      {
        id: 'daily-help',
        type: 'single',
        title: msg('Koliko joj pomoći treba tokom dana?'),
        subtitle: msg('Običnog dana, ne lošeg'),
        shortTitle: msg('Pomoć tokom dana'),
        options: [
          { id: 'none', title: msg('Nimalo'), short: msg('Ništa') },
          { id: 'occasional', title: msg('Povremeno'), short: msg('Povremeno') },
          { id: 'several-times', title: msg('Više puta dnevno'), short: msg('Više puta') },
          { id: 'almost-constant', title: msg('Skoro stalno'), short: msg('Skoro stalno') },
          { id: 'dependent', title: msg('Potpuno zavisi od nekoga'), short: msg('Zavisna') },
        ],
      },
      {
        id: 'self-care',
        type: 'multi',
        // for a very frail person the honest answer is none of them, so this one
        // must be submittable empty
        allowEmpty: true,
        title: msg('Šta od ovoga još može sama?'),
        subtitle: msg('Označite sve što radi bez pomoći'),
        shortTitle: msg('Radi sama'),
        options: [
          { id: 'dressing', title: msg('Da se obuče'), short: msg('Oblačenje') },
          { id: 'bathing', title: msg('Da se okupa'), short: msg('Kupanje') },
          { id: 'toilet', title: msg('Da ode do toaleta'), short: msg('Toalet') },
          { id: 'meals', title: msg('Da spremi obrok'), short: msg('Obroci') },
          { id: 'medication', title: msg('Da uzme lekove'), short: msg('Lekovi') },
        ],
      },
      {
        id: 'falls',
        type: 'single',
        title: msg('Da li je padala u poslednjih godinu dana?'),
        subtitle: msg('Računajući i padove bez povrede'),
        shortTitle: msg('Padovi'),
        options: [
          { id: 'none', title: msg('Nijednom'), short: msg('Bez padova') },
          { id: 'once', title: msg('Jednom'), short: msg('Jedan pad') },
          { id: 'more-than-once', title: msg('Više puta'), short: msg('Više padova') },
        ],
      },
      {
        id: 'outdoors',
        type: 'single',
        title: msg('Koliko često izađe napolje?'),
        subtitle: msg('Makar i da sedne ispred zgrade'),
        shortTitle: msg('Izlasci'),
        options: [
          { id: 'daily', title: msg('Skoro svaki dan'), short: msg('Svaki dan') },
          { id: 'weekly', title: msg('Nekoliko puta nedeljno'), short: msg('Nedeljno') },
          { id: 'rarely', title: msg('Retko'), short: msg('Retko') },
          { id: 'never', title: msg('Nikad'), short: msg('Nikad') },
        ],
      },
      {
        id: 'slowing',
        type: 'single',
        title: msg('Da li je primetno usporila poslednjih meseci?'),
        subtitle: msg('U poređenju sa pre godinu dana'),
        shortTitle: msg('Usporavanje'),
        options: [
          { id: 'no', title: msg('Ne baš'), short: msg('Bez promene') },
          { id: 'little', title: msg('Malo'), short: msg('Malo') },
          { id: 'lot', title: msg('Prilično'), short: msg('Mnogo') },
        ],
      },
      {
        id: 'overall',
        type: 'single',
        title: msg('Kako biste je opisali uopšteno?'),
        subtitle: msg('Vaše reči znače više nego što mislite'),
        shortTitle: msg('Opšte stanje'),
        options: [
          { id: 'active', title: msg('Potpuno aktivna'), short: msg('Potpuno aktivna') },
          { id: 'independent', title: msg('Uglavnom samostalna'), short: msg('Uglavnom samostalna') },
          { id: 'house-help', title: msg('Treba joj pomoć oko kuće'), short: msg('Pomoć kod kuće') },
          { id: 'most-help', title: msg('Treba joj pomoć oko većine stvari'), short: msg('Pomoć oko većine') },
          { id: 'dependent', title: msg('Zavisi od drugih skoro u svemu'), short: msg('Zavisna') },
        ],
      },
    ],
  },

  {
    id: 'support',
    intro:
      msg('Sad mi je slika jasna. Još par pitanja i preporuka će biti precizna.'),
    questions: [
      // ---- light: frailty 1–3, no medical detail needed ----
      {
        id: 'lifestyle',
        type: 'multi',
        allowOther: true,
        otherPlaceholder: msg('Nešto drugo što bi pomoglo'),
        when: ({ band }) => band === 'light',
        title: msg('Šta bi joj sada najviše značilo?'),
        subtitle: msg('Izaberite sve što bi joj pomoglo da ostane ovakva kakva je'),
        shortTitle: msg('Šta bi pomoglo'),
        options: [
          { id: 'company', title: msg('Društvo i razgovor'), short: msg('Društvo') },
          { id: 'activities', title: msg('Odlasci na društvene aktivnosti'), short: msg('Aktivnosti') },
          { id: 'transport', title: msg('Prevoz do lekara'), short: msg('Prevoz') },
          { id: 'exercise', title: msg('Da ostane fizički aktivna'), short: msg('Vežbanje') },
          { id: 'prevention', title: msg('Redovne kontrole i prevencija'), short: msg('Prevencija') },
          { id: 'wellness', title: msg('Wellness - masaža, fizioterapija'), short: msg('Wellness') },
        ],
      },

      // ---- moderate: frailty 4–5, who does the housework ----
      {
        id: 'household-tasks',
        type: 'multi',
        allowOther: true,
        otherPlaceholder: msg('Nešto drugo što je postalo teško'),
        when: ({ band }) => band === 'moderate',
        title: msg('Rekli ste da joj treba pomoć oko kuće. Oko čega?'),
        subtitle: msg('Označite sve što je postalo teško'),
        shortTitle: msg('Oko kuće'),
        options: [
          { id: 'cooking', title: msg('Kuvanje'), short: msg('Kuvanje') },
          { id: 'laundry', title: msg('Veš'), short: msg('Veš') },
          { id: 'shopping', title: msg('Nabavka'), short: msg('Nabavka') },
          { id: 'cleaning', title: msg('Čišćenje i pospremanje'), short: msg('Čišćenje') },
          { id: 'meds-admin', title: msg('Vođenje računa o lekovima'), short: msg('Lekovi') },
        ],
      },
      {
        id: 'who-helps-now',
        type: 'single',
        when: ({ band }) => band === 'moderate',
        title: msg('Ko to sada radi?'),
        subtitle: msg('Korisno je znati šta bismo preuzeli'),
        shortTitle: msg('Ko sad pomaže'),
        options: [
          { id: 'family', title: msg('Porodica, kad stigne'), short: msg('Porodica') },
          { id: 'neighbour', title: msg('Komšinica ili prijateljica'), short: msg('Komšinica') },
          { id: 'paid', title: msg('Neko plaćen privatno'), short: msg('Plaćena pomoć') },
          { id: 'nobody', title: msg('Niko - ne radi se'), short: msg('Niko') },
        ],
      },

      // ---- high: frailty 6, personal care ----
      {
        id: 'personal-care',
        type: 'multi',
        allowOther: true,
        otherPlaceholder: msg('Nešto drugo oko čega treba pomoć'),
        when: ({ band }) => band === 'high',
        title: msg('Oko čega joj treba pomoć rukama?'),
        subtitle: msg('Označite sve što danas važi'),
        shortTitle: msg('Lična nega'),
        options: [
          { id: 'bathing', title: msg('Kupanje'), short: msg('Kupanje') },
          { id: 'dressing', title: msg('Oblačenje'), short: msg('Oblačenje') },
          { id: 'transfer', title: msg('Ustajanje iz kreveta ili stolice'), short: msg('Ustajanje') },
          { id: 'stairs', title: msg('Stepenice'), short: msg('Stepenice') },
          { id: 'incontinence', title: msg('Inkontinencija'), short: msg('Inkontinencija') },
          { id: 'night-toilet', title: msg('Odlazak do toaleta noću'), short: msg('Toalet noću') },
        ],
      },
      {
        id: 'fall-risk',
        type: 'single',
        when: ({ band }) => band === 'high',
        title: msg('Koliko strahujete od pada?'),
        subtitle: msg('Osećaj vas obično ne vara'),
        shortTitle: msg('Rizik od pada'),
        options: [
          { id: 'low', title: msg('Ne naročito'), short: msg('Nizak') },
          { id: 'medium', title: msg('Razmišljam o tome'), short: msg('Srednji') },
          { id: 'high', title: msg('Mnogo - deluje kao pitanje dana'), short: msg('Visok') },
        ],
      },

      // ---- severe: frailty 7–8, nursing territory ----
      {
        id: 'bed-mobility',
        type: 'single',
        when: ({ band }) => band === 'severe',
        title: msg('Može li sama da se okrene u krevetu?'),
        subtitle: msg('Okretanje, sedanje'),
        shortTitle: msg('Pokretljivost u krevetu'),
        options: [
          { id: 'yes', title: msg('Da, sama'), short: msg('Sama') },
          { id: 'some-help', title: msg('Uz malu pomoć'), short: msg('Uz pomoć') },
          { id: 'full-help', title: msg('Mora da se okreće'), short: msg('Mora da se okreće') },
        ],
      },
      {
        id: 'eating',
        type: 'single',
        when: ({ band }) => band === 'severe',
        title: msg('Kako se snalazi sa hranom?'),
        subtitle: msg('Uključujući i probleme sa gutanjem'),
        shortTitle: msg('Ishrana'),
        options: [
          { id: 'alone', title: msg('Jede sama'), short: msg('Jede sama') },
          { id: 'help', title: msg('Treba joj pomoć oko obroka'), short: msg('Treba pomoć') },
          { id: 'fed', title: msg('Mora da se hrani'), short: msg('Mora da se hrani') },
          { id: 'swallowing', title: msg('Ima problem sa gutanjem'), short: msg('Problem sa gutanjem') },
        ],
      },
      {
        id: 'pressure-sores',
        type: 'single',
        when: ({ band }) => band === 'severe',
        title: msg('Ima li dekubitusa?'),
        subtitle: msg('Od ovoga zavisi da li treba i medicinska sestra'),
        shortTitle: msg('Dekubitusi'),
        options: [
          { id: 'none', title: msg('Nema'), short: msg('Ništa') },
          { id: 'early', title: msg('Crvenilo ili plitka rana'), short: msg('Rana faza') },
          { id: 'deep', title: msg('Duboka ili otvorena rana'), short: msg('Duboka rana') },
          { id: 'unsure', title: msg('Nisam siguran'), short: msg('Nisam sigurna') },
        ],
      },
      {
        id: 'respiratory',
        type: 'multi',
        when: ({ band }) => band === 'severe',
        title: msg('Ima li kod kuće podršku za disanje?'),
        subtitle: msg('Ostavite prazno ako nema'),
        shortTitle: msg('Podrška za disanje'),
        options: [
          { id: 'oxygen', title: msg('Kiseonik'), short: msg('Kiseonik') },
          { id: 'cpap', title: 'CPAP', short: 'CPAP' },
          { id: 'suction', title: msg('Aspirator'), short: msg('Aspirator') },
          { id: 'none', title: msg('Ništa od toga'), short: msg('Ništa') },
        ],
      },

      // ---- palliative: frailty 9 ----
      {
        id: 'palliative-needs',
        type: 'multi',
        allowOther: true,
        otherPlaceholder: msg('Nešto drugo što bi pomoglo'),
        when: ({ band }) => band === 'palliative',
        title: msg('Šta bi porodici sada najviše pomoglo?'),
        subtitle: msg('Koordinatorka će u svakom slučaju biti uz vas'),
        shortTitle: msg('Potrebna podrška'),
        options: [
          { id: 'nursing', title: msg('Medicinska sestra koja redovno dolazi'), short: msg('Medicinska sestra') },
          { id: 'round-clock', title: msg('Nega 24 sata kod kuće'), short: msg('Nega 24h') },
          { id: 'medication', title: msg('Dostava lekova na kućnu adresu'), short: msg('Lekovi') },
          { id: 'equipment', title: msg('Pomagala i potrošni materijal'), short: msg('Pomagala') },
          { id: 'spiritual', title: msg('Duhovna podrška'), short: msg('Duhovna podrška') },
          { id: 'family', title: msg('Podrška za porodicu'), short: msg('Podrška porodici') },
        ],
      },
    ],
  },

  {
    id: 'reason',
    intro: msg('Još jedna stvar, i ona je najvažnija - zašto ste nam se javili baš sada?'),
    questions: [
      {
        id: 'reason-for-contact',
        type: 'single',
        title: msg('Šta vas je dovelo do nas?'),
        subtitle: msg('Dovoljno je ono najbliže'),
        shortTitle: msg('Razlog poziva'),
        options: [
          { id: 'fall', title: msg('Pala je'), short: msg('Pad') },
          { id: 'memory', title: msg('Pamćenje joj se menja'), short: msg('Pamćenje') },
          { id: 'discharge', title: msg('Vraća se kući iz bolnice'), short: msg('Otpust') },
          { id: 'loneliness', title: msg('Previše je sama'), short: msg('Usamljenost') },
          { id: 'medication', title: msg('Lekovi su postali teški za praćenje'), short: msg('Lekovi') },
          { id: 'diagnosis', title: msg('Dijagnoza - šlog, Parkinson, kancer'), short: msg('Dijagnoza') },
          { id: 'home-help', title: msg('Kuća joj je postala prevelika'), short: msg('Pomoć u kući') },
          { id: 'respite', title: msg('Porodici treba predah'), short: msg('Predah') },
          { id: 'daily-living', title: msg('Svakodnevni život traži podršku'), short: msg('Svakodnevica') },
        ],
      },
      {
        id: 'onset',
        type: 'single',
        title: msg('Da li se to desilo naglo ili postepeno?'),
        subtitle: msg('Nagle promene obično traže drugačiji pristup'),
        shortTitle: msg('Kako je počelo'),
        options: [
          { id: 'sudden', title: msg('Naglo, u poslednjih par nedelja'), short: msg('Naglo') },
          { id: 'gradual', title: msg('Postepeno, mesecima'), short: msg('Postepeno') },
          { id: 'long-standing', title: msg('Tako je već dugo'), short: msg('Odavno ovako') },
        ],
      },
      {
        id: 'hospitalisation',
        type: 'single',
        title: msg('Da li je bila u bolnici?'),
        subtitle: msg('Nedavni otpust menja šta prvo organizujemo'),
        shortTitle: msg('Boravak u bolnici'),
        options: [
          { id: 'recent', title: msg('Da, u poslednjih mesec dana'), short: msg('Nedavno') },
          { id: 'older', title: msg('Da, ali odavno'), short: msg('Odavno') },
          { id: 'none', title: msg('Ne'), short: msg('Ništa') },
        ],
      },
      {
        id: 'family-goal',
        type: 'inputs',
        title: msg('Šta bi za vas bio dobar ishod?'),
        subtitle: msg('Svojim rečima - od ovoga zavisi sve što predlažemo'),
        shortTitle: msg('Vaš cilj'),
        fields: [
          {
            id: 'goal',
            label: msg('Čemu se nadate'),
            placeholder: msg('Da bezbedno ostane kod kuće'),
          },
          {
            id: 'worry',
            label: msg('Šta vas najviše brine'),
            placeholder: msg('Da opet padne dok sam na poslu'),
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

