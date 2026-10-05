import { useDragControls } from 'motion/react';
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
  if (!pane.contains(document.activeElement)) pane.focus({ preventScroll: true });
}

// The motion-drawn sheet PaywallModal still uses, until it moves onto Drawer.
const PHONE = '(max-width: 640px)';
const isPhone = () => Boolean(window.matchMedia?.(PHONE).matches);

const UP = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
  transition: { type: 'spring', stiffness: 380, damping: 38 },
};

const CLOSE_SPEED = 500;

export function useSheet({ desktop, onClose, dismissible = true }) {
  const [phone] = useState(isPhone);
  const controls = useDragControls();
  if (!phone) return { phone, pane: desktop, grip: {} };
  if (!dismissible) return { phone, pane: UP, grip: {} };
  return {
    phone,
    pane: {
      ...UP,
      drag: 'y',
      dragListener: false,
      dragControls: controls,
      dragConstraints: { top: 0, bottom: 0 },
      dragElastic: { top: 0, bottom: 1 },
      dragMomentum: false,
      onDragEnd: (_, info) => {
        if (info.offset.y > CLOSE_AT || info.velocity.y > CLOSE_SPEED) onClose();
      },
    },
    grip: {
      onPointerDown: (e) => {
        // the close button in the head is pressed, not dragged
        if (e.target.closest('button, a, input, textarea')) return;
        controls.start(e);
      },
      style: { touchAction: 'none' },
    },
  };
}
