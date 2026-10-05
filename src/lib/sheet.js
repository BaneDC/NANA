import { useState } from 'react';
import { useDragControls } from 'motion/react';

// On a phone every pane is a bottom sheet (docs/patterns.md §12): a drawer's
// details, a dialog's action, choosing a plan. It comes up from the bottom edge,
// as tall as what it holds, and its head drags it back down to close. On a wider
// screen the pane keeps its own arrival (`desktop`) and nothing drags.
//
// The drag starts only from the head (`grip`), never from the content, so the
// content still scrolls under a finger. The head takes the whole gesture
// (touch-action: none): left to the browser, a downward swipe became a page
// scroll and cancelled the drag.
const PHONE = '(max-width: 640px)';
const isPhone = () => Boolean(window.matchMedia?.(PHONE).matches);

const UP = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
  transition: { type: 'spring', stiffness: 380, damping: 38 },
};

// how far down, or how fast, a let-go closes the sheet rather than settling it back
const CLOSE_AT = 96;
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
