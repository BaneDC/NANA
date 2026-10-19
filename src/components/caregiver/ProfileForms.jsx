import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaneHint, Part } from '@/components/pane';
import Dialog from '../Dialog';
import { Field, FieldError, Input, Select, TextArea, requiredError, useCheck } from '../TextField';
import { SLOTS } from '../../data/carePlan';
import { DAYS, EDUCATION, LANGUAGES_OFFERED } from '../../data/caregiverProfile';
import { t } from '@/i18n';

// The fields of her profile, each group in its own dialog: "Izmenite" on a card
// of "Moj profil" opens one (docs/superpowers/specs/2026-10-19-negovateljica-finska-design.md).
// The sign-up (part 5) asks the same fields, as steps. Nothing is disabled for
// what is missing; errors show on the press (docs/patterns.md §9, §10).

function Frame({ open, title, onClose, onSave, children }) {
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      {children}
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('Nazad')}
        </Button>
        <Button onClick={onSave}>{t('Sačuvaj')}</Button>
      </DialogFooter>
    </Dialog>
  );
}

export function PersonalForm({ open, profile, onClose, onSave }) {
  const [address, setAddress] = useState(profile.address || '');
  const [area, setArea] = useState(profile.area || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const check = useCheck();
  const errors = { address: !address.trim() && requiredError(), area: !area.trim() && requiredError(), phone: !phone.trim() && requiredError() };
  const save = () => check.check(Object.values(errors)) && onSave({ address: address.trim(), area: area.trim(), phone: phone.trim() });
  return (
    <Frame open={open} title={t('Lični podaci')} onClose={onClose} onSave={save}>
      <Field label={t('Adresa')} required hint={t('Adresa iz lične karte.')} error={check.show(errors.address)}>
        <Input value={address} onChange={setAddress} />
      </Field>
      <Field label={t('Opština')} required error={check.show(errors.area)}>
        <Input value={area} onChange={setArea} />
      </Field>
      <Field label={t('Telefon')} required error={check.show(errors.phone)}>
        <Input value={phone} onChange={setPhone} type="tel" />
      </Field>
    </Frame>
  );
}

export function ProfessionForm({ open, profile, onClose, onSave }) {
  const [education, setEducation] = useState(profile.education || '');
  const [languages, setLanguages] = useState(profile.languages || []);
  const [bio, setBio] = useState(profile.bio ? t(profile.bio) : '');
  const check = useCheck();
  const errors = { education: !education && requiredError(), bio: !bio.trim() && requiredError() };
  const save = () => check.check(Object.values(errors)) && onSave({ education, languages, bio: bio.trim() });
  return (
    <Frame open={open} title={t('Profesija')} onClose={onClose} onSave={save}>
      {profile.classifications?.length > 0 && <PaneHint>{t('Klasifikacije se menjaju preko koordinatorke, zbog dokumenata.')}</PaneHint>}
      <Field label={t('Obrazovanje')} required error={check.show(errors.education)}>
        <Select value={education} onChange={setEducation} options={EDUCATION.map((e) => ({ value: e, label: t(e) }))} />
      </Field>
      <Part label={t('Jezici')}>
        <ToggleGroup type="multiple" size="sm" className="flex-wrap" value={languages} onValueChange={setLanguages} aria-label={t('Jezici')}>
          {LANGUAGES_OFFERED.map((l) => (
            <ToggleGroupItem key={l} value={l}>
              {t(l)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Part>
      <Field label={t('O sebi')} required error={check.show(errors.bio)}>
        <TextArea value={bio} onChange={setBio} rows={4} placeholder={t('Ukratko opišite iskustvo, posebno sa starijima, i šta vas čini pouzdanom.')} />
      </Field>
    </Frame>
  );
}

const RADII = [5, 10, 20, 30, 50];

export function AvailabilityForm({ open, profile, market, onClose, onSave }) {
  const [days, setDays] = useState((profile.days || []).map(String));
  const [slots, setSlots] = useState(profile.slots || []);
  const [radius, setRadius] = useState(String(profile.radius || 10));
  const [from, setFrom] = useState(String(profile.rateMin ?? ''));
  const [to, setTo] = useState(String(profile.rateMax ?? ''));
  const check = useCheck();
  const fi = market !== 'sr';
  const a = Number(from);
  const b = Number(to);
  const errors = {
    days: !days.length && t('Izaberite bar jedan dan.'),
    slots: !slots.length && t('Izaberite bar jedno doba dana.'),
    rate: fi && (!from || !to ? requiredError() : !(a > 0 && b >= a) ? t('Cena „od" ne može biti veća od cene „do".') : null),
  };
  const save = () =>
    check.check(Object.values(errors)) &&
    onSave({ days: days.map(Number).sort(), slots, radius: Number(radius), ...(fi ? { rateMin: a, rateMax: b } : {}) });
  return (
    <Frame open={open} title={t('Dostupnost')} onClose={onClose} onSave={save}>
      <Part label={t('Dani')}>
        <ToggleGroup type="multiple" size="sm" className="flex-wrap" value={days} onValueChange={setDays} aria-label={t('Dani')}>
          {DAYS.map((d, i) => (
            <ToggleGroupItem key={i} value={String(i)}>
              {t(d)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <FieldError>{check.show(errors.days)}</FieldError>
      </Part>
      <Part label={t('Doba dana')}>
        <ToggleGroup type="multiple" size="sm" className="flex-wrap" value={slots} onValueChange={setSlots} aria-label={t('Doba dana')}>
          {Object.entries(SLOTS).map(([id, s]) => (
            <ToggleGroupItem key={id} value={id}>
              {`${t(s.label)} ${s.hours}`}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <FieldError>{check.show(errors.slots)}</FieldError>
      </Part>
      <Field label={t('Radijus')} required>
        <Select value={radius} onChange={setRadius} options={RADII.map((r) => ({ value: String(r), label: t('do {km} km', { km: r }) }))} />
      </Field>
      {fi && (
        <Field label={t('Cena po satu, od - do')} required hint={t('Tržišna cena je oko 15–25 € / h.')} error={check.show(errors.rate)}>
          <div className="grid grid-cols-2 gap-3">
            <Input value={from} onChange={setFrom} inputMode="decimal" suffix="€/h" aria-label={t('Od')} />
            <Input value={to} onChange={setTo} inputMode="decimal" suffix="€/h" aria-label={t('Do')} />
          </div>
        </Field>
      )}
    </Frame>
  );
}

