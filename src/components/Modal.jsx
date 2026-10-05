import { X } from 'lucide-react';
import { paneCloseClass } from '@/components/ui/dialog';
import { Sheet, SheetBody, SheetContent, SheetEyebrow, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHandle, DrawerTitle } from '@/components/ui/drawer';
import { useIsPhone } from '@/hooks/use-phone';
import { cn } from '@/lib/utils';
import { focusPane, useCloseThreshold } from '../lib/sheet';

// A card's details, opened as a pane beside the page (docs/patterns.md §7):
// the details *of something you are looking at*, so the thing you clicked
// stays on screen beside them.
//
// shadcn's Sheet with a mouse, shadcn's Drawer (a bottom sheet, dragged down
// by its head) on a phone. The screen's content goes into the body, which
// scrolls, and ends with `SheetFooter` (src/components/ui/sheet.jsx) when the
// pane has buttons.
//
// The name stays `Modal` because every screen calls it that and the contract is
// unchanged: an eyebrow, a title, a close, and whatever the screen puts inside.
// `dismissible={false}` takes away the close, Escape and a click past it.
export default function Modal({ title, eyebrow, wide, dismissible = true, open = true, onClose, children }) {
  const phone = useIsPhone();
  const sheet = useCloseThreshold();
  const onOpenChange = (next) => !next && onClose?.();
  const head = (Title) => (
    <div className="pointer-events-none relative min-w-0 flex-1">
      {eyebrow && <SheetEyebrow>{eyebrow}</SheetEyebrow>}
      <Title>{title}</Title>
    </div>
  );
  const close = dismissible && (
    <button type="button" className={cn(paneCloseClass, 'relative z-3 ml-auto')} onClick={onClose} aria-label="Zatvori panel">
      <X className="size-4" strokeWidth={1.75} />
    </button>
  );

  if (phone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} dismissible={dismissible} closeThreshold={sheet.threshold}>
        <DrawerContent ref={sheet.ref} tabIndex={-1} onOpenAutoFocus={focusPane}>
          <SheetHeader>
            {dismissible && <DrawerHandle />}
            {head(DrawerTitle)}
            {close}
          </SheetHeader>
          <SheetBody>{children}</SheetBody>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        wide={wide}
        tabIndex={-1}
        onOpenAutoFocus={focusPane}
        onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
        onPointerDownOutside={(e) => !dismissible && e.preventDefault()}
      >
        <SheetHeader>
          {head(SheetTitle)}
          {close}
        </SheetHeader>
        <SheetBody>{children}</SheetBody>
      </SheetContent>
    </Sheet>
  );
}
