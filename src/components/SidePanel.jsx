import { motion } from 'framer-motion';
import { X } from 'lucide-react';

// The right-hand panel. Two things use it — the care plan and the assistant —
// so the slide-in and the chrome live here rather than in each of them.
export default function SidePanel({ eyebrow, title, onClose, footer, children }) {
  return (
    <motion.div
      className="sidebar-wrap"
      initial={{ width: 0 }}
      animate={{ width: 432 }}
      exit={{ width: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 32 }}
    >
      <div className="sidebar">
        <div className="sidebar-head">
          <div className="sidebar-head-text">
            <p className="doc-eyebrow">{eyebrow}</p>
            <p className="doc-title">{title}</p>
          </div>
          <button type="button" className="ci-btn" onClick={onClose} aria-label="Zatvori panel">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="sidebar-body">{children}</div>

        {footer}
      </div>
    </motion.div>
  );
}
