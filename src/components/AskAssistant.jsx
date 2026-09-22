import { Sparkles } from 'lucide-react';
import Button from './Button';

// Opens the co-pilot against the current page. Every view carries one.
export default function AskAssistant({ onClick, label = 'Pitaj asistenta' }) {
  return (
    <Button variant="secondary" onClick={onClick}>
      <Sparkles size={14} strokeWidth={1.75} />
      {label}
    </Button>
  );
}
