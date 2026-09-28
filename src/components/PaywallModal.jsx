import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, FileText, Lock, Send, X } from 'lucide-react';
import { caregivers } from '../data/carePlan';
import { perMonth, planEvery, planPrice, planSaving, planTitle, plansFor } from '../data/plans';
import Button from './Button';
import { Field, TextArea } from './TextField';

// The plans, when there is more than one to choose from. Each card says the
// three things somebody compares: what it is called, what it costs, and what
// that works out to a month — the last one being the only way two plans with
// different periods can be compared at all.
function PlanChoice({ plans, chosen, onChoose }) {
  return (
    <div className="pw-plans">
      {plans.map((plan) => {
        const saving = planSaving(plan, plans);
        const on = plan.id === chosen.id;
        return (
          <button
            key={plan.id}
            type="button"
            className={`pw-plan${on ? ' is-on' : ''}`}
            aria-pressed={on}
            onClick={() => onChoose(plan)}
          >
            <span className="pw-plan-mark">{on && <Check size={12} strokeWidth={3} />}</span>
            <span className="pw-plan-text">
              <span className="pw-plan-top">
                <span className="pw-plan-name">{planTitle(plan)}</span>
                {saving && <span className="status-pill is-accepted">Uštedite {saving}%</span>}
              </span>
              <span className="pw-plan-price">
                {planPrice(plan)} {planEvery(plan)}
              </span>
              <span className="pw-plan-note">
                {plan.months === 1
                  ? 'Otkazujete kad god želite.'
                  : `${perMonth(plan)} mesečno, naplaćeno odjednom.`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// One modal, two ways in: writing to a caregiver, or unlocking the plan.
//
// The message is written first and sent only once the subscription is paid —
// writing costs nothing, and someone who has already put their mother's needs
// into words is not asked to do it again after paying. The family's number is
// not asked for here: registration already has it.
//
// The field starts empty. It used to open with a request written from the plan,
// which read as ours rather than theirs: a family looking at a stranger's name
// was handed a paragraph to send under it, and the first thing most of them did
// was select all and delete. The placeholder says what belongs there instead.
export default function PaywallModal({ caregiver, plan, unlocked, alreadyAsked, country, onPay, onSend, onClose }) {
  const [message, setMessage] = useState('');
  const plans = plansFor(country);
  // The longer plan is the one we would rather sell, so it is the one already
  // chosen — but only where there is a choice at all.
  const [chosen, setChosen] = useState(() => plans[plans.length - 1]);
  const first = caregiver?.name.split(' ')[0];
  const canSend = unlocked && message.trim().length > 0;

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
        className="modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      >
        <button type="button" className="ci-btn modal-close" onClick={onClose} aria-label="Zatvori">
          <X size={16} strokeWidth={1.75} />
        </button>

        <div className="modal-head">
          {caregiver ? (
            <div className="cg-avatar">{caregiver.initials}</div>
          ) : (
            <span className="locked-badge">
              <FileText size={14} strokeWidth={2} />
            </span>
          )}
          <div>
            <p className="doc-eyebrow">{caregiver ? 'Poruka sa planom nege' : 'Ceo plan nege'}</p>
            <p className="doc-title">{caregiver ? caregiver.name : `Plan nege · ${plan.name}`}</p>
          </div>
        </div>

        {caregiver && alreadyAsked ? (
          <p className="doc-p">Već ste poslali upit. {first} odgovara sa svoje table, a mi vam javljamo čim odgovori.</p>
        ) : caregiver ? (
          <>
            <p className="doc-p">
              Uz poruku ide i plan nege, pa ne morate da objašnjavate sve iznova. Upit nikoga ne obavezuje.
            </p>
            <Field label="Poruka za negovateljicu">
              <TextArea
                value={message}
                rows={5}
                onChange={setMessage}
                placeholder="Recite joj ukratko šta vam treba i kada."
              />
            </Field>
          </>
        ) : (
          <p className="doc-p">
            Otključajte ceo plan: preporuke, predložena pomagala i poruke svakoj negovateljici koja odgovara.
          </p>
        )}

        {!unlocked && (
          <div className="pw-gate">
            <p className="pw-gate-title">
              <Lock size={12} strokeWidth={2} />
              {caregiver ? 'Poruka se šalje posle pretplate' : 'Uz pretplatu'}
            </p>
            <ul className="paywall-list">
              <li>
                <Check size={12} strokeWidth={2.5} /> Poruke svim negovateljicama iz plana ({caregivers.length})
              </li>
              <li>
                <Check size={12} strokeWidth={2.5} /> Pregledi i pomagala kod partnera, do 10% jeftinije
              </li>
              <li>
                <Check size={12} strokeWidth={2.5} /> Dostupnost potvrđuje naš tim
              </li>
            </ul>
          </div>
        )}

        {!unlocked && plans.length > 1 && (
          <PlanChoice plans={plans} chosen={chosen} onChoose={setChosen} />
        )}

        {!unlocked ? (
          <Button variant="primary" size="lg" full onClick={() => onPay(chosen)}>
            Pretplati se · {planPrice(chosen)} {planEvery(chosen)}
          </Button>
        ) : caregiver && !alreadyAsked ? (
          <Button variant="primary" size="lg" full disabled={!canSend} onClick={() => onSend(message.trim())}>
            <Send size={14} strokeWidth={1.75} />
            Pošalji poruku
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onClose}>
          {unlocked && (alreadyAsked || !caregiver) ? 'Zatvori' : 'Možda kasnije'}
        </Button>
      </motion.div>
    </motion.div>
  );
}
