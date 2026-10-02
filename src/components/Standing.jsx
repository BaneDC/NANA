import { Check } from 'lucide-react';

// Where the family stands with a caregiver (`standingWith` in familyCare):
// one pill, the same on Pronađi, in the plan's list of caregivers and at the
// top of her profile. A tick for what moved forward; none for a no.
export default function Standing({ standing, className = '' }) {
  if (!standing) return null;
  return (
    <span className={`status-pill ${standing.pill}${className ? ` ${className}` : ''}`}>
      {standing.pill !== 'is-declined' && <Check size={12} strokeWidth={2} />}
      {standing.text}
    </span>
  );
}
