import { cn } from '@/lib/utils';

// The parts a drawer or a dialog is read in (docs/patterns.md §7), in
// Tailwind: what `.ag-label`, `.ag-hint`, `.fam-callout`, `.report-rows`,
// `.visit-concern` and `.fam-stats` were. The pane's own sentence is
// `SheetDescription` / `DialogDescription`.

// The name of a part of the pane: small, medium, 8 more above it than the
// pane's gap, so the parts read as parts.
export function PaneLabel({ className, ...props }) {
  return <p data-slot="pane-label" className={cn('mt-2 text-small font-medium text-foreground', className)} {...props} />;
}

// A quiet note under something: small text, the secondary colour.
export function PaneHint({ className, ...props }) {
  return <p data-slot="pane-hint" className={cn('text-small text-muted-foreground', className)} {...props} />;
}

// A part of a dialog's body (docs/patterns.md §7): its name, as a group's name
// on a page (12, grey, medium, so a name under it reads as one of its rows),
// and what it holds 8 under it. Parts follow one another 24 apart.
export function Part({ label, className, children, ...props }) {
  return (
    <section data-slot="pane-part" className={cn('flex flex-col gap-2', className)} {...props}>
      <h3 className="text-small font-medium text-muted-foreground">{label}</h3>
      {children}
    </section>
  );
}

// a sentence in a part
export function PartText({ className, ...props }) {
  return <p className={cn('text-xs leading-body text-muted-foreground', className)} {...props} />;
}

// Something the pane needs first (add a card before the terms can be agreed):
// the primary's pale ground and line, its sentence and its button under it.
export function Callout({ className, ...props }) {
  return (
    <div
      data-slot="callout"
      className={cn(
        'flex flex-col items-start gap-2 rounded-2xl border border-primary-200 bg-primary-50 p-3 text-xs leading-body text-foreground',
        className
      )}
      {...props}
    />
  );
}

// A report read as label and value, the labels in one column of 116.
export function ReportRows({ className, ...props }) {
  return <dl data-slot="report-rows" className={cn('flex flex-col gap-1', className)} {...props} />;
}

export function ReportRow({ label, children }) {
  return (
    <div data-slot="report-row" className="flex items-baseline gap-3 text-xs leading-body">
      <dt className="w-[116px] shrink-0 text-disabled">{label}</dt>
      <dd className="min-w-0 flex-1 text-foreground">{children}</dd>
    </div>
  );
}

// What the caregiver flagged: red on its pale ground.
export function Concern({ className, ...props }) {
  return (
    <p
      data-slot="concern"
      className={cn(
        'flex items-start gap-2 rounded-lg bg-destructive-muted px-3 py-2 text-[11px] leading-4 text-destructive',
        className
      )}
      {...props}
    />
  );
}

// The sum of a work order, on a grey ground: the lines, then the total.
export function Total({ className, ...props }) {
  return <div data-slot="total" className={cn('flex flex-col gap-1 rounded-lg bg-muted px-3 py-2', className)} {...props} />;
}

// Two numbers at the top of an overview (docs/patterns.md §8): the number 24
// / 32 medium, its label and a note under it, two columns, no box around them.
export function Stats({ className, ...props }) {
  return <div data-slot="stats" className={cn('grid grid-cols-2 gap-4', className)} {...props} />;
}

export function Stat({ value, label, note }) {
  return (
    <div data-slot="stat">
      <p className="text-[24px] leading-8 font-medium text-foreground">{value}</p>
      <p className="text-small text-muted-foreground">{label}</p>
      <p className="text-small text-muted-foreground">{note}</p>
    </div>
  );
}
