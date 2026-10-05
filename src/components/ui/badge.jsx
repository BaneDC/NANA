import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// shadcn's badge as NANA's status pill: 11px, 8px corners, and a tint per
// state. `success` and `warning` are ours; shadcn has no such states.

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-lg px-2 py-1 text-[11px] leading-3 font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        // a soft tint rather than a solid fill: a status is read, not pressed
        default: "bg-(--color-primary-100) text-(--color-primary-700)",
        secondary: "bg-(--surface-elevated-4) text-muted-foreground",
        success: "bg-(--status-ok-bg) text-(--status-ok-fg)",
        warning: "bg-(--status-wait-bg) text-(--status-wait-fg)",
        destructive: "bg-(--status-no-bg) text-(--status-no-fg)",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props} />
  );
}

export { Badge, badgeVariants }
