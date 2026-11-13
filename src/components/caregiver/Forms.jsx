import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DataList, DataRow } from '@/components/data-list';
import { Note, Part } from '@/components/pane';
import Dialog from '../Dialog';
import { Field, FieldError, Input, MultiCombobox, Select, TextArea, requiredError, useCheck } from '../TextField';
import { SERVICE_GROUPS, serviceTitle } from '../../data/serviceCatalog';
import { activeVersion, arrangementOf, chargedFor, hourText, money, todayOf } from '../../data/familyCare';
import { OTHER_REASON, nowOf } from '../../data/caregiverCare';
import { SERVICE_FEE } from '../../data/fees';
import { msg, t } from '@/i18n';

// What she fills in on a family's page (docs/superpowers/specs/2026-10-19-negovateljica-finska-design.md):
// the terms, a visit plan, a work order, and the small dialogs that call a
// visit off or end the work together. Each is a Dialog in parts (docs/patterns.md
// §7), a bottom sheet on a phone; nothing is disabled for what is missing, the
// errors show under what is wrong on the press (§9, §10).

// a form in a dialog: its questions 24 apart, not the dialog's 12, and its
// buttons 24 under the last as in any dialog (decided 11. 11.; docs/patterns.md
// §7); on a phone the buttons are at the sheet's foot, as they were
export const formGap = 'gap-6 [&_[data-slot=dialog-footer]]:-mt-3 phone:[&_[data-slot=dialog-footer]]:mt-auto';

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
    services: !services.length && requiredError(),
    rate: !rate.trim() ? requiredError() : !(n >= MIN_RATE) ? t('Najmanje {rate} / h.', { rate: money(MIN_RATE) }) : null,
  };
  const send = () => {
    if (!check.check(Object.values(errors))) return;
    onSend({ services, rate: n, terms: terms.trim() || undefined, note: note.trim() || undefined });
  };
  return (
    <Dialog open={open} eyebrow={care.elder.name} title={act ? t('Nova verzija ugovora') : t('Ugovor o nezi')} wide className={formGap} onClose={onClose}>
      {act && <DialogDescription>{t('Verzija koja važi ostaje dok porodica ne prihvati novu. Nove posete čekaju do tada.')}</DialogDescription>}
      {/* the services a field per group, several from its list (decided
          11. 11.: sixty chips at once could not be read) */}
      <Part
        label={
          <>
            {t('Usluge')}
            <span className="text-primary-600"> *</span>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {SERVICE_GROUPS.map((g) => (
            <Field key={g.id} label={t(g.title)}>
              <MultiCombobox
                values={services.filter((s) => g.items.some(([id]) => id === s))}
                onChange={(picked) => setServices((all) => [...all.filter((s) => !g.items.some(([id]) => id === s)), ...picked])}
                options={g.items.map(([id]) => ({ value: id, label: serviceTitle(id) }))}
                placeholder={t('Izaberite usluge')}
              />
            </Field>
          ))}
        </div>
        <FieldError className="px-0">{check.show(errors.services)}</FieldError>
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
        <Button onClick={send}>{t('Pošalji ugovor')}</Button>
      </DialogFooter>
    </Dialog>
  );
}

// ── visit plan ──────────────────────────────────────────────────────────────

const HALF_HOURS = Array.from({ length: 48 }, (_, i) => i / 2);
// how long: typed, in half hours from 0,5 to 24 (as on production); a comma
// or a point both do
const hoursOf = (v) => Number(String(v).trim().replace(',', '.'));
const hoursError = (v) => {
  const n = hoursOf(v);
  if (!String(v).trim()) return requiredError();
  if (n > 24) return t('Poseta ne može da traje duže od 24 sata.');
  if (!(n >= 0.5)) return t('Poseta traje najmanje pola sata.');
  return Number.isInteger(n * 2) ? null : t('Poseta se planira na pola sata.');
};
const typedHours = (h) => String(h).replace('.', ',');

// only a number goes in: up to two digits, then a comma or a point and one
// more; anything else typed or pasted is not taken
function Hours({ value, onChange }) {
  const take = (v) => /^\d{0,2}([.,]\d?)?$/.test(v) && onChange(v);
  return <Input value={value} onChange={take} inputMode="decimal" suffix="h" />;
}

export function VisitPlanDialog({ open, care, caregiverId, onClose, onSend }) {
  const act = activeVersion(arrangementOf(care, caregiverId));
  const now = nowOf(care);
  const today = todayOf(care);
  const [day, setDay] = useState('tomorrow');
  const [start, setStart] = useState('9');
  const [hours, setHours] = useState(typedHours(3));
  const [notes, setNotes] = useState('');
  const check = useCheck();
  const hourNow = now % 24;
  // today, only what is still ahead
  const starts = HALF_HOURS.filter((h) => day === 'tomorrow' || h > hourNow);
  const s = Number(start);
  const h = hoursOf(hours);
  const errors = { start: day === 'today' && !(s > hourNow) ? t('Izaberite vreme koje još nije prošlo.') : null, hours: hoursError(hours) };
  // while the hours are not right, the sums wait for them
  const ok = !errors.hours;
  const held = ok ? chargedFor(h, act.rate) : null;
  const soon = day === 'today' && s - hourNow < 1;
  const send = () => {
    if (!check.check(Object.values(errors))) return;
    onSend({ day: day === 'today' ? today : today + 1, start: s, hours: h, notes: notes.trim() || undefined });
  };
  return (
    <Dialog open={open} eyebrow={care.elder.name} title={t('Plan posete')} className={formGap} onClose={onClose}>
      <Field label={t('Dan')}>
        <ToggleGroup type="single" size="sm" value={day} onValueChange={(v) => v && setDay(v)} aria-label={t('Dan')}>
          <ToggleGroupItem value="today">{t('Danas')}</ToggleGroupItem>
          <ToggleGroupItem value="tomorrow">{t('Sutra')}</ToggleGroupItem>
        </ToggleGroup>
      </Field>
      {/* one under the other: side by side the hint under one left a hole
          under the other (decided 11. 11.) */}
      <Field label={t('Početak')} required error={check.show(errors.start)}>
        <Select value={start} onChange={setStart} options={starts.map((x) => ({ value: String(x), label: hourText(x) }))} />
      </Field>
      <Field label={t('Trajanje')} required hint={t('Od 0,5 do 24 sata, na pola sata (npr. 1 ili 1,5).')} error={check.show(errors.hours)}>
        <Hours value={hours} onChange={setHours} />
      </Field>
      <Field label={t('Napomena')}>
        <TextArea value={notes} onChange={setNotes} rows={2} placeholder={t('Šta će raditi, šta da porodica pripremi.')} />
      </Field>
      {/* what it comes to, apart from what she fills in: on the grey ground */}
      <DataList className="rounded-2xl bg-muted p-4">
        <DataRow label={t('Kada')}>{`${day === 'today' ? t('Danas') : t('Sutra')} · ${hourText(s)}${ok ? `–${hourText(s + h)}` : ''}`}</DataRow>
        <DataRow label={t('Rezerviše se porodici')}>{ok ? money(held) : '–'}</DataRow>
        <DataRow label={t('Vi dobijate')}>{ok ? money(net(held)) : '–'}</DataRow>
      </DataList>
      {soon && <Note>{t('Ako porodica otkaže u poslednjem satu, plaća celu posetu.')}</Note>}
      <DialogFooter>
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
    <Field label={label}>
      <ToggleGroup type="single" size="sm" className="flex-wrap" value={value} onValueChange={(v) => v && onChange(v)} aria-label={label}>
        {options.map(([id, text]) => (
          <ToggleGroupItem key={id} value={id}>
            {t(text)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  );
}

export function WorkOrderDialog({ open, care, visit, onClose, onSend }) {
  const [hours, setHours] = useState(typedHours(visit.hours));
  const [done, setDone] = useState(visit.services);
  const [mood, setMood] = useState('usual');
  const [eating, setEating] = useState('usual');
  const [moving, setMoving] = useState('usual');
  const [note, setNote] = useState('');
  const [worry, setWorry] = useState('');
  const check = useCheck();
  const h = hoursOf(hours);
  const errors = { hours: hoursError(hours), note: !note.trim() && requiredError() };
  const send = () => {
    if (!check.check(Object.values(errors))) return;
    onSend({ hours: h, done, mood, eating, moving, note: note.trim(), concern: worry.trim() || undefined });
  };
  return (
    <Dialog open={open} eyebrow={`${care.elder.name} · ${visit.date} · ${visit.time}`} title={t('Radni nalog')} wide className={formGap} onClose={onClose}>
      {/* the note goes with its question, 12 under it */}
      <div className="flex flex-col gap-3">
        <Field label={t('Sati')} required hint={t('Od 0,5 do 24 sata, na pola sata (npr. 1 ili 1,5).')} error={check.show(errors.hours)}>
          <Hours value={hours} onChange={setHours} />
        </Field>
        {!errors.hours && h > visit.hours && <Note>{t('Sat više porodica mora da odobri. Do tada se naplaćuje planirano.')}</Note>}
      </div>
      <Field label={t('Urađeno')}>
        <ToggleGroup type="multiple" size="sm" className="flex-wrap" value={done} onValueChange={setDone} aria-label={t('Urađeno')}>
          {visit.services.map((id) => (
            <ToggleGroupItem key={id} value={id}>
              {serviceTitle(id)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <Choice label={t('Raspoloženje')} value={mood} onChange={setMood} options={MOOD} />
      <Choice label={t('Ishrana')} value={eating} onChange={setEating} options={AMOUNT} />
      <Choice label={t('Kretanje')} value={moving} onChange={setMoving} options={AMOUNT} />
      <Field label={t('Šta ste zapisali')} required error={check.show(errors.note)}>
        <TextArea value={note} onChange={setNote} rows={3} placeholder={t('Kako je prošla poseta, šta porodica treba da zna.')} />
      </Field>
      {/* always there, not behind a press (decided 11. 11.) */}
      <Field label={t('Nešto vas je zabrinulo?')} hint={t('Vidi samo koordinatorka.')}>
        <TextArea value={worry} onChange={setWorry} rows={2} />
      </Field>
      <DialogFooter>
        <Button onClick={send}>{t('Pošalji radni nalog')}</Button>
      </DialogFooter>
    </Dialog>
  );
}

// ── small dialogs: a reason, then one action ────────────────────────────────

export const CALL_OFF_REASONS = [msg('Porodica je otkazala'), msg('Bolesna sam'), msg('Hitan slučaj u porodici'), OTHER_REASON];
export const NO_VISIT_REASONS = [msg('Niko nije bio kod kuće'), msg('Porodica je otkazala istog dana'), msg('Nisam mogla da dođem'), msg('Bila sam bolesna')];

// `primary`: the action sets something going rather than switching it off
// (declining a request: nothing is lost, §9). With "Nešto drugo" among the
// reasons, picking it opens a field for her own words, as on the family's
// side (calling off a visit), and those words are what is sent.
export function ReasonDialog({ open, eyebrow, title, text, reasons, action, back, primary, onConfirm, onClose }) {
  const [reason, setReason] = useState(reasons?.[0]);
  const [other, setOther] = useState('');
  const check = useCheck();
  const { reset } = check;
  // opened again, it starts as new
  useEffect(() => {
    if (!open) return;
    setReason(reasons?.[0]);
    setOther('');
    reset();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const own = reason === OTHER_REASON;
  const otherError = own && !other.trim() && requiredError();
  const confirm = () => {
    if (!check.check([otherError])) return;
    onConfirm(own ? other.trim() : reason);
  };
  return (
    <Dialog open={open} eyebrow={eyebrow} title={title} confirm onClose={onClose}>
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
          {own && (
            <Field error={check.show(otherError)}>
              <TextArea rows={2} value={other} autoFocus placeholder={t('U par reči')} aria-label={t('Drugi razlog')} onChange={setOther} />
            </Field>
          )}
        </Part>
      )}
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {back || t('Nazad')}
        </Button>
        {/* calling off or ending switches something off: secondary; declining
            a request loses nothing: default (§9) */}
        <Button variant={primary ? 'default' : 'secondary'} onClick={confirm}>
          {action}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
