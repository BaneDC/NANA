import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// The letter from the coordinator, straight out of the client's document: signed
// by a named person, addressed to the caller, and ending on "step by step,
// together" rather than a call to action.
//
// It folds. It is the longest thing on the page and it is read once; after that
// it is in the way of the plan it introduces. The greeting stays out, so what is
// folded is still addressed to someone.
export default function CoordinatorMessage({ letter, changed, changeKey }) {
  const { greeting, paragraphs, from } = letter;
  const [open, setOpen] = useState(true);

  return (
    <div className={`coordinator-note${changed ? ' is-changed' : ''}`} key={changed ? changeKey : 'letter'}>
      <button
        type="button"
        className="coordinator-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cg-avatar">{from.initials}</span>
        <span className="coordinator-head-text">
          <span className="coordinator-name">{from.name}</span>
          <span className="coordinator-role">{from.role}</span>
        </span>
        {changed && <span className="status-pill is-attention">Izmenjeno</span>}
        <span className="coordinator-fold">
          {open ? 'Sakrij poruku' : 'Pročitaj poruku'}
          <ChevronDown size={14} strokeWidth={2} className={open ? 'is-open' : ''} />
        </span>
      </button>

      <p className="coordinator-greeting">{greeting}</p>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="coordinator-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {paragraphs.map((p, i) => (
              <p className="doc-p" key={i}>
                {p}
              </p>
            ))}
            <p className="coordinator-sign">— {from.name.split(' ')[0]}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
