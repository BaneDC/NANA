import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';

// One line after a decision, saying what it did — "Paid. 152 € is on its way
// to Sanna." The drawer that took the decision has already closed, and the page
// behind it changes quietly; without this the only sign anything happened is a
// row that is no longer there.
// On a phone it sits at the top and slides down into place (app.css); wider, it
// rises from the bottom.
const PHONE = '(max-width: 640px)';
const fromAbove = () => Boolean(window.matchMedia?.(PHONE).matches);

export default function Toast({ flash, onDone }) {
  const [above] = useState(fromAbove);
  const off = above ? -16 : 12;
  // held in a ref so a parent re-rendering does not restart the clock
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => done.current(), 3600);
    return () => clearTimeout(t);
  }, [flash]);

  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          key={flash.at}
          className="fam-toast"
          role="status"
          initial={{ opacity: 0, y: off }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: off * 0.66, transition: { duration: 0.18 } }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        >
          <Check size={14} strokeWidth={2.25} />
          {flash.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
