"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { cn } from "@/lib/utils"

// shadcn's drawer as NANA's bottom sheet: on a phone every pane is one
// (docs/patterns.md §12), the drawer's details and the dialog's action alike.
// Up from the bottom edge, as tall as what it holds and at most to 48 under
// the top of the screen, top corners 24, the grip (36×4) on top.
//
// On Base UI's Drawer, as shadcn's is now (it was vaul, which is no longer
// maintained and on Android let go of a drag halfway, refused one that began a
// hair up, and kept the sheet at a height measured under the keyboard). The
// sheet is dragged down from anywhere on it: where what is under the finger
// scrolls, it scrolls first, and the sheet comes down once it is at its top.
// It closes as Base UI closes it: let go past half its height, or on a quick
// flick; let go sooner, it goes back. Base UI's keyboard provider keeps the field being
// typed in clear of the keyboard.
//
// `dismissible={false}` takes away the close, Escape, a press past it and the
// drag: backup codes are shown once.
//
// `layerClassName` reaches the dim and the layer the sheet sits in (a z-index
// over the onboarding, which sits at 60).
//
// `kind`: a "sheet" holds a header and a body that scrolls (the drawer's
// parts); a "dialog" scrolls as a whole, 16 inside (the dialog's parts).
// Either way the sheet itself never scrolls.

const FIELD = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
const ALERT = '[role="alert"]'

const DrawerContext = React.createContext({ dismissible: true })

function Drawer({ open, onOpenChange, dismissible = true, children }) {
  return (
    <DrawerContext.Provider value={{ dismissible }}>
      <DrawerPrimitive.Root
        open={open}
        swipeDirection="down"
        disablePointerDismissal={!dismissible}
        onOpenChange={(next, details) => {
          if (!next && !dismissible) {
            details.cancel()
            return
          }
          onOpenChange?.(next)
        }}
      >
        <DrawerPrimitive.VirtualKeyboardProvider>{children}</DrawerPrimitive.VirtualKeyboardProvider>
      </DrawerPrimitive.Root>
    </DrawerContext.Provider>
  )
}

function DrawerClose({ ...props }) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

// What the sheet focuses as it opens: a field that asked for it (autoFocus,
// which TextField marks as data-autofocus), or else the sheet itself, so that no
// button inside it starts out ringed as if it had been tabbed to.
function initialFocusOf(popup) {
  return () => popup.current?.querySelector("[data-autofocus]") || popup.current
}

function DrawerContent({
  className,
  bodyClassName,
  layerClassName = "z-20",
  overlayClassName,
  children,
  kind = "sheet",
  ...props
}) {
  const { dismissible } = React.useContext(DrawerContext)
  const popup = React.useRef(null)
  // the sheet as state too, so what watches it starts once it has mounted
  const [sheet, setSheet] = React.useState(null)
  const setPopup = React.useCallback((node) => {
    popup.current = node
    setSheet(node)
  }, [])
  // On Android the keyboard shrinks the page (`interactive-widget=
  // resizes-content`, index.html) rather than covering it, which Base UI's
  // keyboard provider does not see: the sheet shrinks with the page and the
  // field being typed in is left behind the buttons pinned at its foot (the 2FA
  // code). It is brought back into view, above them (`scroll-pb-20`).
  // An error that comes up while typing (a wrong 2FA code) is brought into view
  // the same way: under the field, it was behind those buttons until the
  // keyboard went.
  React.useEffect(() => {
    if (!sheet) return undefined
    let frame = 0
    const reveal = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const field = document.activeElement
        if (field?.matches?.(FIELD) && sheet.contains(field)) field.scrollIntoView({ block: "nearest" })
        for (const alert of sheet.querySelectorAll(ALERT)) alert.scrollIntoView({ block: "nearest" })
      })
    }
    const onChange = (records) => {
      const added = records.some((r) => [...r.addedNodes].some((n) => n.nodeType === 1 && (n.matches(ALERT) || n.querySelector(ALERT))))
      if (added) reveal()
    }
    const watch = new MutationObserver(onChange)
    watch.observe(sheet, { childList: true, subtree: true })
    window.addEventListener("resize", reveal)
    return () => {
      cancelAnimationFrame(frame)
      watch.disconnect()
      window.removeEventListener("resize", reveal)
    }
  }, [sheet])
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop
        data-slot="drawer-overlay"
        className={cn(
          "fixed inset-0 bg-[rgba(42,42,42,0.3)] backdrop-blur-[2px]",
          kind === "dialog" && "bg-[rgba(42,42,42,0.35)]",
          // dims less as the sheet is dragged down, and fades with it
          "opacity-[calc(1-var(--drawer-swipe-progress,0))] transition-opacity duration-240 ease-[cubic-bezier(0.22,0.61,0.36,1)] data-starting-style:opacity-0 data-ending-style:opacity-0 data-swiping:duration-0",
          layerClassName,
          overlayClassName
        )}
      />
      <DrawerPrimitive.Viewport data-slot="drawer-viewport" className={cn("fixed inset-0 flex items-end", layerClassName)}>
        <DrawerPrimitive.Popup
          ref={setPopup}
          data-slot="drawer-content"
          data-kind={kind}
          initialFocus={initialFocusOf(popup)}
          className={cn(
            "group/drawer-content relative flex w-full max-h-[calc(100%-48px-env(safe-area-inset-top,0px))] flex-col overflow-hidden rounded-t-3xl bg-card shadow-container outline-none",
            kind === "sheet" && "pb-[env(safe-area-inset-bottom,0px)]",
            // follows the finger, and slides in and out from the bottom edge
            "[transform:translateY(var(--drawer-swipe-movement-y,0px))] transition-transform duration-240 ease-[cubic-bezier(0.22,0.61,0.36,1)] data-starting-style:[transform:translateY(100%)] data-ending-style:[transform:translateY(100%)] data-swiping:duration-0",
            className
          )}
          {...(!dismissible && { "data-base-ui-swipe-ignore": "" })}
          {...props}
        >
          {/* the grip, on a strip of the sheet's top that always drags it:
              under it the body may be scrolled, where a drag would scroll */}
          <div aria-hidden="true" data-slot="drawer-grip" className="absolute inset-x-0 top-0 z-1 h-6 touch-none">
            <span className="absolute top-2 left-1/2 -ml-[18px] h-1 w-9 rounded-sm bg-neutral-300" />
          </div>
          {kind === "dialog" ? (
            <div
              data-slot="drawer-scroll"
              className={cn(
                "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain scroll-pb-20 px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]",
                bodyClassName
              )}
            >
              {children}
            </div>
          ) : (
            children
          )}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

function DrawerTitle({ className, ...props }) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  )
}

export { Drawer, DrawerClose, DrawerContent, DrawerTitle }
