import { useState } from 'react';
import { Check, CreditCard, ShieldCheck } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import AskAssistant from '../components/AskAssistant';
import { chargingVisit, heldForPlan, money, paidThisMonth } from '../data/familyCare';

function Toggle({ label, hint, on, onChange }) {
  return (
    <button
      type="button"
      className="toggle-row"
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
    >
      <span className="toggle-text">
        <span className="tip-title">{label}</span>
        <span className="tip-body">{hint}</span>
      </span>
      <span className={`switch${on ? ' is-on' : ''}`}>
        <span className="switch-knob" />
      </span>
    </button>
  );
}

export default function Settings({ unlocked, care, onCare, onAskAssistant }) {
  const [prefs, setPrefs] = useState({
    replies: true,
    schedule: true,
    digest: false,
    marketing: false,
  });
  const set = (key) => (v) => setPrefs((p) => ({ ...p, [key]: v }));
  const [cardOpen, setCardOpen] = useState(false);

  const { payment, agreement } = care;
  const charging = chargingVisit(care);

  // No card details are collected here, and none should be: this is where a
  // real build hands off to Stripe and gets a token back.
  const connect = () => {
    onCare((c) => ({
      ...c,
      payment: { connected: true, brand: 'Visa', last4: '4242', connectedOn: 'just now' },
    }));
    setCardOpen(false);
  };

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Settings</h1>
          <p className="view-sub">Notifications, subscription and account.</p>
        </div>
        <AskAssistant onClick={onAskAssistant} />
      </div>

      <div className="panel-card">
        <p className="doc-section-title">Notifications</p>
        <div className="toggle-list">
          <Toggle
            label="Caregiver replies"
            hint="When someone accepts or declines your request"
            on={prefs.replies}
            onChange={set('replies')}
          />
          <Toggle
            label="Schedule changes"
            hint="Cancelled or rescheduled visits"
            on={prefs.schedule}
            onChange={set('schedule')}
          />
          <Toggle
            label="Weekly digest"
            hint="A Sunday summary of the week's visits"
            on={prefs.digest}
            onChange={set('digest')}
          />
          <Toggle
            label="Product news"
            hint="Occasional updates about NANA Prime"
            on={prefs.marketing}
            onChange={set('marketing')}
          />
        </div>
      </div>

      {/* Set up once and then never thought about again, which is exactly why
          it belongs here and not on the dashboard. */}
      <div className="panel-card">
        <div className="panel-card-head">
          <p className="doc-section-title">Payment method</p>
          {payment.connected ? (
            <span className="status-pill is-accepted">
              <ShieldCheck size={12} strokeWidth={2} />
              {payment.brand} ···· {payment.last4}
            </span>
          ) : (
            <span className="status-pill is-declined">Not set up</span>
          )}
        </div>

        {payment.connected ? (
          <>
            <p className="tip-body">
              Added {payment.connectedOn}. Each visit is charged 24 hours after the caregiver sends
              her report — nothing is asked of you, and you can stop a charge in that window from
              the dashboard.
            </p>
            <div className="bc-lines ag-terms">
              <p className="bc-line">
                <span className="bc-line-label">Set aside for the next visit</span>
                <span className="bc-line-value">{money(heldForPlan(care))}</span>
              </p>
              <p className="bc-line">
                <span className="bc-line-label">Charging now</span>
                <span className="bc-line-value">
                  {charging
                    ? `${money(charging.hours * agreement.rate)} · in ${charging.chargesInHours} h`
                    : 'Nothing'}
                </span>
              </p>
              <p className="bc-line">
                <span className="bc-line-label">Charged in August</span>
                <span className="bc-line-value">{money(paidThisMonth(care))}</span>
              </p>
            </div>
            <div className="panel-card-actions">
              <Button variant="secondary" onClick={() => setCardOpen(true)}>
                <CreditCard size={14} strokeWidth={1.75} />
                Change card
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="tip-body">
              Visits are paid automatically, so a card has to be on file before one can be booked.
              It is added through Stripe — we never see the number.
            </p>
            <div className="panel-card-actions">
              <Button variant="primary" onClick={() => setCardOpen(true)}>
                <CreditCard size={14} strokeWidth={1.75} />
                Add a card
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="panel-card">
        <div className="panel-card-head">
          <p className="doc-section-title">Subscription</p>
          <span className={`status-pill is-${unlocked ? 'accepted' : 'muted'}`}>
            {unlocked ? 'Active' : 'Not subscribed'}
          </span>
        </div>
        {unlocked ? (
          <>
            <ul className="paywall-list">
              <li>
                <Check size={12} strokeWidth={2.5} /> Caregiver contact details
              </li>
              <li>
                <Check size={12} strokeWidth={2.5} /> Doctor & equipment recommendations
              </li>
            </ul>
            <p className="tip-body">1.490 RSD / month · renews 4 September 2026</p>
            <div className="panel-card-actions">
              <Button variant="secondary">Manage billing</Button>
            </div>
          </>
        ) : (
          <p className="tip-body">
            Subscribe from the care plan to unlock caregiver numbers and the full
            recommendations.
          </p>
        )}
      </div>

      <div className="panel-card">
        <p className="doc-section-title">Account</p>
        <p className="tip-body">
          Export everything we hold about you, or close the account and delete it.
        </p>
        <div className="panel-card-actions">
          <Button variant="secondary">Export my data</Button>
          <Button variant="ghost">Delete account</Button>
        </div>
      </div>

      {cardOpen && (
        <Modal eyebrow="Payment" title="Add a card" onClose={() => setCardOpen(false)}>
          <p className="doc-p">
            Cards are held by Stripe, not by us — you enter the number on their page and we never
            see it. Once it is on file, visits are charged automatically and you are not asked
            again.
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
          <Button variant="primary" size="lg" full onClick={connect}>
            <CreditCard size={14} strokeWidth={1.75} />
            Continue to Stripe
          </Button>
        </Modal>
      )}
    </div>
  );
}
