"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"
import { Dialog as SheetPrimitive } from "radix-ui"

// shadcn's sheet as NANA's side pane. It floats: 12px off the screen's edges
// (8px on a phone), 24px corners, the container shadow, over a dimmed and
// slightly blurred page. The header is a title with the square close of every
// pane beside it, and the footer is the row of buttons, pinned to the bottom
// under a hairline. `SheetBody` is ours — the part between the two that
// scrolls, which shadcn leaves to each screen.

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
  ...props
}) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
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
        "fixed inset-0 z-50 bg-[rgba(42,42,42,0.3)] backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props} />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden rounded-3xl bg-card shadow-(--shadow-container) transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:duration-500",
          side === "right" &&
            "inset-y-3 right-3 w-[min(432px,calc(100%-24px))] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right max-sm:inset-y-2 max-sm:right-2 max-sm:w-[calc(100%-16px)]",
          side === "left" &&
            "inset-y-3 left-3 w-[min(432px,calc(100%-24px))] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left max-sm:inset-y-2 max-sm:left-2 max-sm:w-[calc(100%-16px)]",
          side === "top" &&
            "inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className
        )}
        {...props}>
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            className="absolute top-4 right-4 flex size-7 cursor-pointer items-center justify-center rounded-lg bg-(image:--gradient-secondary) text-foreground shadow-(--shadow-button) transition-[filter] outline-none hover:brightness-97 focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:size-11">
            <XIcon className="size-4" strokeWidth={1.75} />
            <span className="sr-only">Zatvori panel</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex shrink-0 flex-col border-b px-4 pt-4 pb-3 pr-14", className)}
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
      className={cn("mt-auto flex shrink-0 flex-wrap justify-end gap-2 border-t px-4 py-3", className)}
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
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-xs leading-[18px] text-muted-foreground", className)}
      {...props} />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
