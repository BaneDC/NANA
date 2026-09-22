import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { ArtifactPane, ChatExperience, useChatTurns } from 'inline-chat-kit';
import 'inline-chat-kit/styles.css';
import { AlertTriangle, ArrowRight, Check, Send } from 'lucide-react';
import { createClient } from '../lib/claudeChat';
import { PAGES, askPlanCopilot, decided } from '../lib/planCopilot';
import { describeChanges } from '../data/planEdits';
import { caregivers } from '../data/carePlan';
import { chatLabelsSr } from '../data/chatLabels.sr';
import Button from './Button';
import { paneFor, previewFor } from './ChatPanes';

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
    }
    if (r.requests.length) {
      yield { kind: 'custom', id: `req-${turnId}`, type: 'send-request', data: { ids: r.requests, sent: [] } };
    }
    // A page the answer points to opens beside the conversation, not instead
    // of it: each is the kit's artifact card, and pressing it opens the pane.
    for (const page of r.pages) {
      const preview = previewFor(page, ctx.current);
      if (preview) yield { kind: 'artifact', id: `page:${page}`, preview: 'text', state: 'done', ...preview };
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
function KitCard({ title, status, children, foot, actions }) {
  return (
    <div className="kc-ground" data-status={status}>
      <div className="kc-card">
        <p className="kc-title">{title}</p>
        {children}
        {foot && <p className="kc-foot">{foot}</p>}
        {actions && <div className="kc-actions">{actions}</div>}
      </div>
    </div>
  );
}

// The proposal and its question are one object, as the kit's own approval is:
// what would change on the card, and the two answers on the same card.
function PlanDiffCard({ data, onDecide }) {
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
      actions={
        status === 'proposed' && (
          <>
            <Button variant="secondary" onClick={() => onDecide(false)}>
              Ne sada
            </Button>
            <Button variant="primary" onClick={() => onDecide(true)}>
              <Check size={14} strokeWidth={2} />
              Primeni na plan
            </Button>
          </>
        )
      }
      foot={
        (desc.frailty || status === 'proposed') && (
          <>
            {desc.frailty && (
              <>
                <AlertTriangle size={12} strokeWidth={2} />
                Nivo krhkosti: {desc.frailty.before} → {desc.frailty.after}.{' '}
              </>
            )}
            {status === 'proposed' && 'Ništa se ne menja dok ne primenite.'}
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

function SendRequestCard({ data, onSend, onOpen }) {
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
                {onOpen ? (
                  <button type="button" className="kc-name-link" onClick={() => onOpen(id)}>
                    {c.name}
                  </button>
                ) : (
                  <span className="kc-now">{c.name}</span>
                )}
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
                <Button variant="primary" onClick={() => onSend(id)}>
                  <Send size={14} strokeWidth={1.75} />
                  Pošalji upit
                </Button>
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
        <Button key={pg} variant="secondary" onClick={() => onOpen(pg)}>
          {PAGES[pg]}
          <ArrowRight size={14} strokeWidth={1.75} />
        </Button>
      ))}
    </div>
  );
}

// The pane the host draws: the kit's own, in the app's right-hand column, so
// what a card opens sits beside the conversation as its own surface.
export function ChatPane({ openId, ctx, onClose }) {
  const pane = paneFor(openId, ctx.current);
  if (!pane) return null;
  return (
    <motion.div
      className="chat-pane-wrap"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 432, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 32 }}
    >
      <ArtifactPane
        className="chat-pane"
        title={pane.title}
        meta={pane.meta}
        onClose={onClose}
        closeLabel={chatLabelsSr.pane.close}
        expandLabel={chatLabelsSr.pane.expand}
        collapseLabel={chatLabelsSr.pane.collapse}
      >
        {pane.children}
      </ArtifactPane>
    </motion.div>
  );
}

// ── the chat ─────────────────────────────────────────────────────────────────

export default function KitAssistant({ ctx, title, actions, className, openPane, onOpenPane }) {
  const chat = useSyncExternalStore(chatStore.subscribe, chatStore.get);
  if (!chat) return null;
  return (
    <KitChat
      chat={chat}
      ctx={ctx}
      title={title}
      actions={actions}
      className={className}
      openPane={openPane}
      onOpenPane={onOpenPane}
    />
  );
}

function KitChat({ chat, ctx, title, actions, className, openPane, onOpenPane }) {
  // With a pane of its own the host draws it beside the chat, in the app's own
  // column; without one the kit draws it inside the conversation, which is
  // what the assistant in the side panel wants.
  const hostPane = Boolean(onOpenPane);
  const { updatePart } = chat;

  const renderPart = useMemo(
    () => (part, { turnId, openArtifact }) => {
      const write = (data) => updatePart(turnId, { kind: 'custom', id: part.id, data });
      switch (part.type) {
        case 'lead':
          return <p className="nana-chat-lead">{part.data.text}</p>;
        case 'plan-diff':
          return (
            <PlanDiffCard
              data={part.data}
              onDecide={(applied) => {
                if (applied) ctx.current.onApplyChanges(part.data.changes);
                write({ ...part.data, status: applied ? 'applied' : 'dismissed' });
                const h = chatStore.get().history;
                h.current = decided(h.current, applied);
              }}
            />
          );
        case 'send-request':
          return (
            <SendRequestCard
              data={part.data}
              onOpen={(id) => openArtifact(`page:caregiver:${id}`)}
              onSend={(id) => {
                if (ctx.current.onAskCaregiver(id)) write({ ...part.data, sent: [...part.data.sent, id] });
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

  // The pane's contents, read from the family's state as it is now, so what
  // opens is never a copy of when the answer was written.
  const artifact = useCallback((openId) => paneFor(openId, ctx.current), [ctx]);

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
        labels={chatLabelsSr}
        headerActions={false}
        composerMenu={false}
        cursor={false}
        selectionToggle={false}
        theme="light"
        title={title}
        actions={actions}
        placeholder={chatLabelsSr.input.placeholder}
        artifact={hostPane ? undefined : artifact}
        pane={hostPane ? 'none' : 'inline'}
        openArtifactId={hostPane ? openPane : undefined}
        onOpenArtifactChange={onOpenPane}
        empty={empty}
      />
    </div>
  );
}
