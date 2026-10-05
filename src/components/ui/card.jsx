import * as React from "react"
import { cn } from "@/lib/utils"

// shadcn's card as NANA's one card (docs/patterns.md §5): white, 24px
// corners, 16 inside, 8 between its parts, and the card's hairline-and-lift
// shadow rather than a border. There is no other card.
//
// The header is the title with, to its right, a status or an icon button
// (`CardAction`). On a phone the title takes the line it needs, and what is
// beside it drops under it, 8 lower, when the two do not fit.
// The footer is the card's buttons, bottom left, at their natural width; on a
// phone they share the card's width.

function Card({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-2 rounded-3xl bg-card p-4 text-card-foreground shadow-card",
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
        "flex items-center gap-2 phone:flex-wrap phone:gap-y-2 phone:[&>:first-child]:max-w-full phone:[&>:first-child]:flex-[1_0_auto]",
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
      className={cn("flex items-center gap-2 text-sm font-medium text-foreground", className)}
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
      className={cn("text-xs leading-body text-muted-foreground", className)}
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
      className={cn("ml-auto flex shrink-0 items-center gap-2 phone:ml-0", className)}
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
      className={cn("mt-2 flex gap-2 phone:flex-wrap phone:[&>*]:flex-auto", className)}
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
