import { useCallback, useEffect, useRef, useState } from 'react';
import { store } from '../data/store';

// The demo's state for one market, as React state: read from the store (or
// seeded), saved on every change, and replaced when another tab saves. What
// arrives from another tab goes through `onReceive` (the dates said in this
// tab's language) and is not saved back, or two tabs in two languages would
// rewrite each other forever.
export function useShared(market, seed, { onReceive = (s) => s } = {}) {
  const [state, setState] = useState(() => store.load(market) ?? seed());
  const receive = useRef(onReceive);
  receive.current = onReceive;

  // the first state is kept at once, so a second tab opened now reads it
  useEffect(() => {
    if (!store.load(market)) store.save(market, state);
    return store.subscribe(market, (next) => setState(next ? receive.current(next) : seed()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market]);

  const update = useCallback(
    (fnOrValue) =>
      setState((s) => {
        const next = typeof fnOrValue === 'function' ? fnOrValue(s) : fnOrValue;
        if (next !== s) store.save(market, next);
        return next;
      }),
    [market]
  );
  return [state, update];
}
