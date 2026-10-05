import { useEffect, useState } from 'react';

// On a phone every pane is a bottom sheet (docs/patterns.md §12), dragged down
// by its head to close: past 96px, or by a quick flick. shadcn's Drawer (vaul)
// takes the distance as a share of the sheet's height, so the share is worked
// out from the height the sheet has: 96 of a 400 tall sheet is 0.24.
const CLOSE_AT = 96;

export function useCloseThreshold() {
  const [pane, ref] = useState(null);
  const [threshold, setThreshold] = useState(0.25);
  useEffect(() => {
    if (!pane) return undefined;
    const measure = () => pane.offsetHeight && setThreshold(Math.min(1, CLOSE_AT / pane.offsetHeight));
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(pane);
    return () => watch.disconnect();
  }, [pane]);
  // a callback ref: the sheet mounts in a portal after the pane that asks
  return { ref, threshold };
}

// What a pane does when it opens: keep focus where the content put it (a field
// with autoFocus), or else take it on the pane itself, so that no button inside
// it starts out ringed as if it had been tabbed to.
export function focusPane(e) {
  e.preventDefault();
  const pane = e.currentTarget;
  if (pane.contains(document.activeElement)) return;
  // a field asked for it (autoFocus, which TextField marks as data-autofocus)
  const field = pane.querySelector('[data-autofocus]');
  (field || pane).focus({ preventScroll: true });
}
