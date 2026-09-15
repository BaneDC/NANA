import Anthropic from '@anthropic-ai/sdk';
import { reconcile } from '../data/dependencies';
import { MODEL, TOOLS, remainingQuestions, stateMessage, toAnswer } from '../data/conversation';
import { frailtyOf } from '../data/frailty';

const KEY_STORAGE = 'nana.anthropic-key';

// The key is the developer's own, typed into the app and kept in this browser.
// That is the right call for a local demo where whoever pulls the repo brings
// their own key — and the wrong call for anything shipped: a browser-held key is
// readable by any script on the page, so this never goes near a real user.
//
// A key in `.env.local` (ANTHROPIC_API_KEY) fills in when this browser has none.
// The browser's copy belongs to one address, port included, so every time the
// dev server came up on a different port the saved key was simply not there;
// the file does not care which port. A key typed into the app still comes
// first, and one Anthropic rejects is cleared (see App), so the next load falls
// back to the file. Only the dev server hands the file's key in — see `define`
// in vite.config.js — so a build never carries it.
const fileKey = typeof __DEV_ANTHROPIC_KEY__ === 'string' ? __DEV_ANTHROPIC_KEY__ : '';
export const loadKey = () => localStorage.getItem(KEY_STORAGE) || fileKey || '';
export const saveKey = (key) => localStorage.setItem(KEY_STORAGE, key.trim());
export const clearKey = () => localStorage.removeItem(KEY_STORAGE);

export function createClient(apiKey) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

// Thinking stays ON, deliberately. Disabling it on this model lets tool calls
// arrive as plain text — the turn succeeds, the call never runs, nothing errors,
// and in a loop that text poisons later turns. For a design that hangs entirely
// on tool use that is the worst available bug; `low` effort is the cheap lever.
const REQUEST = {
  model: MODEL,
  max_tokens: 8000,
  thinking: { type: 'adaptive' },
  output_config: { effort: 'low' },
  tools: TOOLS,
};

// `obrazlozenje` is optional by design — most questions come without one — so
// anything that is not a non-empty string counts as none, and can never draw an
// empty "why" under a question.
const reasonOf = (input) =>
  typeof input?.obrazlozenje === 'string' && input.obrazlozenje.trim() ? input.obrazlozenje.trim() : null;

// What she is thinking and still missing, from an `assess` that may be only half
// written — so every field is checked for being there and being a string.
const thinkingOf = (input) => ({
  text: typeof input?.razmisljanje === 'string' ? input.razmisljanje.trim() : '',
  missing: Array.isArray(input?.nepoznanice)
    ? input.nepoznanice
        .filter((u) => typeof u === 'string' && u.trim())
        .map((u) => u.trim())
        .slice(0, 4)
    : [],
});

/**
 * One turn of the conversation, looping until the model stops calling tools.
 *
 * `answers` is threaded through locally rather than read back from React: a turn
 * can record several answers before it finishes, and each one can change which
 * questions remain, so the model has to see the new state within the same turn.
 */
export async function runTurn({
  client,
  system,
  messages,
  answers,
  notes = [],
  onText,
  onAnswer,
  onNote,
  onAsk,
  onFollowUp,
  onAssess,
  onThinking,
}) {
  let working = { ...answers };
  const collected = [...notes];
  const history = [...messages];

  for (let hop = 0; hop < 8; hop += 1) {
    const stream = client.beta.messages.stream({
      ...REQUEST,
      // Claude Opus 5's classifiers can decline a request; this re-runs it on
      // Anthropic's recommended fallback rather than handing us a dead turn.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages: [...history, { role: 'system', content: stateMessage(working, collected) }],
    });

    stream.on('text', (delta) => onText(delta));
    // Her thinking out loud is the `razmisljanje` in `assess`, shown while she
    // writes it — so that tool's input is read as it streams, not once the call
    // is complete. Listening to `inputJson` is also what makes the SDK parse
    // partial input at all; `streamEvent` says which tool the input belongs to.
    let streamingTool = null;
    stream.on('streamEvent', (event) => {
      if (event.type === 'content_block_start') {
        streamingTool = event.content_block.type === 'tool_use' ? event.content_block.name : null;
      }
    });
    stream.on('inputJson', (_, input) => {
      if (streamingTool === 'assess') onThinking?.(thinkingOf(input));
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      throw new Error('Model je odbio da odgovori na ovu poruku.');
    }

    history.push({ role: 'assistant', content: message.content });

    const calls = message.content.filter((b) => b.type === 'tool_use');
    if (!calls.length) return { messages: history, answers: working, notes: collected };

    const results = [];
    // Whether this turn actually put something on screen for the user to answer.
    // Not the same as "the model called `ask`": it can ask for a question id that
    // does not exist, and ending the turn on that leaves a screen with nothing on
    // it. Only a call that landed hands control back to the person.
    let waiting = false;

    for (const call of calls) {
      if (call.name === 'record_answers') {
        const recorded = [];
        for (const entry of call.input.odgovori || []) {
          const answer = toAnswer(entry);
          if (!answer) continue;
          working = reconcile(working, { ...working, [entry.questionId]: answer }).answers;
          // only report what survived reconciliation — a changed band can drop
          // an answer the model just gave
          if (working[entry.questionId]) {
            recorded.push(entry.questionId);
            onAnswer(entry.questionId, answer);
          }
        }
        results.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: JSON.stringify({
            zabelezeno: recorded,
            nivo_krhkosti: frailtyOf(working)?.level ?? null,
            preostalo: remainingQuestions(working).length,
          }),
        });
      } else if (call.name === 'record_note') {
        const text = call.input.tekst?.trim();
        if (text) {
          collected.push(text);
          onNote?.(text);
        }
        results.push({ type: 'tool_result', tool_use_id: call.id, content: 'Zabeleženo.' });
      } else if (call.name === 'assess') {
        // Clamped here rather than trusted: the panel maps this straight onto a
        // ring's fill, and a model that answers 120 would draw past the circle.
        const level = Math.max(0, Math.min(100, Math.round(Number(call.input.razumevanje) || 0)));
        const thinking = thinkingOf(call.input);
        onAssess?.({ level, reason: thinking.text, unknowns: thinking.missing });
        // the finished call too, in case the streamed copy stopped short of the end
        onThinking?.(thinking);
        // Says what to do next, because `assess` is the one tool that reads like
        // a whole turn's work without being one. A turn that only records and
        // assesses ends with nothing on screen to answer.
        results.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: 'Zabeleženo. Sada napiši rečenicu korisniku i pozovi `ask` ili `follow_up`.',
        });
      } else if (call.name === 'ask') {
        const id = call.input.questionId;
        if (!remainingQuestions(working).some((q) => q.id === id)) {
          results.push({
            type: 'tool_result',
            tool_use_id: call.id,
            content: `Nema pitanja sa id "${id}" među preostalima — ili je već odgovoreno. Izaberi id iz liste, ili postavi svoje potpitanje preko \`follow_up\`.`,
            is_error: true,
          });
        } else {
          onAsk(id, reasonOf(call.input));
          waiting = true;
          results.push({
            type: 'tool_result',
            tool_use_id: call.id,
            content: 'Kartice su prikazane korisniku. Sačekaj njegov odgovor — ne pitaj ništa više.',
          });
        }
      } else if (call.name === 'follow_up') {
        onFollowUp?.(call.input.predlozi || [], reasonOf(call.input));
        waiting = true;
        results.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: 'Polje za pisanje je prikazano. Sačekaj odgovor — ne pitaj ništa više.',
        });
      } else {
        results.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: `Nepoznat alat: ${call.name}`,
          is_error: true,
        });
      }
    }

    history.push({ role: 'user', content: results });

    // A landed `ask` ends the turn: the model is now waiting on the user, and
    // letting it loop again would have it talk past the cards it just put on
    // screen. A rejected one does not — it loops, reads the error, and picks a
    // real question instead of leaving the person looking at nothing.
    if (waiting) {
      return { messages: history, answers: working, notes: collected };
    }
  }

  return { messages: history, answers: working, notes: collected };
}
