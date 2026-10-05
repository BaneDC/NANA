import { cn } from '@/lib/utils';

// 24px square indicator, letter or number inside: white on a grey surface,
// grey on a white card (`onWhite`), the primary when selected.
export default function NumberIndicator({ children, selected, onWhite }) {
  return (
    <div
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-lg bg-card text-small text-foreground transition-[background-color,color] duration-180',
        !selected && onWhite && 'bg-elevated-3',
        selected && 'bg-primary text-primary-foreground'
      )}
    >
      {children}
    </div>
  );
}
