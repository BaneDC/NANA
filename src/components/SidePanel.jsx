import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { paneCloseClass } from '@/components/ui/dialog';
import { SheetEyebrow } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// The right-hand panel. Two things use it — the care plan and the assistant —
// so the slide-in and the chrome live here rather than in each of them.
//
// It opens by growing from nothing to 432 beside the page (a motion width
// animation, which CSS cannot run on a panel the app adds and removes), 12
// from the page, r24 with the container's shadow; on a narrow screen it covers
// everything, square. The head is the eyebrow and title with the close, over
// a hairline; the body scrolls.
export function SidePanelFrame({ className, children }) {
  return (
    <motion.div
      className="h-full shrink-0 overflow-hidden narrow:fixed narrow:inset-0 narrow:z-35 narrow:h-auto narrow:w-auto! narrow:bg-[rgba(42,42,42,0.3)] narrow:backdrop-blur-[2px] pointer-coarse:narrow:bottom-[calc(100%-var(--app-height,100%))]"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 432, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 32 }}
    >
      <div
        className={cn(
          'ml-3 flex h-full w-[420px] flex-col overflow-hidden rounded-3xl bg-card shadow-container narrow:ml-0 narrow:w-full narrow:rounded-none narrow:shadow-none',
          className
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}

export default function SidePanel({ eyebrow, title, onClose, footer, children }) {
  return (
    <SidePanelFrame>
      <div className="flex shrink-0 items-start gap-2 border-b px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <SheetEyebrow>{eyebrow}</SheetEyebrow>
          <p className="text-sm font-medium text-foreground">{title}</p>
        </div>
        <button type="button" className={cn(paneCloseClass, 'ml-auto')} onClick={onClose} aria-label="Zatvori panel">
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">{children}</div>

      {footer}
    </SidePanelFrame>
  );
}
