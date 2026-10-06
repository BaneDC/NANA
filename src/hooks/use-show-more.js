import { useEffect, useState } from 'react';

// A full list that grows with time shows a step of it, and "Prikaži još"
// adds the next step in place (docs/patterns.md §8a). `reset` starts it over
// when what the list shows changes (a filter).
export const LIST_STEP = 20;

export function useShowMore(items, step = LIST_STEP, reset) {
  const [shown, setShown] = useState(step);
  useEffect(() => setShown(step), [reset, step]);
  return {
    visible: items.slice(0, shown),
    rest: Math.max(0, items.length - shown),
    step,
    more: () => setShown((n) => n + step),
  };
}
