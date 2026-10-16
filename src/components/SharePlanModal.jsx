import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PaneHint } from '@/components/pane';
import Dialog from './Dialog';
import { Field, TextArea, requiredError, useCheck } from './TextField';
import { t, tn } from '../i18n';

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
  const check = useCheck();
  // the wrong addresses are named under the field already, as they are typed
  const error = entered.length === 0 ? requiredError() : wrong.length > 0 && t('Ovo ne liči na email adresu: {emails}.', { emails: wrong.join(', ') });

  return (
    <Dialog eyebrow={t('Plan nege · {name}', { name: plan.name })} title={t('Pošaljite plan nekome')} wide open={open} onClose={onClose}>
      <DialogDescription>
        {t(
          'Onaj ko ga dobije vidi plan nege onakav kakav je sada: šta preporučujemo, zašto, i ko od negovateljica odgovara. Ne vidi vaš nalog, plaćanje ni poruke sa negovateljicama.'
        )}
      </DialogDescription>

      <Field label={t('Email adrese')} error={check.show(error)}>
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
      {wrong.length > 0 && !check.show(error) && (
        <PaneHint>{t('Ovo ne liči na email adresu: {emails}.', { emails: wrong.join(', ') })}</PaneHint>
      )}

      <Field label={t('Poruka uz plan (nije obavezno)')}>
        <TextArea rows={2} value={note} placeholder={t('Evo šta smo dogovorili za mamu.')} onChange={setNote} />
      </Field>

      {sentTo.length > 0 && (
        <p className="text-xs leading-body text-muted-foreground">{t('Već poslato: {emails}.', { emails: sentTo.join(', ') })}</p>
      )}

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('Otkaži')}
        </Button>
        <Button onClick={() => check.check([error]) && onSend(entered, note.trim())}>
          <Send size={14} strokeWidth={1.75} />
          {entered.length > 1 ? t('Pošalji na {addresses}', { addresses: tn(entered.length, 'adresu', 'adrese', 'adresa') }) : t('Pošalji')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
