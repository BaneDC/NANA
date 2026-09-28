import { Sparkles } from 'lucide-react';
import Button from './Button';

// Opens the co-pilot against the current page. Every view carries one in its
// head; on a narrow screen those step aside and the one in the top bar, beside
// the logo and the menu, is the one — always in the same place, and never
// squeezing a page's title (docs/patterns.md §4).
export default function AskAssistant({ onClick, label = 'Pitaj asistenta', iconOnly, className }) {
  return (
    <Button
      variant="secondary"
      className={`ask-assistant${className ? ` ${className}` : ''}`}
      iconOnly={iconOnly}
      onClick={onClick}
      aria-label={label}
      title={iconOnly ? label : undefined}
    >
      <Sparkles size={14} strokeWidth={1.75} />
      {!iconOnly && label}
    </Button>
  );
}
