import { Sparkles } from 'lucide-react';
import Button from './Button';

// Opens the co-pilot against the current page. Every view carries one.
export default function AskAssistant({ onClick, label = 'Pitaj asistenta', iconOnly }) {
  return (
    <Button variant="secondary" iconOnly={iconOnly} onClick={onClick} aria-label={label} title={iconOnly ? label : undefined}>
      <Sparkles size={14} strokeWidth={1.75} />
      {!iconOnly && label}
    </Button>
  );
}
