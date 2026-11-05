import { cn } from '@/lib/utils';

// The grey tray (docs/patterns.md §5): the orange part's shape on the page's
// grey, for groups that ask for no attention. Its head (a title, and a button
// to its right when there is one) is on the grey; what it holds are ordinary
// white cards.
//
// The same measures as `Attention`: 32 corners, 8 inside, cards 8 apart and
// r24 in it (32 = 24 + 8); the title 16 from the top and 24 from the left,
// where the cards' text is, and 12 over the first card. A button in the head
// stands 16 from the top and 16 from the right.
export default function Tray({ title, sub, action, head, className, children, ...props }) {
  return (
    <section {...props} data-slot="tray" className={cn('flex flex-col gap-2 rounded-4xl bg-muted p-2', className)}>
      {head || (
        <TrayHead>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <TrayTitle>{title}</TrayTitle>
            {sub && <TrayDescription>{sub}</TrayDescription>}
          </div>
          {action}
        </TrayHead>
      )}
      {children}
    </section>
  );
}

export function TrayHead({ className, ...props }) {
  return <div data-slot="tray-head" className={cn('flex items-center gap-2 px-4 pt-2 pb-1 has-[[data-slot=button]]:pr-2', className)} {...props} />;
}

export function TrayTitle({ className, ...props }) {
  return <p className={cn('text-sm font-medium text-foreground', className)} {...props} />;
}

export function TrayDescription({ className, ...props }) {
  return <p className={cn('text-xs leading-body text-muted-foreground', className)} {...props} />;
}
