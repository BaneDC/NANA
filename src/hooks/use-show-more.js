import { useEffect, useState } from 'react';

// A list longer than what it first shows: "Prikaži još" adds the next ten in
// place, and again, until all are there. Never a drawer or another page for
// the rest (docs/patterns.md §8a). `first` is how many it opens with (ten
// unless the place is tighter); `reset` starts it over when what the list
// shows changes (a filter).
export const LIST_STEP = 10;

export function useShowMore(items, { first = LIST_STEP, step = LIST_STEP, reset } = {}) {
  const [shown, setShown] = useState(first);
  useEffect(() => setShown(first), [reset, first]);
  return {
    visible: items.slice(0, shown),
    rest: Math.max(0, items.length - shown),
    step,
    more: () => setShown((n) => n + step),
  };
}
