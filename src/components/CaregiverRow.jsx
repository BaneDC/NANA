import { Send, Star } from 'lucide-react';
import Button from './Button';

// One caregiver in the care plan: who she is, and the one thing the family can
// do about her.
//
// The action is the app's own button, the same primary that says "Pošalji
// poruku" on Pronađi negovateljicu. It used to be a line of orange text with a
// send icon inside a row that was itself clickable — which read as a button,
// was not one, and put a control inside a control.
export default function CaregiverRow({ caregiver, onSelect }) {
  return (
    <div className="caregiver">
      <div className="cg-avatar">{caregiver.initials}</div>
      <div className="cg-main">
        <div className="cg-top">
          <span className="cg-name">{caregiver.name}</span>
          <span className="status-pill is-attention">Poklapanje · {caregiver.match}%</span>
        </div>
        <div className="cg-meta">
          <Star size={11} strokeWidth={2} className="cg-star" />
          {caregiver.rating} ({caregiver.reviews}) · {caregiver.years} god. iskustva · {caregiver.rate} ·{' '}
          {caregiver.area}, {caregiver.distance}
        </div>
      </div>
      {onSelect && (
        <Button variant="primary" onClick={() => onSelect(caregiver)}>
          <Send size={14} strokeWidth={1.75} />
          Pošalji poruku
        </Button>
      )}
    </div>
  );
}
