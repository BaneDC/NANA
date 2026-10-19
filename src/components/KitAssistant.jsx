import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { ArtifactPane, ChatExperience, ComponentsProvider, useChatTurns } from 'inline-chat-kit';
import 'inline-chat-kit/styles.css';
import { AlertTriangle, ArrowRight, Check, Send } from 'lucide-react';
import { createClient } from '../lib/claudeChat';
import { PAGES, askPlanCopilot, decided } from '../lib/planCopilot';
import { SideFrame } from './SidePanel';
import { describeChanges } from '../data/planEdits';
import { healthRows } from '../data/record';
import { caregiverById } from '../data/carePlan';
import { chatLabels } from '../data/chatLabels.sr';
import { getLang, msg, t } from '../i18n';
import { Button } from '@/components/ui/button';
import { paneFor, previewFor } from './ChatPanes';
import { dropKeyboardAfterSend } from '../lib/keyboardViewport';
import KitButton from './KitButton';

// declared once, outside any render: a new object each render would be a new
// component to the kit, and every button in the chat would remount
const KIT_COMPONENTS = { Button: KitButton };

// The assistant, drawn by inline-chat-kit. The kit owns the conversation's
// look and motion; what is NANA's rides in the answer as custom parts — the
// proposed plan change, the request to a caregiver, the way to a page — and
// the plan change is confirmed with the kit's own approval, with no "always".
//
// One conversation, wherever it is open: the hook lives in <ChatSource>, which
// App keeps mounted and remounts only for a new conversation. It reads the
// family's state through `ctx`, a ref App refreshes every render, so the send
// handler never goes stale and never has to change identity.

// Every conversation the family has open is published here rather than lifted
// into App state: the kit rewrites its turns on every keystroke and every
// streamed frame, and only the chat itself should redraw for that, not the
// whole app around it. One entry per conversation, so switching back to an
// earlier one finds it as it was left.
function createChatStore() {
  const chats = new Map();
  const listeners = new Set();
  return {
    get: (id) => chats.get(id) || null,
    set: (id, next) => {
      chats.set(id, next);
      listeners.forEach((l) => l());
    },
    drop: (id) => {
      chats.delete(id);
      listeners.forEach((l) => l());
    },
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}
export const chatStore = createChatStore();

// What "Prijavi promenu" on the medical record says for the family, and
// what the assistant asks back. Both are fixed, so the way in is instant and
// costs no request; the model takes over from the family's answer.
// The opener is sent as the family's own message, so it is sent in the app's
// language: t(CHANGE_OPENER). Either spelling is recognised here.
export const CHANGE_OPENER = msg('Nešto se promenilo.');
const CHANGE_REPLY = msg(
  'Šta se promenilo, ili šta treba ispraviti? Recite svojim rečima, na primer „pala je i slomila nogu“, „dobila je novi lek“ ili „pogrešno je upisan broj telefona“. Pitaću šta mi treba, pa predložiti šta se menja u kartonu i u planu nege. Medicinske savete ne dajem: lekove i dijagnoze samo beležim.'
);

export const isOpener = (text) => text === CHANGE_OPENER || text === t(CHANGE_OPENER);

// How far a conversation has got, for "Prijavi promenu" (docs/patterns.md §10a):
// 'empty' nothing said yet, 'opener' only the fixed opener (however many times),
// 'talk' the family has said something of their own.
export function chatStage(chat) {
  const said = (chat?.turns || []).map((x) => x.user.trim()).filter(Boolean);
  if (!said.length) return 'empty';
  return said.every(isOpener) ? 'opener' : 'talk';
}

// `opener`: the conversation starts with the fixed opener, sent once the chat exists.
export function ChatSource({ id, ctx, onTitle, opener }) {
  const history = useRef([]);

  const send = useCallback(async function* (message, { turnId }) {
    dropKeyboardAfterSend();
    const { plan, answers, care, record, today, apiKey, onAddNotes } = ctx.current;
    if (!plan) {
      yield t('Asistent radi kad plan nege postoji. Završite razgovor sa Minnom, pa se vratite ovde.');
      return;
    }
    // fixed, so it needs no key
    if (isOpener(message)) {
      const reply = t(CHANGE_REPLY);
      history.current = [...history.current, { role: 'user', content: message }, { role: 'assistant', content: reply }];
      yield reply;
      return;
    }
    if (!apiKey) {
      yield t('Asistent odgovara preko Claude-a, a ključ za Claude još nije unet. Unesite ga kad pokrenete razgovor sa Minnom (AI), pa se vratite ovde.');
      return;
    }
    // Her words are handed to the kit as they are written, not once the whole
    // answer is in: the call puts each piece in a queue and this generator
    // gives the queue out, waiting when it is empty.
    const pieces = [];
    let wake = null;
    let r = null;
    let failed = null;
    let over = false;
    const nudge = () => {
      wake?.();
      wake = null;
    };
    askPlanCopilot({
      client: createClient(apiKey),
      name: plan.firstName,
      answers,
      care,
      record,
      today,
      history: history.current,
      text: message,
      onText: (piece) => {
        pieces.push(piece);
        nudge();
      },
    })
      .then(
        (result) => {
          r = result;
        },
        (e) => {
          failed = e;
        }
      )
      .finally(() => {
        over = true;
        nudge();
      });
    let shown = '';
    while (!over || pieces.length) {
      if (pieces.length) {
        const piece = pieces.shift();
        shown += piece;
        yield piece;
      } else {
        await new Promise((resolve) => {
          wake = resolve;
        });
      }
    }
    if (failed) {
      console.error(failed);
      yield { kind: 'custom', id: `err-${turnId}`, type: 'note', data: { tone: 'danger', items: [failed?.message || String(failed)] } };
      return;
    }
    history.current = r.history;
    // The sentence goes as the answer's own prose, and the cards after it. The
    // kit stamps each part with how much prose had arrived when it did, so the
    // order it is sent in is the order on screen — which also means the answer
    // keeps its markdown and its copy/regenerate row. Most of it is on screen
    // by now; what is left is the end that was held back, or the proposal's own
    // sentence when she wrote none.
    if (r.said.startsWith(shown)) {
      if (r.said.length > shown.length) yield r.said.slice(shown.length);
    } else if (!shown) {
      yield r.said;
    }
    if (r.notes.length) {
      onAddNotes(r.notes);
      yield { kind: 'custom', id: `notes-${turnId}`, type: 'note', data: { items: r.notes } };
    }
    if (r.changes.length || r.health.length) {
      // the record's lists read as rows beside the answers
      const desc = describeChanges(answers, r.changes);
      yield {
        kind: 'custom',
        id: `plan-${turnId}`,
        type: 'plan-diff',
        data: {
          changes: r.changes,
          event: r.event,
          correction: r.correction,
          health: r.health,
          desc: { ...desc, rows: [...desc.rows, ...healthRows(r.health)] },
          status: 'proposed',
        },
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

  // `at-send` is what a docked composer needs: the box at the bottom is always
  // there, so the next thing can be typed while this answer is still arriving.
  const chat = useChatTurns({
    onSend: send,
    nextTurn: 'at-send',
    announcements: { responding: t('Stiže odgovor') },
  });
  const { turns, isStreaming } = chat;
  // What the conversation is called in the nav: the first thing asked in it.
  // The fixed opener is not something the family typed, so a conversation with
  // only that in it has no name and is not listed.
  const first = turns.map((x) => x.user.trim()).find((u) => u && !isOpener(u)) || '';
  const opened = useRef(false);
  useEffect(() => {
    const draft = turns[turns.length - 1];
    if (!opener || opened.current || !draft || isStreaming) return;
    opened.current = true;
    // after the kit has finished setting itself up
    setTimeout(() => chat.submit(draft.id, t(CHANGE_OPENER)), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opener, turns, isStreaming]);
  useEffect(() => {
    onTitle?.(id, first);
  }, [id, first, onTitle]);
  useEffect(() => {
    chatStore.set(id, { ...chat, history });
    // the hook's functions are stable; what changes is the turns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, turns, isStreaming]);
  useEffect(() => () => chatStore.drop(id), [id]);
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
  // something that happened, an entry in her record's lists, or a correction
  // of what the record says: it is written into the medical record, and the
  // plan follows from it
  const toRecord = Boolean(data.event || data.health?.length || data.correction);
  const title =
    status === 'applied' ? (
      <>
        <Check size={14} strokeWidth={2} /> {toRecord ? t('Upisano u karton') : t('Primenjeno na plan')}
      </>
    ) : status === 'dismissed' ? (
      toRecord ? t('Nije upisano') : t('Nije primenjeno')
    ) : data.event?.what ? (
      t('Predlažem da upišemo: {what}', { what: data.event.what })
    ) : data.correction ? (
      t('Predlažem ovu ispravku')
    ) : (
      t('Predlažem ove izmene')
    );
  return (
    <KitCard
      title={title}
      status={status}
      actions={
        status === 'proposed' && (
          <>
            <Button variant="secondary" onClick={() => onDecide(false)}>
              {t('Ne sada')}
            </Button>
            <Button onClick={() => onDecide(true)}>
              <Check size={14} strokeWidth={2} />
              {toRecord ? t('Upiši u karton') : t('Primeni na plan')}
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
                {t('Nivo krhkosti: {before} → {after}.', { before: desc.frailty.before, after: desc.frailty.after })}{' '}
              </>
            )}
            {status === 'proposed' && (toRecord ? t('Ništa se ne upisuje dok ne potvrdite.') : t('Ništa se ne menja dok ne primenite.'))}
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
                {r.removed.length > 0 && <span className="kc-chip is-removed">{t('Više ne: {list}', { list: r.removed.join(', ') })}</span>}
                {r.added.length > 0 && <span className="kc-chip is-added">{t('Sada i: {list}', { list: r.added.join(', ') })}</span>}
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

// What the conversation itself has to say — what was written down, what failed.
// The kit's own system line puts the sentence straight onto a sunken slab; in
// NANA a grey ground never stands empty, it holds a white card, the same one
// every other card in the answer is built on.
function NoteCard({ data }) {
  const danger = data.tone === 'danger';
  return (
    <KitCard title={danger ? t('Nešto nije uspelo') : t('Sačuvano u planu')} status={danger ? 'danger' : 'note'}>
      <ul className="kc-rows">
        {data.items.map((item) => (
          <li key={item} className="kc-row">
            <span className="kc-now">{item}</span>
          </li>
        ))}
      </ul>
    </KitCard>
  );
}

function SendRequestCard({ data, foot, onSend, onOpen }) {
  return (
    <KitCard title={t('Upit sa planom nege')} foot={foot}>
      <ul className="kc-rows">
        {data.ids.map((id) => {
          const c = caregiverById(id);
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
                  {t('Poslato')}
                </span>
              ) : (
                <Button onClick={() => onSend(id)}>
                  <Send size={14} strokeWidth={1.75} />
                  {t('Pošalji upit')}
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
      {/* a page that is gone (the care plan's, in an older conversation) has
          no button */}
      {data.pages.filter((pg) => PAGES[pg]).map((pg) => (
        <Button key={pg} variant="secondary" onClick={() => onOpen(pg)}>
          {t(PAGES[pg])}
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
    <SideFrame className="chat-pane-wrap" onClose={onClose}>
      {/* the pane is put together by hand, so it takes our button this way */}
      <ComponentsProvider components={KIT_COMPONENTS}>
      <ArtifactPane
        className="chat-pane"
        title={pane.title}
        meta={pane.meta}
        onClose={onClose}
        closeLabel={chatLabels().pane.close}
        expandLabel={chatLabels().pane.expand}
        collapseLabel={chatLabels().pane.collapse}
      >
        {pane.children}
      </ArtifactPane>
      </ComponentsProvider>
    </SideFrame>
  );
}

// ── the chat ─────────────────────────────────────────────────────────────────

export default function KitAssistant({ id, ctx, title, actions, className, openPane, onOpenPane }) {
  const get = useCallback(() => chatStore.get(id), [id]);
  const chat = useSyncExternalStore(chatStore.subscribe, get);
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
        case 'note':
          return <NoteCard data={part.data} />;
        case 'plan-diff':
          return (
            <PlanDiffCard
              data={part.data}
              onDecide={(applied) => {
                if (applied) ctx.current.onApplyChanges(part.data.changes, part.data);
                write({ ...part.data, status: applied ? 'applied' : 'dismissed' });
                const h = chat.history;
                h.current = decided(h.current, applied);
              }}
            />
          );
        case 'send-request':
          return (
            <SendRequestCard
              foot={ctx.current.askFoot}
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

  const { plan, care, firstChat } = ctx.current;
  // Before anything has ever been asked, the empty conversation says what the
  // assistant is for and how it is used; after the first question it is the
  // short greeting again (docs/patterns.md §4b). No tour: this is where a
  // first question is typed, so this is where it is said.
  const first = Boolean(plan && firstChat);
  const empty = useMemo(
    () => ({
      title: first ? t('Vaš asistent za negu') : t('Kako mogu da pomognem?'),
      description: !plan
        ? t('Asistent radi kad plan nege postoji.')
        : first
          ? t('Pitajte svojim rečima ili recite šta se promenilo. Asistent zna vaš plan nege, negovateljice i posete, pa može da objasni kako šta ide i da predloži izmenu plana ili upit negovateljici. Ništa se ne menja dok vi ne potvrdite. Medicinske savete ne daje.')
          : t('Mogu da izmenim plan, predložim negovateljice i pošaljem im upit, ili objasnim kako šta ide.'),
      suggestions: care?.requests.length
        ? [t('Šta sada čeka na mene?'), t('Sada hoda uz hodalicu'), t('Kako se plaća poseta?')]
        : [t('Koja negovateljica joj najviše odgovara?'), t('Sada hoda uz hodalicu'), t('Kako ide dogovor sa negovateljicom?')],
    }),
    // the openers only show before the first message
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Boolean(plan), first, Boolean(care?.requests.length), getLang()]
  );

  return (
    <div className={`ick-theme nana-chat${className ? ` ${className}` : ''}`} data-theme="light">
      <ChatExperience
        chat={chat}
        // every button in the chat is ours, but the composer's send (KitButton)
        components={KIT_COMPONENTS}
        renderPart={renderPart}
        labels={chatLabels()}
        headerActions={false}
        composerMenu={false}
        cursor={false}
        // the composer stays at the bottom of the view, the way a chat is read
        composer="docked"
        // as tall as the card it sits in, not as tall as the window
        fill="container"
        // no marking an answer: no marker layer, no saved highlights, nothing
        // over the text in the tab order
        highlights={false}
        theme="light"
        title={title}
        actions={actions}
        placeholder={chatLabels().input.placeholder}
        artifact={hostPane ? undefined : artifact}
        pane={hostPane ? 'none' : 'inline'}
        openArtifactId={hostPane ? openPane : undefined}
        onOpenArtifactChange={onOpenPane}
        empty={empty}
      />
    </div>
  );
}
