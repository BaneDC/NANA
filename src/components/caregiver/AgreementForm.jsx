import { useState } from 'react';
import { Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaneHint, PaneLabel } from '@/components/pane';
import { Group } from '../Tags';
import { Field, FieldError, Input, aboveZeroError, requiredError, useCheck } from '../TextField';
import { DEFAULT_RATE, money, totalsFor } from '../../data/caregiverBoard';
import { SERVICE_GROUPS } from '../../data/serviceCatalog';
import { t } from '../../i18n';

// The agreement, the first and only time it is built: which services, and one
// shared hourly rate. Both are pre-filled from what the family actually asked
// for in their request, so the common case is reading it and pressing send
// rather than composing it from nothing.
export default function AgreementForm({ client, onSend, onCancel }) {
  const [services, setServices] = useState(client.needs);
  const [rate, setRate] = useState(String(client.rate || DEFAULT_RATE));

  const rateNumber = Number(rate);
  const valid = services.length > 0 && rateNumber > 0;
  const check = useCheck();
  const errors = {
    services: services.length === 0 && requiredError(),
    rate: !rate.trim() ? requiredError() : !(rateNumber > 0) && aboveZeroError(),
  };
  const weekly = valid ? rateNumber * client.hours : 0;

  return (
    <>
      <DialogDescription>
        {t(
          'Ovde postavljate koje usluge pružate i jednu zajedničku cenu po satu. Sve posle toga - posete, radni nalozi, uplate - računa se iz ovoga.'
        )}
      </DialogDescription>

      <PaneLabel>
        {t('Usluge iz ovog ugovora')}
        <span className="text-primary-600"> *</span>
      </PaneLabel>
      {/* the catalog's four groups, each under its name; any number chosen */}
      {SERVICE_GROUPS.map((g) => (
        <Group key={g.id} label={t(g.title)}>
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
            aria-label={t(g.title)}
          >
            {g.items.map(([id, title]) => (
              <ToggleGroupItem key={id} value={id}>
                {services.includes(id) && <Check size={13} strokeWidth={2.5} />}
                {t(title)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Group>
      ))}
      <PaneHint>{t('Označeno prema onome što je porodica tražila. Dodajte ili uklonite šta ne odgovara.')}</PaneHint>
      <FieldError>{check.show(errors.services)}</FieldError>

      <Field label={t('Cena po satu')} required className="w-auto self-start" error={check.show(errors.rate)}>
        <Input type="number" inputMode="numeric" value={rate} onChange={setRate} suffix="€ / h" className="w-40!" />
      </Field>
      {valid && (
        <PaneHint>
          {t('Za {hours} h nedeljno to je {weekly} nedeljno, {net} vama posle provizije od 10%.', {
            hours: client.hours,
            weekly: money(weekly),
            net: money(totalsFor(client.hours, rateNumber).net),
          })}
        </PaneHint>
      )}

      <DialogFooter>
        <Button variant="secondary" onClick={onCancel}>
          {t('Otkaži')}
        </Button>
        <Button
          onClick={() => check.check(Object.values(errors)) && onSend(client.id, { services, rate: rateNumber })}
        >
          <Send size={14} strokeWidth={1.75} />
          {t('Pošalji porodici')}
        </Button>
      </DialogFooter>
    </>
  );
}
