import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// A set of answer changes, one per line: the question, then what it was and what
// it becomes — or, for a list, what comes off it and what goes on. The same rows
// read the proposal in the assistant and the change at the top of the plan, so
// the family sees one change described one way.
//
// The question in a column of 136 and the change beside it; on a phone, or
// `stacked` (a narrow pane), the change goes under the question.
export default function ChangeRows({ rows, notes = [], stacked }) {
  const row = cn(
    'grid grid-cols-[136px_minmax(0,1fr)] items-baseline gap-3 rounded-lg bg-muted px-3 py-2 phone:grid-cols-1 phone:gap-1',
    stacked && 'grid-cols-1 gap-1'
  );
  const change = 'flex flex-wrap items-center gap-2 text-xs';
  return (
    <ul className="flex list-none flex-col gap-2">
      {rows.map((r) => (
        <li key={r.questionId} className={row}>
          <span className="text-xs text-muted-foreground">{r.title}</span>
          {r.added || r.removed ? (
            <span className={change}>
              {r.removed.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-destructive-muted px-2 py-1 text-small text-destructive">
                  Više ne: {r.removed.join(', ')}
                </span>
              )}
              {r.added.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-success-muted px-2 py-1 text-small font-medium text-success">
                  Sada i: {r.added.join(', ')}
                </span>
              )}
            </span>
          ) : (
            <span className={change}>
              <span className="text-disabled line-through">{r.before}</span>
              <ArrowRight size={12} strokeWidth={1.75} />
              <span className="font-medium text-foreground">{r.after}</span>
            </span>
          )}
        </li>
      ))}
      {notes.map((t) => (
        <li key={t} className={row}>
          <span className="text-xs text-muted-foreground">Beleška</span>
          <span className={change}>
            <span className="font-medium text-foreground">„{t.replace(/[.„“"]+$/g, '')}“</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
