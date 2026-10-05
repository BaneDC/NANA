import * as React from "react"
import { cn } from "@/lib/utils"

// shadcn's input as NANA's field: 36px (44 under a finger, where the text is
// 16px too, or iOS zooms in on focus), a neutral-300 hairline that turns the
// primary on focus with no ring around it, 12px text and an orange caret.

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-(--input-size) w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground caret-primary transition-[border-color] duration-200 outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:text-[16px] pointer-coarse:leading-6",
        "focus-visible:border-primary",
        "aria-invalid:border-destructive",
        className
      )}
      {...props} />
  );
}

export { Input }
