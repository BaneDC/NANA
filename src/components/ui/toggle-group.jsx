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
// there is more (docs/patterns.md §12). How much of the next chip shows depends
// on the screen and the language, so the side that has more also fades, the
// last 32 px going to nothing: on the right while there is more to come, on the
// left once some has gone by, and none when it all fits. A form's choices keep
// wrapping: all of them should be seen at once.

const ToggleGroupContext = React.createContext({ size: "default" })

// as wide as what holds it and the 16 on each side; `!` because a page makes
// each of its children `w-full` (Page, src/components/page.jsx), which would
// keep the row to the column and the right end 16 short of the screen's edge
const scrollRow =
  "phone:-mx-4 phone:w-[calc(100%+2rem)]! phone:max-w-none! phone:-my-1 phone:shrink-0 phone:self-stretch phone:flex-nowrap phone:overflow-x-auto phone:scroll-px-4 phone:px-4 phone:py-1 phone:[scrollbar-width:none] phone:[&>*]:shrink-0 phone:[&::-webkit-scrollbar]:hidden " +
  "phone:data-[fade=end]:[mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)] " +
  "phone:data-[fade=start]:[mask-image:linear-gradient(to_left,#000_calc(100%-32px),transparent)] " +
  "phone:data-[fade=both]:[mask-image:linear-gradient(to_right,transparent,#000_32px,#000_calc(100%-32px),transparent)]"

// which ends of a scrolling row have more past them
function useFade(on) {
  const [row, setRow] = React.useState(null)
  const [fade, setFade] = React.useState(undefined)
  React.useEffect(() => {
    if (!on || !row) return undefined
    const measure = () => {
      const start = row.scrollLeft > 1
      const end = row.scrollLeft + row.clientWidth < row.scrollWidth - 1
      setFade(start && end ? "both" : start ? "start" : end ? "end" : undefined)
    }
    measure()
    row.addEventListener("scroll", measure, { passive: true })
    const watch = new ResizeObserver(measure)
    watch.observe(row)
    return () => {
      row.removeEventListener("scroll", measure)
      watch.disconnect()
    }
  }, [on, row])
  return [setRow, fade]
}

function ToggleGroup({
  className,
  size,
  scroll = false,
  children,
  ...props
}) {
  const [setRow, fade] = useFade(scroll)
  return (
    <ToggleGroupPrimitive.Root
      ref={scroll ? setRow : undefined}
      data-slot="toggle-group"
      data-size={size}
      data-fade={fade}
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
