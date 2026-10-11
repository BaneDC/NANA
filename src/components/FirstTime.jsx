import { cn } from '@/lib/utils';

// A sentence said only until what it explains has been done once
// (docs/patterns.md §4b): on the page, where the text in the cards starts, in
// a card's own text. It does not float over anything and has nothing to
// press. `show` is read from what has really happened (no change reported
// yet, no question asked yet), never from a "seen" flag.
export default function FirstTime({ show = true, className, children }) {
  if (!show) return null;
  return (
    <p data-slot="first-time" className={cn('pl-4 text-xs leading-body text-muted-foreground', className)}>
      {children}
    </p>
  );
}
