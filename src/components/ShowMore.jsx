import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// "Prikaži još N" under a list that grows with time: secondary, left, and it
// says how many it adds (docs/patterns.md §8a). Nothing when all are shown.
export default function ShowMore({ list, className }) {
  if (!list.rest) return null;
  return (
    <div className={cn('flex gap-2 phone:flex-wrap phone:*:flex-auto', className)}>
      <Button variant="secondary" onClick={list.more}>
        Prikaži još {Math.min(list.step, list.rest)}
      </Button>
    </div>
  );
}
