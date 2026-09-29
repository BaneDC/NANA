import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { perMonth, planPrice, planSaving, plansFor } from '../data/plans';
import Button from './Button';
import { Field, TextArea } from './TextField';

// One plan, as the live platform's plan picker shows it: what it is called, what
// it costs, what it saves, who it is for, everything it includes, and its own
// button. Every card has the lot, so two plans are compared line by line rather
// than by a price and a name. The one we would rather sell is ringed and says
// so; its button is the primary one.
function PlanCard({ plan, plans, onChoose }) {
  const saving = planSaving(plan, plans);
  return (
    <div className={`panel-card pw-plan-card${plan.recommended ? ' is-recommended' : ''}`}>
      <div className="panel-card-head">
        <p className="doc-section-title">{plan.name}</p>
        {plan.recommended && <span className="status-pill is-attention">Najpopularniji</span>}
      </div>

      <div className="pw-plan-price">
        <p className="pw-plan-amount">
          {planPrice(plan)}
          {saving && <span className="status-pill is-accepted">{saving}% uštede</span>}
        </p>
        <p className="pw-plan-per">
          {plan.months === 1
            ? 'mesečno, otkazujete kad god želite'
            : `za ${plan.months} meseca · ${perMonth(plan)} mesečno, naplaćuje se odjednom`}
        </p>
      </div>

      <p className="tip-body">{plan.description}</p>

      <div className="pw-plan-includes">
        {plan.lead && <p className="pw-plan-lead">{plan.lead}</p>}
        <ul className="paywall-list">
          {plan.benefits.map((b) => (
            <li key={b}>
              <Check size={12} strokeWidth={2.5} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel-card-actions">
        <Button
          variant={plan.recommended || plans.length === 1 ? 'primary' : 'secondary'}
          full
          onClick={() => onChoose(plan)}
        >
          Izaberite {plan.name}
        </Button>
      </div>
    </div>
  );
}

// One dialog, two ways in: unlocking the plan, or writing to a caregiver.
//
// Writing comes first and the plan second — writing costs nothing, and someone
// who has already put their mother's needs into words is not asked to do it
// again after paying. So a message to a caregiver opens on the message; "Dalje"
// goes to the plans; paying brings it back to the message, now with "Pošalji".
// The family's number is not asked for here: registration already has it.
//
// The field starts empty. It used to open with a request written from the plan,
// which read as ours rather than theirs; the placeholder says what belongs there.
// On a phone the dialog is a drawer (app.css), so it arrives like one: sliding
// in from the side rather than growing out of the middle.
const PHONE = '(max-width: 640px)';
const arrive = () =>
  window.matchMedia?.(PHONE).matches
    ? { initial: { opacity: 0, x: 28 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 } }
    : { initial: { opacity: 0, scale: 0.96, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.98, y: 8 } };

export default function PaywallModal({ caregiver, unlocked, alreadyAsked, country, onPay, onSend, onClose }) {
  const [message, setMessage] = useState('');
  const [motionProps] = useState(arrive);
  const [step, setStep] = useState('message');
  const plans = plansFor(country);
  const first = caregiver?.name.split(' ')[0];
  const choosing = !unlocked && !alreadyAsked && (!caregiver || step === 'plans');

  return (
    <motion.div
      className="modal-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className={`modal${choosing ? ` is-plans${plans.length === 1 ? ' is-single' : ''}` : ' is-wide'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        {...motionProps}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      >
        <button type="button" className="ci-btn modal-close" onClick={onClose} aria-label="Zatvori">
          <X size={16} strokeWidth={1.75} />
        </button>

        {choosing ? (
          <>
            <div className="pw-head">
              <p className="doc-title">Izaberite pretplatu</p>
              <p className="tip-body">
                {/* no name in these: Serbian would have to decline it ("za Vesnu"),
                    and a template cannot */}
                {caregiver
                  ? 'Vaša poruka ide čim se pretplatite, zajedno sa planom nege.'
                  : 'Pretplata otključava ceo plan nege i kontakte negovateljica.'}
              </p>
            </div>

            <div className="pw-plan-grid">
              {plans.map((p) => (
                <PlanCard key={p.id} plan={p} plans={plans} onChoose={onPay} />
              ))}
            </div>

            <div className="pw-notes">
              <p>Pretplata se obnavlja automatski, a možete da je otkažete u svakom trenutku.</p>
              <p>Cene su izražene u evrima.</p>
            </div>

            {caregiver && (
              <div className="panel-card-actions is-end">
                <Button variant="secondary" onClick={() => setStep('message')}>
                  Nazad na poruku
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="modal-head">
              <div className="cg-avatar">{caregiver?.initials}</div>
              <div>
                <p className="doc-eyebrow">Poruka sa planom nege</p>
                <p className="doc-title">{caregiver?.name}</p>
              </div>
            </div>

            {alreadyAsked ? (
              <p className="doc-p">Već ste poslali upit. {first} odgovara sa svoje table, a mi vam javljamo čim odgovori.</p>
            ) : (
              <>
                <p className="doc-p">
                  Uz poruku ide i plan nege, pa ne morate da objašnjavate sve iznova. Upit nikoga ne obavezuje.
                  {!unlocked && ' Poruka se šalje čim se pretplatite.'}
                </p>
                {/* no label: the sentence above says what goes in it, and the
                    placeholder says it again inside */}
                <Field>
                  <TextArea
                    value={message}
                    rows={5}
                    onChange={setMessage}
                    aria-label="Poruka za negovateljicu"
                    placeholder="Recite joj ukratko šta vam treba i kada."
                  />
                </Field>
              </>
            )}

            <div className="panel-card-actions is-end">
              <Button variant="secondary" onClick={onClose}>
                {alreadyAsked ? 'Zatvori' : 'Možda kasnije'}
              </Button>
              {!alreadyAsked &&
                (unlocked ? (
                  <Button variant="primary" disabled={!message.trim()} onClick={() => onSend(message.trim())}>
                    Pošalji poruku
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => setStep('plans')}>
                    Dalje: izaberite pretplatu
                  </Button>
                ))}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
