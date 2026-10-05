import { useState } from 'react';
import { AlertTriangle, Check, ClipboardList, Send, Utensils, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DataRow } from '@/components/data-list';
import { PaneHint, PaneLabel, Total } from '@/components/pane';
import { Field, Input, TextArea } from '../TextField';
import { money, serviceTitle, totalsFor } from '../../data/caregiverBoard';

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
  { id: 'low', label: 'Loše' },
  { id: 'usual', label: 'Kao i obično' },
  { id: 'good', label: 'Dobro' },
];

const AMOUNTS = [
  { id: 'less', label: 'Manje nego obično' },
  { id: 'usual', label: 'Kao i obično' },
  { id: 'more', label: 'Više nego obično' },
];

// one of a few, always one chosen
function Choice({ options, value, onChange, name }) {
  return (
    <ToggleGroup type="single" size="sm" value={value} onValueChange={(v) => v && onChange(v)} aria-label={name}>
      {options.map((o) => (
        <ToggleGroupItem key={o.id} value={o.id}>
          {o.label}
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
  const totals = totalsFor(valid ? worked : 0, client.rate);
  const overtime = valid && worked !== visit.hours;

  return (
    <>
      <DialogDescription>
        {visit.date} · {visit.time} - planirano {visit.hours} h, po dogovorenih {money(client.rate)}/h.
      </DialogDescription>
      {visit.planNotes && (
        <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-[11px] leading-4 text-muted-foreground">
          <ClipboardList size={13} strokeWidth={1.75} />
          Planirano: {visit.planNotes}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Field label="Odrađeni sati" className="w-auto min-w-0 self-start">
          <Input type="number" inputMode="decimal" step="0.5" value={hours} onChange={setHours} suffix="h" className="w-40!" />
        </Field>
        <Field label="Šta ste radili" className="w-auto min-w-0 flex-1">
          <Input type="text" value={note} placeholder="Jutarnja rutina, doručak, kratka šetnja." onChange={setNote} />
        </Field>
      </div>
      {overtime && (
        <PaneHint>
          {worked > visit.hours
            ? `Više od ${visit.hours} h rezervisanih na kartici porodice. Razlika se naplaćuje kad potvrde.`
            : `Manje od ${visit.hours} h rezervisanih - razlika se vraća porodici.`}
        </PaneHint>
      )}

      <PaneLabel>Kakva je bila danas?</PaneLabel>
      <Choice options={MOODS} value={mood} onChange={setMood} name="Raspoloženje" />

      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <PaneLabel className="mt-0 inline-flex items-center gap-1">
            <Utensils size={13} strokeWidth={1.75} /> Ishrana
          </PaneLabel>
          <Choice options={AMOUNTS} value={eating} onChange={setEating} name="Ishrana" />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <PaneLabel className="mt-0 inline-flex items-center gap-1">
            <Footprints size={13} strokeWidth={1.75} /> Kretanje
          </PaneLabel>
          <Choice options={AMOUNTS} value={moving} onChange={setMoving} name="Kretanje" />
        </div>
      </div>

      <PaneLabel>Šta ste stigli</PaneLabel>
      <PaneHint>Označeno prema planu posete - skinite ono što se nije desilo, označite ono što je iskrslo.</PaneHint>
      <ToggleGroup type="multiple" value={services} onValueChange={setServices} aria-label="Šta ste stigli">
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
            <AlertTriangle size={13} strokeWidth={1.75} /> Nešto me je danas zabrinulo
          </PaneLabel>
          <TextArea
            rows={2}
            value={concern}
            placeholder="Šta ste primetili, svojim rečima. Porodica vidi ovo."
            aria-label="Nešto me je danas zabrinulo"
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
          Nešto me je danas zabrinulo
        </button>
      )}

      <PaneHint>
        Slanjem počinje 24 sata za porodicu. Od njih se ništa ne traži - naplata se izvrši sama kad
        rok istekne, osim ako u tom roku nešto prijave.
      </PaneHint>

      <Total className="mt-2">
        <DataRow label={`Naplaćuje se · ${valid ? worked : 0} h`}>{money(totals.charged)}</DataRow>
        <DataRow label="Provizija (10%)">−{money(totals.fee)}</DataRow>
        <DataRow total label="Vi dobijate">
          {money(totals.net)}
        </DataRow>
      </Total>

      <DialogFooter>
        <Button variant="secondary" onClick={onCancel}>
          Otkaži
        </Button>
        <Button
          disabled={!valid}
          onClick={() =>
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
          Pošalji radni nalog
        </Button>
      </DialogFooter>
    </>
  );
}
