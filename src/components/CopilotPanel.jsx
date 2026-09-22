import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check } from 'lucide-react';
import { copilotContext } from '../data/copilot';
import { createClient } from '../lib/claudeChat';
import { askPlanCopilot, decided } from '../lib/planCopilot';
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

// Beside a finished care plan, with a key to talk to Claude with, the assistant
// is real and can change the plan — see lib/planCopilot. Everywhere else it is
// still the scripted guide it was.
const PLAN_VIEWS = ['plans', 'plan-detail', 'chat'];

// The assistant as a co-pilot: it opens against whatever page you were on and
// keeps a separate thread per page, so switching views does not mix conversations.
export default function CopilotPanel({ view, plan, unlocked, care, apiKey, answers, onApplyChanges, onAddNotes, onClose }) {
  const live = Boolean(plan && apiKey && PLAN_VIEWS.includes(view));
  const thread = live ? 'plan' : view;
  const client = useMemo(() => (apiKey ? createClient(apiKey) : null), [apiKey]);
  const history = useRef([]);
  const ctx = live
    ? {
        label: 'Plan nege',
        opening: 'Mogu da izmenim plan umesto vas. Recite mi šta je sada drugačije, i pokazaću vam tačno šta se menja pre nego što išta sačuvam.',
        suggestions: ['Sada hoda uz hodalicu', 'Prošle nedelje je ponovo pala', 'Sada joj treba pomoć oko kupanja'],
      }
    : copilotContext(view, { plan, unlocked, care });
  const [logByView, setLogByView] = useState({});
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef(null);
  const replyIndex = useRef(0);

  const log = logByView[thread] || [];
  const push = (entry) => setLogByView((l) => ({ ...l, [thread]: [...(l[thread] || []), entry] }));
  const patch = (id, fn) =>
    setLogByView((l) => ({ ...l, [thread]: (l[thread] || []).map((m) => (m.id === id ? fn(m) : m)) }));

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
        const r = await askPlanCopilot({ client, name: plan.firstName, answers, history: history.current, text });
        history.current = r.history;
        if (r.notes.length) onAddNotes?.(r.notes);
        push({
          id: id + 1,
          role: 'assistant',
          text: r.said,
          saved: r.notes,
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
    history.current = decided(history.current, true);
  };
  const dismiss = (m) => {
    patch(m.id, (x) => ({ ...x, proposal: { ...x.proposal, status: 'dismissed' } }));
    history.current = decided(history.current, false);
  };

  return (
    <SidePanel
      eyebrow={`Asistent · ${ctx.label}`}
      title="Kako mogu da pomognem?"
      onClose={onClose}
      footer={
        <div className="copilot-footer">
          <ChatInput placeholder={live ? 'Recite mi šta se promenilo…' : 'Pitajte o ovoj stranici…'} onSend={send} />
        </div>
      }
    >
      <div className="copilot-body" ref={bodyRef}>
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
              {m.proposal && (
                <Proposal proposal={m.proposal} onApply={() => apply(m)} onDismiss={() => dismiss(m)} />
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
      </div>
    </SidePanel>
  );
}
