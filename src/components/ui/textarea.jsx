import * as React from "react"
import { cn } from "@/lib/utils"

// shadcn's textarea in the field's box: the same hairline, corners, text and
// focus as Input, paragraph leading (24 under a finger, for 16px text). It
// opens `rows` tall and that is also the least it can be dragged to; it
// stretches downward only, and has no handle on a phone (docs/patterns.md §10).

function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[calc(var(--rows,3)*1lh+18px)] w-full min-w-0 resize-y rounded-lg border border-input bg-background px-3 py-2 text-xs leading-body text-foreground caret-primary transition-[border-color] duration-180 outline-none placeholder:text-muted-foreground focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive pointer-coarse:text-[16px] pointer-coarse:leading-6",
        className
      )}
      {...props} />
  );
}

export { Textarea }
