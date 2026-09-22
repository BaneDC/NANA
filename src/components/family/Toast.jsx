import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';

// One line after a decision, saying what it did — "Paid. 3.400 RSD is on its way
// to Vesna." The drawer that took the decision has already closed, and the page
// behind it changes quietly; without this the only sign anything happened is a
// row that is no longer there.
export default function Toast({ flash, onDone }) {
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8, transition: { duration: 0.18 } }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        >
          <Check size={14} strokeWidth={2.25} />
          {flash.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
