import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { paneCloseClass } from '@/components/ui/dialog';
import { SheetEyebrow } from '@/components/ui/sheet';
import { useSidePaneMode } from '@/hooks/use-side-pane';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

// The right-hand panel. Two things use it, the care plan and the assistant,
// so the way it comes in and the chrome live here rather than in each of them.
// The pane a card opens from the chat (KitAssistant's ChatPane) uses the frame
// alone, around the kit's own pane.
//
// `SideFrame` is how it stands, by whether there is room (`useSidePaneMode`,
// docs/patterns.md §12):
//
// - beside the page: it grows from nothing to 432 (a motion width animation,
//   which CSS cannot run on a panel the app adds and removes), the panel 12
//   from the page. The frame hides the panel while it grows, but only on the
//   side it grows from: `overflow: hidden` cut the panel's hairline and shadow
//   off flush with its top, right and bottom edge, so it looked sliced under
//   the composer. A clip-path leaves them the 12 of the page's own margin;
// - over the page, when there is no room: the frame covers the window, dimmed,
//   and the panel is a drawer on the right, 12 from the edges, sliding in;
//   pressing the dimmed page closes it;
// - a phone: the whole screen, square.
//
// What is inside reads the frame's `data-mode` to draw itself (r24 and the
// container's shadow, or square on a phone).
export function SideFrame({ className, onClose, children }) {
  const mode = useSidePaneMode();
  const beside = mode === 'beside';
  return (
    <motion.div
      data-slot="side-frame"
      data-mode={mode}
      className={cn(
        beside
          ? 'h-full shrink-0 [clip-path:inset(-12px_-12px_-12px_0)]'
          : 'fixed inset-0 z-35 flex justify-end overflow-hidden bg-[rgba(42,42,42,0.3)] backdrop-blur-[2px] pointer-coarse:bottom-[calc(100%-var(--app-height,100%))]',
        mode === 'over' && 'p-3',
        className
      )}
      initial={beside ? { width: 0, opacity: 0 } : { opacity: 0 }}
      animate={beside ? { width: 432, opacity: 1 } : { width: 'auto', opacity: 1 }}
      exit={beside ? { width: 0, opacity: 0 } : { opacity: 0 }}
      transition={beside ? { type: 'spring', stiffness: 260, damping: 32 } : { duration: 0.18 }}
      onClick={beside || !onClose ? undefined : (event) => event.target === event.currentTarget && onClose()}
    >
      {children}
    </motion.div>
  );
}

export function SidePanelFrame({ className, onClose, children }) {
  return (
    <SideFrame onClose={onClose}>
      <div
        className={cn(
          'flex h-full w-[420px] max-w-full flex-col overflow-hidden rounded-3xl bg-card shadow-container',
          'in-data-[mode=beside]:ml-3',
          'in-data-[mode=over]:animate-in in-data-[mode=over]:duration-300 in-data-[mode=over]:ease-out in-data-[mode=over]:slide-in-from-right-8',
          'in-data-[mode=full]:w-full in-data-[mode=full]:rounded-none in-data-[mode=full]:shadow-none',
          className
        )}
      >
        {children}
      </div>
    </SideFrame>
  );
}

export default function SidePanel({ eyebrow, title, onClose, footer, children }) {
  return (
    <SidePanelFrame onClose={onClose}>
      <div className="flex shrink-0 items-start gap-2 border-b px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <SheetEyebrow>{eyebrow}</SheetEyebrow>
          <p className="text-sm font-medium text-foreground">{title}</p>
        </div>
        <button type="button" className={cn(paneCloseClass, 'ml-auto')} onClick={onClose} aria-label={t('Zatvori panel')}>
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">{children}</div>

      {footer}
    </SidePanelFrame>
  );
}
