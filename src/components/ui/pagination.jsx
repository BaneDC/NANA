import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// shadcn's pagination as NANA's pages (Pronađi): the arrows are square
// secondary buttons, a page number is a 28 chip (44 under a finger), 8 apart,
// and the page being read sits on the primary's pale ground. The pages are
// buttons, not links: the list changes in place, the address does not.

function Pagination({
  className,
  ...props
}) {
  return (
    <nav
      role="navigation"
      aria-label="Strane"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props} />
  );
}

function PaginationContent({
  className,
  ...props
}) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex list-none flex-row items-center gap-2", className)}
      {...props} />
  );
}

function PaginationItem({
  ...props
}) {
  return <li data-slot="pagination-item" {...props} />;
}

function PaginationLink({
  className,
  isActive,
  ...props
}) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        "flex h-(--chip-size) min-w-(--chip-size) cursor-pointer items-center justify-center rounded-lg px-2 text-xs text-muted-foreground transition-[background-color,color] duration-150 hover:bg-muted hover:text-foreground data-[active=true]:bg-primary-200 data-[active=true]:font-medium data-[active=true]:text-foreground pointer-coarse:h-11 pointer-coarse:min-w-11",
        className
      )}
      {...props} />
  );
}

function PaginationPrevious({
  ...props
}) {
  return (
    <Button variant="secondary" size="icon" aria-label="Prethodna strana" {...props}>
      <ChevronLeftIcon size={14} strokeWidth={2} />
    </Button>
  );
}

function PaginationNext({
  ...props
}) {
  return (
    <Button variant="secondary" size="icon" aria-label="Sledeća strana" {...props}>
      <ChevronRightIcon size={14} strokeWidth={2} />
    </Button>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
}
