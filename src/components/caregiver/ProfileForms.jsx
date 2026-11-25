import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaneHint } from '@/components/pane';
import Dialog from '../Dialog';
import { formGap } from './Forms';
import { Checks, Combobox, Field, FieldError, Input, Phone, Select, TextArea, requiredError, useCheck } from '../TextField';
import { dialOf, splitPhone } from '../../data/countries';
import { EXAMPLE } from '../../data/caregiverSignUp';
import { Slider } from '@/components/ui/slider';
import { SLOTS } from '../../data/carePlan';
import { DAYS, EDUCATION, EDUCATION_SR, educationText, HABITS, HEALTH_DETAILS, HEALTH_QUESTIONS, READINESS, languageOptions, RELATIONS, municipalityGroups } from '../../data/caregiverProfile';
import Tags, { Group, Groups } from '../Tags';
import { t } from '@/i18n';

// The fields of her profile, each group in its own dialog: "Izmenite" on a card
// of "Moj profil" opens one (docs/superpowers/specs/2026-10-19-negovateljica-finska-design.md).
// The sign-up (part 5) asks the same fields, as steps. Nothing is disabled for
// what is missing; errors show on the press (docs/patterns.md §9, §10).

// `description`: what the dialog is about, in its head, clear of the X's
// column (docs/patterns.md §7), never as the first line of the form
function Frame({ open, title, description, onClose, onSave, children }) {
  return (
    // the questions 24 apart, as every form in a dialog (decided 11. 11.)
    <Dialog open={open} title={title} description={description} className={formGap} onClose={onClose}>
      {children}
      <DialogFooter>
        <Button onClick={onSave}>{t('Sačuvaj')}</Button>
      </DialogFooter>
    </Dialog>
  );
}

// the country a number is from by default: her market's
const homeCountry = (profile) => (profile.market === 'RS' ? 'RS' : 'FI');
// the sign-up's examples in the empty fields, for her market (caregiverSignUp.js)
const example = (profile) => EXAMPLE[profile.market === 'RS' ? 'sr' : 'fi'];
// as the sign-up checks it (caregiverSignUp.js): empty, or too short to be whole
const phoneError = (v) => (!v.trim() ? requiredError() : v.replace(/\D/g, '').length < 6 ? t('Unesite ceo broj telefona.') : null);
const wholePhone = (country, number) => `${dialOf(country)} ${number.trim()}`;

export function PersonalForm({ open, profile, email, onClose, onSave }) {
  const [address, setAddress] = useState(profile.address || '');
  const [area, setArea] = useState(profile.area || '');
  // the code and the number apart, as on the sign-up (Phone), kept whole
  const [{ country, number: phone }, setPhone] = useState(() => splitPhone(profile.phone, homeCountry(profile)));
  const check = useCheck();
  const errors = { address: !address.trim() && requiredError(), area: !area.trim() && requiredError(), phone: phoneError(phone) };
  const save = () => check.check(Object.values(errors)) && onSave({ address: address.trim(), area: area.trim(), phone: wholePhone(country, phone) });
  return (
    <Frame open={open} title={t('Lični podaci')} onClose={onClose} onSave={save}>
      {/* what is not changed, said here too, so its absence from the fields
          is not a question (decided 22. 11., Branislav): one sentence for all */}
      <Groups>
        <Group label={t('Ime')} text={profile.name} />
        <Group label={t('Datum rođenja')} text={profile.birth || '-'} />
        {email && <Group label={t('E-mail')} text={email} />}
        <PaneHint>{t('Ime, datum rođenja i e-mail ne mogu da se menjaju.')}</PaneHint>
      </Groups>
      <Field label={t('Prebivalište')} required error={check.show(errors.address)}>
        <Input value={address} onChange={setAddress} placeholder={example(profile).address} />
      </Field>
      <Field label={t('Opština')} required error={check.show(errors.area)}>
        <Combobox value={area} onChange={setArea} groups={municipalityGroups(profile.market === 'RS' ? 'sr' : 'fi')} placeholder={t('Pretražite opštine')} searchPlaceholder={t('Pretražite opštine')} />
      </Field>
      <Field label={t('Telefon')} required labelId="pf-phone" error={check.show(errors.phone)}>
        <Phone country={country} onCountry={(v) => setPhone((p) => ({ ...p, country: v }))} value={phone} onChange={(v) => setPhone((p) => ({ ...p, number: v }))} labelledBy="pf-phone" />
      </Field>
    </Frame>
  );
}

export function ProfessionForm({ open, profile, onClose, onSave }) {
  const [education, setEducation] = useState(profile.education || '');
  const [languages, setLanguages] = useState(profile.languages || []);
  const [bio, setBio] = useState(profile.bio ? t(profile.bio) : '');
  const check = useCheck();
  const errors = { education: !education && requiredError(), languages: !languages.length && requiredError(), bio: !bio.trim() && requiredError() };
  const save = () => check.check(Object.values(errors)) && onSave({ education, languages, bio: bio.trim() });
  return (
    <Frame open={open} title={t('Profesija')} onClose={onClose} onSave={save}>
      {/* shown, not only spoken of: what she has, why it is not changed
          here, and where its documents are (decided 22. 11., Branislav) */}
      {profile.classifications?.length > 0 && (
        <Groups>
          <Tags label={t('Klasifikacije')} items={profile.classifications} />
          <PaneHint>{t('Kontaktirajte koordinatorku radi promene klasifikacija.')}</PaneHint>
        </Groups>
      )}
      <Field label={t('Nivo obrazovanja')} required error={check.show(errors.education)}>
        <Select value={education} onChange={setEducation} placeholder={t('Izaberite nivo obrazovanja')} options={EDUCATION.map((e) => ({ value: e, label: t(e) }))} />
      </Field>
      <Checks label={t('Jezici koje govorite')} required error={check.show(errors.languages)} value={languages} onChange={setLanguages} options={languageOptions(profile.market, profile.languages).map((o) => [o.value, o.label])} />
      <Field label={t('Biografija')} required error={check.show(errors.bio)}>
        <TextArea value={bio} onChange={setBio} rows={4} placeholder={t('Ukratko opišite iskustvo, posebno sa starijima, i šta vas čini pouzdanom.')} />
      </Field>
    </Frame>
  );
}

// how far she will go, up to 200: the end of the line is "200+", anywhere
// farther too (as on production)
export const RADIUS_MAX = 200;
export const radiusText = (km, upTo) => (km >= RADIUS_MAX ? t('{km}+ km', { km: RADIUS_MAX }) : upTo ? t('do {km} km', { km }) : t('{km} km', { km }));

// how far she will go: a line she drags, the distance beside its label
export function Radius({ value, onChange }) {
  return (
    <Field label={t('Gde želite da radite? (radijus)')}>
      <div className="flex items-center gap-3">
        <Slider value={[value]} min={1} max={RADIUS_MAX} step={1} onValueChange={([v]) => onChange(v)} aria-label={t('Radijus')} className="flex-1" />
        <span className="min-w-14 shrink-0 whitespace-nowrap text-right text-xs font-medium text-foreground tabular-nums">{radiusText(value)}</span>
      </div>
    </Field>
  );
}


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
    days: !days.length && requiredError(),
    slots: !slots.length && requiredError(),
    engagement: !fi && !engagement.length && requiredError(),
    rate: fi && (!from || !to ? requiredError() : !(a > 0 && b >= a) ? t('Cena „od" ne može biti veća od cene „do".') : null),
  };
  const save = () =>
    check.check(Object.values(errors)) &&
    onSave({ days: days.map(Number).sort(), slots, radius: Number(radius), ...(fi ? { rateMin: a, rateMax: b } : { engagement, abroad: abroad === 'yes' }) });
  return (
    <Frame open={open} title={t('Dostupnost')} onClose={onClose} onSave={save}>
      {!fi && (
        <Field label={t('Angažman')} required>
          <ToggleGroup type="multiple" size="sm" className="flex-wrap" value={engagement} onValueChange={setEngagement} aria-label={t('Angažman')}>
            <ToggleGroupItem value="daily">{t('Dnevne posete')}</ToggleGroupItem>
            <ToggleGroupItem value="shift24">{t('Smena 24 h')}</ToggleGroupItem>
          </ToggleGroup>
          <FieldError>{check.show(errors.engagement)}</FieldError>
          {engagement.length === 2 && <PaneHint>{t('Smena od 24 sata je vaš prvi izbor, a otvoreni ste i za dnevne posete kod drugih korisnika kad niste na dužnosti.')}</PaneHint>}
        </Field>
      )}
      <Field label={t('Dani')} required>
        {/* seven in a row, on a phone four then three, each as wide as its cell (§10) */}
        <ToggleGroup type="multiple" size="sm" className="grid grid-cols-7 *:w-full phone:grid-cols-4" value={days} onValueChange={setDays} aria-label={t('Dani')}>
          {DAYS.map((d, i) => (
            <ToggleGroupItem key={i} value={String(i)}>
              {t(d)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <FieldError>{check.show(errors.days)}</FieldError>
      </Field>
      <Field label={t('Doba dana')} required>
        <ToggleGroup type="multiple" size="sm" className="flex-wrap" value={slots} onValueChange={setSlots} aria-label={t('Doba dana')}>
          {Object.entries(SLOTS).map(([id, s]) => (
            <ToggleGroupItem key={id} value={id}>
              {`${t(s.label)} ${s.hours}`}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <FieldError>{check.show(errors.slots)}</FieldError>
        {/* with the choice it changes the meaning of, plain as the one under
            "Angažman" (decided 22. 11., Branislav; was a grey tile) */}
        {slots.length > 1 && <PaneHint>{t('Izborom više delova dana kažete da prihvatate pojedinačne smene u to vreme, a ne neprekidan rad ceo dan.')}</PaneHint>}
      </Field>
      {/* in the sign-up's order (22. 11., Branislav): abroad, then the radius */}
      {!fi && <YesNo label={t('Rad u inostranstvu')} value={abroad} onChange={setAbroad} />}
      <Radius value={Number(radius)} onChange={(v) => setRadius(String(v))} />
      {!fi && <PaneHint>{t('Tržišna cena je oko 1.000 RSD na sat i oko 6.000 RSD za 24 sata.')}</PaneHint>}
      {fi && (
        <Field label={t('Cena po satu, od - do')} required hint={t('Tržišna cena je oko 15–25 € / h.')} error={check.show(errors.rate)}>
          <div className="grid grid-cols-2 gap-3">
            <Input value={from} onChange={setFrom} inputMode="decimal" suffix="€/h" placeholder="15" aria-label={t('Od')} />
            <Input value={to} onChange={setTo} inputMode="decimal" suffix="€/h" placeholder="25" aria-label={t('Do')} />
          </div>
        </Field>
      )}
    </Frame>
  );
}


// ── Serbia ──────────────────────────────────────────────────────────────────

function YesNo({ label, value, onChange }) {
  return (
    <Field label={label}>
      {/* two chips as wide as a day, as on the sign-up (§10, "Čip u formi nije uži od jednog dana") */}
      <ToggleGroup type="single" size="sm" value={value} onValueChange={(v) => v && onChange(v)} aria-label={label}>
        <ToggleGroupItem value="no">{t('Ne')}</ToggleGroupItem>
        <ToggleGroupItem value="yes">{t('Da')}</ToggleGroupItem>
      </ToggleGroup>
    </Field>
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
      <Field label={t('Nivo obrazovanja')} required error={check.show(errors.education)}>
        <Select value={education} onChange={setEducation} placeholder={t('Izaberite nivo obrazovanja')} options={EDUCATION_SR.map((e) => ({ value: e, label: educationText(e, true) }))} />
      </Field>
      <YesNo label={t('Sertifikat akreditovane škole za negovateljice')} value={certificate} onChange={setCertificate} />
      <Field label={t('Kursevi')}>
        <Input value={courses} onChange={setCourses} placeholder={t('Naziv završenog kursa')} />
      </Field>
      <Field label={t('Opis radnog iskustva i veština')} required error={check.show(errors.bio)}>
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
  const [notes, setNotes] = useState(profile.healthNotes || {});
  // the question just answered "Da", whose field takes the focus as it comes
  const [asked, setAsked] = useState(null);
  const bool = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === 'yes']));
  const check = useCheck();
  const noLanguage = !languages.length && requiredError();
  const noteError = (id) => HEALTH_DETAILS[id] && health[id] === 'yes' && !(notes[id] || '').trim() && requiredError();
  const save = () =>
    check.check([noLanguage, ...HEALTH_QUESTIONS.map(([id]) => noteError(id))]) &&
    onSave({
      habits: bool(habits),
      health: bool(health),
      // only what a "Da" still stands behind
      healthNotes: Object.fromEntries(Object.entries(notes).filter(([id]) => health[id] === 'yes').map(([id, v]) => [id, v.trim()])),
      languages,
      readiness,
      unwilling: unwilling.trim(),
    });
  return (
    <Frame open={open} title={t('Zdravlje i navike')} onClose={onClose} onSave={save}>
      {HABITS.map(([id, label]) => (
        <YesNo key={id} label={t(label)} value={habits[id] || 'no'} onChange={(v) => setHabits((h) => ({ ...h, [id]: v }))} />
      ))}
      <Checks label={t('Jezici koje govorite')} required error={check.show(noLanguage)} value={languages} onChange={setLanguages} options={languageOptions(profile.market, profile.languages).map((o) => [o.value, o.label])} />
      {/* a "Da" on allergies, a limit or a health problem asks what it is,
          12 under the answer, and takes the focus (as on the sign-up) */}
      {HEALTH_QUESTIONS.map(([id, label]) => (
        <div key={id} className="flex flex-col gap-3">
          <YesNo
            label={t(label)}
            value={health[id] || 'no'}
            onChange={(v) => {
              setHealth((h) => ({ ...h, [id]: v }));
              setAsked(v === 'yes' ? id : null);
            }}
          />
          {HEALTH_DETAILS[id] && health[id] === 'yes' && (
            <Field error={check.show(noteError(id))}>
              <TextArea autoFocus={asked === id} rows={2} value={notes[id] || ''} onChange={(v) => setNotes((n) => ({ ...n, [id]: v }))} placeholder={t(HEALTH_DETAILS[id])} aria-label={t(label)} />
            </Field>
          )}
        </div>
      ))}
      {/* boxes, as on the sign-up: more than one answer is a checkbox (§10) */}
      <Checks label={t('Spremnost za rad')} value={readiness} onChange={setReadiness} options={READINESS.map(([id, l]) => [id, t(l)])} />
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
  const [{ country, number: phone }, setPhone] = useState(() => splitPhone(e.phone, homeCountry(profile)));
  const [address, setAddress] = useState(e.address || '');
  const check = useCheck();
  // the number as the sign-up asks it: only that it is there and whole enough
  const errors = { name: !name.trim() && requiredError(), relation: !relation && requiredError(), phone: phone.replace(/\D/g, '').length < 6 && requiredError(), address: !address.trim() && requiredError() };
  const save = () => check.check(Object.values(errors)) && onSave({ emergency: { name: name.trim(), relation, phone: wholePhone(country, phone), address: address.trim() } });
  return (
    <Frame open={open} title={t('Kontakt za hitne slučajeve')} description={t('Ova osoba se kontaktira ako ne možemo da vas dobijemo ili ako je broj pogrešan.')} onClose={onClose} onSave={save}>
      <Field label={t('Ime i prezime')} required error={check.show(errors.name)}>
        <Input value={name} onChange={setName} placeholder={example(profile).emergencyName} />
      </Field>
      <Field label={t('Srodstvo')} required error={check.show(errors.relation)}>
        <Select value={relation} onChange={setRelation} placeholder={t('Majka, otac, sestra i sl.')} options={RELATIONS.map((r) => ({ value: r, label: t(r) }))} />
      </Field>
      <Field label={t('Telefon')} required labelId="pf-e-phone" error={check.show(errors.phone)}>
        <Phone country={country} onCountry={(v) => setPhone((p) => ({ ...p, country: v }))} value={phone} onChange={(v) => setPhone((p) => ({ ...p, number: v }))} labelledBy="pf-e-phone" />
      </Field>
      <Field label={t('Adresa')} required error={check.show(errors.address)}>
        <Input value={address} onChange={setAddress} placeholder={example(profile).emergencyAddress} />
      </Field>
    </Frame>
  );
}
