"use client"

import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"
import { Toggle as TogglePrimitive } from "radix-ui"

// shadcn's toggle as NANA's chip: a pill, 12px text, and the primary's pale
// tint for hover and for what is on — the language, a filter, a task.
const toggleVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-xs text-foreground whitespace-nowrap transition-[color,background-color,border-color] duration-150 outline-none hover:bg-(--primary-subtle) focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-(--primary-subtle) data-[state=on]:font-medium data-[state=on]:text-(--primary-subtle-foreground) [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[13px]",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-border bg-background hover:border-(--color-primary-300) data-[state=on]:border-primary",
      },
      size: {
        default: "px-3 py-2 pointer-coarse:min-h-11",
        sm: "px-2 py-1 pointer-coarse:min-h-11",
        lg: "px-4 py-2.5 pointer-coarse:min-h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Toggle, toggleVariants }
