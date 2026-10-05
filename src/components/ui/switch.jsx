import * as React from "react"
import { cn } from "@/lib/utils"
import { Switch as SwitchPrimitive } from "radix-ui"

// shadcn's switch at NANA's measure: a 40×24 track with 4px around a 16px
// knob, grey when off and the primary when on. No border — shadcn's
// transparent one would add a pixel on every side of a track that is sized
// to the knob.
function Switch({
  className,
  size = "default",
  ...props
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-55 data-[size=default]:h-6 data-[size=default]:w-10 data-[size=sm]:h-5 data-[size=sm]:w-8 data-[state=checked]:bg-primary data-[state=unchecked]:bg-(--surface-elevated-4)",
        className
      )}
      {...props}>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-transform duration-200 group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-[state=unchecked]:translate-x-0 group-data-[size=default]/switch:data-[state=checked]:translate-x-4 group-data-[size=sm]/switch:data-[state=checked]:translate-x-3"
        )} />
    </SwitchPrimitive.Root>
  );
}

export { Switch }
