"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Drawer as DrawerPrimitive } from "vaul"

// shadcn's drawer (vaul) as NANA's bottom sheet: on a phone every pane is one
// (docs/patterns.md §12), the drawer's details and the dialog's action alike.
// Up from the bottom edge, as tall as what it holds and at most to 48 under
// the top of the screen, top corners 24, the grip (36×4) on top. It is dragged
// down by its head only (`handleOnly`, with `DrawerHandle` laid over the
// head), so the content scrolls under a finger.
//
// `overlayClassName` reaches the dim behind it (a z-index over the onboarding,
// which sits at 60).
//
// `kind`: a "sheet" holds a header and a body that scrolls (the drawer's
// parts); a "dialog" scrolls as a whole, 16 inside (the dialog's parts).
// Either way the sheet itself never scrolls, and vaul's strip under it (to
// show no gap when it is pulled up) is taken away: the sheet clips to its
// corners, so the strip could never show, and in a sheet that scrolled it was
// room to scroll into, white and empty.

function Drawer({
  ...props
}) {
  return <DrawerPrimitive.Root data-slot="drawer" direction="bottom" handleOnly {...props} />;
}

function DrawerTrigger({
  ...props
}) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({
  ...props
}) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({
  ...props
}) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-20 bg-[rgba(42,42,42,0.3)] backdrop-blur-[2px]",
        className
      )}
      {...props} />
  );
}

function DrawerContent({
  className,
  bodyClassName,
  overlayClassName,
  children,
  kind = "sheet",
  ...props
}) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay className={cn(kind === "dialog" && "bg-[rgba(42,42,42,0.35)]", overlayClassName)} />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        data-kind={kind}
        aria-describedby={undefined}
        className={cn(
          "group/drawer-content touch-pan-y! after:hidden! fixed inset-x-0 bottom-0 z-20 flex max-h-[calc(100%-48px-env(safe-area-inset-top,0px))] flex-col rounded-t-3xl bg-card shadow-container outline-none",
          kind === "dialog" ? "overflow-hidden" : "overflow-hidden pb-[env(safe-area-inset-bottom,0px)]",
          className
        )}
        {...props}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-2 left-1/2 z-2 -ml-[18px] h-1 w-9 rounded-sm bg-neutral-300" />
        {kind === "dialog" ? (
          <div
            data-slot="drawer-scroll"
            className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]", bodyClassName)}>
            {children}
          </div>
        ) : children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

// The part of the head a finger drags the sheet down by: laid over the head
// (which is `relative`), under its close button.
function DrawerHandle({
  className,
  ...props
}) {
  return (
    <DrawerPrimitive.Handle
      data-slot="drawer-handle"
      className={cn("absolute! inset-0 z-0 m-0! h-auto! w-auto! touch-none bg-transparent! opacity-100!", className)}
      {...props} />
  );
}

function DrawerTitle({
  className,
  ...props
}) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props} />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHandle,
  DrawerTitle,
}
