import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, FileText, Lock, Send, X } from 'lucide-react';
import { caregivers } from '../data/carePlan';
import Button from './Button';

// One modal, two ways in: writing to a caregiver, or unlocking the plan.
//
// The message is written first and sent only once the subscription is paid —
// writing costs nothing, and someone who has already put their mother's needs
// into words is not asked to do it again after paying. The family's number is
// not asked for here: registration already has it.
export default function PaywallModal({ caregiver, plan, unlocked, draft, alreadyAsked, onPay, onSend, onClose }) {
  const [message, setMessage] = useState(draft || '');
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
            <label className="pw-message">
              <span className="tf-label">Poruka za negovateljicu</span>
              <textarea
                value={message}
                rows={5}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Recite joj ukratko šta vam treba i kada."
              />
            </label>
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
                <Check size={12} strokeWidth={2.5} /> Preporuke lekara i predložena pomagala
              </li>
              <li>
                <Check size={12} strokeWidth={2.5} /> Dostupnost potvrđuje naš tim
              </li>
            </ul>
          </div>
        )}

        {!unlocked ? (
          <Button variant="primary" size="lg" full onClick={onPay}>
            Pretplati se · 1.490 RSD mesečno
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
