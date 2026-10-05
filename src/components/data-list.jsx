import { cn } from '@/lib/utils';

// Data as label and value (docs/patterns.md §8), in Tailwind.
//
// A short value (an amount, a date, a state, a number) sits right of its label:
//
//   <DataList>
//     <DataRow label="Rezervisano">54 €</DataRow>
//     <DataRow label="Analitika" off>Isključeno</DataRow>   a value that is off
//     <DataRow label="Ukupno" total>54 €</DataRow>         the sum, under a line
//   </DataList>
//
// The label is 12 in the secondary colour, the value the primary; free text
// wraps and is never cut short.

export function DataList({ className, ...props }) {
  return <div data-slot="data-list" className={cn('flex flex-col gap-1', className)} {...props} />;
}

export function DataRow({ label, off, total, className, children, ...props }) {
  return (
    <p
      data-slot="data-row"
      className={cn(
        'flex items-baseline gap-2 text-xs leading-body',
        total && 'mt-1 border-t pt-1 font-medium',
        className
      )}
      {...props}
    >
      <span className={cn('shrink-0 text-muted-foreground', total && 'text-foreground')}>{label}</span>
      <span className={cn('min-w-0 flex-1 text-right text-foreground', off && 'font-normal text-disabled')}>{children}</span>
    </p>
  );
}

// What something includes, each line after a check in the primary.
export function CheckList({ className, ...props }) {
  return (
    <ul
      data-slot="check-list"
      className={cn(
        'flex list-none flex-col gap-1 self-start [&>li]:flex [&>li]:items-center [&>li]:gap-2 [&>li]:text-xs [&>li]:text-muted-foreground [&_svg]:shrink-0 [&_svg]:text-primary',
        className
      )}
      {...props}
    />
  );
}
