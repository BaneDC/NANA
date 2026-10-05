import {
  Dialog as DialogRoot,
  DialogContent,
  DialogEyebrow,
  DialogHeader,
  DialogTitle,
  paneCloseClass,
} from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerHandle, DrawerTitle } from '@/components/ui/drawer';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsPhone } from '@/hooks/use-phone';
import { focusPane, useCloseThreshold } from '../lib/sheet';

// An action, asked in the middle of the page: end the collaboration, subscribe,
// turn something on, send, cancel. The drawer (`Modal`) is for details of
// something on the page, where the action is not the only thing that matters;
// this is for the action itself (docs/patterns.md §7).
//
// shadcn's Dialog with a mouse, shadcn's Drawer (a bottom sheet, dragged down
// by its head) on a phone. Inside, the screen puts its content and ends with
// `DialogFooter` (src/components/ui/dialog.jsx), which knows both.
//
// It may open over a drawer (cancelling a visit from its plan); then it is the
// one Escape closes, and the drawer stays. `dismissible={false}` takes away the
// close, Escape and a click past it: backup codes are shown once.
export default function Dialog({ title, eyebrow, wide, dismissible = true, open = true, onClose, children }) {
  const phone = useIsPhone();
  const sheet = useCloseThreshold();
  const onOpenChange = (next) => !next && onClose?.();
  const head = (Title) => (
    <>
      {eyebrow && <DialogEyebrow>{eyebrow}</DialogEyebrow>}
      <Title>{title}</Title>
    </>
  );

  if (phone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} dismissible={dismissible} closeThreshold={sheet.threshold}>
        <DrawerContent ref={sheet.ref} kind="dialog" tabIndex={-1} onOpenAutoFocus={focusPane}>
          <DialogHeader className="relative">
            {dismissible && <DrawerHandle />}
            <div className="pointer-events-none relative">{head(DrawerTitle)}</div>
          </DialogHeader>
          {dismissible && (
            <DrawerClose className={cn(paneCloseClass, 'absolute top-[22px] right-4 z-3')}>
              <X className="size-4" strokeWidth={1.75} />
              <span className="sr-only">Zatvori</span>
            </DrawerClose>
          )}
          {children}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        wide={wide}
        tabIndex={-1}
        showCloseButton={dismissible}
        onOpenAutoFocus={focusPane}
        onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
        onPointerDownOutside={(e) => !dismissible && e.preventDefault()}
      >
        <DialogHeader>{head(DialogTitle)}</DialogHeader>
        {children}
      </DialogContent>
    </DialogRoot>
  );
}
