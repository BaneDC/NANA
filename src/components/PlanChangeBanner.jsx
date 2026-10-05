import { AlertTriangle, RotateCcw, Sparkles, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter } from '@/components/ui/card';
import Attention, { AttentionDescription, AttentionHead, AttentionTitle } from './Attention';
import ChangeRows from './ChangeRows';

// What just changed in the plan, said at the top of it. A plan that silently
// redraws itself asks the family to spot the difference; this names it — which
// answers moved, what that did to the frailty level, and which parts of the plan
// were rewritten because of it — and offers the way back.
//
// `change` is App's record of the last edit: the answer rows from
// describeChanges, the recommendations that came out different, and where the
// edit came from. It arrives from a little above, on the dialog's spring.
export default function PlanChangeBanner({ change, onUndo, onDismiss }) {
  const Icon = change.source === 'manual' ? PenLine : Sparkles;
  return (
    <Attention
      className="animate-in fade-in-0 slide-in-from-top-2 duration-490 ease-spring-dialog"
      head={
        <AttentionHead className="flex-row items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            <Icon size={14} strokeWidth={1.75} />
          </span>
          <div>
            <AttentionTitle>Plan je izmenjen</AttentionTitle>
            <AttentionDescription>
              {{ assistant: 'Preko asistenta', manual: 'Ručno', both: 'Ručno i preko asistenta' }[change.source]} · izmenjeni delovi plana su označeni
            </AttentionDescription>
          </div>
        </AttentionHead>
      }
    >
      <Card>
        <ChangeRows rows={change.rows} notes={change.saved} />

        {change.frailty && (
          <p className="flex items-center gap-2 text-xs font-medium text-warning">
            <AlertTriangle size={12} strokeWidth={2} />
            Nivo krhkosti: {change.frailty.before} → {change.frailty.after}
          </p>
        )}

        {change.touched.length > 0 && (
          <p className="text-xs text-muted-foreground">Zbog toga se promenilo: {change.touched.join(', ')}.</p>
        )}

        <CardFooter>
          <Button variant="secondary" onClick={onDismiss}>
            U redu
          </Button>
          <Button variant="ghost" onClick={onUndo}>
            <RotateCcw size={14} strokeWidth={1.75} />
            Poništi izmene
          </Button>
        </CardFooter>
      </Card>
    </Attention>
  );
}
