import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  CalendarPlus,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  FileCheck2,
  FilePen,
  FileText,
  Inbox,
  Meh,
  MessageSquare,
  Phone,
  Send,
  Smile,
  StickyNote,
  Frown,
} from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import AgreementForm from '../../components/caregiver/AgreementForm';
import VisitPlanForm from '../../components/caregiver/VisitPlanForm';
import WorkOrderForm from '../../components/caregiver/WorkOrderForm';
import {
  agreementState,
  awaitingFor,
  dueVisit,
  heldFor,
  frailtyLabel,
  money,
  serviceShort,
  serviceTitle,
  totalsFor,
} from '../../data/caregiverBoard';

// Everything the caregiver knows about one family, on one page: the terms she
// works under, the visits those terms have produced, and the story of the
// relationship around both. The three answer different questions — what is
// agreed, what was done and what was paid, and what has passed between us —
// which is why they are three sections and not one feed.
//
// The page reads; it does not ask. Setting the agreement and filling in a work
// order are forms, and forms live in a dialog — left open on the page they made
// it look like something was unfinished every time it was opened, and buried
// the overview under an empty form.

const MOOD = {
  low: { icon: Frown, label: 'Low' },
  usual: { icon: Meh, label: 'As usual' },
  good: { icon: Smile, label: 'Good' },
};

const ACTIVITY_ICON = {
  request: Inbox,
  accepted: Check,
  'agreement-sent': FileText,
  'agreement-signed': FileCheck2,
  'agreement-changed': FilePen,
  'visit-planned': CalendarPlus,
  visit: CalendarCheck,
  'work-order': Send,
  note: StickyNote,
  message: MessageSquare,
};

function Section({ title, badge, children }) {
  return (
    <section className="panel-card">
      <div className="panel-card-head">
        <p className="doc-section-title">{title}</p>
        {badge}
      </div>
      {children}
    </section>
  );
}

function AgreedTerms({ client }) {
  return (
    <>
      <p className="ag-label">Services this agreement covers</p>
      <div className="ag-services">
        {client.services.map((id) => (
          <span key={id} className="svc is-set">
            <Check size={13} strokeWidth={2.5} />
            {serviceTitle(id)}
          </span>
        ))}
      </div>
      <div className="bc-lines ag-terms">
        <p className="bc-line">
          <span className="bc-line-label">Hourly rate</span>
          <span className="bc-line-value">{money(client.rate)} / h</span>
        </p>
        <p className="bc-line">
          <span className="bc-line-label">Agreed hours</span>
          <span className="bc-line-value">{client.hours} h/week</span>
        </p>
        <p className="bc-line">
          <span className="bc-line-label">Pattern</span>
          <span className="bc-line-value">{client.schedule}</span>
        </p>
      </div>
    </>
  );
}

const AMOUNT_WORD = { less: 'less than usual', usual: 'as usual', more: 'more than usual' };

function Visits({ client }) {
  // The visit still waiting on its work order is not in here — it is the form
  // above, and listing it twice would say a visit is both done and outstanding.
  const visits = (client.visits || []).filter((v) => v.status !== 'due');
  const settled = visits.filter((v) => v.status === 'paid');
  if (!visits.length) {
    return (
      <p className="board-empty">
        No visits settled yet. They start once {client.family} signs the agreement.
      </p>
    );
  }

  const hours = settled.reduce((n, v) => n + v.hours, 0);
  const earned = settled.reduce((n, v) => n + totalsFor(v.hours, client.rate).net, 0);
  const pending = awaitingFor(client);

  return (
    <>
      <p className="ag-hint">
        {settled.length} paid · {hours} h · {money(earned)} to you
        {pending > 0 && ` · ${money(pending)} clearing`}
      </p>
      <ul className="visit-list">
        {visits.map((v, i) => {
          const Mood = MOOD[v.mood]?.icon;
          const totals = totalsFor(v.hours, client.rate);
          return (
            <li key={`${v.date}-${i}`} className="visit">
              <div className="visit-head">
                <p className="visit-when">
                  {v.date} · {v.time}
                </p>
                {v.status === 'awaiting' ? (
                  <span className="status-pill is-pending">
                    <Clock size={12} strokeWidth={2} />
                    Charges in {v.confirmsInHours} h
                  </span>
                ) : (
                  <span className="status-pill is-accepted">Paid</span>
                )}
              </div>
              <p className="visit-note">{v.note}</p>
              {v.services?.length > 0 && (
                <p className="visit-services">{v.services.map(serviceShort).join(' · ')}</p>
              )}
              {v.concern && (
                <p className="visit-concern">
                  <AlertTriangle size={12} strokeWidth={2} />
                  {v.concern}
                </p>
              )}
              <div className="visit-foot">
                {Mood && (
                  <span className="visit-mood">
                    <Mood size={13} strokeWidth={1.75} />
                    {MOOD[v.mood].label}
                  </span>
                )}
                {v.eating && <span className="visit-mood">ate {AMOUNT_WORD[v.eating]}</span>}
                {v.moving && <span className="visit-mood">moved {AMOUNT_WORD[v.moving]}</span>}
                <span className="visit-money">
                  {v.hours} h · {money(totals.net)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Activity({ client }) {
  // Newest first: the last thing that happened is the thing she is trying to
  // remember when she opens this.
  const entries = [...(client.activity || [])].reverse();
  return (
    <ol className="timeline">
      {entries.map((e, i) => {
        const Icon = ACTIVITY_ICON[e.kind] || StickyNote;
        return (
          <li key={i} className="tl-item">
            <span className="tl-dot">
              <Icon size={13} strokeWidth={1.75} />
            </span>
            <div className="tl-body">
              <p className="tl-text">{e.text}</p>
              <p className="tl-when">{e.when}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function ClientPage({
  client,
  onBack,
  onSendAgreement,
  onRemind,
  onPlanVisit,
  onVisitDone,
  onSendWorkOrder,
}) {
  const state = agreementState(client);
  const due = dueVisit(client);
  const [modal, setModal] = useState(null); // null | 'agreement' | 'plan' | 'work-order'
  const [termsOpen, setTermsOpen] = useState(false);

  // What the row says without being opened. Enough to know the terms are the
  // ones you remember; the pills and the pattern are behind the chevron.
  //
  // A switch, not a lookup object: every branch of an object literal is built
  // before one is picked, so the two that read `client.services` ran for a
  // family that has no agreement yet and took the page down with them.
  const summary = (() => {
    switch (state) {
      case 'none':
        return `${client.family} asked for ${client.hours} h/week · ${client.schedule}`;
      case 'draft':
        return `Not set yet — ${client.family} asked for ${client.hours} h/week`;
      case 'sent':
        return `${client.services.length} services · ${money(client.rate)}/h · sent ${client.sentOn}`;
      default:
        return `${client.services.length} services · ${money(client.rate)}/h · ${client.hours} h/week`;
    }
  })();

  const badge = {
    none: <span className="status-pill is-muted">Not accepted</span>,
    draft: <span className="status-pill is-pending">Draft</span>,
    sent: (
      <span className="status-pill is-pending">
        <Clock size={12} strokeWidth={2} />
        Waiting for signature
      </span>
    ),
    active: (
      <span className="status-pill is-accepted">
        <Check size={12} strokeWidth={2} />
        Active since {client.since}
      </span>
    ),
  }[state];

  return (
    <motion.div
      className="view"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
    >
      <div className="view-head">
        <div className="view-head-text">
          <button type="button" className="back-link" onClick={onBack}>
            <ArrowLeft size={14} strokeWidth={1.75} />
            Board
          </button>
        </div>
      </div>

      <header className="client-head">
        <span className="cg-avatar">{client.initials}</span>
        <div className="client-head-text">
          <h1 className="view-title">{client.elder}</h1>
          <p className="view-sub">
            {client.age} · {client.area} · {client.distance} · CFS {client.frailty},{' '}
            {frailtyLabel(client.frailty)}
          </p>
        </div>
      </header>

      <div className="client-contact">
        <p className="bc-line">
          <span className="bc-line-label">Family contact</span>
          <span className="bc-line-value">
            {client.family} · {client.relation}
          </span>
        </p>
        <p className="bc-line">
          <span className="bc-line-label">
            <Phone size={12} strokeWidth={1.75} /> Phone
          </span>
          <span className="bc-line-value">{client.phone}</span>
        </p>
      </div>

      {/* An outstanding work order goes first: it is the only thing on this
          page with a deadline. The agreement below it changes once. */}
      {due && (
        <Section
          title="Work order outstanding"
          badge={
            <span className="status-pill is-pending">
              <AlertTriangle size={12} strokeWidth={2} />
              Not sent
            </span>
          }
        >
          <p className="ag-lead">
            {due.date} · {due.time} — {due.hours} h at the agreed {money(client.rate)}/h, finished{' '}
            {client.sinceVisit}. Sending it starts {client.family}'s 24 hours: they confirm, or it
            charges itself when the time is up.
          </p>
          <div className="bc-lines ag-terms">
            <p className="bc-line">
              <span className="bc-line-label">If sent as worked</span>
              <span className="bc-line-value">
                {money(totalsFor(due.hours, client.rate).net)} to you
              </span>
            </p>
          </div>
          <div className="panel-card-actions is-end">
            <Button variant="primary" onClick={() => setModal('work-order')}>
              <FileText size={14} strokeWidth={1.75} />
              Fill in work order
            </Button>
          </div>
        </Section>
      )}

      {/* The visit order: written before going, and the thing the work order is
          later filled in against. Only an active arrangement can have one. */}
      {state === 'active' && !due && (
        <Section
          title="Next visit"
          badge={
            client.plan ? (
              <span className="status-pill is-accepted">
                <Check size={12} strokeWidth={2} />
                {money(heldFor(client))} held
              </span>
            ) : null
          }
        >
          {client.plan ? (
            <>
              <p className="ag-lead">
                {client.plan.date} · {client.plan.time} — {client.plan.hours} h at{' '}
                {money(client.rate)}/h. Sent to {client.family} {client.plan.sentOn};{' '}
                {money(heldFor(client))} is held against their card, and{' '}
                {money(totalsFor(client.plan.hours, client.rate).net)} of it reaches you if the
                visit runs to plan.
              </p>
              <p className="ag-label">Planned</p>
              <div className="ag-services">
                {client.plan.services.map((id) => (
                  <span key={id} className="svc is-set">
                    <Check size={13} strokeWidth={2.5} />
                    {serviceTitle(id)}
                  </span>
                ))}
              </div>
              {client.plan.notes && <p className="visit-note">{client.plan.notes}</p>}
              <div className="panel-card-actions is-end">
                <Button variant="secondary" onClick={() => setModal('plan')}>
                  Change the plan
                </Button>
                <Button variant="primary" onClick={() => onVisitDone(client.id)}>
                  <CheckCheck size={14} strokeWidth={1.75} />
                  Visit done
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="ag-lead">
                Nothing planned yet. The visit order says what you are going for, and sending it to{' '}
                {client.family} holds the money for it before you go — so the work order afterwards
                is only confirming what was already covered.
              </p>
              <div className="panel-card-actions is-end">
                <Button variant="primary" onClick={() => setModal('plan')}>
                  <CalendarPlus size={14} strokeWidth={1.75} />
                  Plan a visit
                </Button>
              </div>
            </>
          )}
        </Section>
      )}

      {/* Terms that are set once and then read occasionally. A row, with the
          detail a click away — as a full panel it pushed the visits and the
          history, the things that actually change, below the fold. */}
      <section className="panel-card is-compact">
        <div className="compact-row">
          <button
            type="button"
            className="compact-text"
            onClick={() => setTermsOpen((v) => !v)}
            aria-expanded={termsOpen}
          >
            <span className="doc-section-title">
              Care agreement
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`toggle-chevron${termsOpen ? '' : ' is-up'}`}
              />
            </span>
            <span className="compact-sub">{summary}</span>
          </button>
          {badge}
          {state === 'draft' && (
            <Button variant="primary" onClick={() => setModal('agreement')}>
              <FileText size={14} strokeWidth={1.75} />
              Set up agreement
            </Button>
          )}
          {state === 'sent' && (
            <Button variant="secondary" onClick={() => onRemind(client.id)}>
              <Send size={14} strokeWidth={1.75} />
              Send a reminder
            </Button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {termsOpen && (
            <motion.div
              key="terms"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="compact-body">
                {state === 'none' || state === 'draft' ? (
                  <>
                    <p className="ag-label">What {client.family} asked for</p>
                    <div className="ag-services">
                      {client.needs.map((id) => (
                        <span key={id} className="svc">
                          {serviceTitle(id)}
                        </span>
                      ))}
                    </div>
                    <div className="bc-lines ag-terms">
                      <p className="bc-line">
                        <span className="bc-line-label">Hours</span>
                        <span className="bc-line-value">{client.hours} h/week</span>
                      </p>
                      <p className="bc-line">
                        <span className="bc-line-label">Pattern</span>
                        <span className="bc-line-value">{client.schedule}</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <AgreedTerms client={client} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Section title="Visits">
        <Visits client={client} />
      </Section>

      <Section title="Activity">
        <Activity client={client} />
      </Section>

      <AnimatePresence>
        {modal === 'agreement' && (
          <Modal
            key="agreement"
            eyebrow={client.elder}
            title="Care agreement"
            wide
            onClose={() => setModal(null)}
          >
            <AgreementForm
              client={client}
              onSend={(id, terms) => {
                setModal(null);
                onSendAgreement(id, terms);
              }}
              onCancel={() => setModal(null)}
            />
          </Modal>
        )}

        {modal === 'plan' && (
          <Modal
            key="plan"
            eyebrow={client.elder}
            title={client.plan ? 'Change the visit' : 'Plan a visit'}
            wide
            onClose={() => setModal(null)}
          >
            <VisitPlanForm
              client={client}
              plan={client.plan}
              onSave={(id, plan) => {
                setModal(null);
                onPlanVisit(id, plan);
              }}
              onCancel={() => setModal(null)}
            />
          </Modal>
        )}

        {modal === 'work-order' && due && (
          <Modal
            key="work-order"
            eyebrow={client.elder}
            title="Work order"
            wide
            onClose={() => setModal(null)}
          >
            <WorkOrderForm
              client={client}
              visit={due}
              onSend={(id, report) => {
                setModal(null);
                onSendWorkOrder(id, report);
              }}
              onCancel={() => setModal(null)}
            />
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
