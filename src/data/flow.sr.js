// Serbian copy for the AI conversation variant.
//
// Kept as an overlay rather than folded into flow.js: the classic and immersive
// variants stay English to match the Figma file, and the question ids — which the
// frailty scoring, the branching and the care plan all read — must not move. Only
// the words change here. Every line is Serbian, marked with msg() and translated
// where it is shown (t() from src/i18n).
import { msg, t } from '../i18n';

export const Q = {
  'about-person': {
    title: msg('O kome se brinemo?'),
    short: msg('O njoj/njemu'),
    fields: { name: msg('Ime i prezime'), age: msg('Godine'), city: msg('Gde živi') },
  },
  'about-you': {
    title: msg('A sa kim ja razgovaram?'),
    short: msg('O vama'),
    fields: { 'your-name': msg('Vaše ime'), relation: msg('Šta ste joj/mu'), 'your-phone': msg('Vaš telefon') },
  },
  household: {
    title: msg('Ko još živi u domaćinstvu?'),
    short: msg('Domaćinstvo'),
    options: {
      alone: msg('Živi sama'),
      partner: msg('Sa partnerom'),
      family: msg('Sa porodicom'),
      crowded: msg('Troje ili više njih'),
    },
  },
  'home-condition': {
    title: msg('Kako biste opisali stanje stana?'),
    short: msg('Stanje stana'),
    options: {
      'well-kept': msg('Uredan'),
      'mostly-fine': msg('Uglavnom u redu'),
      'needs-help': msg('Treba pomoć'),
      neglected: msg('Zapušten'),
    },
  },

  mobility: {
    title: msg('Kako se trenutno kreće?'),
    short: msg('Kretanje'),
    options: {
      independent: msg('Potpuno sama'),
      stick: msg('Uz štap'),
      walker: msg('Uz hodalicu'),
      wheelchair: msg('U kolicima'),
      bed: msg('Uglavnom leži'),
    },
  },
  'going-out': {
    title: msg('Može li sama da izađe iz stana?'),
    short: msg('Izlazak iz stana'),
    options: {
      easily: msg('Bez problema'),
      'little-help': msg('Uz malu pomoć'),
      accompanied: msg('Samo u pratnji'),
      'never-out': msg('Ne izlazi'),
    },
  },
  'daily-help': {
    title: msg('Koliko joj pomoći treba tokom dana?'),
    short: msg('Pomoć tokom dana'),
    options: {
      none: msg('Nimalo'),
      occasional: msg('Povremeno'),
      'several-times': msg('Više puta dnevno'),
      'almost-constant': msg('Skoro stalno'),
      dependent: msg('Potpuno zavisi od nekoga'),
    },
  },
  'self-care': {
    title: msg('Šta od ovoga još može sama?'),
    short: msg('Radi sama'),
    options: {
      dressing: msg('Da se obuče'),
      bathing: msg('Da se okupa'),
      toilet: msg('Da ode do toaleta'),
      meals: msg('Da spremi obrok'),
      medication: msg('Da uzme lekove'),
    },
    empty: msg('Ništa od ovoga'),
  },
  falls: {
    title: msg('Da li je padala u poslednjih godinu dana?'),
    short: msg('Padovi'),
    options: { none: msg('Nijednom'), once: msg('Jednom'), 'more-than-once': msg('Više puta') },
  },
  outdoors: {
    title: msg('Koliko često izađe napolje?'),
    short: msg('Izlasci'),
    options: { daily: msg('Skoro svaki dan'), weekly: msg('Nekoliko puta nedeljno'), rarely: msg('Retko'), never: msg('Nikad') },
  },
  slowing: {
    title: msg('Da li je primetno usporila poslednjih meseci?'),
    short: msg('Usporavanje'),
    options: { no: msg('Ne baš'), little: msg('Malo'), lot: msg('Prilično') },
  },
  overall: {
    title: msg('Kako biste je opisali uopšteno?'),
    short: msg('Opšte stanje'),
    options: {
      active: msg('Potpuno aktivna'),
      independent: msg('Uglavnom samostalna'),
      'house-help': msg('Treba joj pomoć oko kuće'),
      'most-help': msg('Treba joj pomoć oko većine stvari'),
      dependent: msg('Zavisi od drugih skoro u svemu'),
    },
  },

  lifestyle: {
    title: msg('Šta bi joj sada najviše značilo?'),
    short: msg('Šta bi pomoglo'),
    options: {
      company: msg('Društvo i razgovor'),
      activities: msg('Odlasci na društvene aktivnosti'),
      transport: msg('Prevoz do lekara'),
      exercise: msg('Da ostane fizički aktivna'),
      prevention: msg('Redovne kontrole i prevencija'),
      wellness: msg('Wellness - masaža, fizioterapija'),
    },
    other: msg('Nešto drugo što bi pomoglo'),
  },
  'household-tasks': {
    title: msg('Rekli ste da joj treba pomoć oko kuće. Oko čega?'),
    short: msg('Oko kuće'),
    options: {
      cooking: msg('Kuvanje'),
      laundry: msg('Veš'),
      shopping: msg('Nabavka'),
      cleaning: msg('Čišćenje i pospremanje'),
      'meds-admin': msg('Vođenje računa o lekovima'),
    },
    other: msg('Nešto drugo što joj je postalo teško'),
  },
  'who-helps-now': {
    title: msg('Ko to sada radi?'),
    short: msg('Ko sad pomaže'),
    options: {
      family: msg('Porodica, kad stigne'),
      neighbour: msg('Komšinica ili prijateljica'),
      paid: msg('Neko plaćen privatno'),
      nobody: msg('Niko - ne radi se'),
    },
  },
  'personal-care': {
    title: msg('Oko čega joj treba pomoć rukama?'),
    short: msg('Lična nega'),
    options: {
      bathing: msg('Kupanje'),
      dressing: msg('Oblačenje'),
      transfer: msg('Ustajanje iz kreveta ili stolice'),
      stairs: msg('Stepenice'),
      incontinence: msg('Inkontinencija'),
      'night-toilet': msg('Odlazak do toaleta noću'),
    },
    other: msg('Nešto drugo oko čega joj treba pomoć'),
  },
  'fall-risk': {
    title: msg('Koliko strahujete od pada?'),
    short: msg('Rizik od pada'),
    options: {
      low: msg('Ne naročito'),
      medium: msg('Razmišljam o tome'),
      high: msg('Mnogo - deluje kao pitanje dana'),
    },
  },
  'bed-mobility': {
    title: msg('Može li sama da se okrene u krevetu?'),
    short: msg('Pokretljivost u krevetu'),
    options: { yes: msg('Da, sama'), 'some-help': msg('Uz malu pomoć'), 'full-help': msg('Mora da se okreće') },
  },
  eating: {
    title: msg('Kako se snalazi sa hranom?'),
    short: msg('Ishrana'),
    options: {
      alone: msg('Jede sama'),
      help: msg('Treba joj pomoć oko obroka'),
      fed: msg('Mora da se hrani'),
      swallowing: msg('Ima problem sa gutanjem'),
    },
  },
  'pressure-sores': {
    title: msg('Ima li dekubitusa?'),
    short: msg('Dekubitusi'),
    options: {
      none: msg('Nema'),
      early: msg('Crvenilo ili plitka rana'),
      deep: msg('Duboka ili otvorena rana'),
      unsure: msg('Nisam siguran'),
    },
  },
  respiratory: {
    title: msg('Ima li kod kuće podršku za disanje?'),
    short: msg('Podrška za disanje'),
    options: { oxygen: msg('Kiseonik'), cpap: 'CPAP', suction: msg('Aspirator'), none: msg('Ništa od toga') },
  },
  'palliative-needs': {
    title: msg('Šta bi porodici sada najviše pomoglo?'),
    short: msg('Potrebna podrška'),
    options: {
      nursing: msg('Medicinska sestra koja redovno dolazi'),
      'round-clock': msg('Nega 24 sata kod kuće'),
      medication: msg('Dostava lekova na kućnu adresu'),
      equipment: msg('Pomagala i potrošni materijal'),
      spiritual: msg('Duhovna podrška'),
      family: msg('Podrška za porodicu'),
    },
    other: msg('Nešto drugo što bi pomoglo'),
  },

  'reason-for-contact': {
    title: msg('Šta vas je dovelo do nas?'),
    short: msg('Razlog poziva'),
    options: {
      fall: msg('Pala je'),
      memory: msg('Pamćenje joj se menja'),
      discharge: msg('Vraća se kući iz bolnice'),
      loneliness: msg('Previše je sama'),
      medication: msg('Lekovi su postali teški za praćenje'),
      diagnosis: msg('Dijagnoza - šlog, Parkinson, kancer'),
      'home-help': msg('Kuća joj je postala prevelika'),
      respite: msg('Porodici treba predah'),
      'daily-living': msg('Svakodnevni život traži podršku'),
    },
  },
  onset: {
    title: msg('Da li se to desilo naglo ili postepeno?'),
    short: msg('Kako je počelo'),
    options: {
      sudden: msg('Naglo, u poslednjih par nedelja'),
      gradual: msg('Postepeno, mesecima'),
      'long-standing': msg('Tako je već dugo'),
    },
  },
  hospitalisation: {
    title: msg('Da li je bila u bolnici?'),
    short: msg('Boravak u bolnici'),
    options: { recent: msg('Da, u poslednjih mesec dana'), older: msg('Da, ali odavno'), none: msg('Ne') },
  },
  'family-goal': {
    title: msg('Šta bi za vas bio dobar ishod?'),
    short: msg('Vaš cilj'),
    fields: { goal: msg('Čemu se nadate'), worry: msg('Šta vas najviše brine') },
  },
};

// Section lead-ins, for the model to draw on rather than invent from nothing.
export const STEP_INTRO = {
  'getting-to-know':
    msg('Dobro došli u NANA Prime. Ja sam Minna, vaš koordinator nege. Pre nego što vam preporučim bilo kakvu podršku, volela bih da upoznam vas i osobu o kojoj brinete.'),
  'daily-life':
    msg('Hvala. Sada kada smo se upoznali, volela bih da razumem kako izgleda njihov svakodnevni dan.'),
  support: msg('Sad mi je slika jasna. Još par pitanja i preporuka će biti precizna.'),
  reason: msg('Još jedna stvar, i ona je najvažnija: zašto ste nam se javili baš sada?'),
};

// The scale's names, in the language the app is in (see frailty.js).
export { CFS as CFS_SR } from './frailty';

// Openers for the blank first screen. The empty page is right for someone who
// knows what to say; these are for everyone staring at it not knowing where to
// start. Each one is sent as the user's first message, so Minna picks it up
// like anything else the person could have typed.
export const STARTERS = [
  {
    id: 'plan',
    title: msg('Želim plan za svoju majku'),
    sub: msg('Krenemo od njenih podataka, pa razgovaramo'),
  },
  {
    id: 'changed',
    title: msg('Nešto se promenilo i zabrinut sam'),
    sub: msg('Pad, zbunjenost, loša nedelja: recite mi šta se desilo'),
  },
  {
    id: 'help',
    title: msg('Treba mi neko u stanu nekoliko puta nedeljno'),
    sub: msg('Negovateljice u njenom kraju i koliko koštaju'),
  },
  {
    id: 'abroad',
    title: msg('Živim u inostranstvu i ne znam odakle da počnem'),
    sub: msg('Videćemo šta može da se organizuje i bez vas tamo'),
  },
];

// Where you are, instead of how many questions are left. The count was a promise
// the flow cannot keep: `follow_up` screens are not in the question list, so the
// number froze while screens went by.
export const SECTION = {
  'getting-to-know': msg('Upoznavanje'),
  'daily-life': msg('Svakodnevni život'),
  support: msg('Kakva podrška'),
  reason: msg('Zašto ste se javili'),
};

// Why we ask — for the questions a family might reasonably wonder about. These
// are not shown as written: they go into Minna's instructions as the house's
// own reasoning, and she decides per conversation whether a question needs one
// and words it around what the family has told her. A name, an age, how she
// gets around explain themselves and have none on purpose; a reason under every
// question is a reason nobody reads.
export const WHY = {
  'about-you': msg('Da bi vas negovateljica mogla odmah dobiti ako se tokom posete nešto desi.'),
  household:
    msg('Ako živi sama, negovateljica je često prva koja primeti promenu; ako živi sa nekim, sa njim dogovaramo ko šta preuzima.'),
  'home-condition': msg('Da znamo da li negovateljica prvo treba da sredi stan, pa tek onda da uđe u svakodnevnu rutinu.'),
  'daily-help': msg('Po ovome procenjujemo koliko je poseta nedeljno stvarno potrebno, ni previše, ni premalo.'),
  'self-care': msg('Ono što još može sama ne preuzimamo od nje, da to ne izgubi. Pomažemo samo tamo gde treba.'),
  falls:
    msg('Posle jednog pada raste rizik od sledećeg; ako je padala, prvo proveravamo stan i kretanje, pa tek onda krećemo sa negom.'),
  outdoors:
    msg('Da znamo da li je usamljenost deo slike, jer tada negovateljica nije samo pomoć u kući, nego i društvo i razlog da izađe.'),
  slowing: msg('Da znamo da li se stanje menja, i da li plan pravimo za danas ili za narednih nekoliko meseci.'),
  'who-helps-now': msg('Da znamo koga rasterećujemo, i šta ne sme da stane dok ne krenemo.'),
  'personal-care':
    msg('Za kupanje, premeštanje i inkontinenciju biramo negovateljicu koja je to već radila, jer se to ne uči na licu mesta.'),
  'fall-risk': msg('Vaš osećaj je često tačniji od svakog upitnika; ako strahujete od pada, prevenciju stavljamo na prvo mesto.'),
  'bed-mobility':
    msg('Ko ne može sam da se okrene, mora redovno da se okreće i noću, a to menja koliko često neko mora da bude uz nju.'),
  eating: msg('Ako ima problem sa gutanjem, hrana se priprema drugačije i obrok traži nekoga ko zna kako.'),
  'pressure-sores': msg('Od ovoga zavisi da li je dovoljna negovateljica, ili treba da dolazi i medicinska sestra.'),
  respiratory: msg('Kiseonik i aparati za disanje traže nekoga ko je obučen da radi sa njima.'),
  onset: msg('Nagla promena traži brzu reakciju i često lekara, a postepena dugoročan plan.'),
  hospitalisation:
    msg('Prve nedelje posle bolnice su najosetljivije, pa tada prvo usklađujemo lekove i negu sa otpusnom listom.'),
};

// Follow-ups are where a reason matters most: the question was on no list, the
// family's own answer opened it, and nothing tells them why Minna picked up on
// that particular thing. The first one is the client's own example, word for
// word bar the diacritics.
export const WHY_FOLLOW_UPS = [
  {
    kad: msg('porodica pomene demenciju'),
    pitanje: msg('Da li je demencija u epizodama ili u kontinuitetu?'),
    obrazlozenje:
      msg('Ovo nam je potrebno da znamo da li sa bakom treba da se rade mentalne vežbe, ili se sa porodicom dogovaraju priče koje se konstantno ponavljaju baki.'),
  },
  {
    kad: msg('pomene Parkinsonovu bolest'),
    pitanje: msg('Da li su joj simptomi jači u neko određeno doba dana?'),
    obrazlozenje: msg('Da posete zakažemo onda kada joj je najteže, a ne kada je nama zgodno.'),
  },
  {
    kad: msg('niko od porodice ne živi blizu'),
    pitanje: msg('Ima li neko ko može da stigne do nje za pola sata ako zatreba?'),
    obrazlozenje: msg('Ako niko nije blizu, sa negovateljicom unapred dogovaramo koga zove i šta sme sama da odluči.'),
  },
  {
    kad: msg('pomene dijabetes'),
    pitanje: msg('Da li sama meri šećer i daje sebi insulin?'),
    obrazlozenje: msg('Od ovoga zavisi da li je dovoljna negovateljica, ili nam za insulin treba i medicinska sestra.'),
  },
];

// ── the words of an answer, in the app's language ───────────────────────────
// Written here in Serbian and translated as they are read, so everything that
// calls these (the plan, the record, the edits) gets the language the app is in
// now. Anything without a line here falls back to the flow's own words.

const shown = (text, fallback) => (text ? t(text) : fallback);
const rawTitle = (q) => Q[q.id]?.title || q.title;
export const srTitle = (q) => shown(rawTitle(q), '');
export const srShort = (q) => shown(Q[q.id]?.short || q.shortTitle || rawTitle(q), '');
export const srOption = (q, optionId) =>
  shown(Q[q.id]?.options?.[optionId] || q.options?.find((o) => o.id === optionId)?.title, optionId);
export const srField = (q, fieldId) =>
  shown(Q[q.id]?.fields?.[fieldId] || q.fields?.find((f) => f.id === fieldId)?.label, fieldId);

// the picked option(s) of an answer, as the family would read them
export function srOptionTitles(q, answer) {
  if (!q || !answer) return [];
  if (q.type === 'single') return answer.optionId ? [srOption(q, answer.optionId)] : [];
  if (q.type === 'multi') {
    const titles = (answer.optionIds || []).map((id) => srOption(q, id));
    if (answer.other?.trim()) titles.push(answer.other.trim());
    return titles;
  }
  return [];
}
