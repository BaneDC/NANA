import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// The data says a state the way the pill used to (`is-accepted`…); this is the
// Badge variant that draws it (docs/patterns.md §10).
const VARIANT = {
  'is-accepted': 'success',
  'is-pending': 'warning',
  'is-declined': 'destructive',
  'is-muted': 'secondary',
  'is-attention': 'default',
};
export const statusVariant = (pill) => VARIANT[pill] || 'secondary';

// Where the family stands with a caregiver (`standingWith` in familyCare):
// one badge, the same on Pronađi, in the plan's list of caregivers and at the
// top of her profile. A tick for what moved forward; none for a no.
export default function Standing({ standing, className }) {
  if (!standing) return null;
  return (
    <Badge variant={statusVariant(standing.pill)} className={className}>
      {standing.pill !== 'is-declined' && <Check size={12} strokeWidth={2} />}
      {standing.text}
    </Badge>
  );
}
