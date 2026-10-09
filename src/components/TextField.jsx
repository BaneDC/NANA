import { createContext, useContext, useId, useState } from 'react';
import { CalendarDays, Eye, EyeOff } from 'lucide-react';
import { FieldDescription, FieldLabel, Field as FieldRoot } from '@/components/ui/field';
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
import { longDate } from '../data/familyCare';

// The one text field (docs/patterns.md §10), built from shadcn's Field, Input,
// InputGroup, Textarea and Select. Every form in the app uses it — settings,
// the profile, the caregiver's forms, sign-up — so a field looks and behaves
// the same wherever someone meets it.
//
// `Field` is the label over the control and the hint under it, both in 12 from
// the edge, where the text in the field starts. The control inside takes the
// field's id, so the label points at it. `onChange` hands back the value, not
// the event.

const FieldId = createContext(undefined);

export function Field({ label, required, hint, className, labelId, children }) {
  const id = useId();
  return (
    <FieldRoot className={className}>
      {label && (
        <FieldLabel htmlFor={id} id={labelId}>
          <span>
            {label}
            {required && <span className="text-primary-600"> *</span>}
          </span>
        </FieldLabel>
      )}
      <FieldId.Provider value={id}>{children}</FieldId.Provider>
      {hint && <FieldDescription>{hint}</FieldDescription>}
    </FieldRoot>
  );
}

const keys = (onEnter) => (e) => e.key === 'Enter' && onEnter?.();

// an icon in front (a search), or a unit behind (€ / h)
export function Input({ value, onChange, onEnter, icon: Icon, suffix, className, ...rest }) {
  const id = useContext(FieldId);
  const control = { id, value, onChange: (e) => onChange(e.target.value), onKeyDown: keys(onEnter), 'data-autofocus': rest.autoFocus || undefined, ...rest };
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
        {...rest}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? 'Sakrij lozinku' : 'Prikaži lozinku'}
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
  return (
    <Textarea
      id={id}
      data-autofocus={rest.autoFocus || undefined}
      value={value}
      rows={rows}
      style={{ '--rows': rows }}
      className={className}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}

// `options` are { value, label, icon?, meta?, display? } — `display` is what the
// closed field shows when it should be shorter than the row (a country's code).
// `bare` draws the trigger without the field's box, for a Select inside
// another field (the country code in front of a phone number), behind a line.
export function Select({ value, onChange, options, placeholder = 'Izaberite', labelledBy, ariaLabel, bare, className }) {
  const id = useContext(FieldId);
  const chosen = options.find((o) => o.value === value);
  return (
    <SelectRoot value={value ?? ''} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
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
// under it, on the day chosen or the first that can be. `from` and `to` are the
// first and last days that can be chosen (Dates); `today` is the day marked as
// today (the prototype's own, which is not the clock's), `from` if not given.
// Picking a day closes it.
export function DateInput({ value, onChange, from, to, today = from, placeholder = 'Izaberite datum', ariaLabel, autoFocus, className }) {
  const id = useContext(FieldId);
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-label={ariaLabel}
          autoFocus={autoFocus}
          data-autofocus={autoFocus || undefined}
          data-placeholder={value ? undefined : ''}
          className={cn(
            'flex h-(--input-size) w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 text-left text-xs text-foreground transition-[border-color] duration-180 outline-none focus-visible:border-primary data-[placeholder]:text-muted-foreground data-[state=open]:border-primary pointer-coarse:text-[16px] pointer-coarse:leading-6',
            className
          )}
        >
          <span className="min-w-0 flex-1 truncate">{value ? longDate(value) : placeholder}</span>
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={value ?? undefined}
          defaultMonth={value ?? from}
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
      </PopoverContent>
    </Popover>
  );
}
