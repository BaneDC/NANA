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
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { useIsPhone } from '@/hooks/use-phone';
import { focusPane } from '../lib/sheet';

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
// A dialog closes on its X, Escape or a click past it; a button that only
// closes it ("Nazad", "Otkaži" beside the X) is not added (decided 11. 11.,
// docs/patterns.md §7). `confirm`: a question with two answers (call a visit
// off, end the work, decline a version), where going back is one of the
// answers: no X, and a click past it does nothing; Escape is still "no".
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
// A field in it keeps to the padding: its label and its edge start where the
// title does (docs/patterns.md §10).
//
// `className` reaches the dialog's own box (a width, a gap), and on a phone the
// part that scrolls; `closeClassName` moves the close on a phone, to sit level
// with a head of another height.

export default function Dialog({
  title,
  eyebrow,
  description,
  header,
  wide,
  className,
  closeClassName,
  dismissible = true,
  confirm = false,
  open = true,
  onClose,
  children,
}) {
  const phone = useIsPhone();
  const closable = dismissible && !confirm;
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
      <Drawer open={open} onOpenChange={onOpenChange} dismissible={closable}>
        <DrawerContent kind="dialog" bodyClassName={className} head={head(DrawerTitle)}>
          {closable && (
            <DrawerClose className={cn(paneCloseClass, 'absolute top-[30px] right-4 z-3', closeClassName)}>
              <X className="size-4" strokeWidth={1.75} />
              <span className="sr-only">{t('Zatvori')}</span>
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
        className={className}
        tabIndex={-1}
        showCloseButton={false}
        onOpenAutoFocus={focusPane}
        onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
        onPointerDownOutside={(e) => !closable && e.preventDefault()}
      >
        {/* the head stays while a long body scrolls under it, as the footer
            does at the bottom and as a sheet's head does on a phone; its 12
            underneath covers what passes beneath it, and gives back the gap */}
        <div data-slot="dialog-sticky-head" className="sticky -top-6 z-2 -mx-6 -mt-6 -mb-3 bg-card px-6 pt-6 pb-3">
          {head(
            DialogTitle,
            closable && !header && (
              <DialogClose className={cn(paneCloseClass, 'shrink-0')}>
                <X className="size-4" strokeWidth={1.75} />
                <span className="sr-only">{t('Zatvori')}</span>
              </DialogClose>
            )
          )}
          {/* a head of its own keeps the close in the corner, inside the part
              that stays */}
          {closable && header && (
            <DialogClose className={cn(paneCloseClass, 'absolute top-3 right-3')}>
              <X className="size-4" strokeWidth={1.75} />
              <span className="sr-only">{t('Zatvori')}</span>
            </DialogClose>
          )}
        </div>
        {children}
      </DialogContent>
    </DialogRoot>
  );
}
