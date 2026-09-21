import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

// A card's details, opened as the side pane the rest of the app already uses
// for the care plan and the assistant — not a dialog in the middle of the page.
// These are the details *of something you are looking at*, so the thing you
// clicked stays on screen beside them.
//
// The name stays `Modal` because every screen calls it that and the contract is
// unchanged: an eyebrow, a title, a close, and whatever the screen puts inside.
export default function Modal({ title, eyebrow, wide, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Rendered into the body. The pages that open this animate themselves, and a
  // transform anywhere above a `position: fixed` element makes it fixed to that
  // ancestor instead of the viewport — a pane that lands half off-screen for
  // reasons nothing about the pane explains.
  return createPortal(
    <motion.div
      className="drawer-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, pointerEvents: 'auto' }}
      // On the way out it stops taking clicks immediately. It covers the whole
      // screen, and it outlives its own fade by the length of the pane's spring
      // — long enough to swallow the first thing clicked after dismissing it.
      exit={{ opacity: 0, pointerEvents: 'none' }}
      transition={{ duration: 0.18 }}
    >
      <motion.aside
        className={`drawer${wide ? ' is-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        initial={{ x: 28, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        // a spring to arrive on, a short curve to leave on
        exit={{ x: 20, opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      >
        <div className="sidebar-head">
          <div className="sidebar-head-text">
            {eyebrow && <p className="doc-eyebrow">{eyebrow}</p>}
            <p className="doc-title">{title}</p>
          </div>
          <button type="button" className="ci-btn" onClick={onClose} aria-label="Close panel">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="drawer-body">{children}</div>
      </motion.aside>
    </motion.div>,
    document.body
  );
}
