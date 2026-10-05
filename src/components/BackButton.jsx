import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// The one way back: the ghost button every page uses, first on the page, with
// the arrow in line with the page's own left edge (docs/patterns.md §4): its
// padding goes out into the margin. 16 above it (the page starts 16 down when
// it is first) and 4 more under it than the page's gap.
export default function BackButton({ label, onClick }) {
  return (
    // the row takes the page's column (720, centred); the button keeps its size
    <div data-slot="back-button" className="mb-1 shrink-0">
      <Button variant="ghost" className="-ml-3" onClick={onClick}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        {label}
      </Button>
    </div>
  );
}
