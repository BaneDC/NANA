import { cloneElement, createContext, useContext, useId, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronsUpDown, Eye, EyeOff, X } from 'lucide-react';
import { FieldDescription, FieldError as FieldErrorRoot, FieldLabel, Field as FieldRoot } from '@/components/ui/field';
import { Input as InputBox } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, CalendarPick } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { paneCloseClass } from '@/components/ui/dialog';
import { useIsPhone } from '@/hooks/use-phone';
import { LONG_LIST, OptionList, OptionSheet } from './OptionSheet';
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { countryOptions } from '../data/countries';
import { longDate, marketDate } from '../data/familyCare';
import { t } from '../i18n';

// The one text field (docs/patterns.md §10), built from shadcn's Field, Input,
// InputGroup, Textarea and Select. Every form in the app uses it — settings,
// the profile, the caregiver's forms, sign-up — so a field looks and behaves
// the same wherever someone meets it.
//
// `Field` is the label over the control and the hint under it, both at the
// control's left edge (docs/patterns.md §10). The control inside takes the
// field's id, so the label points at it. `onChange` hands back the value, not
// the event.
//
// `error`, as shadcn does it (docs/patterns.md §10, "Greške u poljima"): the
// field is `data-invalid` (its label goes red), the control `aria-invalid` (its
// edge goes red) and described by the error, which stands under it in the
// hint's place. Shown only once a press has asked for it (`useCheck`).

const FieldId = createContext(undefined);
const FieldState = createContext({ invalid: false, describedBy: undefined });
// the field's label, which heads the sheet a list or a calendar opens in on a phone
const FieldTitle = createContext(undefined);

// what every control in a field takes from it
const invalidOf = (state) => (state.invalid ? { 'aria-invalid': true, 'aria-describedby': state.describedBy } : {});

export function Field({ label, required, hint, error, className, labelId, children }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <FieldRoot className={className} data-invalid={error ? true : undefined}>
      {label && (
        <FieldLabel htmlFor={id} id={labelId}>
          <span>
            {label}
            {required && <span className="text-primary-600"> *</span>}
          </span>
        </FieldLabel>
      )}
      <FieldTitle.Provider value={typeof label === 'string' ? label : undefined}>
        <FieldId.Provider value={id}>
          <FieldState.Provider value={{ invalid: Boolean(error), describedBy: error ? errorId : undefined }}>{children}</FieldState.Provider>
        </FieldId.Provider>
      </FieldTitle.Provider>
      {error ? <FieldError id={errorId}>{error}</FieldError> : hint && <FieldDescription>{hint}</FieldDescription>}
    </FieldRoot>
  );
}

// a choice in the form (docs/patterns.md §10, decided 10. 11.): one answer of
// several is a radio, several a box beside each; a row each, the whole row
// the target (44 on touch), always one under the other (decided 11. 11.).
// Yes / no, the days, the time of day and the engagement are chips.
export const choiceRow = 'flex min-h-8 cursor-pointer items-start gap-2 py-1.5 text-xs leading-5 text-foreground pointer-coarse:min-h-11 pointer-coarse:py-3';

export function Checks({ label, value, onChange, options, required, error }) {
  return (
    <Field label={label} required={required}>
      <div role="group" aria-label={label} className="flex flex-col">
        {options.map(([id, text]) => (
          <label key={id} className={choiceRow}>
            <Checkbox checked={value.includes(id)} onCheckedChange={(on) => onChange(on ? [...value, id] : value.filter((x) => x !== id))} className="mt-0.5" />
            <span className="min-w-0">{text}</span>
          </label>
        ))}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

// An error under what is not a field (a consent, a choice of services, the
// six-digit code, the onboarding's cards): the same red line, `role="alert"`.
export function FieldError({ className, children, ...rest }) {
  if (!children) return null;
  return (
    <FieldErrorRoot className={className} {...rest}>
      {children}
    </FieldErrorRoot>
  );
}

// The one thing an empty required field says, whatever it is called: its label
// is right above it.
export const requiredError = () => t('Ovo polje je obavezno.');
// a number that has to be more than nothing (a price, hours worked)
export const aboveZeroError = () => t('Unesite broj veći od nule.');

// A form's errors, shown once a press has asked for them (docs/patterns.md
// §10). `check([...errors])` is the press: true when there are none; otherwise
// they show, and the first wrong field takes the focus. `show(error)` is what
// goes under a field: nothing until then, and after it the error while there is
// one, so it goes as soon as the field is put right.
export function useCheck() {
  const [tried, setTried] = useState(false);
  return {
    tried,
    show: (error) => (tried && error) || null,
    check(errors) {
      if (!errors.some(Boolean)) return true;
      setTried(true);
      const from = document.activeElement?.closest('form, [role="dialog"], [data-slot="drawer-content"]') || document;
      // the first wrong field, or, where what is wrong is not a field (a choice
      // of services), its error brought into view
      requestAnimationFrame(() => {
        const field = from.querySelector('[aria-invalid="true"]');
        if (field) field.focus();
        else from.querySelector('[role="alert"]')?.scrollIntoView({ block: 'nearest' });
      });
      return false;
    },
    reset: () => setTried(false),
  };
}

const keys = (onEnter) => (e) => e.key === 'Enter' && onEnter?.();

// an icon in front (a search), or a unit behind (€ / h)
export function Input({ value, onChange, onEnter, icon: Icon, suffix, className, ...rest }) {
  const id = useContext(FieldId);
  const state = useContext(FieldState);
  const control = { id, value, onChange: (e) => onChange(e.target.value), onKeyDown: keys(onEnter), 'data-autofocus': rest.autoFocus || undefined, ...invalidOf(state), ...rest };
  if (!Icon && !suffix) return <InputBox className={className} {...control} />;
  return (
    <InputGroup className={className}>
      {Icon && (
        <InputGroupAddon>
          <Icon size={14} strokeWidth={1.75} />
        </InputGroupAddon>
      )}
      <InputGroupInput {...control} />
      {suffix && <InputGroupAddon align="inline-end">{suffix}</InputGroupAddon>}
    </InputGroup>
  );
}

// always with the eye, to see what was typed
export function Password({ value, onChange, onEnter, autoComplete = 'current-password', className, ...rest }) {
  const id = useContext(FieldId);
  const state = useContext(FieldState);
  const [shown, setShown] = useState(false);
  return (
    <InputGroup className={className}>
      <InputGroupInput
        id={id}
        data-autofocus={rest.autoFocus || undefined}
        type={shown ? 'text' : 'password'}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={keys(onEnter)}
        {...invalidOf(state)}
        {...rest}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? t('Sakrij lozinku') : t('Prikaži lozinku')}
        >
          {shown ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

// Stretches downward only, from the rows it opens with, which are also the
// least it can be dragged down to (§10).
export function TextArea({ value, onChange, rows = 3, className, ...rest }) {
  const id = useContext(FieldId);
  const state = useContext(FieldState);
  return (
    <Textarea
      id={id}
      data-autofocus={rest.autoFocus || undefined}
      value={value}
      rows={rows}
      style={{ '--rows': rows }}
      className={className}
      onChange={(e) => onChange(e.target.value)}
      {...invalidOf(state)}
      {...rest}
    />
  );
}

// `options` are { value, label, icon?, meta?, display? } — `display` is what the
// closed field shows when it should be shorter than the row (a country's code).
// `bare` draws the trigger without the field's box, for a Select inside
// another field (the country code in front of a phone number), behind a line.
// On a phone it opens in a bottom sheet, headed by the field's label
// (OptionSheet; docs/patterns.md §10, decided 10. 11.).
export function Select({ value, onChange, options, placeholder = t('Izaberite'), labelledBy, ariaLabel, bare, className }) {
  const id = useContext(FieldId);
  const state = useContext(FieldState);
  const label = useContext(FieldTitle);
  const phone = useIsPhone();
  const [open, setOpen] = useState(false);
  const chosen = options.find((o) => o.value === value);
  if (phone)
    return (
      <>
        <button
          type="button"
          id={id}
          aria-labelledby={labelledBy}
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          data-state={open ? 'open' : 'closed'}
          data-placeholder={chosen ? undefined : ''}
          {...(bare ? {} : invalidOf(state))}
          onClick={() => setOpen(true)}
          className={cn(listTrigger, bare && 'h-auto w-auto shrink-0 self-stretch rounded-none border-y-0 border-l-0 bg-transparent pr-2 pl-3', className)}
        >
          <span className={cn('min-w-0 truncate', !bare && 'flex-1')}>{chosen ? chosen.display ?? chosen.label : placeholder}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        </button>
        <OptionSheet open={open} onOpenChange={setOpen} title={(bare ? ariaLabel || label : label || ariaLabel) || placeholder} options={options} value={value} onPick={onChange} />
      </>
    );
  return (
    <SelectRoot value={value ?? ''} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        {...(bare ? {} : invalidOf(state))}
        className={cn(bare && 'h-auto w-auto shrink-0 self-stretch rounded-none border-y-0 border-l-0 bg-transparent pr-2 pl-3', className)}
      >
        <SelectValue placeholder={placeholder}>{chosen ? chosen.display ?? chosen.label : null}</SelectValue>
      </SelectTrigger>
      <SelectContent className={bare ? 'min-w-[280px]' : undefined}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} meta={o.meta}>
            {o.icon && <span className="mr-2 inline-flex">{o.icon}</span>}
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}

// What a field opens (a calendar, a list with a search): by the field with a
// mouse, a Popover; on a phone a bottom sheet, as every pane there is
// (docs/patterns.md §10, decided 9. 11.). By the field it ran off the screen
// on a phone, and the keyboard a search brings up left a list two rows. The
// sheet is headed by the field's label (or `title`); `tall` keeps it at its
// full height, so it does not jump while a search narrows the list.
// `closable`: a sheet whose choice is kept only on its button (the date of
// birth, a list with boxes) has the X every pane has, and only that button in
// its foot (decided 11. 11.); one where a row is the choice closes on it.
// `back`: a view inside the sheet (the month's list in the date's), with the
// way back at the head's left, where the title starts.
function FieldPane({ open, onOpenChange, trigger, title, fallback, tall, closable, back, popover, children }) {
  const phone = useIsPhone();
  const label = useContext(FieldTitle);
  if (phone)
    return (
      <>
        {cloneElement(trigger, { onClick: () => onOpenChange(true), 'data-state': open ? 'open' : 'closed' })}
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent
            kind="dialog"
            head={
              closable || back ? (
                // as tall as its buttons (44) in each view, so going in and back does not move it
                <div className="flex min-h-11 items-center gap-2">
                  {back && (
                    <Button type="button" variant="ghost" size="icon" className="-ml-3" aria-label={t('Nazad')} onClick={back.onBack}>
                      <ChevronLeft className="size-4" strokeWidth={1.75} />
                    </Button>
                  )}
                  <DrawerTitle className="min-w-0 flex-1 truncate">{back?.title || title || label || fallback}</DrawerTitle>
                  {closable && (
                    <DrawerClose className={paneCloseClass}>
                      <X className="size-4" strokeWidth={1.75} />
                      <span className="sr-only">{t('Zatvori')}</span>
                    </DrawerClose>
                  )}
                </div>
              ) : (
                <DrawerTitle>{title || label || fallback}</DrawerTitle>
              )
            }
            className={tall ? 'h-[calc(100%-48px-env(safe-area-inset-top,0px))]' : undefined}
            bodyClassName={tall ? 'min-h-0 flex-1 overflow-hidden' : undefined}
          >
            {/* the rows, days and buttons are choices, not a grip: the sheet's
                swipe took the pointer on a mouse press, and the click went to
                the sheet (12. 11.); the grip and the head still drag it */}
            <div data-base-ui-swipe-ignore="" className="contents">
              {children}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent {...popover}>{children}</PopoverContent>
    </Popover>
  );
}

// A day, picked from a calendar rather than typed: the field shows it as it is
// said ("1. novembra 2026") with the calendar at its end, and opens a month
// under its right end, where the calendar icon is, half its width, on the day
// chosen or the first that can be. `from` and `to` are the first and last days that can be chosen (Dates); `today` is the day marked as
// today (the prototype's own, which is not the clock's), `from` if not given.
// Picking a day closes it.
// `pickYear`: month and year as dropdowns, for a date years back (a date of
// birth). People pick the day first, then the month and the year, so a day
// only marks the date and does not close: the day marked goes along when the
// month or year changes, and nothing is kept until "Potvrdi", at the right of
// its foot (docs/patterns.md §10). Six weeks always, so it does not change
// height from month to month. On a phone the month opens in a bottom sheet
// (FieldPane) with an X, and the month's or the year's list opens in its place
// in that sheet, at the calendar's height, with "Nazad" in the head (decided
// 11. 11.; it was a second sheet over the first, with no way back but a pick).
// `market` ('sr' | 'fi'): the date in figures, as that market writes it
// (marketDate: 8.11.1967 / 08.11.1967.), not in words.
export function DateInput({ value, onChange, from, to, today = from, pickYear, market, placeholder = t('Izaberite datum'), title, ariaLabel, autoFocus, className }) {
  const id = useContext(FieldId);
  const state = useContext(FieldState);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [month, setMonth] = useState(null);
  const phone = useIsPhone();
  // the month's or the year's list, shown in the sheet in the calendar's place
  const [list, setList] = useState(null);
  const pane = useRef(null);
  const [height, setHeight] = useState(null);
  const pick = useMemo(
    () => ({
      open: (l) => {
        setHeight(pane.current?.offsetHeight ?? null);
        setList(l);
      },
    }),
    []
  );
  const toggle = (on) => {
    if (on) {
      setDraft(value ?? null);
      setMonth(value ?? today ?? from);
      setList(null);
    }
    setOpen(on);
  };
  // the same day in the month now shown, or its last if it has fewer
  const moveTo = (m) => {
    setMonth(m);
    if (draft) setDraft(new Date(m.getFullYear(), m.getMonth(), Math.min(draft.getDate(), new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate())));
  };
  const trigger = (
    <button
      type="button"
      id={id}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      data-autofocus={autoFocus || undefined}
      data-placeholder={value ? undefined : ''}
      {...invalidOf(state)}
      className={cn(
        'flex h-(--input-size) w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 text-left text-xs text-foreground transition-[border-color] duration-180 outline-none focus-visible:border-primary data-[placeholder]:text-muted-foreground data-[state=open]:border-primary aria-invalid:border-destructive pointer-coarse:text-[16px] pointer-coarse:leading-6',
        className
      )}
    >
      <span className="min-w-0 flex-1 truncate">{value ? (market ? marketDate(value, market) : longDate(value)) : placeholder}</span>
      <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
    </button>
  );
  const body = (
    <>
      {pickYear ? (
        <CalendarPick.Provider value={phone ? pick : null}>
          {list && (
            <div style={height ? { height } : undefined} className="flex min-h-0 flex-col">
              <OptionList
                key={list.label}
                options={list.options}
                value={list.value}
                className="min-h-0 flex-1 [&_[data-slot=command-list]]:max-h-none [&_[data-slot=command-list]]:flex-1"
                onPick={(v) => {
                  list.onPick(v);
                  setList(null);
                }}
              />
            </div>
          )}
          {/* kept while a list is shown, so the month it was on stays */}
          <div ref={pane} className={cn('flex flex-col', list && 'hidden')}>
            <Calendar
              mode="single"
              captionLayout="dropdown"
              fixedWeeks
              selected={draft ?? undefined}
              month={month ?? undefined}
              onMonthChange={moveTo}
              today={today}
              disabled={[from && { before: from }, to && { after: to }].filter(Boolean)}
              startMonth={from}
              endMonth={to}
              onSelect={(d) => d && setDraft(d)}
              autoFocus
            />
            <div className="flex justify-end p-1 pt-2">
              <Button
                onClick={() => {
                  if (draft) onChange(draft);
                  setOpen(false);
                }}
              >
                {t('Potvrdi')}
              </Button>
            </div>
          </div>
        </CalendarPick.Provider>
      ) : (
        <Calendar
          mode="single"
          selected={value ?? undefined}
          defaultMonth={value ?? today ?? from}
          today={today}
          disabled={[from && { before: from }, to && { after: to }].filter(Boolean)}
          startMonth={from}
          endMonth={to}
          onSelect={(d) => {
            if (!d) return;
            onChange(d);
            setOpen(false);
          }}
          autoFocus
        />
      )}
    </>
  );
  return (
    <FieldPane
      open={open}
      onOpenChange={toggle}
      trigger={trigger}
      title={title}
      fallback={placeholder}
      closable={pickYear}
      back={list && { title: list.label, onBack: () => setList(null) }}
      // with month and year as dropdowns 320, so "Septembar" and the year fit whole
      popover={{ align: 'end', className: pickYear ? 'w-80' : undefined }}
    >
      {body}
    </FieldPane>
  );
}

// A file, chosen and not typed (part 5, the caregiver's documents): the
// browser's file input stays hidden and our button opens it, so the field
// looks like every other button-field here. Once chosen, the name is shown
// with "Promeni" and "Ukloni". The prototype keeps only the name.
export function FileField({ value, onChange, accept = '.pdf,.jpg,.jpeg,.png', ariaLabel }) {
  const ref = useRef(null);
  const state = useContext(FieldState);
  const pick = () => ref.current?.click();
  return (
    <div className="flex flex-wrap items-center gap-2" {...invalidOf(state)}>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        aria-label={ariaLabel}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f.name);
          e.target.value = '';
        }}
      />
      {value ? (
        <>
          <span className="min-w-0 flex-1 truncate text-xs text-foreground">{value}</span>
          <Button type="button" variant="secondary" onClick={pick}>
            {t('Promeni')}
          </Button>
          <Button type="button" variant="ghost" onClick={() => onChange('')}>
            {t('Ukloni')}
          </Button>
        </>
      ) : (
        <Button type="button" variant="secondary" onClick={pick}>
          {t('Izaberite fajl')}
        </Button>
      )}
    </div>
  );
}

// A phone number: the country (flag and code) in front, behind a line, then the
// number, as one field (docs/provera-pravila.md, 5). The family's sign-up and
// the caregiver's use it.
// a mobile number as it is written in that country, for the example in the field
const PHONE_EXAMPLE = { RS: '64 123 4567', FI: '40 123 4567' };
export function Phone({ country, onCountry, value, onChange, labelledBy, placeholder = PHONE_EXAMPLE[country] ?? '40 123 4567' }) {
  const state = useContext(FieldState);
  const id = useContext(FieldId);
  return (
    <InputGroup>
      <Select bare value={country} onChange={onCountry} ariaLabel={t('Pozivni broj države')} options={countryOptions()} />
      <InputGroupInput
        id={id}
        type="tel"
        value={value}
        placeholder={placeholder}
        autoComplete="tel-national"
        aria-labelledby={labelledBy}
        {...invalidOf(state)}
        onChange={(e) => onChange(e.target.value)}
      />
    </InputGroup>
  );
}

// The trigger every list-field here has: as tall and as drawn as a Select.
const listTrigger =
  'flex h-(--input-size) w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 text-left text-xs text-foreground transition-[border-color] duration-180 outline-none focus-visible:border-primary data-[placeholder]:text-muted-foreground data-[state=open]:border-primary aria-invalid:border-destructive pointer-coarse:text-[16px] pointer-coarse:leading-6';

// One from a long list, with a search on top: shadcn's combobox (a Popover
// with a Command). `groups`: [{ label, options: [{ value, label }] }].
// in a sheet on a phone the list fills what is under the search and scrolls
// itself, the search staying on top; by the field it is as tall as it was
const paneList = 'phone:min-h-0 phone:flex-1 phone:[&_[data-slot=command-list]]:max-h-none phone:[&_[data-slot=command-list]]:flex-1';

export function Combobox({ value, onChange, groups, placeholder = t('Izaberite'), searchPlaceholder = t('Pretraga'), empty = t('Nema rezultata.') }) {
  const id = useContext(FieldId);
  const state = useContext(FieldState);
  const [open, setOpen] = useState(false);
  const chosen = groups.flatMap((g) => g.options).find((o) => o.value === value);
  return (
    <FieldPane
      open={open}
      onOpenChange={setOpen}
      tall
      fallback={placeholder}
      popover={{ align: 'start', className: 'w-(--radix-popover-trigger-width) p-2' }}
      trigger={
        <button type="button" id={id} role="combobox" aria-expanded={open} data-placeholder={chosen ? undefined : ''} {...invalidOf(state)} className={listTrigger}>
          <span className="min-w-0 flex-1 truncate">{chosen ? chosen.label : placeholder}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        </button>
      }
    >
        <Command className={paneList}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{empty}</CommandEmpty>
            {groups.map((g) => (
              <CommandGroup key={g.label || 'all'} heading={g.label} className="p-0">
                {g.options.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.label}
                    onSelect={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    <span className="flex-1">{o.label}</span>
                    {o.value === value && <Check className="size-3.5 text-primary" strokeWidth={2} />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
    </FieldPane>
  );
}

// Several from a list (docs/patterns.md §10, "Više od više u listi", decided
// 11. 11.): a box beside each; a search on top only when the list is long
// (OptionSheet's LONG_LIST). What is ticked is kept only on "Izaberi", right
// in the foot; at its left "Poništi izbor" once any is. Closed any other way,
// nothing changes. No "Izaberi sve" (12. 11., Branislav): with four languages
// nobody speaks them all, and it was easy to hit.
export function MultiCombobox({ values, onChange, options, placeholder = t('Izaberite'), searchPlaceholder = t('Pretraga'), empty = t('Nema rezultata.') }) {
  const id = useContext(FieldId);
  const state = useContext(FieldState);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(values);
  const long = options.length > LONG_LIST;
  const toggleOpen = (on) => {
    if (on) setDraft(values);
    setOpen(on);
  };
  const toggle = (v) => setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));
  const shown = options.filter((o) => values.includes(o.value)).map((o) => o.label);
  return (
    <FieldPane
      open={open}
      onOpenChange={toggleOpen}
      // a long one keeps the sheet's full height while the search narrows it
      tall={long}
      closable
      fallback={placeholder}
      popover={{ align: 'start', className: 'w-(--radix-popover-trigger-width) p-2' }}
      trigger={
        <button type="button" id={id} role="combobox" aria-expanded={open} data-placeholder={shown.length ? undefined : ''} {...invalidOf(state)} className={listTrigger}>
          <span className="min-w-0 flex-1 truncate">{shown.length ? shown.join(', ') : placeholder}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        </button>
      }
    >
        <Command className={long ? paneList : '[&_[data-slot=command-list]]:max-h-none'}>
          {long && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList>
            {long && <CommandEmpty>{empty}</CommandEmpty>}
            <CommandGroup className="p-0">
              {options.map((o) => (
                <CommandItem key={o.value} value={o.label} onSelect={() => toggle(o.value)}>
                  <Checkbox checked={draft.includes(o.value)} tabIndex={-1} className="pointer-events-none" />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="mt-2 flex items-center gap-2 border-t pt-2">
          {draft.length > 0 && (
            <Button type="button" variant="ghost" onClick={() => setDraft([])}>
              {t('Poništi izbor')}
            </Button>
          )}
          <Button
            type="button"
            className="ml-auto"
            onClick={() => {
              onChange(options.map((o) => o.value).filter((v) => draft.includes(v)));
              setOpen(false);
            }}
          >
            {t('Izaberi')}
          </Button>
        </div>
    </FieldPane>
  );
}
