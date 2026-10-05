import { cn } from "@/lib/utils"

// shadcn's empty state as NANA's empty page (docs/patterns.md §5): a grey
// panel, 24 corners, 32 by 24 inside, centred: a title (a card's title, 14),
// a sentence (at most 380 wide) and one action, 8 apart, and 8 more under
// the sentence.

function Empty({
  className,
  ...props
}) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex flex-col items-center gap-2 rounded-3xl bg-muted px-6 py-8 text-center",
        className
      )}
      {...props} />
  );
}

function EmptyTitle({
  className,
  ...props
}) {
  return (
    <p
      data-slot="empty-title"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props} />
  );
}

function EmptyDescription({
  className,
  ...props
}) {
  return (
    <p
      data-slot="empty-description"
      className={cn("mb-2 max-w-[380px] text-xs leading-body text-muted-foreground", className)}
      {...props} />
  );
}

export { Empty, EmptyTitle, EmptyDescription }
