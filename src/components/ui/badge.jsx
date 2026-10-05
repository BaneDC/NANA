import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// shadcn's badge as NANA's status and tag (docs/patterns.md §1, §2, §6).
// A status is 20px: 11px medium, 4px corners, a tint per state; it is read,
// not pressed, so it has no hover. `tag` is the label beside a name or an
// amount ("54 € rezervisano", a service): small text, grey ground, 4px corners.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-sm px-2 py-1 whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        // for attention, not for a state: "Poklapanje · 97%", "Izmenjeno"
        default: "bg-primary-100 text-badge font-medium text-primary-700",
        // on, active, accepted
        success: "bg-success-muted text-badge font-medium text-success",
        // waiting on somebody else
        warning: "bg-warning-muted text-badge font-medium text-warning",
        // missing or declined
        destructive: "bg-destructive-muted text-badge font-medium text-destructive",
        // neutral, off
        secondary: "bg-elevated-4 text-badge font-medium text-muted-foreground",
        tag: "bg-muted text-small text-muted-foreground",
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
