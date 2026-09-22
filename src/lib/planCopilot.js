import { MODEL, toAnswer } from '../data/conversation';
import { questionById } from '../data/flow';
import { frailtyOf } from '../data/frailty';
import { answerText, planQuestions } from '../data/planEdits';
import { srField, srOption, srTitle } from '../data/flow.sr';

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

const system = (name) =>
  [
    `You are the assistant in NANA Prime, open beside the care plan for ${name}. The person talking to you is a family member.`,
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
export async function askPlanCopilot({ client, name, answers, history, text }) {
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
    tools: [PROPOSE, NOTE],
    messages: [...messages, { role: 'system', content: catalog(answers) }],
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
  if (calls.length) {
    const results = calls.map((call) => {
      if (call.name === 'add_note') {
        const t = String(call.input.text || '').trim();
        if (t) notes.push(t);
        return { type: 'tool_result', tool_use_id: call.id, content: t ? 'Saved with the plan.' : 'Empty note, nothing saved.' };
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
  return { said: said || (changes.length ? note : '') || '', changes, notes, history: next };
}

// Said into the history when the family acts on a proposal, so the next answer
// knows whether it went through.
export const decided = (history, applied) => [
  ...history,
  { role: 'user', content: applied ? '(I applied the proposed changes.)' : '(I did not apply the proposed changes.)' },
];
