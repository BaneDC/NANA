import { useRef } from 'react';

// A click past a pane closes it only if the press began past it too. The browser
// sends a click to whatever holds both ends of a drag, and for a drag that starts
// in the pane and ends outside it (growing a text field, selecting text) that is
// the backdrop: the pane closed on letting go, with what was typed in it.
export function useBackdropClose(onClose, enabled = true) {
  const pressedOnBackdrop = useRef(false);
  if (!enabled) return {};
  return {
    onPointerDown: (e) => {
      pressedOnBackdrop.current = e.target === e.currentTarget;
    },
    onClick: (e) => {
      if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose();
      pressedOnBackdrop.current = false;
    },
  };
}
