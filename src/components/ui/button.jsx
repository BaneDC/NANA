import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"
import { Loader2 } from "lucide-react"

// shadcn's button, drawn as NANA's: the variant and size names are shadcn's,
// what they draw is ours, and every value comes from tokens.css. Heights go
// through --button-size and --chip-size, which tokens.css raises to
// 44px on a touch screen, so a finger gets the target a mouse does not need.
// Edited in place, as shadcn intends — `shadcn add button --overwrite` would
// put the stock one back.
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg text-xs whitespace-nowrap transition-[filter,background-color,opacity,scale] duration-150 outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // orange, a gradient down the face, a hairline of its own colour
        default:
          "border border-primary bg-(image:--gradient-primary) text-primary-foreground shadow-(--shadow-button) hover:brightness-105",
        // the one red: it destroys something, and red means nothing else here
        destructive:
          "border border-destructive bg-destructive text-primary-foreground shadow-(--shadow-button) hover:brightness-90 focus-visible:ring-destructive/20",
        outline:
          "border border-input bg-background text-foreground shadow-(--shadow-button) hover:bg-accent",
        // light, a grey-to-clear gradient, lifted by the same shadow as default
        secondary:
          "border border-(--surface-elevated-2) bg-(image:--gradient-secondary) text-secondary-foreground shadow-(--shadow-button) hover:brightness-98",
        ghost: "text-foreground hover:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-(--button-size) px-3",
        sm: "h-(--chip-size) gap-1.5 px-2",
        lg: "h-10 px-3 pointer-coarse:h-12",
        icon: "size-(--chip-size) pointer-coarse:size-11",
        "icon-sm": "size-6 pointer-coarse:size-11",
        "icon-lg": "size-(--button-size) pointer-coarse:size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// `loading`: while what it sent is on its way. Not `disabled` (docs/patterns.md
// §9): the button keeps its look, a spinner takes its icon's place (or comes in
// front of its words), and a second press does nothing, so nothing goes twice.
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  onClick,
  children,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }), loading && "cursor-progress [&>svg:not([data-spinner])]:hidden")}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      {...props}>
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 data-spinner="" className="size-3.5 animate-spin" strokeWidth={1.75} />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants }
