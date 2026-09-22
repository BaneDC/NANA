import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { ChatExperience, Button as KitButton, useChatTurns } from 'inline-chat-kit';
import 'inline-chat-kit/styles.css';
import { AlertTriangle, ArrowRight, Check, Send } from 'lucide-react';
import { createClient } from '../lib/claudeChat';
import { PAGES, askPlanCopilot, decided } from '../lib/planCopilot';
import { describeChanges } from '../data/planEdits';
import { caregivers } from '../data/carePlan';
import { chatLabelsSr } from '../data/chatLabels.sr';

// The assistant, drawn by inline-chat-kit. The kit owns the conversation's
// look and motion; what is NANA's rides in the answer as custom parts — the
// proposed plan change, the request to a caregiver, the way to a page — and
// the plan change is confirmed with the kit's own approval, with no "always".
//
// One conversation, wherever it is open: the hook lives in <ChatSource>, which
// App keeps mounted and remounts only for a new conversation. It reads the
// family's state through `ctx`, a ref App refreshes every render, so the send
// handler never goes stale and never has to change identity.

// The live conversation is published here rather than lifted into App state:
// the kit rewrites its turns on every keystroke and every streamed frame, and
// only the chat itself should redraw for that, not the whole app around it.
function createChatStore() {
  let current = null;
  const listeners = new Set();
  return {
    get: () => current,
    set: (next) => {
      current = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}
export const chatStore = createChatStore();

export function ChatSource({ ctx }) {
  const history = useRef([]);

  const send = useCallback(async function* (message, { turnId }) {
    const { plan, answers, care, apiKey, onAddNotes } = ctx.current;
    if (!plan || !apiKey) {
      yield 'Asistent radi kad plan nege postoji. Završite razgovor sa Jovanom, pa se vratite ovde.';
      return;
    }
    let r;
    try {
      r = await askPlanCopilot({
        client: createClient(apiKey),
        name: plan.firstName,
        answers,
        care,
        history: history.current,
        text: message,
      });
    } catch (e) {
      console.error(e);
      yield { kind: 'notice', id: `err-${turnId}`, tone: 'danger', text: e?.message || String(e) };
      return;
    }
    history.current = r.history;
    // The kit draws parts in one block above the answer's prose, so when there
    // are cards the sentence rides as the first part, to be read before them.
    const cards = r.changes.length || r.requests.length || r.pages.length;
    if (r.said && cards) yield { kind: 'custom', id: `say-${turnId}`, type: 'lead', data: { text: r.said } };
    else if (r.said) yield r.said;
    if (r.notes.length) {
      onAddNotes(r.notes);
      yield { kind: 'notice', id: `notes-${turnId}`, text: `Sačuvano u planu: ${r.notes.join(' · ')}` };
    }
    if (r.changes.length) {
      yield {
        kind: 'custom',
        id: `plan-${turnId}`,
        type: 'plan-diff',
        data: { changes: r.changes, desc: describeChanges(answers, r.changes), status: 'proposed' },
      };
      yield {
        kind: 'approval',
        id: `ok-${turnId}`,
        title: 'Da primenim ove izmene na plan?',
        description: 'Ništa se ne menja dok ne primenite.',
        choices: ['once', 'deny'],
      };
    }
    if (r.requests.length) {
      yield { kind: 'custom', id: `req-${turnId}`, type: 'send-request', data: { ids: r.requests, sent: [] } };
    }
    if (r.pages.length) {
      yield { kind: 'custom', id: `open-${turnId}`, type: 'open-page', data: { pages: r.pages } };
    }
  }, [ctx]);

  const chat = useChatTurns({ onSend: send, announcements: { responding: 'Stiže odgovor' } });
  const { turns, isStreaming } = chat;
  useEffect(() => {
    chatStore.set({ ...chat, history });
    // the hook's functions are stable; what changes is the turns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turns, isStreaming]);
  return null;
}

// ── the cards ────────────────────────────────────────────────────────────────
// Their state lives in the part's data and is written back with updatePart, so
// only the row they belong to redraws, and a remount keeps it.

// Built on the kit's surfaces, like its own question and approval: a ground
// holding a card holding inset rows, corners on the kit's one chain
// (8 → 16 → 24 → 40), separated by surface and gap rather than by lines.
function KitCard({ title, status, children, foot }) {
  return (
    <div className="kc-ground" data-status={status}>
      <div className="kc-card">
        <p className="kc-title">{title}</p>
        {children}
        {foot && <p className="kc-foot">{foot}</p>}
      </div>
    </div>
  );
}

function PlanDiffCard({ data }) {
  const { desc, status } = data;
  const title =
    status === 'applied' ? (
      <>
        <Check size={14} strokeWidth={2} /> Primenjeno na plan
      </>
    ) : status === 'dismissed' ? (
      'Nije primenjeno'
    ) : (
      'Predlažem ove izmene'
    );
  return (
    <KitCard
      title={title}
      status={status}
      foot={
        desc.frailty && (
          <>
            <AlertTriangle size={12} strokeWidth={2} />
            Nivo krhkosti: {desc.frailty.before} → {desc.frailty.after}
          </>
        )
      }
    >
      <ul className="kc-rows">
        {desc.rows.map((r) => (
          <li key={r.questionId} className="kc-row">
            <span className="kc-row-label">{r.title}</span>
            {r.added || r.removed ? (
              <span className="kc-chips">
                {r.removed.length > 0 && <span className="kc-chip is-removed">Više ne: {r.removed.join(', ')}</span>}
                {r.added.length > 0 && <span className="kc-chip is-added">Sada i: {r.added.join(', ')}</span>}
              </span>
            ) : (
              <span className="kc-change">
                <span className="kc-was">{r.before}</span>
                <ArrowRight size={12} strokeWidth={1.75} />
                <span className="kc-now">{r.after}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </KitCard>
  );
}

function SendRequestCard({ data, onSend }) {
  return (
    <KitCard title="Upit sa planom nege" foot="Upit ništa ne košta i nikoga ne obavezuje.">
      <ul className="kc-rows">
        {data.ids.map((id) => {
          const c = caregivers.find((x) => x.id === id);
          if (!c) return null;
          const sent = data.sent.includes(id);
          return (
            <li key={id} className="kc-row is-person">
              <span className="kc-avatar">{c.initials}</span>
              <span className="kc-person">
                <span className="kc-now">{c.name}</span>
                <span className="kc-row-label">
                  {c.area} · {c.rate}
                </span>
              </span>
              {sent ? (
                <span className="kc-chip is-added">
                  <Check size={12} strokeWidth={2} />
                  Poslato
                </span>
              ) : (
                <KitButton variant="primary" icon={<Send size={14} strokeWidth={1.75} />} onClick={() => onSend(id)}>
                  Pošalji upit
                </KitButton>
              )}
            </li>
          );
        })}
      </ul>
    </KitCard>
  );
}

function OpenPageButtons({ data, onOpen }) {
  return (
    <div className="kc-pages">
      {data.pages.map((pg) => (
        <KitButton key={pg} variant="outline" iconRight={<ArrowRight size={14} strokeWidth={1.75} />} onClick={() => onOpen(pg)}>
          {PAGES[pg]}
        </KitButton>
      ))}
    </div>
  );
}

// ── the chat ─────────────────────────────────────────────────────────────────

export default function KitAssistant({ ctx, title, actions, className }) {
  const chat = useSyncExternalStore(chatStore.subscribe, chatStore.get);
  if (!chat) return null;
  return <KitChat chat={chat} ctx={ctx} title={title} actions={actions} className={className} />;
}

function KitChat({ chat, ctx, title, actions, className }) {
  const { updatePart } = chat;

  const renderPart = useMemo(
    () => (part, { turnId }) => {
      const write = (data) => updatePart(turnId, { kind: 'custom', id: part.id, data });
      switch (part.type) {
        case 'lead':
          return <p className="nana-chat-lead">{part.data.text}</p>;
        case 'plan-diff':
          return <PlanDiffCard data={part.data} />;
        case 'send-request':
          return (
            <SendRequestCard
              data={part.data}
              onSend={(id) => {
                ctx.current.onAskCaregiver(id);
                write({ ...part.data, sent: [...part.data.sent, id] });
              }}
            />
          );
        case 'open-page':
          return <OpenPageButtons data={part.data} onOpen={(pg) => ctx.current.onOpenPage(pg)} />;
        default:
          return null;
      }
    },
    [updatePart, ctx]
  );

  // The plan changes only on "Primeni na plan": the approval's decision is
  // written back, the card above it says what happened, and the model hears it.
  const chatRef = useRef(chat);
  chatRef.current = chat;
  const decide = useCallback(
    (write, turnId, partId, decision) => {
      write(turnId, { kind: 'approval', id: partId, decision });
      const turn = chatRef.current.turns.find((t) => t.id === turnId);
      const diff = turn?.parts.find((p) => p.kind === 'custom' && p.type === 'plan-diff');
      if (!diff) return;
      const applied = decision === 'once';
      if (applied) ctx.current.onApplyChanges(diff.data.changes);
      write(turnId, { kind: 'custom', id: diff.id, data: { ...diff.data, status: applied ? 'applied' : 'dismissed' } });
      const h = chatRef.current.history;
      h.current = decided(h.current, applied);
    },
    [ctx]
  );

  const { plan, care } = ctx.current;
  const empty = useMemo(
    () => ({
      title: 'Kako mogu da pomognem?',
      description: plan
        ? 'Mogu da izmenim plan, predložim negovateljice i pošaljem im upit, ili objasnim kako šta ide.'
        : 'Asistent radi kad plan nege postoji.',
      suggestions: care?.requests.length
        ? ['Šta sada čeka na mene?', 'Sada hoda uz hodalicu', 'Kako se plaća poseta?']
        : ['Koja negovateljica joj najviše odgovara?', 'Sada hoda uz hodalicu', 'Kako ide dogovor sa negovateljicom?'],
    }),
    // the openers only show before the first message
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Boolean(plan), Boolean(care?.requests.length)]
  );

  return (
    <div className={`ick-theme nana-chat${className ? ` ${className}` : ''}`} data-theme="light">
      <ChatExperience
        chat={chat}
        renderPart={renderPart}
        onDecideApproval={decide}
        labels={chatLabelsSr}
        headerActions={false}
        composerMenu={false}
        cursor={false}
        selectionToggle={false}
        theme="light"
        title={title}
        actions={actions}
        placeholder={chatLabelsSr.input.placeholder}
        empty={empty}
      />
    </div>
  );
}
