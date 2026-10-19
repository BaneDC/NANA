import { createContext, useContext, useId, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronsUpDown, Eye, EyeOff } from 'lucide-react';
import { FieldDescription, FieldError as FieldErrorRoot, FieldLabel, Field as FieldRoot } from '@/components/ui/field';
import { Input as InputBox } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { longDate } from '../data/familyCare';
import { t } from '../i18n';

// The one text field (docs/patterns.md §10), built from shadcn's Field, Input,
// InputGroup, Textarea and Select. Every form in the app uses it — settings,
// the profile, the caregiver's forms, sign-up — so a field looks and behaves
// the same wherever someone meets it.
//
// `Field` is the label over the control and the hint under it, both in 12 from
// the edge, where the text in the field starts. The control inside takes the
// field's id, so the label points at it. `onChange` hands back the value, not
// the event.
//
// `error`, as shadcn does it (docs/patterns.md §10, "Greške u poljima"): the
// field is `data-invalid` (its label goes red), the control `aria-invalid` (its
// edge goes red) and described by the error, which stands under it in the
// hint's place. Shown only once a press has asked for it (`useCheck`).

const FieldId = createContext(undefined);
const FieldState = createContext({ invalid: false, describedBy: undefined });

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
      <FieldId.Provider value={id}>
        <FieldState.Provider value={{ invalid: Boolean(error), describedBy: error ? errorId : undefined }}>{children}</FieldState.Provider>
      </FieldId.Provider>
      {error ? <FieldError id={errorId}>{error}</FieldError> : hint && <FieldDescription>{hint}</FieldDescription>}
    </FieldRoot>
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
export function Select({ value, onChange, options, placeholder = t('Izaberite'), labelledBy, ariaLabel, bare, className }) {
  const id = useContext(FieldId);
  const state = useContext(FieldState);
  const chosen = options.find((o) => o.value === value);
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

// A day, picked from a calendar rather than typed: the field shows it as it is
// said ("1. novembra 2026") with the calendar at its end, and opens a month
// under its right end, where the calendar icon is, half its width, on the day
// chosen or the first that can be. `from` and `to` are the first and last days that can be chosen (Dates); `today` is the day marked as
// today (the prototype's own, which is not the clock's), `from` if not given.
// Picking a day closes it.
// `pickYear`: month and year as dropdowns, for a date years back (a date of
// birth). People pick the day first, then the month and the year, so a day
// only marks the date and does not close: the day marked goes along when the
// month or year changes, and nothing is kept until "Potvrdi" (docs/patterns.md §10).
export function DateInput({ value, onChange, from, to, today = from, pickYear, placeholder = t('Izaberite datum'), ariaLabel, autoFocus, className }) {
  const id = useContext(FieldId);
  const state = useContext(FieldState);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [month, setMonth] = useState(null);
  const toggle = (on) => {
    if (on) {
      setDraft(value ?? null);
      setMonth(value ?? today ?? from);
    }
    setOpen(on);
  };
  // the same day in the month now shown, or its last if it has fewer
  const moveTo = (m) => {
    setMonth(m);
    if (draft) setDraft(new Date(m.getFullYear(), m.getMonth(), Math.min(draft.getDate(), new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate())));
  };
  return (
    <Popover open={open} onOpenChange={toggle}>
      <PopoverTrigger asChild>
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
          <span className="min-w-0 flex-1 truncate">{value ? longDate(value) : placeholder}</span>
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end">
        {pickYear ? (
          <>
            <Calendar
              mode="single"
              captionLayout="dropdown"
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
            <div className="flex gap-2 p-1 pt-2 [&>*]:flex-1">
              <Button
                onClick={() => {
                  if (draft) onChange(draft);
                  setOpen(false);
                }}
              >
                {t('Potvrdi')}
              </Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                {t('Otkaži')}
              </Button>
            </div>
          </>
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
      </PopoverContent>
    </Popover>
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
export function Phone({ country, onCountry, value, onChange, labelledBy, placeholder = '40 123 4567' }) {
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
export function Combobox({ value, onChange, groups, placeholder = t('Izaberite'), searchPlaceholder = t('Pretraga'), empty = t('Nema rezultata.') }) {
  const id = useContext(FieldId);
  const state = useContext(FieldState);
  const [open, setOpen] = useState(false);
  const chosen = groups.flatMap((g) => g.options).find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" id={id} role="combobox" aria-expanded={open} data-placeholder={chosen ? undefined : ''} {...invalidOf(state)} className={listTrigger}>
          <span className="min-w-0 flex-1 truncate">{chosen ? chosen.label : placeholder}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-2">
        <Command>
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
      </PopoverContent>
    </Popover>
  );
}

// Several from a list, with a search, "Izaberi sve" and "Zatvori", as the
// platform's own languages field: a box beside each, the chosen named in the
// field. Kept in this file with the other fields (docs/patterns.md §10).
export function MultiCombobox({ values, onChange, options, placeholder = t('Izaberite'), searchPlaceholder = t('Pretraga'), empty = t('Nema rezultata.') }) {
  const id = useContext(FieldId);
  const state = useContext(FieldState);
  const [open, setOpen] = useState(false);
  const all = values.length === options.length;
  const toggle = (v) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  const shown = options.filter((o) => values.includes(o.value)).map((o) => o.label);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" id={id} role="combobox" aria-expanded={open} data-placeholder={shown.length ? undefined : ''} {...invalidOf(state)} className={listTrigger}>
          <span className="min-w-0 flex-1 truncate">{shown.length ? shown.join(', ') : placeholder}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-2">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{empty}</CommandEmpty>
            <CommandGroup className="p-0">
              <CommandItem value={t('Izaberi sve')} onSelect={() => onChange(all ? [] : options.map((o) => o.value))}>
                <Checkbox checked={all} tabIndex={-1} className="pointer-events-none" />
                {t('Izaberi sve')}
              </CommandItem>
              {options.map((o) => (
                <CommandItem key={o.value} value={o.label} onSelect={() => toggle(o.value)}>
                  <Checkbox checked={values.includes(o.value)} tabIndex={-1} className="pointer-events-none" />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="mt-2 border-t pt-2">
          <Button type="button" variant="ghost" className="w-full" onClick={() => setOpen(false)}>
            {t('Zatvori')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
