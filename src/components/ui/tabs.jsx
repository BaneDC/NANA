"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

// shadcn's tabs as NANA's: two or more views of the same thing, one shown at
// a time (the care plan and its overview). A grey track as tall as a button
// (36, 44 under a finger), 4 inside, 8 corners; the chosen view a white tab
// lifted by the button's shadow, 4 corners (8 = 4 + 4). Chips (ToggleGroup)
// stay for what is chosen or filtered; tabs are for where you are
// (docs/patterns.md §10).
//
// The white tab is one piece that slides to the tab chosen (250ms, a strong
// ease-out: it moves at once and settles), the labels' colour turning with
// it, rather than one tab going out and another coming on. Not on the first
// paint, only when the choice changes; with reduced motion it simply moves.

function Tabs({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("relative flex flex-col gap-3", className)}
      {...props} />
  );
}

function TabsList({
  className,
  children,
  ...props
}) {
  const listRef = React.useRef(null)
  const [pill, setPill] = React.useState(null)

  // where the chosen tab is, read from the DOM: Radix marks it, and its width
  // follows its label (and the font, once loaded)
  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const place = () => {
      const tab = list.querySelector('[data-slot=tabs-trigger][data-state=active]')
      if (!tab) return setPill(null)
      setPill((was) => {
        const next = { x: tab.offsetLeft, w: tab.offsetWidth, moved: Boolean(was) }
        return was && was.x === next.x && was.w === next.w ? was : next
      })
    }
    place()
    const states = new MutationObserver(place)
    states.observe(list, { subtree: true, attributes: true, attributeFilter: ['data-state'] })
    const sizes = new ResizeObserver(place)
    sizes.observe(list)
    return () => {
      states.disconnect()
      sizes.disconnect()
    }
  }, [])

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(
        "relative inline-flex h-(--button-size) w-fit items-center justify-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}>
      {pill && (
        <span
          aria-hidden
          data-slot="tabs-indicator"
          className={cn(
            "pointer-events-none absolute inset-y-1 left-0 rounded-sm bg-card shadow-(--shadow-button)",
            pill.moved && "transition-[translate,width] duration-250 ease-out-strong motion-reduce:transition-none"
          )}
          style={{ translate: `${pill.x}px 0`, width: pill.w }} />
      )}
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-full flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm px-3 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors duration-250 ease-out-strong outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground [@media(hover:hover)]:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props} />
  );
}

// Every view stays mounted, so coming back finds it as it was left (scrolled
// lists, opened rows) and nothing in it plays its entrance again. The views
// not shown are laid aside rather than removed from the page (display: none
// would restart every animation inside them on the way back): invisible, out
// of the flow, no height, out of reach of a click, a Tab key or a screen
// reader. The one chosen comes in from transparent and 4px lower, 200ms; the
// one left goes at once, so the two never overlap and nothing flickers.
function TabsContent({
  className,
  forceMount = true,
  ...props
}) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      forceMount={forceMount}
      className={cn(
        "flex-1 outline-none transition-[opacity,translate] duration-200 ease-out-strong motion-reduce:transition-[opacity]",
        className,
        "data-[state=inactive]:pointer-events-none data-[state=inactive]:invisible data-[state=inactive]:absolute data-[state=inactive]:inset-x-0 data-[state=inactive]:top-0 data-[state=inactive]:h-0 data-[state=inactive]:overflow-hidden data-[state=inactive]:translate-y-1 data-[state=inactive]:opacity-0 data-[state=inactive]:duration-0"
      )}
      {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
