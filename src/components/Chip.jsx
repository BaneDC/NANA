import { motion } from 'motion/react';

// A short read-only label (a need on the caregiver's board, an answer in a
// question): 28 tall, 8 corners, small text on the light grey, cut short past
// 180. It pops in on a spring; it stays a motion element because the lists it
// sits in animate it out with AnimatePresence (QuestionItem).
export default function Chip({ children }) {
  return (
    <motion.span
      className="inline-flex h-(--chip-size) max-w-[180px] shrink-0 items-center gap-2 overflow-hidden rounded-lg bg-elevated-3 px-2 text-small text-ellipsis whitespace-nowrap text-foreground"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {children}
    </motion.span>
  );
}
