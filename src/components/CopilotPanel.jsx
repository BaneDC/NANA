import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Check, Send } from 'lucide-react';
import { copilotContext } from '../data/copilot';
import { createClient } from '../lib/claudeChat';
import { PAGES, askPlanCopilot, decided } from '../lib/planCopilot';
import { caregivers } from '../data/carePlan';
import { describeChanges } from '../data/planEdits';
import SidePanel from './SidePanel';
import ChatInput from './ChatInput';
import Button from './Button';
import ChangeRows from './ChangeRows';

const messageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// What the assistant proposes to change, laid out before anything is saved —
// in the same rows the plan uses to say what changed, so the proposal and the
// result read alike.
function Proposal({ proposal, onApply, onDismiss }) {
  const { desc, status } = proposal;
  return (
    <div className={`cp-proposal is-${status}`}>
      <p className="cp-proposal-title">
        {status === 'applied' ? (
          <>
            <Check size={14} strokeWidth={2} /> Primenjeno na plan
          </>
        ) : status === 'dismissed' ? (
          'Nije primenjeno'
        ) : (
          'Predlažem ove izmene'
        )}
      </p>
      <ChangeRows rows={desc.rows} stacked />
      {desc.frailty && (
        <p className="pc-frailty">
          <AlertTriangle size={12} strokeWidth={2} />
          Nivo krhkosti: {desc.frailty.before} → {desc.frailty.after}
        </p>
      )}
      {status === 'open' && (
        <>
          <p className="cp-proposal-hint">Ništa se ne menja dok ne primenite.</p>
          <div className="cp-proposal-actions">
            <Button variant="secondary" onClick={onDismiss}>
              Ne sada
            </Button>
            <Button variant="primary" onClick={onApply}>
              <Check size={14} strokeWidth={2} />
              Primeni na plan
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// A request the assistant offered to send; the family sends it.
function RequestOffer({ ids, care, onAsk }) {
  return (
    <div className="cp-proposal">
      <p className="cp-proposal-title">Upit sa planom nege</p>
      <div className="cp-offers">
        {ids.map((id) => {
          const c = caregivers.find((x) => x.id === id);
          const sent = care?.requests.some((r) => r.caregiverId === id);
          return (
            <div key={id} className="cp-offer">
              <span className="cg-avatar">{c.initials}</span>
              <span className="cp-offer-text">
                <span className="cp-offer-name">{c.name}</span>
                <span className="cp-offer-meta">
                  {c.area} · {c.rate}
                </span>
              </span>
              {sent ? (
                <span className="status-pill is-accepted">
                  <Check size={12} strokeWidth={2} />
                  Poslato
                </span>
              ) : (
                <Button variant="primary" onClick={() => onAsk(id)}>
                  <Send size={14} strokeWidth={1.75} />
                  Pošalji upit
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <p className="cp-proposal-hint">Upit ništa ne košta i nikoga ne obavezuje.</p>
    </div>
  );
}

// With a care plan and a key to talk to Claude with, the assistant is real:
// it can change the plan, send requests and open pages — see lib/planCopilot.
// Without them it is the scripted guide it was, one thread per page.
//
// The real one is one conversation, kept in App, so the same thread is there
// whether it is open in Razgovor or beside a page.
export function useAssistantStore() {
  const [log, setLog] = useState([]);
  const history = useRef([]);
  const reset = () => {
    setLog([]);
    history.current = [];
  };
  return { log, setLog, history, reset };
}

export function Assistant({
  inline = false,
  view,
  plan,
  unlocked,
  care,
  apiKey,
  answers,
  store,
  onApplyChanges,
  onAddNotes,
  onAskCaregiver,
  onOpenPage,
  onClose,
}) {
  const live = Boolean(plan && apiKey);
  const client = useMemo(() => (apiKey ? createClient(apiKey) : null), [apiKey]);
  const ctx = live
    ? {
        label: inline ? 'Razgovor' : 'Plan nege',
        opening: 'Tu sam za sve oko nege: mogu da izmenim plan, predložim negovateljice i pošaljem im upit, ili objasnim kako šta ide. Recite mi šta vam treba.',
        suggestions: care?.requests.length
          ? ['Šta sada čeka na mene?', 'Sada hoda uz hodalicu', 'Kako se plaća poseta?']
          : ['Koja negovateljica joj najviše odgovara?', 'Sada hoda uz hodalicu', 'Kako ide dogovor sa negovateljicom?'],
      }
    : copilotContext(view, { plan, unlocked, care });
  const [scripted, setScripted] = useState({});
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef(null);
  const replyIndex = useRef(0);

  const log = live ? store.log : scripted[view] || [];
  const push = (entry) =>
    live ? store.setLog((l) => [...l, entry]) : setScripted((l) => ({ ...l, [view]: [...(l[view] || []), entry] }));
  const patch = (id, fn) => store.setLog((l) => l.map((m) => (m.id === id ? fn(m) : m)));

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [log.length, thinking, view]);

  const send = async (text) => {
    const id = Date.now();
    push({ id, role: 'user', text });
    setThinking(true);
    if (live) {
      try {
        const r = await askPlanCopilot({ client, name: plan.firstName, answers, care, history: store.history.current, text });
        store.history.current = r.history;
        if (r.notes.length) onAddNotes?.(r.notes);
        push({
          id: id + 1,
          role: 'assistant',
          text: r.said,
          saved: r.notes,
          requests: r.requests,
          pages: r.pages,
          proposal: r.changes.length
            ? { changes: r.changes, desc: describeChanges(answers, r.changes), status: 'open' }
            : null,
        });
      } catch (e) {
        console.error(e);
        push({ id: id + 1, role: 'assistant', error: true, text: e?.message || String(e) });
      } finally {
        setThinking(false);
      }
      return;
    }
    setTimeout(() => {
      setThinking(false);
      const reply = ctx.replies[replyIndex.current++ % ctx.replies.length];
      push({ id: id + 1, role: 'assistant', text: reply });
    }, 1000);
  };

  const apply = (m) => {
    onApplyChanges(m.proposal.changes);
    patch(m.id, (x) => ({ ...x, proposal: { ...x.proposal, status: 'applied' } }));
    store.history.current = decided(store.history.current, true);
  };
  const dismiss = (m) => {
    patch(m.id, (x) => ({ ...x, proposal: { ...x.proposal, status: 'dismissed' } }));
    store.history.current = decided(store.history.current, false);
  };

  const thread = (
    <>
      <p className="assistant-text">{ctx.opening}</p>

      {log.length === 0 && (
        <div className="copilot-suggestions">
          {ctx.suggestions.map((s) => (
            <button key={s} type="button" className="suggestion" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {log.map((m) =>
        m.role === 'user' ? (
          <motion.div className="bubble-row" key={m.id} {...messageMotion}>
            <div className="bubble">{m.text}</div>
          </motion.div>
        ) : (
          <motion.div className="cp-reply" key={m.id} {...messageMotion}>
            {m.text && <p className={`assistant-text${m.error ? ' is-error' : ''}`}>{m.text}</p>}
            {m.saved?.length > 0 && (
              <p className="cp-saved">
                <Check size={12} strokeWidth={2} />
                Sačuvano u planu: {m.saved.join(' · ')}
              </p>
            )}
            {m.proposal && <Proposal proposal={m.proposal} onApply={() => apply(m)} onDismiss={() => dismiss(m)} />}
            {m.requests?.length > 0 && <RequestOffer ids={m.requests} care={care} onAsk={onAskCaregiver} />}
            {m.pages?.length > 0 && (
              <div className="cp-pages">
                {m.pages.map((pg) => (
                  <Button key={pg} variant="secondary" onClick={() => onOpenPage(pg)}>
                    {PAGES[pg]}
                    <ArrowRight size={14} strokeWidth={1.75} />
                  </Button>
                ))}
              </div>
            )}
          </motion.div>
        )
      )}

      <AnimatePresence>
        {thinking && (
          <motion.div
            key="typing"
            className="typing"
            {...messageMotion}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <span />
            <span />
            <span />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  const placeholder = live ? 'Pitajte ili recite šta se promenilo…' : 'Pitajte o ovoj stranici…';

  if (inline) {
    return (
      <div className="chat">
        <div className="chat-scroll" ref={bodyRef}>
          <div className="chat-column copilot-body is-inline">{thread}</div>
        </div>
        <div className="chat-footer">
          <div className="chat-column">
            <ChatInput placeholder={placeholder} onSend={send} />
            <p className="footer-note">NANA Prime može da pogreši. Proverite odgovore.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidePanel
      eyebrow={`Asistent · ${ctx.label}`}
      title="Kako mogu da pomognem?"
      onClose={onClose}
      footer={
        <div className="copilot-footer">
          <ChatInput placeholder={placeholder} onSend={send} />
        </div>
      }
    >
      <div className="copilot-body" ref={bodyRef}>
        {thread}
      </div>
    </SidePanel>
  );
}

export default Assistant;
