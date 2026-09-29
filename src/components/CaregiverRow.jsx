import { ChevronRight, Send, Star } from 'lucide-react';
import Button from './Button';
import { ratingText } from '../data/carePlan';

// One caregiver in the care plan: who she is, and the one thing the family can
// do about her.
//
// The row opens her profile — the name is the link, and it covers the row — and
// the action sits at the row's right, the app's own primary button. On a phone
// the button goes and a chevron says the row opens: the profile a tap brings up
// has the same "Pošalji poruku", so every row does not need its own.
export default function CaregiverRow({ caregiver, onSelect, onOpen }) {
  return (
    <div className={`caregiver${onOpen ? ' is-clickable' : ''}`}>
      <div className="cg-avatar">{caregiver.initials}</div>
      <div className="cg-main">
        <div className="cg-top">
          {onOpen ? (
            <button type="button" className="cg-name card-link" onClick={() => onOpen(caregiver)}>
              {caregiver.name}
            </button>
          ) : (
            <span className="cg-name">{caregiver.name}</span>
          )}
          <span className="status-pill is-attention">Poklapanje · {caregiver.match}%</span>
          {onOpen && <ChevronRight className="card-go" size={16} strokeWidth={1.75} aria-hidden="true" />}
        </div>
        <div className="cg-meta">
          <Star size={11} strokeWidth={2} className="cg-star" />
          {ratingText(caregiver)} · {caregiver.rate} · {caregiver.area}, do {caregiver.radius} km
        </div>
      </div>
      {onSelect && (
        <Button variant="primary" className={onOpen ? 'card-action' : undefined} onClick={() => onSelect(caregiver)}>
          <Send size={14} strokeWidth={1.75} />
          Pošalji poruku
        </Button>
      )}
    </div>
  );
}
