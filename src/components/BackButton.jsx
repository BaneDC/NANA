import { ArrowLeft } from 'lucide-react';
import Button from './Button';

// The one way back: the ghost button every page uses, first on the page, with
// the arrow in line with the page's own left edge (docs/patterns.md §4).
export default function BackButton({ label, onClick }) {
  return (
    // the row takes the page's column (720, centred); the button keeps its size
    <div className="back-row">
      <Button variant="ghost" className="back-btn" onClick={onClick}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        {label}
      </Button>
    </div>
  );
}
