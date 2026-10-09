"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

// shadcn's popover as NANA's: what opens from a field and stays by it (the
// date picker's calendar). It floats 4 from its trigger like the select's
// list, half as wide as the trigger (never under the calendar's own width), 16
// corners, 8 inside, the container's shadow, over a dialog or a sheet. It grows out of the trigger, not out of its own middle: from 97% and clear,
// 150ms with a strong ease-out, and goes in 100.

function Popover({
  ...props
}) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "start",
  sideOffset = 4,
  ...props
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-40 w-[calc(var(--radix-popover-trigger-width)/2)] min-w-[268px] origin-(--radix-popover-content-transform-origin) rounded-2xl pointer-coarse:min-w-[324px] bg-popover p-2 text-popover-foreground shadow-container outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97] data-[state=open]:duration-150 data-[state=open]:ease-out-strong",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97] data-[state=closed]:duration-100",
          "motion-reduce:data-[state=open]:zoom-in-100 motion-reduce:data-[state=closed]:zoom-out-100",
          className
        )}
        {...props} />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent }
