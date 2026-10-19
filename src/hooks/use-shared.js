import { useCallback, useEffect, useRef, useState } from 'react';
import { store } from '../data/store';

// The demo's state for one market, as React state: read from the store (or
// seeded), saved after every local change, and replaced when another tab
// saves. What comes from the store, at mount, on a market change or from
// another tab, goes through `onReceive` (the dates said in this tab's
// language) and is never saved back, or two tabs in two languages would
// rewrite each other forever. Only a local `update` (and a seed the store did
// not have) is saved, in an effect after the commit, never inside a render.
// A null market is plain local state, kept nowhere.
const open = (market, seed, onReceive) => {
  const stored = market ? store.load(market) : null;
  return stored ? { market, state: onReceive(stored), save: false } : { market, state: seed(), save: !!market };
};

export function useShared(market, seed, { onReceive = (s) => s } = {}) {
  const [box, setBox] = useState(() => open(market, seed, onReceive));
  const receive = useRef(onReceive);
  receive.current = onReceive;
  const seeding = useRef(seed);
  seeding.current = seed;

  // the market changed while mounted: read the new one, never carry the old state over
  let current = box;
  if (box.market !== market) {
    current = open(market, seed, onReceive);
    setBox(current);
  }

  // keep what was changed here, once it is committed
  useEffect(() => {
    if (current.market && current.save) store.save(current.market, current.state);
  }, [current]);

  // replaced when another tab saves (or resets) this market
  useEffect(() => {
    if (!market) return undefined;
    return store.subscribe(market, (next) =>
      setBox({ market, state: next ? receive.current(next) : seeding.current(), save: false })
    );
  }, [market]);

  const update = useCallback(
    (fnOrValue) =>
      setBox((b) => {
        const next = typeof fnOrValue === 'function' ? fnOrValue(b.state) : fnOrValue;
        return next === b.state ? b : { market: b.market, state: next, save: true };
      }),
    []
  );
  return [current.state, update];
}
