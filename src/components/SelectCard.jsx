import { motion } from 'motion/react';
import NumberIndicator from './NumberIndicator';

// Selectable option card (single or multi select).
export default function SelectCard({ letter, title, description, selected, onClick }) {
  return (
    <motion.button
      type="button"
      className={`select-card${selected ? ' selected' : ''}`}
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
    >
      <NumberIndicator selected={selected}>{letter}</NumberIndicator>
      <div className="sc-content">
        <div className="sc-title">{title}</div>
        {description && <div className="sc-description">{description}</div>}
      </div>
    </motion.button>
  );
}
