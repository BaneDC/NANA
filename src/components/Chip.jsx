import { motion } from 'motion/react';

export default function Chip({ children }) {
  return (
    <motion.span
      className="chip"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {children}
    </motion.span>
  );
}
