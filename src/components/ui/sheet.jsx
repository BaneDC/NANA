"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { paneCloseClass } from "@/components/ui/dialog"

// shadcn's sheet as NANA's drawer (docs/patterns.md §7): the details of
// something on the page, beside it. It floats 12 off the screen's edges,
// 432 wide (520 `wide`), 24 corners, the container shadow, over a dimmed and
// slightly blurred page. It arrives from 28 to the right on a spring
// (`ease-spring-pane`) and leaves on a short curve.
//
// The header is the eyebrow and title with the square close beside them, over
// a hairline. `SheetBody` is ours: the part that scrolls. The footer is the
// row of buttons at the end of the body, pinned to the bottom under a
// hairline. On a phone the same header, body and footer sit in a bottom sheet
// (`Drawer`).

function Sheet({
  ...props
}) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  className,
  ...props
}) {
  return (
    <SheetPrimitive.Close data-slot="sheet-close" className={cn(paneCloseClass, className)} {...props}>
      <XIcon className="size-4" strokeWidth={1.75} />
      <span className="sr-only">Zatvori panel</span>
    </SheetPrimitive.Close>
  );
}

function SheetPortal({
  ...props
}) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-20 bg-[rgba(42,42,42,0.3)] backdrop-blur-[2px] transition-none duration-180 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props} />
  );
}

function SheetContent({
  className,
  children,
  wide = false,
  ...props
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        aria-describedby={undefined}
        className={cn(
          "fixed inset-y-3 right-3 z-20 flex flex-col transition-none overflow-hidden rounded-3xl bg-card shadow-container outline-none",
          wide ? "w-[min(520px,calc(100%-24px))]" : "w-[min(432px,calc(100%-24px))]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-7 data-[state=open]:duration-430 data-[state=open]:ease-spring-pane",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-5 data-[state=closed]:duration-160 data-[state=closed]:ease-in",
          className
        )}
        {...props}>
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

// on a phone the title sits level with the middle of the 44 close
function SheetHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("relative flex shrink-0 items-start gap-2 border-b px-4 pt-4 pb-3 phone:items-center phone:pt-6", className)}
      {...props} />
  );
}

function SheetEyebrow({
  className,
  ...props
}) {
  return (
    <p
      data-slot="sheet-eyebrow"
      className={cn("text-small text-primary", className)}
      {...props} />
  );
}

function SheetBody({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4", className)}
      {...props} />
  );
}

function SheetFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "sticky -bottom-4 z-1 -mx-4 mt-auto -mb-4 flex shrink-0 justify-end gap-2 border-t bg-card px-4 py-3",
        className
      )}
      {...props} />
  );
}

function SheetTitle({
  className,
  ...props
}) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props} />
  );
}

function SheetDescription({
  className,
  ...props
}) {
  return (
    <p
      data-slot="sheet-description"
      className={cn("text-xs leading-body text-muted-foreground", className)}
      {...props} />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetEyebrow,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
