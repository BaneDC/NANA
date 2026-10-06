import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { paneCloseClass } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHandle, DrawerTitle } from '@/components/ui/drawer';
import { useIsPhone } from '@/hooks/use-phone';

// What has been asked so far, and what was answered — a panel down the right
// side, the way an assistant panel sits beside the work.
//
// A back button was the other option and it is not the same thing: going back
// to see what was asked means leaving the question you are on. This is read
// without losing your place, and it closes where it opened.
//
// Newest last, like a conversation: the eye lands on the bottom, which is the
// exchange just before the one on screen.
//
// On a phone it is a bottom sheet like every other pane (docs/patterns.md §12),
// 98% of the screen tall, dragged down by its head to close.
export default function HistoryPanel({ open, entries, onClose }) {
  const phone = useIsPhone();

  const list =
    entries.length === 0 ? (
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
    );

  const close = (
    <button type="button" className="imm-history-close relative z-1" onClick={onClose} aria-label="Zatvori">
      <X size={14} strokeWidth={1.75} />
    </button>
  );

  if (phone) {
    return (
      <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
        {/* over the onboarding, which stands at 60 */}
        <DrawerContent className="z-61 h-[98dvh] max-h-none text-left" overlayClassName="z-61">
          <div className="imm-history-head relative px-4 pt-4 pb-3">
            <DrawerHandle />
            <DrawerTitle className="imm-history-title pointer-events-none relative">Dosad smo prošli</DrawerTitle>
            {/* the sheets' own close, 44 under a finger */}
            <button type="button" className={`${paneCloseClass} relative z-1`} onClick={onClose} aria-label="Zatvori">
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{list}</div>
        </DrawerContent>
      </Drawer>
    );
  }

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
            {close}
          </div>
          {list}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
