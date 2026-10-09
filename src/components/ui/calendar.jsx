"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { srLatn } from "react-day-picker/locale"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// shadcn's calendar (react-day-picker) as NANA's, in Serbian, weeks from
// Monday: a month at a time, the month (with a capital) and year in the middle
// of the top row and the arrows to either side of it. It fills the width it is
// given (the field's, in a date picker), the seven days sharing it; each day
// is a 36 square in the middle of its share (44 under a finger), 8 corners inside the popover's 8 (16 = 8 + 8); today in the
// primary, the day chosen filled, the days that cannot be chosen grey. Only
// the month's own days are drawn.

function Calendar({
  className,
  classNames,
  ...props
}) {
  return (
    <DayPicker
      locale={srLatn}
      weekStartsOn={1}
      showOutsideDays={false}
      className={cn("w-full", className)}
      classNames={{
        months: "relative flex flex-col",
        month: "flex flex-col gap-2",
        month_caption: "flex h-9 items-center justify-center px-10 pointer-coarse:h-11",
        caption_label: "text-xs font-medium text-foreground",
        nav: "absolute inset-x-0 top-0 z-1 flex items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "flex h-9 flex-1 items-center justify-center text-small font-normal text-muted-foreground",
        week: "flex",
        day: "flex flex-1 justify-center p-0",
        day_button:
          "flex size-9 cursor-pointer items-center justify-center rounded-lg text-xs text-foreground tabular-nums transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:size-11 pointer-coarse:text-sm [@media(hover:hover)]:hover:bg-muted",
        today: "[&>button]:font-medium [&>button]:text-primary-600",
        selected:
          "[&>button]:bg-primary [&>button]:font-medium [&>button]:text-primary-foreground [@media(hover:hover)]:[&>button]:hover:bg-primary",
        disabled: "[&>button]:cursor-default [&>button]:text-disabled [&>button]:hover:bg-transparent",
        hidden: "invisible",
        ...classNames,
      }}
      formatters={{
        // "Avgust 2026": the month starts with a capital, as a heading does
        formatCaption: (month, options, dateLib) => {
          const text = dateLib.format(month, "LLLL y")
          return text.charAt(0).toUpperCase() + text.slice(1)
        },
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className="size-4" strokeWidth={1.75} />
          ) : (
            <ChevronRightIcon className="size-4" strokeWidth={1.75} />
          ),
      }}
      {...props} />
  );
}

const navButton =
  "flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-40 pointer-coarse:size-11 [@media(hover:hover)]:hover:bg-muted [@media(hover:hover)]:hover:text-foreground"

export { Calendar }
