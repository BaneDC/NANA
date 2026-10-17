import * as React from "react"
import { cn } from "@/lib/utils"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"
import { toggleVariants } from "@/components/ui/toggle"

// A row of chips, 8 apart and wrapping, each one a chip of its own (not
// shadcn's joined segments): the language in Settings, a filter, a service.
//
// `scroll`, for a filter (chips that choose what is shown, not an answer in a
// form): on a phone one row that scrolls sideways, out to the screen's edges
// (the 16 a page and a sheet keep), the last chip cut by the edge so it says
// there is more (docs/patterns.md §12). A form's choices keep wrapping: all of
// them should be seen at once.

const ToggleGroupContext = React.createContext({ size: "default" })

// as wide as what holds it and the 16 on each side; `!` because a page makes
// each of its children `w-full` (Page, src/components/page.jsx), which would
// keep the row to the column and the right end 16 short of the screen's edge
const scrollRow =
  "phone:-mx-4 phone:w-[calc(100%+2rem)]! phone:max-w-none! phone:-my-1 phone:shrink-0 phone:self-stretch phone:flex-nowrap phone:overflow-x-auto phone:scroll-px-4 phone:px-4 phone:py-1 phone:[scrollbar-width:none] phone:[&>*]:shrink-0 phone:[&::-webkit-scrollbar]:hidden"

function ToggleGroup({
  className,
  size,
  scroll = false,
  children,
  ...props
}) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-size={size}
      className={cn("group/toggle-group flex flex-wrap gap-2", scroll && scrollRow, className)}
      {...props}>
      <ToggleGroupContext.Provider value={{ size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  children,
  size,
  ...props
}) {
  const context = React.useContext(ToggleGroupContext)
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-size={context.size || size}
      className={cn(toggleVariants({ size: context.size || size }), className)}
      {...props}>
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem }
