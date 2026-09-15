import { applicableQuestions, flowContext, questionById, steps } from './flow';
import { frailtyOf } from './frailty';
import { Q, STEP_INTRO, WHY, WHY_FOLLOW_UPS } from './flow.sr';

// The AI variant's contract with the model.
//
// The division of labour is the whole design: **Claude owns the words, flow.js
// owns the data.** Claude decides what to ask next and how to phrase it; the
// question ids, the option ids and the answer shapes stay exactly as the other
// two variants write them, because the frailty scoring, the branching and the
// care plan all read those ids. A model free to invent options would produce
// answers that score nothing and a plan built on nothing.

export const MODEL = 'claude-opus-5';

// What is still to be asked, given everything answered so far. Recomputed every
// turn because the frailty band decides which questions exist at all.
//
// The support section is withheld until daily life is fully answered. The
// estimate exists from the first answer onward, but a band derived from two
// answers is not one to branch on: the model would ask a branch question, the
// band would move as the rest of daily life landed, and `reconcile` would drop
// the answer it had just collected. The other two variants get this for free
// from walking the steps in order; here the model chooses, so it has to be said.
export function remainingQuestions(answers) {
  const level = frailtyOf(answers)?.level;
  const ctx = flowContext(answers, level);
  const dailyLife = steps.find((s) => s.id === 'daily-life');
  const bandIsSettled = dailyLife.questions.every((q) => answers[q.id]);

  return steps.flatMap((step) => {
    if (step.id === 'support' && !bandIsSettled) return [];
    return applicableQuestions(step, ctx)
      .filter((q) => !answers[q.id])
      .map((q) => serialize(q, step.id));
  });
}

function serialize(q, stepId) {
  const sr = Q[q.id] || {};
  const out = { id: q.id, sekcija: stepId, pitanje: sr.title || q.title, tip: q.type };

  if (q.type === 'inputs') {
    out.polja = q.fields.map((f) => ({
      id: f.id,
      naziv: sr.fields?.[f.id] || f.label,
      obavezno: !f.optional,
    }));
  } else {
    out.opcije = q.options.map((o) => ({ id: o.id, tekst: sr.options?.[o.id] || o.title }));
    if (q.allowEmpty) out.moze_prazno = true;
    if (q.allowOther) out.moze_slobodan_unos = true;
  }
  return out;
}

// What Jovana already knows, as short phrases fit to show back to the person.
//
// Derived from `answers` rather than reported by the model: the two would drift,
// and the ids are already the source of truth for the plan. The model only has
// to say what it is still *missing* — that is the part no list can compute.
// The caller's own name, relation and phone are collected, but they are not
// facts about the person being cared for — and the panel these feed says they
// are. Left in, "Marija Marić, unuka" sat in a list headed by her mother's name.
const ABOUT_CALLER = new Set(['about-you']);

export function knownFacts(answers, notes = []) {
  const facts = [];

  for (const [id, answer] of Object.entries(answers)) {
    const q = questionById[id];
    if (!q || ABOUT_CALLER.has(id)) continue;
    const sr = Q[id] || {};
    const label = (oid) => sr.options?.[oid] || q.options?.find((o) => o.id === oid)?.short;

    // The option's wording alone is not a fact: "više puta dnevno" says nothing
    // without the question it answers, and "nijednom" says less than nothing.
    // `short` is what the review screens already use to name a question in a
    // few words, so it is what names it here too.
    const topic = sr.short || q.shortTitle;

    if (q.type === 'inputs') {
      const filled = Object.values(answer.values || {})
        .map((v) => v?.trim())
        .filter(Boolean);
      if (filled.length) facts.push({ id, topic, text: filled.join(', ') });
    } else if (q.type === 'single') {
      const text = label(answer.optionId);
      if (text) facts.push({ id, topic, text });
    } else {
      const texts = (answer.optionIds || []).map(label).filter(Boolean);
      if (answer.other?.trim()) texts.push(answer.other.trim());
      if (texts.length) facts.push({ id, topic, text: texts.join(', ') });
    }
  }

  notes.forEach((text, i) => facts.push({ id: `note-${i}`, text, note: true }));
  return facts;
}

// The answer the model reports, in the shape the rest of the app already stores.
export function toAnswer(entry) {
  const q = questionById[entry.questionId];
  if (!q) return null;
  // Everything the model sends is checked against the question it claims to be
  // answering. `multi` always did this; `single` and `inputs` took what they were
  // given, so an invented option id was stored as a valid answer and only
  // surfaced much later — an id no phrase table has a line for printed
  // "undefined, and it has come on gradually" into the finished plan.
  //
  // Rejecting returns null, which the caller reports back as "not recorded", and
  // the model asks again. A wrong answer that scores nothing is worse.
  if (q.type === 'inputs') {
    const values = Object.fromEntries(
      Object.entries(entry.values || {}).filter(([id, v]) => q.fields.some((f) => f.id === id) && v?.trim())
    );
    return Object.keys(values).length ? { values } : null;
  }
  if (q.type === 'single') {
    return q.options.some((o) => o.id === entry.optionId) ? { optionId: entry.optionId } : null;
  }
  const ids = (entry.optionIds || []).filter((id) => q.options.some((o) => o.id === id));
  const other = entry.other?.trim();
  if (!ids.length && !other && !q.allowEmpty) return null;
  return { optionIds: ids, ...(other ? { other } : {}) };
}

// Shared by `ask` and `follow_up`: either kind of question can need a reason, and
// a follow-up — which no list prepared anyone for — needs one most.
const WHY_FIELD =
  'Opciono. Jedna rečenica koja se prikazuje ispod pitanja: zašto nam baš ovo treba i šta radimo drugačije u zavisnosti od odgovora. Samo kada bi se čovek mogao zapitati zašto pitaš — ne uz svako pitanje.';

export const TOOLS = [
  {
    name: 'record_answers',
    description:
      'Zabeleži jedan ili više odgovora. Pozovi ovo čim iz onoga što je korisnik napisao možeš da popuniš neko pitanje — i kada jednom rečenicom odgovori na više njih odjednom. Koristi isključivo id-jeve iz liste preostalih pitanja.',
    input_schema: {
      type: 'object',
      properties: {
        odgovori: {
          type: 'array',
          description: 'Odgovori koje beležiš u ovom potezu.',
          items: {
            type: 'object',
            properties: {
              questionId: { type: 'string', description: 'id pitanja' },
              optionId: { type: 'string', description: 'Za tip "single": id izabrane opcije.' },
              optionIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Za tip "multi": id-jevi svih izabranih opcija.',
              },
              other: {
                type: 'string',
                description:
                  'Za tip "multi" sa moze_slobodan_unos: ono što je korisnik rekao a ne postoji među opcijama, njegovim rečima.',
              },
              values: {
                type: 'object',
                additionalProperties: { type: 'string' },
                description: 'Za tip "inputs": vrednosti po id-ju polja.',
              },
            },
            required: ['questionId'],
          },
        },
      },
      required: ['odgovori'],
    },
  },
  {
    name: 'record_note',
    description:
      'Zapamti nešto važno što je korisnik rekao a ne pripada nijednom pitanju iz liste — okolnost, strah, ograničenje, detalj o porodici. Bez ovoga bi to nestalo. Ulazi u plan podrške.',
    input_schema: {
      type: 'object',
      properties: { tekst: { type: 'string', description: 'Jedna rečenica, njegovim rečima gde možeš.' } },
      required: ['tekst'],
    },
  },
  {
    name: 'assess',
    description:
      'Reci koliko stvarno razumeš osobu o kojoj se radi i koliko si sigurna da joj možeš napraviti dobar plan. Pozovi ovo u svakom potezu, posle beleženja a pre nego što napišeš pitanje — čovek tvoje razmišljanje čita dok čeka. Broj sme i da padne: ako je čovek rekao nešto što otvara pitanje koje ranije nisi ni znala da postoji, spusti ga iskreno.',
    input_schema: {
      type: 'object',
      properties: {
        razmisljanje: {
          type: 'string',
          description:
            'Naglas, za čoveka koji čeka tvoj odgovor — prikazuje mu se dok razmišljaš. Dve do tri kratke rečenice u prvom licu: šta si upravo razumela iz njegove poruke (sa konkretnim detaljem iz nje), šta ti još nije jasno i šta ćeš zato sledeće da pitaš. Toplo i jednostavno, kao kad misliš naglas pred njim. Bez brojeva i procenata, bez procene krhkosti, bez naziva alata, id-jeva i pravila koja slediš.',
        },
        razumevanje: {
          type: 'integer',
          description:
            'Od 0 do 100. 0 = ne znaš ništa o njoj. 100 = znaš dovoljno za plan u koji si sigurna. Budi stroga: odgovorena pitanja nisu isto što i razumevanje. Popunjena lista uz nejasan razlog poziva nije 100.',
        },
        nepoznanice: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Do četiri kratke fraze — šta ti fali da bi bila sigurna. Ljudskim jezikom, ne nazivi pitanja: „zašto baš sada", „kako podnosi stranca u kući".',
        },
      },
      required: ['razmisljanje', 'razumevanje'],
    },
  },
  {
    name: 'ask',
    description:
      'Postavi pitanje iz liste. Tekst pitanja pišeš sam, u svojoj poruci — ovaj alat samo određuje koje kartice se prikazuju ispod. Pozovi ga jednom na kraju poteza.',
    input_schema: {
      type: 'object',
      properties: {
        questionId: { type: 'string', description: 'id pitanja iz liste preostalih' },
        obrazlozenje: { type: 'string', description: WHY_FIELD },
      },
      required: ['questionId'],
    },
  },
  {
    name: 'follow_up',
    description:
      'Postavi svoje potpitanje, koje ne postoji u listi — kada ti nešto nije jasno, kada je korisnik rekao nešto što traži pojašnjenje, ili kada bi defaultno sledeće pitanje zvučalo kao da ga nisi čula. Nema kartica; korisnik piše. Koristi umereno i nikad dvaput zaredom.',
    input_schema: {
      type: 'object',
      properties: {
        predlozi: {
          type: 'array',
          items: { type: 'string' },
          description: 'Do četiri kratka predloga odgovora, kao meki nagoveštaj. Opciono.',
        },
        obrazlozenje: { type: 'string', description: WHY_FIELD },
      },
    },
  },
];

export function systemPrompt(user) {
  const ime = user.name?.split(' ')[0] || '';

  return `Ti si Jovana Đorđević, koordinator nege u NANA Prime — srpskoj firmi koja porodicama nalazi gerontodomaćice za brigu o starijim roditeljima.

Razgovaraš sa osobom koja se javila${ime ? ` (${ime})` : ''}. Ona brine o nekom starijem i ne zna odakle da počne. Tvoj posao nije da popuniš formular nego da razumeš situaciju — a usput ti trebaju konkretni podaci da bismo mogli da preporučimo pravu podršku.

# Kako pričaš
Kratko. Jedna do dve rečenice pre pitanja, nikad više. Toplo, ali bez patetike i bez fraza tipa „razumem koliko vam je teško".
Obraćaš se sa „vi". Pišeš latinicom, na srpskom.
Nadovezuješ se na ono što je čovek upravo rekao — ne prelaziš na sledeće pitanje kao da nisi čula.
Nikad ne nabrajaš ponuđene opcije u tekstu. Korisnik ih vidi kao kartice ispod tvoje poruke.

# Kako počinje
Prvi ekran nije pitanje nego prazan papir — čovek svojim rečima opiše šta se dešava. Iz tog jednog pasusa izvuci sve što možeš odjednom preko \`record_answers\`, pa nastavi od onoga što fali. Ne vraćaj se na ono što je već rekao, ni u drugoj formulaciji.
Ako je napisao malo ili ništa, samo kreni od prvog pitanja.

# Svaki put kad ti čovek nešto napiše — ovim redom
1. Pročitaj šta je stvarno rekao, celu poruku, i tek onda gledaj listu pitanja.
2. Zabeleži sve što se može zabeležiti: \`record_answers\` za sve na šta je odgovorio, makar usput i drugim rečima, i \`record_note\` za sve važno što ne pripada nijednom pitanju. Ovo ide pre nego što bilo šta pitaš. Ono što ne zabeležiš — nestaje.
3. Pozovi \`assess\` — koliko sada razumeš osobu o kojoj se radi i šta ti još fali.
4. Tek onda pitaj sledeće.
U svojoj rečenici pomeni konkretan detalj iz onoga što je upravo rekao — ime, mesto, broj, ono što ga muči. Ne uopšteno „razumem vas", nego znak da si pročitala baš to.
Ako je napisao nešto što menja sliku a ti nisi sigurna kako, pitaj o tome preko \`follow_up\` umesto da nastaviš niz listu.

# Kako radiš
Postavljaš jedno pitanje odjednom, pozivom alata \`ask\`.
Tekst pitanja uvek pišeš sama, u svojoj poruci. \`ask\` samo bira koje kartice se prikazuju ispod. Nikad ne recituj formulaciju iz liste — ona ti je samo podatak o tome šta treba da saznaš.
Nadovezuj se. Ako je čovek upravo rekao da živi u drugom gradu, sledeće pitanje to uvažava umesto da nastavi kao da nije rekao ništa.
Kada nešto nije jasno ili kada bi sledeće pitanje zvučalo gluvo, postavi svoje potpitanje preko \`follow_up\` umesto da guraš dalje.
Kada čovek kaže nešto važno što ne pripada nijednom pitanju, zabeleži to preko \`record_note\`.
Pitanja tipa \`inputs\` nemaju kartice — čovek odgovara jednom rečenicom, a ti iz nje izvučeš polja. „Bogdan, sin, 063 555 210" je ime, srodstvo i telefon. Ako nešto od obaveznih polja fali, pitaj samo za to što fali, ne za sve ponovo.
Kada iz onoga što je čovek napisao možeš da popuniš neko pitanje, odmah to zabeležiš preko \`record_answers\` — i kada jednom rečenicom odgovori na više njih. „Pala je dvaput prošle godine i više ne može da kuva" su dva odgovora, ne jedan.
Nikad ne pitaš ono što već znaš.
Čovek vidi koliko je razumeš — to je broj koji šalješ kroz \`assess\` — a dok čeka tvoj odgovor, uživo čita tvoje \`razmisljanje\`. Zato \`assess\` pozivaš pre nego što napišeš pitanje. Broj je tvoja iskrena procena, ne ohrabrenje: ako ti je nešto zamaglilo sliku, neka padne. Razmišljanje je jedino što čovek sazna o tome šta razumeš i šta ti još treba, pa neka bude konkretno.
Ako je odgovor nejasan, pitaj da razjasniš umesto da nagađaš. Ako je jasan, ne traži potvrdu.
Ako podatak deluje nemoguće ili u šali — 120 godina, grad na drugom kraju sveta — nemoj ga zabeležiti, ali nemoj ni stati. Reci mirno šta ti ne štima i pitaj preko \`follow_up\`. Čovek možda testira aplikaciju, možda je pogrešio, možda misli ozbiljno; u sva tri slučaja razgovor ide dalje.
Svaki tvoj potez se završava tako što nešto pitaš — \`ask\` ili \`follow_up\`. Beleženje i procena nisu potez; bez pitanja čovek ostaje pred praznim ekranom.
Redosled je tvoj, ali drži se sekcija: prvo upoznavanje, pa svakodnevni život, pa podrška, pa razlog poziva.

# Zašto pitamo
Uz \`ask\` i \`follow_up\` možeš da pošalješ i \`obrazlozenje\`: jednu rečenicu koja čoveku kaže zašto nam baš to treba. Prikazuje se ispod pitanja, odvojeno od tvoje poruke, pa ga u poruci ne ponavljaš.
Ne ide uz svako pitanje. Većina pitanja se sama objašnjava — ime, godine, kako se kreće — i tu je obrazloženje višak koji niko ne čita. Pošalji ga kada bi se čovek mogao zapitati zašto to pitaš:
- kada je pitanje lično ili neprijatno (kupanje, inkontinencija, rane, stanje stana),
- kada ne vidi kakve to veze ima sa negom (koliko izlazi napolje, ko još živi u stanu),
- kada tražiš lični podatak (telefon),
- i skoro uvek kada postavljaš potpitanje koje je otvorio njegov odgovor — tada najmanje zna zašto si se zakačila baš za to.
Kako ga pišeš: jedna rečenica, do dvadesetak reči, u ime NANA Prime („treba nam“, „da znamo“). Konkretno reci šta radimo drugačije u zavisnosti od odgovora: „da znamo da li … ili …“. Nikad uopšteno — „da bismo vam bolje pomogli“ je gore nego nikakvo obrazloženje.
Obrazloženje zavisi od onoga što je čovek rekao: isto pitanje posle pada i posle usamljenosti ne traži isto objašnjenje. Kad znaš ime, koristi ga.
Bez dijagnoza i bez obećanja.

Primeri potpitanja koja otvara odgovor, sa obrazloženjem. Prvi je primer same NANA Prime:
${WHY_FOLLOW_UPS.map((w) => `- Kad ${w.kad}. Pitanje: „${w.pitanje}“ Obrazloženje: „${w.obrazlozenje}“`).join('\n')}

Obrazloženja za pitanja iz liste, kao orijentir — prilagodi ih razgovoru i ne šalji ih samo zato što postoje:
${Object.entries(WHY)
  .map(([id, text]) => `- ${id}: ${text}`)
  .join('\n')}

# Šta ne radiš
Ne izmišljaš pitanja ni opcije van liste. Ne postavljaš medicinske dijagnoze. Ne obećavaš cene, rokove ni konkretne osobe.
Ne komentarišeš sopstveni proces („sada ću da zabeležim…", „idemo dalje na sledeću sekciju").

# Uvodne rečenice za sekcije, kao orijentir — parafraziraj ih, ne recituj
${Object.entries(STEP_INTRO)
  .map(([id, text]) => `- ${id}: ${text}`)
  .join('\n')}`;
}

// Sent as a system-role message each turn: the remaining questions change as the
// frailty band moves, and this keeps that list beside the conversation without
// rewriting the cached system prompt above it.
export function stateMessage(answers, notes = []) {
  const remaining = remainingQuestions(answers);
  const frailty = frailtyOf(answers);

  if (!remaining.length) {
    return 'Sva pitanja su odgovorena. Pozovi `assess` poslednji put, pa se zahvali u jednoj rečenici i reci da sada praviš plan podrške. Ne pozivaj `ask` ni `follow_up`.';
  }

  return [
    'Prvo zabeleži sve iz poslednje korisnikove poruke (`record_answers`, `record_note`), pa pozovi `assess`, pa tek onda pitaj sledeće. U svojoj rečenici pomeni konkretan detalj iz te poruke.',
    frailty
      ? `Trenutna procena krhkosti: nivo ${frailty.level}. Ne pominji je korisniku — biće mu prikazana zasebno.`
      : 'Još nema dovoljno odgovora za procenu krhkosti.',
    notes.length
      ? `Već zabeleženo van pitanja (ne pitaj ponovo):\n${notes.map((n) => `- ${n}`).join('\n')}`
      : null,
    `Preostala pitanja (${remaining.length}), redom:`,
    JSON.stringify(remaining, null, 1),
  ]
    .filter(Boolean)
    .join('\n');
}
