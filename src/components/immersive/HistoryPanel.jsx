import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

// What has been asked so far, and what was answered — a panel down the right
// side, the way an assistant panel sits beside the work.
//
// A back button was the other option and it is not the same thing: going back
// to see what was asked means leaving the question you are on. This is read
// without losing your place, and it closes where it opened.
//
// Newest last, like a conversation: the eye lands on the bottom, which is the
// exchange just before the one on screen.
export default function HistoryPanel({ open, entries, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="imm-history"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          aria-label="Dosadašnji razgovor"
        >
          <div className="imm-history-head">
            <p className="imm-history-title">Dosad smo prošli</p>
            <button type="button" className="imm-history-close" onClick={onClose} aria-label="Zatvori">
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>

          {entries.length === 0 ? (
            <p className="imm-history-empty">Ovde će stajati sva pitanja i vaši odgovori, kako budu prolazili.</p>
          ) : (
            <ol className="imm-history-list">
              {entries.map((e, i) => (
                <li className="imm-history-item" key={`${i}-${e.question}`}>
                  <span className="imm-history-index">{i + 1}</span>
                  <div className="imm-history-pair">
                    <p className="imm-history-question">{e.question}</p>
                    <p className="imm-history-answer">{e.answer}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
