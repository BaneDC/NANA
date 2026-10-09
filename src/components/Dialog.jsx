import {
  Dialog as DialogRoot,
  DialogClose,
  DialogContent,
  DialogDescription,
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
//
// The head is one group: the eyebrow over the title, with the close beside the
// two and on their middle (with a mouse; a sheet's close is placed by the
// sheet), and `description`, the dialog's sentence of what this is about, 4
// under them, kept out of the close's column (its 28 and the 12 beside it; 48
// on a phone) so it never runs on under the button. What follows is the body.
//
// `header` replaces the eyebrow and title when the head is more than that (the
// plans' larger title, a caregiver's avatar); it is handed the Title to use,
// and the close stays in the corner.
// With a mouse, a field in it reaches 12 into the padding on each side
// (FIELD_OUT), so its label and the text in it, which sit 12 inside the field,
// start where the title does (docs/patterns.md §10). Not on a phone: the
// sheet's 16 would leave the field 4 from the screen's edge.
//
// `className` reaches the dialog's own box (a width, a gap), and on a phone the
// part that scrolls; `closeClassName` moves the close on a phone, to sit level
// with a head of another height.
const FIELD_OUT = '[&_[data-slot=field]]:-mx-3 [&_[data-slot=field]]:w-[calc(100%+24px)]';

export default function Dialog({
  title,
  eyebrow,
  description,
  header,
  wide,
  className,
  closeClassName,
  dismissible = true,
  open = true,
  onClose,
  children,
}) {
  const phone = useIsPhone();
  const sheet = useCloseThreshold();
  const onOpenChange = (next) => !next && onClose?.();
  const head = (Title, close) =>
    header ? (
      header(Title)
    ) : (
      <div data-slot="dialog-head" className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <DialogHeader className={cn('min-w-0 flex-1', close && 'pr-0')}>
            {eyebrow && <DialogEyebrow>{eyebrow}</DialogEyebrow>}
            <Title>{title}</Title>
          </DialogHeader>
          {close}
        </div>
        {description && <DialogDescription className="pr-10 phone:pr-12">{description}</DialogDescription>}
      </div>
    );

  if (phone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} dismissible={dismissible} closeThreshold={sheet.threshold}>
        <DrawerContent ref={sheet.ref} kind="dialog" bodyClassName={className} tabIndex={-1} onOpenAutoFocus={focusPane}>
          {/* the head, with the part a finger drags the sheet by laid over it */}
          <div className="relative">
            {dismissible && <DrawerHandle />}
            <div className="pointer-events-none relative">{head(DrawerTitle)}</div>
          </div>
          {dismissible && (
            <DrawerClose className={cn(paneCloseClass, 'absolute top-[22px] right-4 z-3', closeClassName)}>
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
        className={cn(FIELD_OUT, className)}
        tabIndex={-1}
        showCloseButton={dismissible && Boolean(header)}
        onOpenAutoFocus={focusPane}
        onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
        onPointerDownOutside={(e) => !dismissible && e.preventDefault()}
      >
        {head(
          DialogTitle,
          dismissible && (
            <DialogClose className={cn(paneCloseClass, 'shrink-0')}>
              <X className="size-4" strokeWidth={1.75} />
              <span className="sr-only">Zatvori</span>
            </DialogClose>
          )
        )}
        {children}
      </DialogContent>
    </DialogRoot>
  );
}
