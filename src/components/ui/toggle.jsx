"use client"
import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"
import { Toggle as TogglePrimitive } from "radix-ui"

// shadcn's toggle as NANA's chip (docs/patterns.md §1, §10): 8px corners,
// never a full pill; a neutral hairline on white, the primary's pale tint on
// hover, and the primary's hairline and tint for what is on. 44px tall under
// a finger. `sm` is the short chip of a filter row.
const toggleVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-xs text-foreground whitespace-nowrap transition-[color,background-color,border-color] duration-150 outline-none hover:border-primary-300 hover:bg-primary-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-primary data-[state=on]:bg-primary-50 data-[state=on]:font-medium data-[state=on]:text-primary-600 pointer-coarse:min-h-11 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "py-2",
        sm: "py-1 leading-body",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Toggle({
  className,
  size,
  ...props
}) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ size, className }))}
      {...props} />
  );
}

export { Toggle, toggleVariants }
