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

function Tabs({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-3", className)}
      {...props} />
  );
}

function TabsList({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-(--button-size) w-fit items-center justify-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props} />
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
        "inline-flex h-full flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm px-3 text-xs font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color,box-shadow] duration-150 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-(--shadow-button) [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props} />
  );
}

// the views not shown take no room, whatever layout the content asks for
// (there is no preflight to make [hidden] win over a display class)
function TabsContent({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className, "data-[state=inactive]:hidden")}
      {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
