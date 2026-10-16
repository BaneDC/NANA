import { useState } from 'react';
import { AlertTriangle, Check, ClipboardList, Send, Utensils, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DataRow } from '@/components/data-list';
import { PaneHint, PaneLabel, Total } from '@/components/pane';
import { Field, Input, TextArea, aboveZeroError, requiredError, useCheck } from '../TextField';
import { money, serviceTitle, totalsFor } from '../../data/caregiverBoard';
import { msg, t } from '../../i18n';

// The work order is the visit's report and its invoice in one, because they are
// the same event: what was done decides what is charged. It prices itself
// against the agreement — the rate is the agreed rate, and the things that can
// be ticked are the services the agreement covers, nothing else.
//
// It opens against the visit order: the hours that were planned, the services
// that were planned, everything "as usual". A visit that went to plan is read
// and sent; only what actually differed has to be touched. Every service the
// agreement covers is still offered, because a visit can turn into something
// nobody planned.

const MOODS = [
  { id: 'low', label: msg('Loše') },
  { id: 'usual', label: msg('Kao i obično') },
  { id: 'good', label: msg('Dobro') },
];

const AMOUNTS = [
  { id: 'less', label: msg('Manje nego obično') },
  { id: 'usual', label: msg('Kao i obično') },
  { id: 'more', label: msg('Više nego obično') },
];

// one of a few, always one chosen
function Choice({ options, value, onChange, name }) {
  return (
    <ToggleGroup type="single" size="sm" value={value} onValueChange={(v) => v && onChange(v)} aria-label={name}>
      {options.map((o) => (
        <ToggleGroupItem key={o.id} value={o.id}>
          {t(o.label)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export default function WorkOrderForm({ client, visit, onSend, onCancel }) {
  const [hours, setHours] = useState(String(visit.hours));
  const [note, setNote] = useState('');
  const [mood, setMood] = useState('usual');
  const [eating, setEating] = useState('usual');
  const [moving, setMoving] = useState('usual');
  const [services, setServices] = useState(visit.planned || client.services);
  const [concernOpen, setConcernOpen] = useState(false);
  const [concern, setConcern] = useState('');

  const worked = Number(hours);
  const valid = worked > 0;
  const check = useCheck();
  const hoursError = !hours.trim() ? requiredError() : !valid && aboveZeroError();
  const totals = totalsFor(valid ? worked : 0, client.rate);
  const overtime = valid && worked !== visit.hours;

  return (
    <>
      <DialogDescription>
        {t('{date} · {time} - planirano {hours} h, po dogovorenih {rate}/h.', {
          date: t(visit.date),
          time: visit.time,
          hours: visit.hours,
          rate: money(client.rate),
        })}
      </DialogDescription>
      {visit.planNotes && (
        <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-small text-muted-foreground">
          <ClipboardList size={13} strokeWidth={1.75} />
          {t('Planirano: {notes}', { notes: t(visit.planNotes) })}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Field label={t('Odrađeni sati')} className="w-auto min-w-0 self-start" error={check.show(hoursError)}>
          <Input type="number" inputMode="decimal" step="0.5" value={hours} onChange={setHours} suffix="h" className="w-40!" />
        </Field>
        <Field label={t('Šta ste radili')} className="w-auto min-w-0 flex-1">
          <Input type="text" value={note} placeholder={t('Jutarnja rutina, doručak, kratka šetnja.')} onChange={setNote} />
        </Field>
      </div>
      {overtime && (
        <PaneHint>
          {worked > visit.hours
            ? t('Više od {hours} h rezervisanih na kartici porodice. Razlika se naplaćuje kad potvrde.', { hours: visit.hours })
            : t('Manje od {hours} h rezervisanih - razlika se vraća porodici.', { hours: visit.hours })}
        </PaneHint>
      )}

      <PaneLabel>{t('Kakva je bila danas?')}</PaneLabel>
      <Choice options={MOODS} value={mood} onChange={setMood} name={t('Raspoloženje')} />

      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <PaneLabel className="mt-0 inline-flex items-center gap-1">
            <Utensils size={13} strokeWidth={1.75} /> {t('Ishrana')}
          </PaneLabel>
          <Choice options={AMOUNTS} value={eating} onChange={setEating} name={t('Ishrana')} />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <PaneLabel className="mt-0 inline-flex items-center gap-1">
            <Footprints size={13} strokeWidth={1.75} /> {t('Kretanje')}
          </PaneLabel>
          <Choice options={AMOUNTS} value={moving} onChange={setMoving} name={t('Kretanje')} />
        </div>
      </div>

      <PaneLabel>{t('Šta ste stigli')}</PaneLabel>
      <PaneHint>{t('Označeno prema planu posete - skinite ono što se nije desilo, označite ono što je iskrslo.')}</PaneHint>
      <ToggleGroup type="multiple" value={services} onValueChange={setServices} aria-label={t('Šta ste stigli')}>
        {client.services.map((id) => (
          <ToggleGroupItem key={id} value={id}>
            {services.includes(id) && <Check size={13} strokeWidth={2.5} />}
            {serviceTitle(id)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Somewhere for the thing that does not fit in a rating. It reaches the
          family, so it is deliberately not a checkbox with no words. */}
      {concernOpen ? (
        <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-destructive-muted p-3">
          <PaneLabel className="mt-0 inline-flex items-center gap-1 text-destructive">
            <AlertTriangle size={13} strokeWidth={1.75} /> {t('Nešto me je danas zabrinulo')}
          </PaneLabel>
          <TextArea
            rows={2}
            value={concern}
            placeholder={t('Šta ste primetili, svojim rečima. Porodica vidi ovo.')}
            aria-label={t('Nešto me je danas zabrinulo')}
            onChange={setConcern}
          />
        </div>
      ) : (
        <button
          type="button"
          className="mt-1 inline-flex cursor-pointer items-center gap-2 self-start text-xs text-destructive hover:underline"
          onClick={() => setConcernOpen(true)}
        >
          <AlertTriangle size={13} strokeWidth={1.75} />
          {t('Nešto me je danas zabrinulo')}
        </button>
      )}

      <PaneHint>
        {t(
          'Slanjem počinje 24 sata za porodicu. Od njih se ništa ne traži - naplata se izvrši sama kad rok istekne, osim ako u tom roku nešto prijave.'
        )}
      </PaneHint>

      <Total className="mt-2">
        <DataRow label={t('Naplaćuje se · {hours} h', { hours: valid ? worked : 0 })}>{money(totals.charged)}</DataRow>
        <DataRow label={t('Provizija (10%)')}>−{money(totals.fee)}</DataRow>
        <DataRow total label={t('Vi dobijate')}>
          {money(totals.net)}
        </DataRow>
      </Total>

      <DialogFooter>
        <Button variant="secondary" onClick={onCancel}>
          {t('Otkaži')}
        </Button>
        <Button
          onClick={() =>
            check.check([hoursError]) &&
            onSend(client.id, {
              hours: worked,
              note: note.trim(),
              mood,
              eating,
              moving,
              services,
              concern: concern.trim(),
            })
          }
        >
          <Send size={14} strokeWidth={1.75} />
          {t('Pošalji radni nalog')}
        </Button>
      </DialogFooter>
    </>
  );
}
