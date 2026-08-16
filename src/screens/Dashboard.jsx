import { useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Frown,
  Meh,
  Phone,
  ShieldCheck,
  Smile,
  XCircle,
} from 'lucide-react';
import { STATUS_LABEL, bookingsWithCaregiver, statusCounts } from '../data/bookings';
import {
  care as seedCare,
  chargedFor,
  chargingVisit,
  heldForPlan,
  money,
  needsYou,
  paidThisMonth,
  serviceTitle,
} from '../data/familyCare';
import Button from '../components/Button';
import Modal from '../components/Modal';
import AskAssistant from '../components/AskAssistant';

// The family's side of the arrangement. The caregiver's board answers "what do
// I owe whom next"; this answers the two questions a family actually has —
// how is my mother, and what is this costing — and holds the three things the
// caregiver's board sits blocked on: a signature, a card, and the right to say
// something is wrong before it is charged.

const STATUS_ICON = { accepted: CheckCircle2, pending: Clock, declined: XCircle };
const MOOD = { low: { icon: Frown, label: 'Low' }, usual: { icon: Meh, label: 'As usual' }, good: { icon: Smile, label: 'Good' } };
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

const DISPUTE_REASONS = [
  { id: 'hours', label: 'The hours are wrong' },
  { id: 'not-done', label: 'Something on the list did not happen' },
  { id: 'no-visit', label: 'The visit did not happen' },
  { id: 'other', label: 'Something else' },
];

function DisputeForm({ visit, rate, onSend, onCancel }) {
  const [reason, setReason] = useState('hours');
  const [text, setText] = useState('');

  return (
    <>
      <p className="ag-lead">
        {visit.date} · {visit.time} — {visit.hours} h, {money(chargedFor(visit.hours, rate))}. Raising
        this stops the charge while we look at it, and Vesna is told what you said.
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
          <AlertTriangle size={14} strokeWidth={1.75} />
          Raise it
        </Button>
      </div>
    </>
  );
}

export default function Dashboard({ hasBookings, onGoToChat, onAskAssistant }) {
  const [care, setCare] = useState(seedCare);
  const [modal, setModal] = useState(null); // 'sign' | 'pay' | 'dispute'

  const counts = statusCounts();
  const rows = bookingsWithCaregiver().filter((b) => b.status !== 'accepted');
  const { caregiver, elder, agreement, payment, plan } = care;
  const charging = chargingVisit(care);
  const todo = needsYou(care);

  const sign = () => {
    setCare((c) => ({ ...c, agreement: { ...c.agreement, status: 'active', signedOn: 'just now' } }));
    setModal(null);
  };

  // No card details are collected here, and none should be: this is the point
  // where a real build hands off to Stripe and gets a token back.
  const connect = () => {
    setCare((c) => ({
      ...c,
      payment: { connected: true, brand: 'Visa', last4: '4242', connectedOn: 'just now' },
    }));
    setModal(null);
  };

  const dispute = (reason, text) => {
    setCare((c) => ({
      ...c,
      visits: c.visits.map((v) =>
        v.id === charging.id ? { ...v, status: 'disputed', disputeReason: reason, disputeText: text } : v
      ),
    }));
    setModal(null);
  };

  // The arrangement is not behind the paywall. Unlocking bought the caregivers'
  // numbers; it has nothing to do with whether the family can see the care they
  // are already receiving — and hiding this screen until they paid meant the
  // one screen that says what is being charged was the one they could not read.
  // The requests they sent are still gated, because those are what unlocking is
  // about.

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Your care</h1>
          <p className="view-sub">
            {caregiver.name.split(' ')[0]} and {elder.name.split(' ')[0]}, and everything that has
            passed between you.
          </p>
        </div>
        <AskAssistant onClick={onAskAssistant} />
      </div>

      {/* Only what is being asked of them, and only while it is. */}
      {todo.length > 0 && (
        <section className="panel-card needs-you">
          <div className="panel-card-head">
            <p className="doc-section-title">
              <AlertTriangle size={13} strokeWidth={2} />
              Waiting on you
            </p>
          </div>
          <ul className="needs-list">
            {todo.map((item) => (
              <li key={item.id} className="needs-item">
                <span className="needs-text">
                  <span className="needs-label">{item.label}</span>
                  <span className="needs-note">{item.note}</span>
                </span>
                {item.id === 'sign' && (
                  <Button variant="primary" onClick={() => setModal('sign')}>
                    <FileText size={14} strokeWidth={1.75} />
                    Read and sign
                  </Button>
                )}
                {item.id === 'pay' && (
                  <Button variant="primary" onClick={() => setModal('pay')}>
                    <CreditCard size={14} strokeWidth={1.75} />
                    Add a card
                  </Button>
                )}
                {item.id === 'charge' && (
                  <Button variant="secondary" onClick={() => setModal('dispute')}>
                    Something is wrong
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Section
        title="Your caregiver"
        badge={
          agreement.status === 'active' ? (
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
        <p className="visit-note">{caregiver.bio}</p>

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
      </Section>

      {plan && agreement.status === 'active' && (
        <Section
          title="Next visit"
          badge={
            <span className="status-pill is-muted">
              <CalendarClock size={12} strokeWidth={2} />
              {money(heldForPlan(care))} held
            </span>
          }
        >
          <p className="ag-lead">
            {plan.date} · {plan.time} — {plan.hours} h. {caregiver.name.split(' ')[0]} sent this{' '}
            {plan.sentOn}, and {money(heldForPlan(care))} is held on your card for it. Nothing is
            taken until the visit has happened.
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
        </Section>
      )}

      <Section
        title="Payment"
        badge={
          payment.connected ? (
            <span className="status-pill is-accepted">
              <ShieldCheck size={12} strokeWidth={2} />
              {payment.brand} ···· {payment.last4}
            </span>
          ) : (
            <span className="status-pill is-declined">Not set up</span>
          )
        }
      >
        {payment.connected ? (
          <>
            <p className="ag-lead">
              Added {payment.connectedOn}. Each visit is charged 24 hours after{' '}
              {caregiver.name.split(' ')[0]} sends the report — you do not have to approve anything,
              and you can stop a charge in that window if something is wrong.
            </p>
            <div className="bc-lines ag-terms">
              <Line label="Held for the next visit" value={money(heldForPlan(care))} />
              <Line
                label="Charging now"
                value={
                  charging
                    ? `${money(chargedFor(charging.hours, agreement.rate))} · in ${charging.chargesInHours} h`
                    : 'Nothing'
                }
              />
              <Line label="Charged in August" value={money(paidThisMonth(care))} />
            </div>
            <div className="panel-card-actions is-end">
              <Button variant="secondary" onClick={() => setModal('pay')}>
                <CreditCard size={14} strokeWidth={1.75} />
                Change card
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="ag-lead">
              Visits are paid automatically, so a card has to be on file before one can be booked.
              It is added through Stripe — we never see the number.
            </p>
            <div className="panel-card-actions is-end">
              <Button variant="primary" onClick={() => setModal('pay')}>
                <CreditCard size={14} strokeWidth={1.75} />
                Add a card
              </Button>
            </div>
          </>
        )}
      </Section>

      <Section title="Visits and charges">
        <ul className="visit-list">
          {care.visits.map((v) => {
            const Mood = MOOD[v.mood]?.icon;
            return (
              <li key={v.id} className="visit">
                <div className="visit-head">
                  <p className="visit-when">
                    {v.date} · {v.time}
                  </p>
                  {v.status === 'charging' && (
                    <span className="status-pill is-pending">
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
                    {v.hours} h · {money(chargedFor(v.hours, agreement.rate))}
                  </span>
                </div>
                {v.status === 'charging' && (
                  <div className="panel-card-actions is-end">
                    <Button variant="secondary" onClick={() => setModal('dispute')}>
                      Something is wrong
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      {/* The requests that never turned into anything are still part of the
          picture, so they stay — just no longer the whole screen. */}
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

      <AnimatedModals
        modal={modal}
        care={care}
        charging={charging}
        onClose={() => setModal(null)}
        onSign={sign}
        onConnect={connect}
        onDispute={dispute}
      />
    </div>
  );
}

function AnimatedModals({ modal, care, charging, onClose, onSign, onConnect, onDispute }) {
  const { caregiver, agreement } = care;

  if (modal === 'sign') {
    return (
      <Modal eyebrow={caregiver.name} title="Care agreement" wide onClose={onClose}>
        <p className="ag-lead">
          These are the terms {caregiver.name.split(' ')[0]} proposed on {agreement.sentOn}. Signing
          them is what lets visits be booked — every visit and charge after this is calculated from
          them.
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
          <Button variant="secondary" onClick={onClose}>
            Not yet
          </Button>
          <Button variant="primary" onClick={onSign}>
            <Check size={14} strokeWidth={2} />
            Sign the agreement
          </Button>
        </div>
      </Modal>
    );
  }

  if (modal === 'pay') {
    return (
      <Modal eyebrow="Payment" title="Add a card" onClose={onClose}>
        <p className="doc-p">
          Cards are held by Stripe, not by us — you enter the number on their page and we never see
          it. Once it is on file, visits are charged automatically and you are not asked again.
        </p>
        <ul className="paywall-list">
          <li>
            <Check size={12} strokeWidth={2.5} /> Charged 24 hours after each visit report
          </li>
          <li>
            <Check size={12} strokeWidth={2.5} /> Nothing taken before a visit happens
          </li>
          <li>
            <Check size={12} strokeWidth={2.5} /> You can stop any charge inside that window
          </li>
        </ul>
        <Button variant="primary" size="lg" full onClick={onConnect}>
          <CreditCard size={14} strokeWidth={1.75} />
          Continue to Stripe
        </Button>
      </Modal>
    );
  }

  if (modal === 'dispute' && charging) {
    return (
      <Modal eyebrow={caregiver.name} title="Something is wrong" wide onClose={onClose}>
        <DisputeForm visit={charging} rate={agreement.rate} onSend={onDispute} onCancel={onClose} />
      </Modal>
    );
  }

  return null;
}
