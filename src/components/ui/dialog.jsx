import * as React from "react"
import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

// shadcn's dialog as NANA's modal (docs/patterns.md §7): an action asked in
// the middle of the page. 440 wide (560 `wide`), 24 inside and 24 corners,
// its parts 12 apart, over a dimmed and slightly blurred page. It arrives on
// a spring (`ease-spring-dialog`) from a little below and a little smaller.
// The footer is the row of buttons, bottom right, pinned to the bottom while a
// long content scrolls. On a phone the same parts sit in a bottom sheet
// (`Drawer`), which is why every part also says what it does there.

// the square close every pane has: 28, 44 under a finger
const paneCloseClass =
  "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-(image:--gradient-secondary) text-foreground shadow-button transition-[filter] duration-150 outline-none hover:brightness-97 focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:size-11"

function Dialog({
  ...props
}) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-20 bg-[rgba(42,42,42,0.35)] backdrop-blur-[2px] transition-none duration-180 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props} />
  );
}

function DialogContent({
  className,
  children,
  wide = false,
  showCloseButton = true,
  ...props
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        aria-describedby={undefined}
        className={cn(
          // centred by its margins rather than shadcn's translate(-50%): half of an
          // odd height is half a pixel, and a box on half a pixel blurs its text.
          // No transitions: the animation's duration would otherwise set one on
          // everything, and a dialog that changes width (the message, then the
          // plans) grew into it instead of jumping
          "fixed inset-0 z-20 m-auto flex h-fit transition-none max-h-[calc(100%-48px)] w-[calc(100%-48px)] flex-col gap-3 overflow-y-auto rounded-3xl bg-card p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)] outline-none",
          wide ? "max-w-[560px]" : "max-w-[440px]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.96] data-[state=open]:slide-in-from-bottom-3 data-[state=open]:duration-490 data-[state=open]:ease-spring-dialog",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98] data-[state=closed]:slide-out-to-bottom-2 data-[state=closed]:duration-180",
          className
        )}
        {...props}>
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(paneCloseClass, "absolute top-3 right-3")}>
            <XIcon className="size-4" strokeWidth={1.75} />
            <span className="sr-only">Zatvori</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

// the eyebrow (the area, in the primary) over the title; clear of the close
function DialogHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col pr-9 phone:pt-2 phone:pr-12", className)}
      {...props} />
  );
}

function DialogEyebrow({
  className,
  ...props
}) {
  return (
    <p
      data-slot="dialog-eyebrow"
      className={cn("text-small text-primary", className)}
      {...props} />
  );
}

function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props} />
  );
}

function DialogDescription({
  className,
  ...props
}) {
  return (
    <p
      data-slot="dialog-description"
      className={cn("text-xs leading-body text-muted-foreground", className)}
      {...props} />
  );
}

// Secondary first, the main action last, bottom right. Pinned to the bottom:
// with a mouse it sits in the dialog's 24 of padding; on a phone (a sheet) it
// is a bar under a hairline.
function DialogFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "sticky -bottom-6 z-1 -mx-6 -mt-2 -mb-6 flex justify-end gap-2 bg-card px-6 pt-3 pb-6",
        "phone:-bottom-4 phone:-mx-4 phone:mt-auto phone:-mb-4 phone:border-t phone:px-4 phone:py-3",
        className
      )}
      {...props} />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogEyebrow,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  paneCloseClass,
}
