import { useState } from 'react';
import { Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaneHint, PaneLabel } from '@/components/pane';
import { Group } from '../Tags';
import { Field, Input } from '../TextField';
import { DEFAULT_RATE, money, totalsFor } from '../../data/caregiverBoard';
import { SERVICE_GROUPS } from '../../data/serviceCatalog';

// The agreement, the first and only time it is built: which services, and one
// shared hourly rate. Both are pre-filled from what the family actually asked
// for in their request, so the common case is reading it and pressing send
// rather than composing it from nothing.
export default function AgreementForm({ client, onSend, onCancel }) {
  const [services, setServices] = useState(client.needs);
  const [rate, setRate] = useState(String(client.rate || DEFAULT_RATE));

  const rateNumber = Number(rate);
  const valid = services.length > 0 && rateNumber > 0;
  const weekly = valid ? rateNumber * client.hours : 0;

  return (
    <>
      <DialogDescription>
        Ovde postavljate koje usluge pružate i jednu zajedničku cenu po satu. Sve posle toga -
        posete, radni nalozi, uplate - računa se iz ovoga.
      </DialogDescription>

      <PaneLabel>Usluge iz ovog ugovora</PaneLabel>
      {/* the catalog's four groups, each under its name; any number chosen */}
      {SERVICE_GROUPS.map((g) => (
        <Group key={g.id} label={g.title}>
          <ToggleGroup
            type="multiple"
            value={services.filter((id) => g.items.some(([i]) => i === id))}
            // as a toggle: what is unpicked leaves, what is picked joins at the end
            onValueChange={(picked) =>
              setServices((s) => [
                ...s.filter((id) => picked.includes(id) || !g.items.some(([i]) => i === id)),
                ...picked.filter((id) => !s.includes(id)),
              ])
            }
            aria-label={g.title}
          >
            {g.items.map(([id, title]) => (
              <ToggleGroupItem key={id} value={id}>
                {services.includes(id) && <Check size={13} strokeWidth={2.5} />}
                {title}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Group>
      ))}
      <PaneHint>Označeno prema onome što je porodica tražila. Dodajte ili uklonite šta ne odgovara.</PaneHint>

      <Field label="Cena po satu" className="w-auto self-start">
        <Input type="number" inputMode="numeric" value={rate} onChange={setRate} suffix="€ / h" className="w-40!" />
      </Field>
      {valid && (
        <PaneHint>
          Za {client.hours} h nedeljno to je {money(weekly)} nedeljno,{' '}
          {money(totalsFor(client.hours, rateNumber).net)} vama posle provizije od 10%.
        </PaneHint>
      )}

      <DialogFooter>
        <Button variant="secondary" onClick={onCancel}>
          Otkaži
        </Button>
        <Button
          disabled={!valid}
          onClick={() => onSend(client.id, { services, rate: rateNumber })}
        >
          <Send size={14} strokeWidth={1.75} />
          Pošalji porodici
        </Button>
      </DialogFooter>
    </>
  );
}
