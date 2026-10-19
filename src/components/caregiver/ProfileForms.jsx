import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaneHint, Part } from '@/components/pane';
import Dialog from '../Dialog';
import { Field, FieldError, Input, Select, TextArea, requiredError, useCheck } from '../TextField';
import { SLOTS } from '../../data/carePlan';
import { DAYS, EDUCATION, HABITS, HEALTH_QUESTIONS, LANGUAGES_OFFERED, READINESS, RELATIONS } from '../../data/caregiverProfile';
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
  const [engagement, setEngagement] = useState(profile.engagement || ['daily']);
  const [abroad, setAbroad] = useState(profile.abroad ? 'yes' : 'no');
  const [to, setTo] = useState(String(profile.rateMax ?? ''));
  const check = useCheck();
  const fi = market !== 'sr';
  const a = Number(String(from).replace(',', '.'));
  const b = Number(String(to).replace(',', '.'));
  const errors = {
    days: !days.length && t('Izaberite bar jedan dan.'),
    slots: !slots.length && t('Izaberite bar jedno doba dana.'),
    engagement: !fi && !engagement.length && t('Izaberite bar jednu vrstu angažmana.'),
    rate: fi && (!from || !to ? requiredError() : !(a > 0 && b >= a) ? t('Cena „od" ne može biti veća od cene „do".') : null),
  };
  const save = () =>
    check.check(Object.values(errors)) &&
    onSave({ days: days.map(Number).sort(), slots, radius: Number(radius), ...(fi ? { rateMin: a, rateMax: b } : { engagement, abroad: abroad === 'yes' }) });
  return (
    <Frame open={open} title={t('Dostupnost')} onClose={onClose} onSave={save}>
      {!fi && (
        <Part label={t('Angažman')}>
          <ToggleGroup type="multiple" size="sm" className="flex-wrap" value={engagement} onValueChange={setEngagement} aria-label={t('Angažman')}>
            <ToggleGroupItem value="daily">{t('Dnevne posete')}</ToggleGroupItem>
            <ToggleGroupItem value="shift24">{t('Smena 24 h')}</ToggleGroupItem>
          </ToggleGroup>
          <FieldError>{check.show(errors.engagement)}</FieldError>
          {engagement.length === 2 && <PaneHint>{t('Smena od 24 sata je vaš prvi izbor, a otvoreni ste i za dnevne posete kod drugih korisnika kad niste na dužnosti.')}</PaneHint>}
        </Part>
      )}
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
      {slots.length > 1 && (
        <PaneHint>{t('Izborom više delova dana kažete da prihvatate pojedinačne smene u to vreme, a ne neprekidan rad ceo dan.')}</PaneHint>
      )}
      {!fi && <YesNo label={t('Rad u inostranstvu')} value={abroad} onChange={setAbroad} />}
      {!fi && <PaneHint>{t('Tržišna cena je oko 1.000 RSD na sat i oko 6.000 RSD za 24 sata.')}</PaneHint>}
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


// ── Serbia ──────────────────────────────────────────────────────────────────

function YesNo({ label, value, onChange }) {
  return (
    <Part label={label}>
      <ToggleGroup type="single" size="sm" value={value} onValueChange={(v) => v && onChange(v)} aria-label={label}>
        <ToggleGroupItem value="no">{t('Ne')}</ToggleGroupItem>
        <ToggleGroupItem value="yes">{t('Da')}</ToggleGroupItem>
      </ToggleGroup>
    </Part>
  );
}

export function QualificationsForm({ open, profile, onClose, onSave }) {
  const [education, setEducation] = useState(profile.education || '');
  const [certificate, setCertificate] = useState(profile.certificate ? 'yes' : 'no');
  const [courses, setCourses] = useState(profile.courses ? t(profile.courses) : '');
  const [bio, setBio] = useState(profile.bio ? t(profile.bio) : '');
  const check = useCheck();
  const errors = { education: !education && requiredError(), bio: !bio.trim() && requiredError() };
  const save = () => check.check(Object.values(errors)) && onSave({ education, certificate: certificate === 'yes', courses: courses.trim(), bio: bio.trim() });
  return (
    <Frame open={open} title={t('Kvalifikacije')} onClose={onClose} onSave={save}>
      <Field label={t('Obrazovanje')} required error={check.show(errors.education)}>
        <Select value={education} onChange={setEducation} options={EDUCATION.map((e) => ({ value: e, label: t(e) }))} />
      </Field>
      <YesNo label={t('Sertifikat akreditovane škole za negovateljice')} value={certificate} onChange={setCertificate} />
      <Field label={t('Kursevi')}>
        <Input value={courses} onChange={setCourses} placeholder={t('Naziv završenog kursa')} />
      </Field>
      <Field label={t('Iskustvo i veštine')} required error={check.show(errors.bio)}>
        <TextArea value={bio} onChange={setBio} rows={4} placeholder={t('Ukratko opišite iskustvo, posebno sa starijima, i šta vas čini pouzdanom.')} />
      </Field>
    </Frame>
  );
}

export function HealthForm({ open, profile, onClose, onSave }) {
  const yn = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, v ? 'yes' : 'no']));
  const [habits, setHabits] = useState(yn(profile.habits));
  const [health, setHealth] = useState(yn(profile.health));
  const [languages, setLanguages] = useState(profile.languages || []);
  const [readiness, setReadiness] = useState(profile.readiness || []);
  const [unwilling, setUnwilling] = useState(profile.unwilling || '');
  const bool = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === 'yes']));
  const save = () => onSave({ habits: bool(habits), health: bool(health), languages, readiness, unwilling: unwilling.trim() });
  return (
    <Frame open={open} title={t('Zdravlje i navike')} onClose={onClose} onSave={save}>
      {HABITS.map(([id, label]) => (
        <YesNo key={id} label={t(label)} value={habits[id] || 'no'} onChange={(v) => setHabits((h) => ({ ...h, [id]: v }))} />
      ))}
      <Part label={t('Jezici')}>
        <ToggleGroup type="multiple" size="sm" className="flex-wrap" value={languages} onValueChange={setLanguages} aria-label={t('Jezici')}>
          {LANGUAGES_OFFERED.map((l) => (
            <ToggleGroupItem key={l} value={l}>
              {t(l)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Part>
      {HEALTH_QUESTIONS.map(([id, label]) => (
        <YesNo key={id} label={t(label)} value={health[id] || 'no'} onChange={(v) => setHealth((h) => ({ ...h, [id]: v }))} />
      ))}
      <Part label={t('Spremnost za rad')}>
        <ToggleGroup type="multiple" size="sm" className="flex-wrap" value={readiness} onValueChange={setReadiness} aria-label={t('Spremnost za rad')}>
          {READINESS.map(([id, label]) => (
            <ToggleGroupItem key={id} value={id}>
              {t(label)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Part>
      <Field label={t('Šta ne želite da radite')}>
        <TextArea value={unwilling} onChange={setUnwilling} rows={2} placeholder={t('Npr. menjanje pelena, kupanje, rad sa nepokretnim osobama.')} />
      </Field>
    </Frame>
  );
}

export function EmergencyForm({ open, profile, onClose, onSave }) {
  const e = profile.emergency || {};
  const [name, setName] = useState(e.name || '');
  const [relation, setRelation] = useState(e.relation || '');
  const [phone, setPhone] = useState(e.phone || '');
  const [address, setAddress] = useState(e.address || '');
  const check = useCheck();
  const errors = { name: !name.trim() && requiredError(), relation: !relation && requiredError(), phone: !phone.trim() && requiredError(), address: !address.trim() && requiredError() };
  const save = () => check.check(Object.values(errors)) && onSave({ emergency: { name: name.trim(), relation, phone: phone.trim(), address: address.trim() } });
  return (
    <Frame open={open} title={t('Kontakt za hitne slučajeve')} onClose={onClose} onSave={save}>
      <PaneHint>{t('Ova osoba se kontaktira ako ne možemo da vas dobijemo ili ako je broj pogrešan.')}</PaneHint>
      <Field label={t('Ime i prezime')} required error={check.show(errors.name)}>
        <Input value={name} onChange={setName} />
      </Field>
      <Field label={t('Srodstvo')} required error={check.show(errors.relation)}>
        <Select value={relation} onChange={setRelation} options={RELATIONS.map((r) => ({ value: r, label: t(r) }))} />
      </Field>
      <Field label={t('Telefon')} required error={check.show(errors.phone)}>
        <Input value={phone} onChange={setPhone} type="tel" />
      </Field>
      <Field label={t('Adresa')} required error={check.show(errors.address)}>
        <Input value={address} onChange={setAddress} />
      </Field>
    </Frame>
  );
}
