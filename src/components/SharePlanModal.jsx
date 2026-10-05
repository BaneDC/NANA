import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PaneHint } from '@/components/pane';
import Dialog from './Dialog';
import { Field, TextArea } from './TextField';
import { pl } from '../data/familyCare';

// Sending the care plan to someone who is not in the app: a sister who shares
// the driving, a son abroad, the doctor the family wants to show it to. They
// get the plan as it is now, to read; nothing about the account goes with it.
//
// Several addresses at once, because this is rarely one person: they are typed
// the way people paste them, separated by commas, spaces or new lines.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parse = (text) =>
  text
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

export default function SharePlanModal({ open = true, plan, sentTo = [], onSend, onClose }) {
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const entered = parse(text);
  const wrong = entered.filter((e) => !EMAIL.test(e));
  const ready = entered.length > 0 && wrong.length === 0;

  return (
    <Dialog eyebrow={`Plan nege · ${plan.name}`} title="Pošaljite plan nekome" wide open={open} onClose={onClose}>
      <DialogDescription>
        Onaj ko ga dobije vidi plan nege onakav kakav je sada: šta preporučujemo, zašto, i ko od
        negovateljica odgovara. Ne vidi vaš nalog, plaćanje ni poruke sa negovateljicama.
      </DialogDescription>

      <Field label="Email adrese">
        <TextArea rows={3} value={text} placeholder="ana@mail.com, milan@mail.com" onChange={setText} />
      </Field>

      {entered.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entered.map((e) => (
            <Badge key={e} variant={EMAIL.test(e) ? 'success' : 'destructive'}>
              <Mail size={12} strokeWidth={2} />
              {e}
            </Badge>
          ))}
        </div>
      )}
      {wrong.length > 0 && (
        <PaneHint>Ovo ne liči na email adresu: {wrong.join(', ')}.</PaneHint>
      )}

      <Field label="Poruka uz plan (nije obavezno)">
        <TextArea rows={2} value={note} placeholder="Evo šta smo dogovorili za mamu." onChange={setNote} />
      </Field>

      {sentTo.length > 0 && (
        <p className="text-xs leading-body text-muted-foreground">Već poslato: {sentTo.join(', ')}.</p>
      )}

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        <Button disabled={!ready} onClick={() => onSend(entered, note.trim())}>
          <Send size={14} strokeWidth={1.75} />
          {entered.length > 1 ? `Pošalji na ${pl(entered.length, 'adresu', 'adrese', 'adresa')}` : 'Pošalji'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
