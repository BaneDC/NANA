import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useBackdropClose } from '../lib/backdropClose';
import { useSheet } from '../lib/sheet';

// An action, asked in the middle of the page: end the collaboration, subscribe,
// turn something on, send, cancel. The drawer (`Modal`) is for details of
// something on the page, where the action is not the only thing that matters;
// this is for the action itself (docs/patterns.md §7).
//
// The same contract as `Modal` — an eyebrow, a title, a close, and whatever the
// screen puts inside, ending in its action row — so a screen moves from one to
// the other by its name. It may open over a drawer (cancelling a visit from its
// plan); then it is the one Escape closes.
//
// On a phone it is a bottom sheet like the drawer (src/lib/sheet.js): up from
// the bottom edge, dragged down by its title.
const MIDDLE = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 8 },
  transition: { type: 'spring', stiffness: 320, damping: 30 },
};

export default function Dialog({ title, eyebrow, wide, dismissible = true, onClose, children }) {
  const sheet = useSheet({ desktop: MIDDLE, onClose, dismissible });
  const backdrop = useBackdropClose(onClose, dismissible);

  useEffect(() => {
    if (!dismissible) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      // over a drawer, this closes and the drawer stays
      e.stopImmediatePropagation();
      onClose();
    };
    // capture, so it is heard before the drawer under it
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, dismissible]);

  return createPortal(
    <motion.div
      className="modal-backdrop"
      {...backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, pointerEvents: 'auto' }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className={`modal is-dialog${wide ? ' is-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        {...sheet.pane}
      >
        {sheet.phone && <span className="sheet-grip" aria-hidden="true" />}
        {dismissible && (
          <button type="button" className="ci-btn modal-close" onClick={onClose} aria-label="Zatvori">
            <X size={16} strokeWidth={1.75} />
          </button>
        )}
        <div className="modal-title" {...sheet.grip}>
          {eyebrow && <p className="doc-eyebrow">{eyebrow}</p>}
          <p className="doc-title">{title}</p>
        </div>
        {children}
      </motion.div>
    </motion.div>,
    document.body
  );
}
