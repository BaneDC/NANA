import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"

// shadcn's input group in the same box as our field: what sits inside it — an
// icon in front, a unit or the eye of a password behind — is drawn at the
// field's own 12px, and the whole box takes the primary on focus. The field
// inside keeps the box's corners (less its line), so the browser's autofill
// tint cannot cover the box's line at the corners.

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

function InputGroup({
  className,
  ...props
}) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex w-full items-center rounded-lg border border-input bg-background transition-[border-color] duration-200 outline-none",
        "h-(--input-size) min-w-0 has-[>textarea]:h-auto",
        // Variants based on alignment.
        "has-[>[data-align=inline-start]]:[&>input]:pl-3",
        "has-[>[data-align=inline-end]]:[&>input]:pr-2",
        "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
        "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",
        // Focus state.
        "has-[[data-slot=input-group-control]:focus-visible]:border-primary",
        // a select in it (a country code) whose list is open
        "has-[[data-slot=select-trigger][data-state=open]]:border-primary",
        // Error state.
        "has-[[data-slot][aria-invalid=true]]:border-destructive",
        className
      )}
      {...props} />
  );
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-xs text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-sm [&>svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      align: {
        "inline-start":
          "order-first pl-3",
        "inline-end":
          "order-last pr-3",
        "block-start":
          "order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5 [.border-b]:pb-3",
        "block-end":
          "order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5 [.border-t]:pt-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props} />
  );
}

const inputGroupButtonVariants = cva("flex items-center gap-2 text-xs shadow-none", {
  variants: {
    size: {
      xs: "h-6 gap-1 rounded-lg px-2 has-[>svg]:px-2",
      sm: "h-8 gap-1.5 rounded-lg px-2.5 has-[>svg]:px-2.5",
      "icon-xs":
        "size-6 rounded-lg p-0 text-muted-foreground hover:text-foreground has-[>svg]:p-0",
      "icon-sm": "size-8 p-0 has-[>svg]:p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
})

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props} />
  );
}

function InputGroupText({
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props} />
  );
}

function InputGroupInput({
  className,
  ...props
}) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-[7px] border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
        className
      )}
      {...props} />
  );
}

function InputGroupTextarea({
  className,
  ...props
}) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",
        className
      )}
      {...props} />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
