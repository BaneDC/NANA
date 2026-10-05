"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"

// shadcn's select as NANA's dropdown, in place of the browser's: the trigger
// is the field itself (36, 44 under a finger; the chevron turns when open),
// and the list floats 4 under it (or over it, when there is no room below),
// at least as wide as the field, 16 corners, 8 inside, at most 320 tall. The
// option under the pointer or the arrows is grey; the chosen one is medium
// with a check in the primary. Arrows, Enter, Escape and typing a letter work
// as the browser's do.

function Select({
  ...props
}) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  children,
  ...props
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "group/select flex h-(--input-size) w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 text-left text-xs text-foreground transition-[border-color] duration-180 outline-none focus-visible:border-primary data-[placeholder]:text-muted-foreground pointer-coarse:text-[16px] pointer-coarse:leading-6 [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate",
        className
      )}
      {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon
          className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-180 group-data-[state=open]/select:rotate-180"
          strokeWidth={1.75} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  ...props
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position="popper"
        sideOffset={4}
        align="start"
        className={cn(
          "relative z-40 max-h-[min(320px,var(--radix-select-content-available-height))] min-w-(--radix-select-trigger-width) overflow-x-hidden overflow-y-auto rounded-2xl bg-popover text-popover-foreground shadow-container",
          className
        )}
        {...props}>
        <SelectPrimitive.Viewport className="flex flex-col p-2">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  meta,
  ...props
}) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "group/item flex min-h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg p-2 text-xs text-foreground outline-none select-none data-[highlighted]:bg-muted data-[state=checked]:font-medium pointer-coarse:min-h-11 pointer-coarse:text-sm [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}>
      <span className="min-w-0 flex-1">
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      </span>
      {meta && <span className="text-muted-foreground">{meta}</span>}
      <CheckIcon className="invisible size-3.5 text-primary-600 group-data-[state=checked]/item:visible" strokeWidth={2} />
    </SelectPrimitive.Item>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
}
