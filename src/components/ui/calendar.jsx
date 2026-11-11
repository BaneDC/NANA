"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { enGB, fi, srLatn } from "react-day-picker/locale"
import { getLang } from "@/i18n"
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIsPhone } from "@/hooks/use-phone"
import { OptionSheet } from "@/components/OptionSheet"

// the day picker speaks the app's language
const LOCALES = { sr: srLatn, en: enGB, fi }

// shadcn's calendar (react-day-picker) as NANA's, in the app's language, weeks from
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
      locale={LOCALES[getLang()] || srLatn}
      weekStartsOn={1}
      showOutsideDays={false}
      className={cn("w-full", className)}
      classNames={{
        months: "relative flex flex-col",
        month: "flex flex-col gap-2",
        month_caption: "flex h-9 items-center justify-center px-10 pointer-coarse:h-11 pointer-coarse:px-12",
        caption_label: "text-xs font-medium text-foreground",
        // month and year as two dropdowns (`captionLayout="dropdown"`, a date of
        // birth): our Select (CalendarDropdown below), never the browser's own
        // the two fill the row between the arrows, the month wider (decided 11. 11.)
        dropdowns: "flex h-9 w-full items-center gap-2 pointer-coarse:h-11 [&>button:first-of-type]:flex-[3] [&>button:last-of-type]:flex-[2]",
        // the arrows lie over the caption; only they take a press, so the month
        // and year dropdowns under the same row stay clickable
        nav: "pointer-events-none absolute inset-x-0 top-0 z-1 flex items-center justify-between [&>button]:pointer-events-auto",
        button_previous: navButton,
        button_next: navButton,
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "flex h-9 flex-1 items-center justify-center text-small font-normal text-muted-foreground",
        week: "flex",
        // the cell holds its height with no day in it, so a sixth week of
        // nothing (`fixedWeeks`) is as tall as the others
        day: "flex h-9 flex-1 justify-center p-0 pointer-coarse:h-11",
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
        Dropdown: CalendarDropdown,
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

// A sheet the calendar sits in can show the month's or the year's list in its
// own place, with a way back, instead of a second sheet over it (the date's
// sheet, decided 11. 11.): it gives `open({ label, options, value, onPick })`.
const CalendarPick = React.createContext(null)

export { Calendar, CalendarPick }

// The month or the year, as every list here is chosen: shadcn's Select, not the
// browser's (docs/patterns.md §10). DayPicker hands its options and expects a
// change event back.
// a month starts with a capital, as in the caption (docs/patterns.md §10)
const cap = (x) => (typeof x === "string" ? x.charAt(0).toUpperCase() + x.slice(1) : x)

function CalendarDropdown({ options = [], value, onChange, "aria-label": label }) {
  const chosen = options.find((o) => o.value === value)
  const phone = useIsPhone()
  const pick = React.useContext(CalendarPick)
  const [open, setOpen] = React.useState(false)
  const choices = options.map((o) => ({ value: o.value, label: cap(o.label), disabled: o.disabled }))
  const choose = (v) => onChange?.({ target: { value: String(v) } })
  // on a phone the list opens in a sheet over the calendar's (OptionSheet,
  // docs/patterns.md §10, decided 10. 11.), the year a list of a hundred
  if (phone)
    return (
      <>
        <button
          type="button"
          aria-label={label}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => (pick ? pick.open({ label, options: choices, value, onPick: choose }) : setOpen(true))}
          className="flex h-11 min-w-0 cursor-pointer items-center justify-between gap-1 rounded-lg border border-input bg-background px-3 text-[16px] leading-6 text-foreground outline-none focus-visible:border-primary"
        >
          <span className="truncate">{cap(chosen?.label)}</span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        </button>
        {!pick && <OptionSheet open={open} onOpenChange={setOpen} title={label} options={choices} value={value} onPick={choose} />}
      </>
    )
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange?.({ target: { value: v } })}
    >
      <SelectTrigger aria-label={label} className="h-8 min-w-0 justify-between gap-1 px-2 pointer-coarse:h-11">
        <SelectValue>{cap(chosen?.label)}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((o) => (
          <SelectItem key={o.value} value={String(o.value)} disabled={o.disabled}>
            {cap(o.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
