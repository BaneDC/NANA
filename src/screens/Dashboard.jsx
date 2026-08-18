import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Frown,
  Meh,
  Phone,
  Search,
  Smile,
  XCircle,
} from 'lucide-react';
import { STATUS_LABEL, bookingsWithCaregiver, statusCounts } from '../data/bookings';
import { chargedFor, chargingVisit, heldForPlan, money, serviceTitle } from '../data/familyCare';
import Button from '../components/Button';
import Modal from '../components/Modal';
import AskAssistant from '../components/AskAssistant';

// The family's side of the arrangement, and only what a family opens it to see:
// who is caring for their mother, what is coming, and what each visit cost.
//
// There is no alert panel. A charge going through 24 hours after a visit is the
// normal working of the thing — nothing is asked of the family, and dressing it
// in a warning said "something is wrong" on every day that nothing was. The one
// thing that genuinely waits on them, signing the agreement, is asked for where
// the agreement already is. The card lives in Settings, because it is set up
// once and then never thought about again.

const STATUS_ICON = { accepted: CheckCircle2, pending: Clock, declined: XCircle };
const MOOD = {
  low: { icon: Frown, label: 'Low' },
  usual: { icon: Meh, label: 'As usual' },
  good: { icon: Smile, label: 'Good' },
};
const AMOUNT_WORD = { less: 'less than usual', usual: 'as usual', more: 'more than usual' };

function StatusPill({ status }) {
  const Icon = STATUS_ICON[status];
  return (
    <span className={`status-pill is-${status}`}>
      <Icon size={12} strokeWidth={2} />
      {STATUS_LABEL[status]}
    </span>
  );
}

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

function Line({ label, value }) {
  return (
    <p className="bc-line">
      <span className="bc-line-label">{label}</span>
      <span className="bc-line-value">{value}</span>
    </p>
  );
}

function Visit({ visit: v, rate, onRaise }) {
  const Mood = MOOD[v.mood]?.icon;
  return (
    <li className="visit">
      <div className="visit-head">
        <p className="visit-when">
          {v.date} · {v.time}
        </p>
        {v.status === 'charging' && (
          <span className="status-pill is-muted">
            <Clock size={12} strokeWidth={2} />
            Charges in {v.chargesInHours} h
          </span>
        )}
        {v.status === 'disputed' && (
          <span className="status-pill is-declined">
            <AlertTriangle size={12} strokeWidth={2} />
            On hold — you raised it
          </span>
        )}
        {v.status === 'paid' && <span className="status-pill is-accepted">Charged {v.chargedOn}</span>}
      </div>
      <p className="visit-note">{v.note}</p>
      <p className="visit-services">{v.services.map(serviceTitle).join(' · ')}</p>
      {v.concern && (
        <p className="visit-concern">
          <AlertTriangle size={12} strokeWidth={2} />
          {v.concern}
        </p>
      )}
      {v.disputeText && (
        <p className="visit-concern">
          <AlertTriangle size={12} strokeWidth={2} />
          You said: {v.disputeText}
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
          {v.hours} h · {money(chargedFor(v.hours, rate))}
        </span>
      </div>
      {/* Quietly, on the row it belongs to: the charge is not a problem, but
          the family can say so if it is. */}
      {v.status === 'charging' && (
        <button type="button" className="visit-raise" onClick={onRaise}>
          Something is wrong with this visit
        </button>
      )}
    </li>
  );
}

// What arrived, laid against what was promised. A report is only reassuring if
// you can see it matched the plan; on its own it is just a paragraph.
function ReportDetail({ visit: v, caregiver, rate }) {
  const Mood = MOOD[v.mood]?.icon;
  const asPlanned = v.plannedHours ? v.hours === v.plannedHours : null;
  return (
    <>
      <p className="ag-lead">
        {caregiver.name.split(' ')[0]} sent this {v.sentOn}. If you do nothing it is charged in{' '}
        {v.chargesInHours} hours — you only need to be here if something is wrong.
      </p>

      <dl className="report-rows">
        <div className="report-row">
          <dt>Visit</dt>
          <dd>
            {v.date} · {v.time}
          </dd>
        </div>
        <div className="report-row">
          <dt>Hours</dt>
          <dd>
            {v.hours} h
            {v.plannedHours &&
              (asPlanned ? ' — as planned' : ` — ${v.plannedHours} h were planned`)}
          </dd>
        </div>
        <div className="report-row">
          <dt>What she did</dt>
          <dd>{v.note}</dd>
        </div>
        {v.planNotes && (
          <div className="report-row">
            <dt>Was asked to</dt>
            <dd>{v.planNotes}</dd>
          </div>
        )}
        <div className="report-row">
          <dt>How she was</dt>
          <dd className="visit-foot is-inline">
            {Mood && (
              <span className="visit-mood">
                <Mood size={13} strokeWidth={1.75} />
                {MOOD[v.mood].label}
              </span>
            )}
            {v.eating && <span className="visit-mood">ate {AMOUNT_WORD[v.eating]}</span>}
            {v.moving && <span className="visit-mood">moved {AMOUNT_WORD[v.moving]}</span>}
          </dd>
        </div>
      </dl>

      <p className="ag-label">What got done</p>
      <div className="ag-services">
        {v.services.map((id) => (
          <span key={id} className="svc is-set">
            <Check size={13} strokeWidth={2.5} />
            {serviceTitle(id)}
          </span>
        ))}
        {(v.plannedServices || [])
          .filter((id) => !v.services.includes(id))
          .map((id) => (
            <span key={id} className="svc">
              {serviceTitle(id)} — not this time
            </span>
          ))}
      </div>

      {v.concern && (
        <p className="visit-concern">
          <AlertTriangle size={12} strokeWidth={2} />
          {caregiver.name.split(' ')[0]} flagged: {v.concern}
        </p>
      )}

      <div className="bc-total">
        <p className="bc-line">
          <span className="bc-line-label">
            {v.hours} h at {money(rate)}/h
          </span>
          <span className="bc-line-value">{money(chargedFor(v.hours, rate))}</span>
        </p>
        <p className="bc-line is-net">
          <span className="bc-line-label">Charged in {v.chargesInHours} h</span>
          <span className="bc-line-value">{money(chargedFor(v.hours, rate))}</span>
        </p>
      </div>
    </>
  );
}

const DISPUTE_REASONS = [
  { id: 'hours', label: 'The hours are wrong' },
  { id: 'not-done', label: 'Something on the list did not happen' },
  { id: 'no-visit', label: 'The visit did not happen' },
  { id: 'other', label: 'Something else' },
];

function DisputeForm({ visit, caregiver, rate, onSend, onCancel }) {
  const [reason, setReason] = useState('hours');
  const [text, setText] = useState('');

  return (
    <>
      <p className="ag-lead">
        {visit.date} · {visit.time} — {visit.hours} h, {money(chargedFor(visit.hours, rate))}. Raising
        this stops the charge while we look at it, and {caregiver.name.split(' ')[0]} is told what
        you said.
      </p>

      <p className="ag-label">What is wrong</p>
      <div className="wo-choice">
        {DISPUTE_REASONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`svc is-sm${reason === r.id ? ' is-on' : ''}`}
            onClick={() => setReason(r.id)}
            aria-pressed={reason === r.id}
          >
            {r.label}
          </button>
        ))}
      </div>

      <label className="wo-field">
        <span className="ag-label">In your words</span>
        <textarea
          rows={3}
          className="wo-text"
          value={text}
          placeholder="What you noticed, and what you expected instead."
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" disabled={!text.trim()} onClick={() => onSend(reason, text.trim())}>
          Raise it
        </Button>
      </div>
    </>
  );
}

export default function Dashboard({ care, onCare, hasBookings, onAskAssistant, onFindCaregiver }) {
  const [modal, setModal] = useState(null); // 'sign' | 'dispute'
  const [historyOpen, setHistoryOpen] = useState(false);

  const counts = statusCounts();
  const rows = bookingsWithCaregiver().filter((b) => b.status !== 'accepted');
  const { caregiver, elder, agreement, payment, plan } = care;
  const charging = chargingVisit(care);
  const signed = agreement.status === 'active';

  // Anything with money still moving stays out regardless of its age, then the
  // list is topped up to two. Everything before that folds away.
  const settledList = care.visits.filter((v) => v.status !== 'charging');
  const live = settledList.filter((v) => v.status !== 'paid');
  const shown = [...live, ...settledList.filter((v) => v.status === 'paid')].slice(
    0,
    Math.max(2, live.length)
  );
  const earlier = settledList.filter((v) => !shown.includes(v));

  const sign = () => {
    onCare((c) => ({ ...c, agreement: { ...c.agreement, status: 'active', signedOn: 'just now' } }));
    setModal(null);
  };

  // Saying it is fine only brings the charge forward. Silence does the same
  // thing 24 hours later, which is the arrangement they signed up to.
  const confirm = () => {
    onCare((c) => ({
      ...c,
      visits: c.visits.map((v) =>
        v.id === charging.id ? { ...v, status: 'paid', chargedOn: 'just now' } : v
      ),
    }));
    setModal(null);
  };

  const dispute = (reason, text) => {
    onCare((c) => ({
      ...c,
      visits: c.visits.map((v) =>
        v.id === charging.id ? { ...v, status: 'disputed', disputeReason: reason, disputeText: text } : v
      ),
    }));
    setModal(null);
  };

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Your care</h1>
          <p className="view-sub">
            {caregiver.name.split(' ')[0]} and {elder.name.split(' ')[0]}, and every visit so far.
          </p>
        </div>
        {/* A shortcut, not the home of it: wanting another pair of hands
            usually occurs while looking at the arrangement you already have.
            The page itself is in the nav, where a capability belongs. */}
        <div className="view-head-actions">
          <AskAssistant onClick={onAskAssistant} />
          <Button variant="primary" onClick={onFindCaregiver}>
            <Search size={14} strokeWidth={1.75} />
            Find a caregiver
          </Button>
        </div>
      </div>

      {/* First on the page while it is live. It is the newest thing that has
          happened, the only one with a clock on it, and the only one that
          changes if it is read — everything below is standing information.
          Once it is settled it drops into the list at the bottom. */}
      {charging && (
        <Section
          title={`New report from ${caregiver.name.split(' ')[0]}`}
          badge={
            <span className="status-pill is-muted">
              <Clock size={12} strokeWidth={2} />
              Charges in {charging.chargesInHours} h
            </span>
          }
        >
          <button type="button" className="report-card" onClick={() => setModal('report')}>
            <span className="cg-avatar">{caregiver.initials}</span>
            <span className="report-body">
              <span className="report-top">
                <span className="report-when">
                  {charging.date} · {charging.time}
                </span>
              </span>
              <span className="report-note">{charging.note}</span>
              <span className="report-meta">
                {charging.hours} h · {money(chargedFor(charging.hours, agreement.rate))} · sent{' '}
                {charging.sentOn} — open to read it
              </span>
            </span>
            <ChevronRight size={18} strokeWidth={1.75} className="report-open" />
          </button>
        </Section>
      )}

      <Section
        title="Your caregiver"
        badge={
          signed ? (
            <span className="status-pill is-accepted">
              <Check size={12} strokeWidth={2} />
              Since {agreement.signedOn}
            </span>
          ) : (
            <span className="status-pill is-pending">
              <Clock size={12} strokeWidth={2} />
              Agreement unsigned
            </span>
          )
        }
      >
        <div className="cg-head">
          <span className="cg-avatar">{caregiver.initials}</span>
          <div className="cg-main">
            <p className="cg-name">{caregiver.name}</p>
            <p className="bc-meta">
              {caregiver.years} years · {caregiver.rating} ★ ({caregiver.reviews}) · {caregiver.area} ·{' '}
              {caregiver.distance}
            </p>
          </div>
          <a className="cg-phone is-open" href={`tel:${caregiver.phone.replace(/\s/g, '')}`}>
            <Phone size={13} strokeWidth={1.75} />
            {caregiver.phone}
          </a>
        </div>

        <p className="ag-label">What the agreement covers</p>
        <div className="ag-services">
          {agreement.services.map((id) => (
            <span key={id} className="svc is-set">
              <Check size={13} strokeWidth={2.5} />
              {serviceTitle(id)}
            </span>
          ))}
        </div>
        <div className="bc-lines ag-terms">
          <Line label="Hourly rate" value={`${money(agreement.rate)} / h`} />
          <Line label="Agreed hours" value={`${agreement.hours} h/week`} />
          <Line label="Pattern" value={agreement.schedule} />
        </div>

        {/* The one thing that really is waiting on them, asked for where the
            agreement it concerns already is. */}
        {!signed && (
          <>
            <p className="ag-hint">Sent {agreement.sentOn}. Visits can be booked once you sign.</p>
            <div className="panel-card-actions is-end">
              <Button variant="primary" onClick={() => setModal('sign')}>
                <FileText size={14} strokeWidth={1.75} />
                Read and sign
              </Button>
            </div>
          </>
        )}
      </Section>

      {plan && signed && (
        <Section
          title="Next visit"
          badge={
            <span className="status-pill is-muted">
              <CalendarClock size={12} strokeWidth={2} />
              {money(heldForPlan(care))} set aside
            </span>
          }
        >
          <p className="ag-lead">
            {plan.date} · {plan.time} — {plan.hours} h. {caregiver.name.split(' ')[0]} sent this{' '}
            {plan.sentOn}, and {money(heldForPlan(care))} is set aside on your card for it. Nothing
            is taken until the visit has happened.
          </p>
          <div className="ag-services">
            {plan.services.map((id) => (
              <span key={id} className="svc is-set">
                <Check size={13} strokeWidth={2.5} />
                {serviceTitle(id)}
              </span>
            ))}
          </div>
          {plan.notes && <p className="visit-note">{plan.notes}</p>}
          {!payment.connected && (
            <p className="ag-hint">
              No card on file yet — add one in Settings so this visit can be paid for.
            </p>
          )}
        </Section>
      )}

      <Section title="Visits">
        <ul className="visit-list">
          {shown.map((v) => (
            <Visit key={v.id} visit={v} rate={agreement.rate} onRaise={() => setModal('dispute')} />
          ))}
        </ul>

        {/* The recent ones stay open: a family opens this to read how yesterday
            went, and putting that behind a click hides the only thing they came
            for. What is older is reference, and reference folds away. */}
        {earlier.length > 0 && (
          <>
            <button
              type="button"
              className="visit-more"
              onClick={() => setHistoryOpen((v) => !v)}
              aria-expanded={historyOpen}
            >
              {historyOpen ? 'Hide earlier visits' : `${earlier.length} earlier visits`}
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`toggle-chevron${historyOpen ? '' : ' is-up'}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {historyOpen && (
                <motion.div
                  key="earlier"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <ul className="visit-list is-earlier">
                    {earlier.map((v) => (
                      <Visit key={v.id} visit={v} rate={agreement.rate} onRaise={() => setModal('dispute')} />
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </Section>

      {hasBookings && rows.length > 0 && (
        <Section
          title="Your other requests"
          badge={<span className="status-pill is-muted">{counts.pending} waiting</span>}
        >
          <div className="view-list">
            {rows.map((b) => (
              <div className={`booking is-${b.status}`} key={b.caregiverId}>
                <div className="cg-avatar">{b.caregiver.initials}</div>
                <div className="cg-main">
                  <div className="cg-top">
                    <span className="cg-name">{b.caregiver.name}</span>
                    <StatusPill status={b.status} />
                  </div>
                  <div className="cg-meta">
                    {b.caregiver.rate} · {b.caregiver.area} · requested {b.requested}
                  </div>
                  <p className={`booking-detail${b.status === 'declined' ? ' is-reason' : ''}`}>
                    {b.status === 'declined' && <strong>Reason: </strong>}
                    {b.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {modal === 'sign' && (
        <Modal eyebrow={caregiver.name} title="Care agreement" wide onClose={() => setModal(null)}>
          <p className="ag-lead">
            These are the terms {caregiver.name.split(' ')[0]} proposed on {agreement.sentOn}.
            Signing them is what lets visits be booked — every visit and charge after this is
            calculated from them.
          </p>
          <p className="ag-label">Services covered</p>
          <div className="ag-services">
            {agreement.services.map((id) => (
              <span key={id} className="svc is-set">
                <Check size={13} strokeWidth={2.5} />
                {serviceTitle(id)}
              </span>
            ))}
          </div>
          <div className="bc-lines ag-terms">
            <Line label="Hourly rate" value={`${money(agreement.rate)} / h`} />
            <Line label="Agreed hours" value={`${agreement.hours} h/week`} />
            <Line label="Pattern" value={agreement.schedule} />
          </div>
          <p className="ag-hint">
            You can end the arrangement at any time. Hours are charged as they are worked, never in
            advance.
          </p>
          <div className="panel-card-actions is-end">
            <Button variant="secondary" onClick={() => setModal(null)}>
              Not yet
            </Button>
            <Button variant="primary" onClick={sign}>
              <Check size={14} strokeWidth={2} />
              Sign the agreement
            </Button>
          </div>
        </Modal>
      )}

      {modal === 'report' && charging && (
        <Modal
          eyebrow={`${caregiver.name} · ${charging.date}`}
          title="Visit report"
          wide
          onClose={() => setModal(null)}
        >
          <ReportDetail visit={charging} caregiver={caregiver} rate={agreement.rate} />
          <div className="panel-card-actions is-end">
            <Button variant="secondary" onClick={() => setModal('dispute')}>
              Something is wrong
            </Button>
            <Button variant="primary" onClick={confirm}>
              <Check size={14} strokeWidth={2} />
              All good — pay now
            </Button>
          </div>
        </Modal>
      )}

      {modal === 'dispute' && charging && (
        <Modal
          eyebrow={caregiver.name}
          title="Something is wrong"
          wide
          onClose={() => setModal(null)}
        >
          <DisputeForm
            visit={charging}
            caregiver={caregiver}
            rate={agreement.rate}
            onSend={dispute}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
