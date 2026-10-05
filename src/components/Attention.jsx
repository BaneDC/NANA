import { cn } from '@/lib/utils';

// The page's one tinted place (docs/patterns.md §5): what waits on the family,
// the next step, a change to the plan, Minna's letter. The tint is the ground
// around it and the ink of its title; what it holds are ordinary white cards,
// so the tint tells it apart from the rest of the page and the cards in it
// read like every other card.
//
// 32 corners, 8 inside, a 1px line drawn inside (it takes nothing from the 8),
// cards 8 apart and r24 in it (32 = 24 + 8). The title is 16 from the top and
// 24 from the left, where the cards' text is, and 12 over the first card.
//
// `head` replaces the title and sentence when the head is more than that
// (Minna's letter folds from its head); `AttentionHead` gives it the same
// place.
export default function Attention({ title, sub, head, className, children, ...props }) {
  return (
    <section
      {...props}
      data-slot="attention"
      className={cn(
        'flex flex-col gap-2 rounded-4xl bg-primary-50 p-2 shadow-[inset_0_0_0_1px_var(--color-primary-200)]',
        className
      )}
    >
      {head || (
        <AttentionHead>
          <AttentionTitle>{title}</AttentionTitle>
          {sub && <AttentionDescription>{sub}</AttentionDescription>}
        </AttentionHead>
      )}
      {children}
    </section>
  );
}

export function AttentionHead({ className, ...props }) {
  return <div data-slot="attention-head" className={cn('flex flex-col gap-1 px-4 pt-2 pb-1', className)} {...props} />;
}

export function AttentionTitle({ className, ...props }) {
  return <p className={cn('flex items-center gap-2 text-sm font-medium text-primary-700', className)} {...props} />;
}

export function AttentionDescription({ className, ...props }) {
  return <p className={cn('text-xs leading-body text-primary-700', className)} {...props} />;
}
