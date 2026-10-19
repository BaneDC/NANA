import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataList, DataRow } from '@/components/data-list';
import { PaneHint, Part } from '@/components/pane';
import { cn } from '@/lib/utils';
import Dialog from '../Dialog';
import { Field, FieldError, Input, Select, TextArea, requiredError, useCheck } from '../TextField';
import { SERVICE_GROUPS, serviceTitle } from '../../data/serviceCatalog';
import { activeVersion, arrangementOf, chargedFor, hourText, money, todayOf } from '../../data/familyCare';
import { nowOf } from '../../data/caregiverCare';
import { SERVICE_FEE } from '../../data/fees';
import { msg, t } from '@/i18n';

// What she fills in on a family's page (docs/superpowers/specs/2026-10-19-negovateljica-finska-design.md):
// the terms, a visit plan, a work order, and the small dialogs that call a
// visit off or end the work together. Each is a Dialog in parts (docs/patterns.md
// §7), a bottom sheet on a phone; nothing is disabled for what is missing, the
// errors show under what is wrong on the press (§9, §10).

const net = (amount) => Math.round(amount * (1 - SERVICE_FEE) * 100) / 100;
const MIN_RATE = 12;

// ── terms ───────────────────────────────────────────────────────────────────

export function AgreementDialog({ open, care, caregiverId, onClose, onSend }) {
  const a = arrangementOf(care, caregiverId);
  const act = a && activeVersion(a);
  const [services, setServices] = useState(() => act?.services || care.need?.services || []);
  const [rate, setRate] = useState(() => String(act?.rate || ''));
  const [terms, setTerms] = useState(act?.terms ? t(act.terms) : '');
  const [note, setNote] = useState('');
  const check = useCheck();
  const n = Number(String(rate).replace(',', '.'));
  const errors = {
    services: !services.length && t('Izaberite bar jednu uslugu.'),
    rate: !rate.trim() ? requiredError() : !(n >= MIN_RATE) ? t('Najmanje {rate} / h.', { rate: money(MIN_RATE) }) : null,
  };
  const send = () => {
    if (!check.check(Object.values(errors))) return;
    onSend({ services, rate: n, terms: terms.trim() || undefined, note: note.trim() || undefined });
  };
  return (
    <Dialog open={open} eyebrow={care.elder.name} title={act ? t('Nova verzija ugovora') : t('Ugovor o nezi')} wide onClose={onClose}>
      {act && <DialogDescription>{t('Verzija koja važi ostaje dok porodica ne prihvati novu. Nove posete čekaju do tada.')}</DialogDescription>}
      <Part label={t('Usluge')}>
        {SERVICE_GROUPS.map((g) => (
          <div key={g.id} className="flex flex-col gap-2">
            <p className="text-small text-muted-foreground">{t(g.title)}</p>
            <ToggleGroup
              type="multiple"
              size="sm"
              className="flex-wrap"
              value={services.filter((s) => g.items.some(([id]) => id === s))}
              onValueChange={(picked) => setServices((all) => [...all.filter((s) => !g.items.some(([id]) => id === s)), ...picked])}
              aria-label={t(g.title)}
            >
              {g.items.map(([id]) => (
                <ToggleGroupItem key={id} value={id}>
                  {serviceTitle(id)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ))}
        <FieldError>{check.show(errors.services)}</FieldError>
      </Part>
      <Field label={t('Cena po satu')} required hint={n >= MIN_RATE ? t('Porodica plaća ovu cenu, PDV uključen. Vi dobijate {net} / h.', { net: money(net(n)) }) : t('Porodica plaća ovu cenu, PDV uključen.')} error={check.show(errors.rate)}>
        <Input value={rate} onChange={setRate} inputMode="decimal" suffix="€/h" />
      </Field>
      <Field label={t('Dodatni uslovi')}>
        <TextArea value={terms} onChange={setTerms} rows={2} placeholder={t('Npr. gde je ključ, šta ako ste sprečeni.')} />
      </Field>
      <Field label={t('Poruka porodici')}>
        <TextArea value={note} onChange={setNote} rows={2} />
      </Field>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('Nazad')}
        </Button>
        <Button onClick={send}>{t('Pošalji ugovor')}</Button>
      </DialogFooter>
    </Dialog>
  );
}

// ── visit plan ──────────────────────────────────────────────────────────────

const HALF_HOURS = Array.from({ length: 48 }, (_, i) => i / 2);
const DURATIONS = Array.from({ length: 24 }, (_, i) => (i + 1) / 2);
const hoursText = (h) => t('{n} h', { n: String(h).replace('.', ',') });

export function VisitPlanDialog({ open, care, caregiverId, onClose, onSend }) {
  const act = activeVersion(arrangementOf(care, caregiverId));
  const now = nowOf(care);
  const today = todayOf(care);
  const [day, setDay] = useState('tomorrow');
  const [start, setStart] = useState('9');
  const [hours, setHours] = useState('3');
  const [notes, setNotes] = useState('');
  const check = useCheck();
  const hourNow = now % 24;
  // today, only what is still ahead
  const starts = HALF_HOURS.filter((h) => day === 'tomorrow' || h > hourNow);
  const s = Number(start);
  const h = Number(hours);
  const errors = { start: day === 'today' && !(s > hourNow) ? t('Izaberite vreme koje još nije prošlo.') : null };
  const held = chargedFor(h, act.rate);
  const soon = day === 'today' && s - hourNow < 1;
  const send = () => {
    if (!check.check(Object.values(errors))) return;
    onSend({ day: day === 'today' ? today : today + 1, start: s, hours: h, notes: notes.trim() || undefined });
  };
  return (
    <Dialog open={open} eyebrow={care.elder.name} title={t('Plan posete')} onClose={onClose}>
      <Part label={t('Dan')}>
        <ToggleGroup type="single" size="sm" value={day} onValueChange={(v) => v && setDay(v)} aria-label={t('Dan')}>
          <ToggleGroupItem value="today">{t('Danas')}</ToggleGroupItem>
          <ToggleGroupItem value="tomorrow">{t('Sutra')}</ToggleGroupItem>
        </ToggleGroup>
      </Part>
      <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
        <Field label={t('Početak')} required error={check.show(errors.start)}>
          <Select value={start} onChange={setStart} options={starts.map((x) => ({ value: String(x), label: hourText(x) }))} />
        </Field>
        <Field label={t('Trajanje')} required>
          <Select value={hours} onChange={setHours} options={DURATIONS.map((x) => ({ value: String(x), label: hoursText(x) }))} />
        </Field>
      </div>
      <Field label={t('Napomena')}>
        <TextArea value={notes} onChange={setNotes} rows={2} placeholder={t('Šta će raditi, šta da porodica pripremi.')} />
      </Field>
      <DataList>
        <DataRow label={t('Kada')}>{`${day === 'today' ? t('Danas') : t('Sutra')} · ${hourText(s)}–${hourText(s + h)}`}</DataRow>
        <DataRow label={t('Rezerviše se porodici')}>{money(held)}</DataRow>
        <DataRow label={t('Vi dobijate')}>{money(net(held))}</DataRow>
      </DataList>
      {soon && <PaneHint>{t('Ako porodica otkaže u poslednjem satu, plaća celu posetu.')}</PaneHint>}
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('Nazad')}
        </Button>
        <Button onClick={send}>{t('Pošalji plan posete')}</Button>
      </DialogFooter>
    </Dialog>
  );
}

// ── work order ──────────────────────────────────────────────────────────────

const MOOD = [
  ['low', msg('Loše')],
  ['usual', msg('Kao i obično')],
  ['good', msg('Dobro')],
];
const AMOUNT = [
  ['less', msg('Manje nego obično')],
  ['usual', msg('Kao i obično')],
  ['more', msg('Više nego obično')],
];

function Choice({ label, value, onChange, options }) {
  return (
    <Part label={label}>
      <ToggleGroup type="single" size="sm" className="flex-wrap" value={value} onValueChange={(v) => v && onChange(v)} aria-label={label}>
        {options.map(([id, text]) => (
          <ToggleGroupItem key={id} value={id}>
            {t(text)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Part>
  );
}

export function WorkOrderDialog({ open, care, visit, onClose, onSend }) {
  const [hours, setHours] = useState(String(visit.hours));
  const [done, setDone] = useState(visit.services);
  const [mood, setMood] = useState('usual');
  const [eating, setEating] = useState('usual');
  const [moving, setMoving] = useState('usual');
  const [note, setNote] = useState('');
  const [worry, setWorry] = useState('');
  const [worried, setWorried] = useState(false);
  const check = useCheck();
  const h = Number(hours);
  const errors = { note: !note.trim() && requiredError() };
  const send = () => {
    if (!check.check(Object.values(errors))) return;
    onSend({ hours: h, done, mood, eating, moving, note: note.trim(), concern: worry.trim() || undefined });
  };
  return (
    <Dialog open={open} eyebrow={`${care.elder.name} · ${visit.date} · ${visit.time}`} title={t('Radni nalog')} wide onClose={onClose}>
      <Field label={t('Sati')} required>
        <Select value={hours} onChange={setHours} options={DURATIONS.map((x) => ({ value: String(x), label: hoursText(x) }))} />
      </Field>
      {h > visit.hours && <PaneHint>{t('Sat više porodica mora da odobri. Do tada se naplaćuje planirano.')}</PaneHint>}
      <Part label={t('Urađeno')}>
        <ToggleGroup type="multiple" size="sm" className="flex-wrap" value={done} onValueChange={setDone} aria-label={t('Urađeno')}>
          {visit.services.map((id) => (
            <ToggleGroupItem key={id} value={id}>
              {serviceTitle(id)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Part>
      <Choice label={t('Raspoloženje')} value={mood} onChange={setMood} options={MOOD} />
      <Choice label={t('Ishrana')} value={eating} onChange={setEating} options={AMOUNT} />
      <Choice label={t('Kretanje')} value={moving} onChange={setMoving} options={AMOUNT} />
      <Field label={t('Šta ste zapisali')} required error={check.show(errors.note)}>
        <TextArea value={note} onChange={setNote} rows={3} placeholder={t('Kako je prošla poseta, šta porodica treba da zna.')} />
      </Field>
      <Collapsible open={worried} onOpenChange={setWorried}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="-ml-3 self-start" aria-expanded={worried}>
            {t('Nešto vas je zabrinulo?')}
            <ChevronDown size={14} strokeWidth={1.75} className={cn('transition-transform duration-200', worried && 'rotate-180')} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-2 pt-2">
          <Field hint={t('Vidi samo koordinatorka.')}>
            <TextArea value={worry} onChange={setWorry} rows={2} aria-label={t('Šta vas je zabrinulo')} />
          </Field>
        </CollapsibleContent>
      </Collapsible>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('Nazad')}
        </Button>
        <Button onClick={send}>{t('Pošalji radni nalog')}</Button>
      </DialogFooter>
    </Dialog>
  );
}

// ── small dialogs: a reason, then one action ────────────────────────────────

export const CALL_OFF_REASONS = [msg('Porodica je otkazala'), msg('Bolesna sam'), msg('Hitan slučaj u porodici'), msg('Nešto drugo')];
export const NO_VISIT_REASONS = [msg('Niko nije bio kod kuće'), msg('Porodica je otkazala istog dana'), msg('Nisam mogla da dođem'), msg('Bila sam bolesna')];

export function ReasonDialog({ open, eyebrow, title, text, reasons, action, onConfirm, onClose }) {
  const [reason, setReason] = useState(reasons?.[0]);
  return (
    <Dialog open={open} eyebrow={eyebrow} title={title} onClose={onClose}>
      {text && <DialogDescription>{text}</DialogDescription>}
      {reasons && (
        <Part label={t('Zašto')}>
          <ToggleGroup type="single" size="sm" className="flex-wrap" value={reason} onValueChange={(v) => v && setReason(v)} aria-label={t('Zašto')}>
            {reasons.map((r) => (
              <ToggleGroupItem key={r} value={r}>
                {t(r)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Part>
      )}
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('Nazad')}
        </Button>
        {/* calling off or ending switches something off: secondary (§9) */}
        <Button variant="secondary" onClick={() => onConfirm(reason)}>
          {action}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
