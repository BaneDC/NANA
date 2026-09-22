import { MODEL, toAnswer, withoutLongDashes } from '../data/conversation';
import { questionById } from '../data/flow';
import { frailtyOf } from '../data/frailty';
import { answerText, planQuestions } from '../data/planEdits';
import { srField, srOption, srTitle } from '../data/flow.sr';
import { caregivers } from '../data/carePlan';
import { activeVersion, allVisits, pendingVersion, waitingOnYou } from '../data/familyCare';

// The assistant beside a finished care plan, able to change it. The plan is
// built from the family's answers, so the assistant changes it the only way
// anything does: by proposing new answers. It never applies them — the panel
// shows what would change and the family decides. One request per message; the
// proposal ends the turn and waits for them.

const PROPOSE = {
  name: 'propose_changes',
  description:
    'Propose changes to the answers the care plan is built from. The family sees the proposal — each answer as it is and as it would be — and applies it or not; nothing changes until they do. Use only question ids and option ids from the catalog in the latest system message. One entry per question.',
  input_schema: {
    type: 'object',
    properties: {
      note: {
        type: 'string',
        description:
          'One short sentence to the family, shown above the proposal: what you are proposing and why, in plain words, in the language they wrote in. It describes exactly the changes in this call — nothing more, nothing left out.',
      },
      changes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            questionId: { type: 'string' },
            optionId: { type: 'string', description: 'For "single" questions: the one option that now applies.' },
            optionIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'For "multi" questions: every option that applies now — the full new set, not only the ones that changed.',
            },
            other: { type: 'string', description: 'For "multi" questions that allow it: anything that fits none of the options.' },
            values: {
              type: 'object',
              additionalProperties: { type: 'string' },
              description: 'For "inputs" questions: field id → value, only the fields that change.',
            },
          },
          required: ['questionId'],
        },
      },
    },
    required: ['note', 'changes'],
  },
};

// What matters but is not a question the plan asks — a habit, a preference, a
// name. It is kept with the plan's notes, which the coordinator reads.
const NOTE = {
  name: 'add_note',
  description:
    'Keep something the family said that no question covers (a habit, a preference, a diagnosis, a person) with the care plan, where the coordinator reads it. It is saved straight away.',
  input_schema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'The note, short, in the language the family wrote in.' },
    },
    required: ['text'],
  },
};

// Sending a caregiver the request, which is the family's to do: proposed here,
// sent when they press the button.
const REQUEST = {
  name: 'propose_request',
  description:
    'Offer to send a caregiver a request (an inquiry with the care plan attached; it costs nothing and commits nobody). The family sees a button and sends it themselves. Only caregivers from the list in the latest system message who have not been asked yet.',
  input_schema: {
    type: 'object',
    properties: {
      caregiverIds: { type: 'array', items: { type: 'string' }, description: 'Caregiver ids from the list.' },
    },
    required: ['caregiverIds'],
  },
};

// A way to the page something is on, when the family wants to look at it.
export const PAGES = {
  plan: 'Plan nege',
  'my-care': 'Moja nega',
  'find-caregiver': 'Pronađi negovateljicu',
  visits: 'Sve posete',
  requests: 'Upiti',
  settings: 'Podešavanja',
};
const SHOW = {
  name: 'show_page',
  description: 'Show a button that opens a page of the app, when the family wants to see or do something there.',
  input_schema: {
    type: 'object',
    properties: { page: { type: 'string', enum: Object.keys(PAGES) } },
    required: ['page'],
  },
};

const system = (name) =>
  [
    `You are the assistant in NANA Prime, for the family caring for ${name}. The person talking to you is a family member. You know their care plan, the caregivers who fit it, who they have asked, and what is waiting on them — all in the latest system message, which is the truth about their situation; never invent visits, prices or answers that are not there.`,
    'Besides the plan you can help with the rest of their care: say how things work (a request costs nothing; terms must be agreed before anything is booked; a visit is reserved on their card and charged after the work order unless they query it), offer to send requests with `propose_request`, and point them to a page with `show_page`. Anything that moves money or agrees terms they do on the page themselves.',
    'The plan is not free text: it is built from their answers to the onboarding questions, and the recommendations and caregivers follow from those answers. To change the plan, call `propose_changes` with the answers that should now be different. The app shows the proposal and they apply it with a button — never say a change is made, say what you are proposing.',
    'One thing said often touches more than one question — what they still manage alone and where they need hands-on help, how they get around and whether they can go out alone. Look at every question it bears on and propose all of them in one call.',
    'If what they tell you changes nothing in the answers, say so plainly and do not propose anything. If it matters but no question covers it (a habit, a preference, a diagnosis, a person), keep it with `add_note` and tell them it is saved with the plan for the coordinator.',
    'Keep replies to one to three short sentences. Reply in the language they write in.',
  ].join('\n\n');

// Every question that applies now, with its options and current answer, as the
// model needs them. Sent as a system message after the latest turn, so it is
// always current and the cached prefix stays put.
function catalog(answers) {
  const questions = planQuestions(answers).flatMap((s) =>
    s.questions.map(({ q, answer }) => ({
      id: q.id,
      section: s.title,
      question: srTitle(q),
      type: q.type,
      ...(q.type === 'inputs'
        ? { fields: q.fields.map((f) => ({ id: f.id, label: srField(q, f.id) })) }
        : { options: q.options.map((o) => ({ id: o.id, label: srOption(q, o.id) })), ...(q.allowOther ? { allowsOther: true } : {}) }),
      current: answer ? answerText(q, answer) : null,
      ...(answer ? { currentRaw: answer } : {}),
    }))
  );
  const frailty = frailtyOf(answers);
  return [
    frailty ? `Current frailty level: ${frailty.level} (do not tell the family the number unless they ask).` : null,
    'Questions the plan is built from, with the current answers:',
    JSON.stringify(questions),
  ]
    .filter(Boolean)
    .join('\n');
}

// Where the family stands with caregivers, as the model needs it: who fits,
// who was asked and what they said, what was agreed, what is booked, and what
// is waiting on the family.
function situation(care) {
  const asked = Object.fromEntries(care.requests.map((r) => [r.caregiverId, r]));
  const list = caregivers.map((c) => ({
    id: c.id,
    name: c.name,
    match: `${c.match}%`,
    area: c.area,
    distance: c.distance,
    rate: c.rate,
    years: c.years,
    skills: c.tags,
    days: c.days,
    request: asked[c.id] ? { status: asked[c.id].status, detail: asked[c.id].detail } : 'not asked',
  }));
  const arrangements = care.arrangements.map((a) => ({
    caregiver: a.caregiver.name,
    agreed: activeVersion(a) ? { rate: activeVersion(a).rate, hoursPerWeek: activeVersion(a).hours, schedule: activeVersion(a).schedule } : null,
    termsWaitingForFamily: pendingVersion(a) ? { rate: pendingVersion(a).rate, hoursPerWeek: pendingVersion(a).hours, schedule: pendingVersion(a).schedule } : null,
    ended: a.endedOn || null,
  }));
  const visits = allVisits(care).map((v) => ({ caregiver: v.caregiver.name, date: v.date, time: v.time, status: v.status }));
  return [
    `Payment card saved: ${care.payment.connected ? 'yes' : 'no'}.`,
    'Caregivers who fit the plan (rates in RSD per hour):',
    JSON.stringify(list),
    `Arrangements: ${JSON.stringify(arrangements)}`,
    `Visits: ${visits.length ? JSON.stringify(visits) : 'none yet'}`,
    `Waiting on the family: ${waitingOnYou(care).map((w) => w.kind).join(', ') || 'nothing'}`,
  ].join('\n');
}

// A proposed entry in the shape an answer is stored in, or null when it names a
// question or option that does not exist. An `inputs` change only names the
// fields that change, so it is laid over the current values first.
function toChange(entry, answers) {
  const q = questionById[entry.questionId];
  if (!q) return null;
  const merged =
    q.type === 'inputs' ? { ...entry, values: { ...(answers[q.id]?.values || {}), ...(entry.values || {}) } } : entry;
  const answer = toAnswer(merged);
  return answer ? { questionId: q.id, answer } : null;
}

/**
 * One message from the family, answered. Returns the assistant's words, any
 * proposal it made (already checked against the questions), and the history
 * to send next time.
 */
export async function askPlanCopilot({ client, name, answers, care, history, text }) {
  const messages = [...history, { role: 'user', content: text }];

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // Thinking stays on: with it off this model can write a tool call as text,
    // which here would be a proposal that never shows up.
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    // A declined request is re-run on the recommended fallback instead of
    // leaving the panel with nothing.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: system(name),
    tools: [PROPOSE, NOTE, REQUEST, SHOW],
    messages: [...messages, { role: 'system', content: [catalog(answers), care ? situation(care) : null].filter(Boolean).join('\n\n') }],
  });

  if (response.stop_reason === 'refusal') {
    console.error('Refusal', response.stop_details);
    throw new Error('Asistent nije mogao da odgovori na to. Probajte da kažete drugačije.');
  }

  const said = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  const calls = response.content.filter((b) => b.type === 'tool_use');

  const next = [...messages, { role: 'assistant', content: response.content }];
  let changes = [];
  let note = null;
  const notes = [];
  const requests = [];
  const pages = [];
  if (calls.length) {
    const results = calls.map((call) => {
      if (call.name === 'add_note') {
        const t = String(call.input.text || '').trim();
        if (t) notes.push(t);
        return { type: 'tool_result', tool_use_id: call.id, content: t ? 'Saved with the plan.' : 'Empty note, nothing saved.' };
      }
      if (call.name === 'propose_request') {
        const asked = new Set((care?.requests || []).map((r) => r.caregiverId));
        const ids = (call.input.caregiverIds || []).filter((id) => caregivers.some((c) => c.id === id) && !asked.has(id));
        requests.push(...ids.filter((id) => !requests.includes(id)));
        return {
          type: 'tool_result',
          tool_use_id: call.id,
          content: ids.length ? 'Shown as a button; the family sends it themselves.' : 'Nothing shown: unknown caregiver, or already asked.',
          ...(ids.length ? {} : { is_error: true }),
        };
      }
      if (call.name === 'show_page') {
        if (PAGES[call.input.page] && !pages.includes(call.input.page)) pages.push(call.input.page);
        return { type: 'tool_result', tool_use_id: call.id, content: 'Shown as a button.' };
      }
      if (call.name === 'propose_changes' && typeof call.input.note === 'string') note = call.input.note.trim();
      const entries = call.name === 'propose_changes' ? call.input.changes || [] : [];
      const valid = entries.map((e) => toChange(e, answers)).filter(Boolean);
      changes = changes.concat(valid);
      const rejected = entries.length - valid.length;
      return {
        type: 'tool_result',
        tool_use_id: call.id,
        content: valid.length
          ? `Shown to the family as a proposal (${valid.length} ${valid.length === 1 ? 'change' : 'changes'}). They apply it or not with a button.${rejected ? ` ${rejected} entries named a question or option that does not exist and were left out.` : ''}`
          : 'Nothing was shown: every entry named a question or option that does not exist. Use ids from the catalog.',
        ...(valid.length ? {} : { is_error: true }),
      };
    });
    next.push({ role: 'user', content: results });
  }

  // the proposal's own sentence, when the reply carried no words of its own
  // no long dashes in what she says, the same rule the onboarding keeps
  return { said: withoutLongDashes(said || (changes.length ? note : '') || ''), changes, notes, requests, pages, history: next };
}

// Said into the history when the family acts on a proposal, so the next answer
// knows whether it went through.
export const decided = (history, applied) => [
  ...history,
  { role: 'user', content: applied ? '(I applied the proposed changes.)' : '(I did not apply the proposed changes.)' },
];
