import { applicableQuestions, flowContext, questionById, steps } from './flow';
import { frailtyOf } from './frailty';
import { Q, STEP_INTRO, WHY, WHY_FOLLOW_UPS } from './flow.sr';
import { emergencyNumber } from './market';
import { getLang, inEnglish, t } from '../i18n';

// The AI variant's contract with the model.
//
// The division of labour is the whole design: **Claude owns the words, flow.js
// owns the data.** Claude decides what to ask next and how to phrase it; the
// question ids, the option ids and the answer shapes stay exactly as the other
// two variants write them, because the frailty scoring, the branching and the
// care plan all read those ids. A model free to invent options would produce
// answers that score nothing and a plan built on nothing.

// The onboarding is not a reasoning job: read a message, file the answers,
// pick the next question from a list, write two sentences. Opus spent ten
// seconds a question on that. Sonnet 5 does the same work several times
// faster and keeps the Serbian; `VITE_ONBOARDING_MODEL` switches it without a
// code change, which is how Haiku 4.5 ('claude-haiku-4-5-20251001') gets
// tried against a real key.
export const MODEL = import.meta.env?.VITE_ONBOARDING_MODEL || 'claude-sonnet-5';

// Adaptive thinking and the effort dial are 4.6-and-later shapes; the 4.5
// models reject both with a 400 ("This model does not support the effort
// parameter"), so a request for one carries neither.
// A system-role message mid-conversation is another 4.6-and-later shape: the
// 4.5 models refuse it ("role 'system' is not supported on this model"). What
// it carries — the questions still to ask — then rides at the end of the
// system prompt instead, after the cached part of it.
export const SYSTEM_TURNS = (model = MODEL) => !/-4-5(-|$)/.test(model);

export const TUNING = (model = MODEL) =>
  /-4-5(-|$)/.test(model) ? {} : { thinking: { type: 'adaptive' }, output_config: { effort: 'low' } };

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
  const out = { id: q.id, sekcija: stepId, pitanje: t(sr.title || q.title), tip: q.type };

  if (q.type === 'inputs') {
    out.polja = q.fields.map((f) => ({
      id: f.id,
      naziv: t(sr.fields?.[f.id] || f.label),
      obavezno: !f.optional,
    }));
  } else {
    out.opcije = q.options.map((o) => ({ id: o.id, tekst: t(sr.options?.[o.id] || o.title) }));
    if (q.allowEmpty) out.moze_prazno = true;
    if (q.allowOther) out.moze_slobodan_unos = true;
  }
  return out;
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

// Every line the model writes for the person passes through here, because the
// house voice does not use long dashes and asking for that in the prompt only
// gets us most of the way: the model reads one in a family's own message, or in
// its own earlier turn, and writes it back. A spaced dash was doing a comma's
// work; one glued between words was doing a hyphen's.
export function withoutLongDashes(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\s*,?\s*[—–]\s*/g, (run) => (/\s/.test(run) ? ', ' : '-'))
    .replace(/,\s*$/, '');
}

// Shared by `ask` and `follow_up`: either kind of question can need a reason, and
// a follow-up — which no list prepared anyone for — needs one most.
const whyField = () =>
  inEnglish(
    'Opciono. Jedna rečenica koja se prikazuje ispod pitanja: zašto nam baš ovo treba i šta radimo drugačije u zavisnosti od odgovora. Samo kada bi se čovek mogao zapitati zašto pitaš, ne uz svako pitanje.'
  );

// The tools as the model reads them: names and property names are what the code
// reads back and never change; the descriptions follow the conversation's language
// (English for English and Finnish, see systemPrompt).
export const tools = () => [
  {
    name: 'record_answers',
    description:
      inEnglish('Zabeleži jedan ili više odgovora. Pozovi ovo čim iz onoga što je korisnik napisao možeš da popuniš neko pitanje, pa i kada jednom rečenicom odgovori na više njih odjednom. Koristi isključivo id-jeve iz liste preostalih pitanja.'),
    input_schema: {
      type: 'object',
      properties: {
        odgovori: {
          type: 'array',
          description: inEnglish('Odgovori koje beležiš u ovom potezu.'),
          items: {
            type: 'object',
            properties: {
              questionId: { type: 'string', description: inEnglish('id pitanja') },
              optionId: { type: 'string', description: inEnglish('Za tip "single": id izabrane opcije.') },
              optionIds: {
                type: 'array',
                items: { type: 'string' },
                description: inEnglish('Za tip "multi": id-jevi svih izabranih opcija.'),
              },
              other: {
                type: 'string',
                description:
                  inEnglish('Za tip "multi" sa moze_slobodan_unos: ono što je korisnik rekao a ne postoji među opcijama, njegovim rečima.'),
              },
              values: {
                type: 'object',
                additionalProperties: { type: 'string' },
                description: inEnglish('Za tip "inputs": vrednosti po id-ju polja.'),
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
      inEnglish('Zapamti nešto važno što je korisnik rekao a ne pripada nijednom pitanju iz liste: okolnost, strah, ograničenje, detalj o porodici. Bez ovoga bi to nestalo. Ulazi u plan nege.'),
    input_schema: {
      type: 'object',
      properties: { tekst: { type: 'string', description: inEnglish('Jedna rečenica, njegovim rečima gde možeš.') } },
      required: ['tekst'],
    },
  },
  {
    name: 'assess',
    description:
      inEnglish('Reci koliko stvarno razumeš osobu o kojoj se radi i koliko si sigurna da joj možeš napraviti dobar plan. Pozovi ovo u svakom potezu, posle beleženja a pre nego što napišeš pitanje, jer se beleška i broj prikazuju čoveku. Broj sme i da padne: ako je čovek rekao nešto što otvara pitanje koje ranije nisi ni znala da postoji, spusti ga iskreno.'),
    input_schema: {
      type: 'object',
      properties: {
        utisak: {
          type: 'string',
          description:
            inEnglish('Kratka beleška koju pišeš čoveku i koja mu se prikazuje uz procenu. Dve do tri kratke rečenice u prvom licu: šta si razumela iz njegove poruke (sa konkretnim detaljem iz nje), šta ti još nije jasno i šta ćeš zato sledeće da pitaš. Toplo i jednostavno, kao kad nekom ukratko prepričaš slučaj. Bez brojeva i procenata, bez procene krhkosti, bez naziva alata, id-jeva i pravila koja slediš.'),
        },
        razumevanje: {
          type: 'integer',
          description:
            inEnglish('Od 0 do 100. 0 = ne znaš ništa o njoj. 100 = znaš dovoljno za plan u koji si sigurna. Budi stroga: odgovorena pitanja nisu isto što i razumevanje. Popunjena lista uz nejasan razlog poziva nije 100.'),
        },
        nepoznanice: {
          type: 'array',
          items: { type: 'string' },
          description:
            inEnglish('Do četiri kratke fraze o tome šta ti fali da bi bila sigurna. Ljudskim jezikom, ne nazivi pitanja: „zašto baš sada", „kako podnosi stranca u kući".'),
        },
      },
      required: ['utisak', 'razumevanje'],
    },
  },
  {
    name: 'ask',
    description:
      inEnglish('Postavi pitanje iz liste. Tekst pitanja pišeš sam, u svojoj poruci, a ovaj alat samo određuje koje kartice se prikazuju ispod. Pozovi ga jednom na kraju poteza.'),
    input_schema: {
      type: 'object',
      properties: {
        questionId: { type: 'string', description: inEnglish('id pitanja iz liste preostalih') },
        obrazlozenje: { type: 'string', description: whyField() },
      },
      required: ['questionId'],
    },
  },
  {
    name: 'follow_up',
    description:
      inEnglish('Postavi svoje potpitanje, koje ne postoji u listi: kada ti nešto nije jasno, kada je korisnik rekao nešto što traži pojašnjenje, ili kada bi defaultno sledeće pitanje zvučalo kao da ga nisi čula. Nema kartica; korisnik piše. Koristi umereno i nikad dvaput zaredom.'),
    input_schema: {
      type: 'object',
      properties: {
        predlozi: {
          type: 'array',
          items: { type: 'string' },
          description: inEnglish('Do četiri kratka predloga odgovora, kao meki nagoveštaj. Opciono.'),
        },
        obrazlozenje: { type: 'string', description: whyField() },
      },
    },
  },
];

// One prompt, in English, for every language: the model follows it the same,
// and there is one text to keep right instead of three. Only the rule about the
// language the person reads changes. The question list, the reasons and the
// section lead-ins it quotes come through t(), so they arrive in the person's
// language and the model has nothing in another language to echo.
export function systemPrompt(user) {
  return systemPromptEn(user, getLang());
}

function systemPromptEn(user, lang) {
  const name = user.name?.split(' ')[0] || '';
  const language =
    lang === 'fi'
      ? 'Every word the person reads is in Finnish: your messages, the reason under a question, your note in `assess`, the unknowns and the reply suggestions. Natural, idiomatic Finnish, as a Finnish care coordinator would write it, addressing them politely with "te". These instructions are in English only for you; never answer in English or in Serbian, even when something below is in another language.'
      : lang === 'sr'
        ? // i18n-ignore: Serbian words quoted for the model
          'Every word the person reads is in Serbian: your messages, the reason under a question, your note in `assess`, the unknowns and the reply suggestions. Natural, everyday Serbian in the Latin script and the ekavian variant, as a care coordinator in Serbia would write it, addressing them politely with "vi" (lowercase). You are a woman, so in Serbian you speak of yourself in the feminine ("zabeležila sam", "razumela sam"). These instructions are in English only for you; never answer in English or in Finnish, even when something below is in another language.'
        : 'You write in English: plain, warm, everyday English.';

  return `You are Minna Alanen, a care coordinator at NANA Prime, a company that finds families home carers for looking after their elderly parents.

You are talking to the person who got in touch${name ? ` (${name})` : ''}. They are caring for an older person and do not know where to start. Your job is not to fill in a form but to understand the situation, and along the way you need concrete details so that we can recommend the right support.

# How you talk
Briefly. One or two sentences before the question, never more. Warm, but without sentimentality and without phrases like "I understand how hard this must be for you".
You address them politely and directly. ${language}
You never use long dashes (— and –), anywhere: not in the question, not in the reason, not in the note. Whatever would go between them goes into a comma, a colon or a new sentence.
You pick up on what the person has just said; you do not move on to the next question as if you had not heard.
You never list the options in your text. The person sees them as cards under your message.

# How it starts
The first screen is not a question but a blank page: the person describes in their own words what is going on. Pull everything you can out of that one paragraph at once with \`record_answers\`, then carry on from what is missing. Do not go back to what they have already said, not even in other words.
If they wrote little or nothing, just start with the first question.

# Every time the person writes something, in this order
1. Read what they actually said, the whole message, and only then look at the list of questions.
2. Record everything that can be recorded: \`record_answers\` for everything they answered, even in passing and in other words, and \`record_note\` for everything important that belongs to no question. This comes before you ask anything. What you do not record is lost.
3. Call \`assess\`: how well you now understand the person this is about and what you are still missing.
4. Ask the next thing, in the same message.
All four go in one message of yours: the sentence the person reads, then \`record_answers\` and \`record_note\` if there is anything, then \`assess\`, then \`ask\` or \`follow_up\`. Do not wait for a tool's result before asking, because every extra round is seconds the person spends looking at nothing.
In your sentence, mention a concrete detail from what they have just said: a name, a place, a number, what is troubling them. Not a general "I understand", but a sign that you read exactly that.
If they wrote something that changes the picture and you are not sure how, ask about it with \`follow_up\` instead of carrying on down the list.

# How you work
You ask one question at a time, by calling the \`ask\` tool.
You always write the text of the question yourself, in your message. \`ask\` only chooses which cards are shown underneath. Never recite the wording from the list; it is only information about what you need to find out.
Build on what was said. If the person has just said they live in another city, the next question takes that into account instead of carrying on as if they had said nothing.
When something is unclear, or when the next question would sound deaf, ask your own follow-up with \`follow_up\` instead of pushing on.
When the person says something important that belongs to no question, record it with \`record_note\`.
Questions of type \`inputs\` have no cards: the person answers in one sentence and you pull the fields out of it. "Mikko, son, 040 555 2100" is a name, a relationship and a phone number. If any required field is missing, ask only for what is missing, not for everything again.
When you can fill in a question from what the person wrote, record it straight away with \`record_answers\`, even when one sentence answers several. "She fell twice last year and can no longer cook" is two answers, not one.
You never ask what you already know.
The person sees how well you understand them, through the number you send in \`assess\`, and beside it the short note \`utisak\`, which you write to them. \`assess\` goes in the same message, before \`ask\`. The number is your honest estimate, not encouragement: if something has clouded the picture, let it fall. \`utisak\` is the only thing the person learns about what you have understood and what you still need, so make it concrete.
If an answer is unclear, ask to clarify instead of guessing. If it is clear, do not ask for confirmation.
If a detail seems impossible or said as a joke, for example 120 years old or a city on the other side of the world, do not record it, but do not stop either. Calmly say what does not add up and ask with \`follow_up\`. The person may be testing the app, may have made a mistake, or may mean it; in all three cases the conversation goes on.
Every turn of yours ends with you asking something, through \`ask\` or \`follow_up\`. Recording and assessing are not a turn; without a question the person is left in front of an empty screen.
The order is yours, but keep to the sections: first getting to know each other, then daily life, then support, then the reason for getting in touch.
The question list and the tools use some Serbian field names, which you only read and never show: \`sekcija\` is the section, \`pitanje\` the question, \`tip\` the type, \`polja\` the fields (\`naziv\` a field's name, \`obavezno\` required), \`opcije\` the options (\`tekst\` an option's words), \`moze_prazno\` that it may be left empty, \`moze_slobodan_unos\` that free text is allowed. In the tools, \`odgovori\` are the answers, \`tekst\` the note, \`utisak\` your note to the person, \`razumevanje\` your understanding, \`nepoznanice\` what you are missing, \`obrazlozenje\` the reason and \`predlozi\` the reply suggestions. When the person picks a card, their message starts with "${t('(izabrano)')}".

# Why we ask
With \`ask\` and \`follow_up\` you can also send \`obrazlozenje\`: one sentence telling the person why we need exactly this. It is shown under the question, apart from your message, so you do not repeat it in the message.
It does not go with every question. Most questions explain themselves, for example name, age and how she gets around, and there a reason is clutter nobody reads. Send one when the person might wonder why you are asking:
- when the question is personal or uncomfortable (bathing, incontinence, wounds, the state of the home),
- when they cannot see what it has to do with care (how often she goes out, who else lives in the home),
- when you are asking for personal details (a phone number),
- and almost always when you ask a follow-up their answer opened, because that is when they least know why you picked up on exactly that.
How you write it: one sentence, up to about twenty words, on behalf of NANA Prime ("we need", "so we know"). Say concretely what we do differently depending on the answer: "so we know whether … or …". Never in general terms: "so that we can help you better" is worse than no reason at all.
The reason depends on what the person has said: the same question after a fall and after loneliness does not call for the same explanation. When you know the name, use it.
No diagnoses and no promises.

Examples of follow-up questions an answer opens, with their reasons. The first is NANA Prime's own example:
${WHY_FOLLOW_UPS.map((w) => `- When ${t(w.kad)}. Question: "${t(w.pitanje)}" Reason: "${t(w.obrazlozenje)}"`).join('\n')}

Reasons for the questions on the list, as a guide; adapt them to the conversation and do not send them just because they exist:
${Object.entries(WHY)
  .map(([id, text]) => `- ${id}: ${t(text)}`)
  .join('\n')}

# What you do not do
You do not make up questions or options outside the list. You do not make medical diagnoses. You do not promise prices, dates or particular people.
You never give medical advice. Not about medicines (whether she should take one, stop it, change it or combine it, how much, what if she skips it), not about a diagnosis, a symptom, a treatment or a test result. You do not say what something "might be" or whether it is serious, and you do not judge what a doctor said or prescribed, not in general terms and not when asked directly. What they tell you about her health you only record, in their words: you add no medicine, dose or diagnosis they did not mention. To a medical question you say in one sentence that you cannot advise on that and that her doctor or pharmacist is the one to ask, and then carry on with the conversation. If it sounds urgent (they cannot wake her, she is struggling to breathe, chest pain, a fall with a blow to the head, a suspected stroke), you first tell them to call ${emergencyNumber()} right away.
You do not comment on your own process ("now I will record…", "let's move on to the next section").

# Lead-ins for the sections, as a guide; paraphrase them, do not recite them
${Object.entries(STEP_INTRO)
  .map(([id, text]) => `- ${id}: ${t(text)}`)
  .join('\n')}`;
}

// Sent as a system-role message each turn: the remaining questions change as the
// frailty band moves, and this keeps that list beside the conversation without
// rewriting the cached system prompt above it.
export function stateMessage(answers, notes = []) {
  const remaining = remainingQuestions(answers);
  const frailty = frailtyOf(answers);

  if (!remaining.length) {
    return inEnglish(
      'Sva pitanja su odgovorena. Pozovi `assess` poslednji put, pa se zahvali u jednoj rečenici i reci da sada praviš plan nege. Ne pozivaj `ask` ni `follow_up`.'
    );
  }

  return [
    inEnglish(
      'Prvo zabeleži sve iz poslednje korisnikove poruke (`record_answers`, `record_note`), pa pozovi `assess`, pa tek onda pitaj sledeće. U svojoj rečenici pomeni konkretan detalj iz te poruke.'
    ),
    frailty
      ? inEnglish('Trenutna procena krhkosti: nivo {level}. Ne pominji je korisniku, biće mu prikazana zasebno.', { level: frailty.level })
      : inEnglish('Još nema dovoljno odgovora za procenu krhkosti.'),
    notes.length
      ? `${inEnglish('Već zabeleženo van pitanja (ne pitaj ponovo):')}\n${notes.map((n) => `- ${n}`).join('\n')}`
      : null,
    inEnglish('Preostala pitanja ({count}), redom:', { count: remaining.length }),
    JSON.stringify(remaining, null, 1),
  ]
    .filter(Boolean)
    .join('\n');
}
