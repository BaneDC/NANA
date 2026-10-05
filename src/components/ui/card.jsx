import * as React from "react"
import { cn } from "@/lib/utils"

// shadcn's card as NANA draws it: 24px corners, 16px inside, 8px between
// its parts, and the card's own hairline-and-lift shadow rather than a border.
// The header keeps shadcn's grid, with the action (a status, most often)
// centred on the title's line and the description under both.

function Card({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-2 rounded-3xl bg-card p-4 text-card-foreground shadow-(--shadow-card)",
        className
      )}
      {...props} />
  );
}

function CardHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min items-center gap-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4",
        className
      )}
      {...props} />
  );
}

function CardTitle({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-title"
      className={cn("flex items-center gap-2 text-xs font-medium text-card-foreground [&_svg:not([class*='size-'])]:size-3.5", className)}
      {...props} />
  );
}

function CardDescription({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-description"
      className={cn("col-span-full text-xs leading-[18px] text-muted-foreground", className)}
      {...props} />
  );
}

function CardAction({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-start-1 flex justify-self-end",
        className
      )}
      {...props} />
  );
}

function CardContent({
  className,
  ...props
}) {
  return (<div data-slot="card-content" className={cn("", className)} {...props} />);
}

function CardFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-footer"
      className={cn("mt-1 flex flex-wrap items-center gap-2 [.border-t]:pt-4", className)}
      {...props} />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
