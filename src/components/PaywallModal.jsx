import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, FileText, Phone, X } from 'lucide-react';
import { caregivers } from '../data/carePlan';
import TextField from './TextField';
import Button from './Button';

// One modal, two ways in: tapping a caregiver to request their number, or unlocking
// the recommendations. We ask for the user's own number because the introduction is
// made by SMS — it doubles as the lead capture.
export default function PaywallModal({ caregiver, plan, onPay, onClose }) {
  const [phone, setPhone] = useState('');
  const valid = phone.replace(/\D/g, '').length >= 8;

  const pay = () => valid && onPay();

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
            <p className="doc-eyebrow">{caregiver ? 'Zatražite broj' : 'Ceo plan nege'}</p>
            <p className="doc-title">{caregiver ? caregiver.name : `Plan nege · ${plan.name}`}</p>
          </div>
        </div>

        <p className="doc-p">
          {caregiver
            ? `Ostavite broj i potvrdićemo da je ${caregiver.name.split(' ')[0]} slobodna, pa vam poslati upoznavanje SMS-om — uz direktan broj svake negovateljice iz plana.`
            : 'Ostavite broj i otključaćemo ceo plan — preporuke, predložena pomagala i direktan broj svake negovateljice koja odgovara.'}
        </p>

        <TextField
          label="Vaš broj telefona"
          icon={Phone}
          placeholder="+381 60 123 45 67"
          value={phone}
          onChange={setPhone}
          onEnter={pay}
        />

        <ul className="paywall-list">
          <li>
            <Check size={12} strokeWidth={2.5} /> Direktni brojevi svih {caregivers.length}{' '}
            negovateljica
          </li>
          <li>
            <Check size={12} strokeWidth={2.5} /> Preporuke lekara i predložena pomagala
          </li>
          <li>
            <Check size={12} strokeWidth={2.5} /> Dostupnost potvrđuje naš tim
          </li>
        </ul>

        <Button variant="primary" size="lg" full disabled={!valid} onClick={pay}>
          Pretplati se — 1.490 RSD mesečno
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Možda kasnije
        </Button>
      </motion.div>
    </motion.div>
  );
}
