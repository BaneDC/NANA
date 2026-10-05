import * as React from "react"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// shadcn's item as NANA's row inside a card (docs/patterns.md §6, §7): not a
// box with a border, a row. It reaches 8 into the card's padding, has 8 of
// its own on every side and 16 corners (seen only on hover), and rows are 8
// apart with a 1px line in the middle of that gap, in 8 from the edges.
//
// A row that opens something has an `ItemLink` for its name: a real button
// whose ::after stretches over the whole row, so the keyboard and a screen
// reader get one target. On hover the row goes grey, the lines beside it step
// aside, the name takes the primary's dark ink and its tags go white. Buttons
// and statuses in it sit above the stretch and do only what they say. On a
// phone an `ItemAction` (the button that says the same as the link) is gone:
// the row opens on a tap.
//
// `ItemGroup` holds the rows; last in a card, it lets its last row reach the
// card's padding too, so the hover ground is 8 from the bottom as from the side.

function ItemGroup({
  className,
  ...props
}) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn("flex flex-col gap-2 [[data-slot=card]>&:last-child]:has-[>[data-slot=item]:last-child]:-mb-2", className)}
      {...props} />
  );
}

function Item({
  className,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="item"
      className={cn(
        "group/item relative -mx-2 flex rounded-2xl p-2 transition-[background-color] duration-150",
        // the line between two rows: every row has it out of the flow, and it
        // shows only under a row before it (a ::before in the flow, on the
        // first row, pushed its content 12 to the right on hover)
        "before:absolute before:inset-x-2 before:-top-1 before:h-px before:-translate-y-1/2 before:transition-opacity before:duration-150 [[data-slot=item]+&]:before:bg-border",
        // a row that opens something
        "has-[[data-slot=item-link]]:cursor-pointer has-[[data-slot=item-link]]:hover:bg-muted has-[[data-slot=item-link]]:hover:before:opacity-0 [[data-slot=item]:has([data-slot=item-link]):hover+&]:before:opacity-0",
        "has-[[data-slot=item-link]]:hover:[&_[data-variant=tag]]:bg-card",
        "has-[[data-slot=item-link]:focus-visible]:outline-2 has-[[data-slot=item-link]:focus-visible]:outline-offset-2 has-[[data-slot=item-link]:focus-visible]:outline-primary",
        "has-[[data-slot=item-link]]:[&_[data-slot=button]]:relative has-[[data-slot=item-link]]:[&_[data-slot=button]]:z-1 has-[[data-slot=item-link]]:[&_[data-slot=badge]]:relative has-[[data-slot=item-link]]:[&_[data-slot=badge]]:z-1",
        className
      )}
      {...props} />
  );
}

function ItemContent({
  className,
  ...props
}) {
  return (
    <div
      data-slot="item-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}
      {...props} />
  );
}

function ItemTitle({
  className,
  ...props
}) {
  return (
    <div
      data-slot="item-title"
      className={cn("flex items-center gap-2 text-xs font-medium text-foreground", className)}
      {...props} />
  );
}

const linkClass =
  "cursor-pointer text-left [font:inherit] text-inherit outline-none after:absolute after:inset-0 after:rounded-[inherit]"

// the name that opens the row: its ::after covers the lot
function ItemLink({
  className,
  ...props
}) {
  return (
    <button
      type="button"
      data-slot="item-link"
      className={cn(linkClass, "group-hover/item:text-primary-700", className)}
      {...props} />
  );
}

function ItemDescription({
  className,
  ...props
}) {
  return (
    <p
      data-slot="item-description"
      className={cn("text-xs leading-body text-muted-foreground", className)}
      {...props} />
  );
}

// the button that says what the link does: gone on a phone
function ItemAction({
  className,
  ...props
}) {
  return (
    // no data-slot of its own: it would take the button's, which is what lifts
    // the button above the row's link
    <Slot.Root data-item-action="" className={cn("phone:hidden", className)} {...props} />
  );
}

export {
  linkClass,
  Item,
  ItemAction,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemLink,
  ItemTitle,
}
