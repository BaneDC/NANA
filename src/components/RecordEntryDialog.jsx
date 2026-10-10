import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaneHint, Part, PartText } from '@/components/pane';
import AutoHeight from './AutoHeight';
import Dialog from './Dialog';
import { DateInput, Field, Input } from './TextField';
import { dateOfToday, firstName, longDate } from '../data/familyCare';
import { entryLine } from '../data/record';

// An entry in one of the record's lists (a diagnosis, a medicine, an allergy,
// an aid), written or changed (docs/patterns.md §10a). The plan is not built
// from these, so there is one step, and the dialog says so before it is
// agreed.
//
// A new entry is its name, a note and, if known, from when. An entry already
// there is asked what this is, as a change of where she lives is: a change
// (another dose), that it no longer holds (from when; it leaves the list and
// stays in the history), or a correction of the record. A change is chosen to
// begin with; another choice swaps the parts under it in place.
export default function RecordEntryDialog({ open = true, list, entry, care, onSave, onEnd, onClose }) {
  const [mode, setMode] = useState('change'); // change | end | correction
  const [name, setName] = useState(entry?.name || '');
  const [note, setNote] = useState(entry?.note || '');
  const [since, setSince] = useState(entry?.since || null);
  const today = dateOfToday(care);
  const [ended, setEnded] = useState(today);
  const working = (care?.arrangements || []).filter((a) => !a.endedOn).map((a) => firstName(a.caregiver.name));
  const told = working.length > 0 && ` ${working.join(', ')} ${working.length === 1 ? 'dobija' : 'dobijaju'} obaveštenje pre sledeće posete.`;

  const values = { name: name.trim(), note: note.trim(), since };
  const moved = !entry || values.name !== entry.name || values.note !== (entry.note || '') || String(since || '') !== String(entry.since || '');

  const fields = (
    <div className="flex flex-col gap-3">
      <Field label={list.name}>
        <Input value={name} onChange={setName} placeholder={list.namePlaceholder} autoFocus={!entry} />
      </Field>
      <Field label="Napomena" hint="Nije obavezno.">
        <Input value={note} onChange={setNote} placeholder={list.notePlaceholder} />
      </Field>
      <Field label="Od kada" hint="Nije obavezno.">
        <DateInput value={since} onChange={setSince} to={today} today={today} />
      </Field>
    </div>
  );

  return (
    <Dialog
      eyebrow={`Medicinski karton · ${list.title}`}
      title={entry ? entry.name : list.add}
      description={entry ? entryLine(entry) || undefined : undefined}
      open={open}
      onClose={onClose}
    >
      <AutoHeight className="flex flex-col gap-6 pt-3">
        {entry && (
          <Part label="Šta je u pitanju">
            <ToggleGroup type="single" size="sm" value={mode} onValueChange={(v) => v && setMode(v)} aria-label="Šta je u pitanju">
              <ToggleGroupItem value="change">Izmena</ToggleGroupItem>
              <ToggleGroupItem value="end">{list.end}</ToggleGroupItem>
              <ToggleGroupItem value="correction">Ispravka</ToggleGroupItem>
            </ToggleGroup>
            <PaneHint key={mode} className="animate-in fade-in-0 duration-200">
              {mode === 'change' && 'Nešto je sada drugačije nego što piše. U istoriji kartona ostaje i kako je bilo.'}
              {mode === 'end' && 'Zapis se sklanja sa spiska. U istoriji ostaje šta je bilo upisano i do kada.'}
              {mode === 'correction' && 'Zapis je bio pogrešan od početka. Ispravlja se, a u istoriji ostaje da je ispravljen.'}
            </PaneHint>
          </Part>
        )}

        {/* what the choice asks for, swapped in place */}
        <div key={mode} className="flex animate-in flex-col gap-6 fade-in-0 duration-200">
          {mode === 'end' ? (
            <Part label="Od kada">
              <Field>
                <DateInput value={ended} onChange={setEnded} to={today} today={today} ariaLabel="Od kada" />
              </Field>
            </Part>
          ) : (
            fields
          )}

          <Part label="Šta ovo menja">
            <PartText>
              {list.id === 'allergies' && mode !== 'end' && 'Alergija stoji i u „Na šta paziti", na vrhu kartona. '}
              Plan nege ostaje isti: preporuke se ne pišu iz ovog spiska.{told || ''}
            </PartText>
          </Part>
        </div>
      </AutoHeight>

      <DialogFooter className="mt-0">
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        {mode === 'end' ? (
          <Button disabled={!ended} onClick={() => onEnd(longDate(ended))}>
            Zaključi zapis
          </Button>
        ) : (
          <Button disabled={!values.name || !moved} onClick={() => onSave(values, entry ? mode : 'added')}>
            {!entry ? 'Upiši u karton' : mode === 'correction' ? 'Sačuvaj ispravku' : 'Upiši izmenu'}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
