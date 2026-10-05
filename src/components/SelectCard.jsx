import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import NumberIndicator from './NumberIndicator';

// Selectable option card (single or multi select).
export default function SelectCard({ letter, title, description, selected, onClick }) {
  return (
    <motion.button
      type="button"
      className={cn(
        'flex w-full cursor-pointer items-start gap-2 rounded-lg bg-elevated-3 p-2 text-left transition-[background-color] duration-150 hover:bg-elevated-4',
        selected && 'bg-primary-50 hover:bg-primary-50'
      )}
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
    >
      <NumberIndicator selected={selected}>{letter}</NumberIndicator>
      <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
        <div className="text-xs font-medium text-foreground">{title}</div>
        {description && <div className="mt-1 text-xs text-muted-foreground">{description}</div>}
      </div>
    </motion.button>
  );
}
