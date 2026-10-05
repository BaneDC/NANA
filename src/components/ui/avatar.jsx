"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar as AvatarPrimitive } from "radix-ui"

// shadcn's avatar as NANA's: the initials on the primary's pale ground, 8
// corners. It has no size of its own: `--avatar`, set where it stands, makes
// it as tall as the name and the line under it (docs/patterns.md §6), so it
// grows with the text under a finger. 32 when nothing sets it.

function Avatar({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-(--avatar,32px) shrink-0 overflow-hidden rounded-lg",
        className
      )}
      {...props} />
  );
}

function AvatarImage({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props} />
  );
}

function AvatarFallback({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center bg-primary-200 text-xs font-medium text-primary-700",
        className
      )}
      {...props} />
  );
}

export { Avatar, AvatarImage, AvatarFallback }
