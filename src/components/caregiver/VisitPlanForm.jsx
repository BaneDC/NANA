import { useState } from 'react';
import { Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaneHint, PaneLabel } from '@/components/pane';
import { Field, Input, TextArea } from '../TextField';
import { hoursIn, money, serviceTitle, totalsFor } from '../../data/caregiverBoard';

// The visit order: what is meant to happen, written before going. It sits
// between the agreement and the work order and is the reason those two can be
// compared at all — without it, "4 hours worked" is a number with nothing to be
// measured against, and the things to remember on the way live in someone's
// head.
//
// It is filled from the agreement: the pattern gives the time, the time gives
// the hours, and the services are the ones the agreement covers.
export default function VisitPlanForm({ client, plan, onSave, onCancel }) {
  const patternTime = client.schedule?.split('· ')[1] || '';
  const [date, setDate] = useState(plan?.date || '');
  const [time, setTime] = useState(plan?.time || patternTime);
  const [services, setServices] = useState(plan?.services || client.services);
  const [notes, setNotes] = useState(plan?.notes || '');

  const hours = hoursIn(time);
  const valid = date.trim().length > 0 && hours > 0;

  return (
    <>
      <DialogDescription>
        Zašto dolazite. Kad ovo pošaljete porodici, novac za posetu se rezerviše pre nego što
        krenete, a radni nalog se posle otvara prema ovome - pa ono što ovde promenite je ono prema
        čemu se poseta meri.
      </DialogDescription>

      <div className="flex flex-wrap gap-3">
        <Field label="Dan" className="w-auto min-w-0 flex-1">
          <Input type="text" value={date} placeholder="četvrtak, 14. avgusta" onChange={setDate} />
        </Field>
        <Field label="Vreme" className="w-auto min-w-0 self-start">
          <Input type="text" value={time} placeholder="09:00–13:00" onChange={setTime} className="w-40!" />
        </Field>
      </div>
      <PaneHint>
        {hours
          ? `${hours} h po dogovorenih ${money(client.rate)}/h. Na kartici porodice rezerviše se ${money(
              totalsFor(hours, client.rate).charged
            )}, od toga ${money(
              totalsFor(hours, client.rate).net
            )} vama ako poseta prođe po planu. Raspored iz ugovora: ${client.schedule}.`
          : `Vreme kao raspon, npr. 09:00–13:00. Raspored iz ugovora: ${client.schedule}.`}
      </PaneHint>

      <PaneLabel>Šta planirate da radite</PaneLabel>
      <ToggleGroup type="multiple" value={services} onValueChange={setServices} aria-label="Šta planirate da radite">
        {client.services.map((id) => (
          <ToggleGroupItem key={id} value={id}>
            {services.includes(id) && <Check size={13} strokeWidth={2.5} />}
            {serviceTitle(id)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Field label="Šta treba zapamtiti">
        <TextArea
          rows={2}
          value={notes}
          placeholder="Recept za podizanje, nešto što je porodica tražila, nešto što treba proveriti."
          onChange={setNotes}
        />
      </Field>

      <DialogFooter>
        <Button variant="secondary" onClick={onCancel}>
          Otkaži
        </Button>
        <Button
          disabled={!valid}
          onClick={() =>
            onSave(client.id, { date: date.trim(), time: time.trim(), hours, services, notes: notes.trim() })
          }
        >
          <Send size={14} strokeWidth={1.75} />
          {plan ? 'Pošalji izmenu' : 'Pošalji porodici'}
        </Button>
      </DialogFooter>
    </>
  );
}
