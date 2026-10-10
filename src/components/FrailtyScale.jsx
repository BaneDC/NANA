import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { frailtyOf } from '../data/frailty';
import { CFS_SR } from '../data/flow.sr';

// Where she is on the Clinical Frailty Scale, worked out from the answers: the
// level and its name, the nine steps with hers lit and those she has passed
// tinted, what the level means, and that it is an estimate, not a diagnosis.
// The same card in the plan's overview and in the medical record. Nothing when
// too little is answered to tell.
export default function FrailtyScale({ answers = {} }) {
  const level = frailtyOf(answers)?.level;
  const cfs = level ? CFS_SR[level] : null;
  if (!cfs) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Klinička skala krhkosti: {level} od 9, {cfs.label.toLowerCase()}
        </CardTitle>
      </CardHeader>
      {/* the nine steps, hers lit and those she has passed tinted */}
      <div className="mt-1 grid grid-cols-9 gap-1" role="img" aria-label={`Nivo ${level} od 9`}>
        {Array.from({ length: 9 }, (_, i) => i + 1).map((l) => (
          <span
            key={l}
            className={cn(
              'flex h-8 items-center justify-center rounded-sm text-small',
              l === level
                ? 'bg-primary font-medium text-primary-foreground'
                : l < level
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            {l}
          </span>
        ))}
      </div>
      <p className="flex justify-between gap-3 text-small text-muted-foreground">
        <span>1 - potpuno samostalna</span>
        <span className="text-right">9 - na kraju života</span>
      </p>
      <CardDescription>{cfs.blurb}</CardDescription>
      <p className="text-small text-disabled">
        Procena je iz vaših odgovora i služi da uskladimo podršku. Nije dijagnoza i ne zamenjuje lekara.
      </p>
    </Card>
  );
}
