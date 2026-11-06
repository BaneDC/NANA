import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Note, PaneHint } from '@/components/pane';
import { StepCard, StepCards } from '@/components/StepCards';
import PersonalityTest from './PersonalityTest';
import { Actions, Consent, FormCard, Welcome, column } from '../Register';
import { Radius } from '../../components/caregiver/ProfileForms';
import { Combobox, DateInput, Field, FieldError, FileField, Input, MultiCombobox, Password, Phone, Select, TextArea, requiredError, useCheck } from '../../components/TextField';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { saveAccount } from '../../lib/account';
import { dialOf } from '../../data/countries';
import { CLASSIFICATIONS, STEPS, afterSteps, documentsNeeded, emptyForm, recordFrom, stepErrors } from '../../data/caregiverSignUp';
import { DAYS, EDUCATION, EDUCATION_SR, educationText, HABITS, HEALTH_QUESTIONS, LANGUAGES_OFFERED, READINESS, RELATIONS, municipalityGroups } from '../../data/caregiverProfile';
import { SLOTS, daysText } from '../../data/carePlan';
import { locale, msg, t } from '@/i18n';

// The caregiver's sign-up (docs/superpowers/specs/2026-10-19-registracija-negovateljice-design.md):
// where she wants to work, her account, the parts of the form for that market
// on one page, then her documents (Finland) or the personality test (Serbia),
// the channel for the talk with the coordinator, and thanks. Every screen is in
// the sign-up's own frame (Register.jsx): a title, grey panels with the fields,
// the buttons under them. The form's parts are step cards (docs/patterns.md
// §10): one open, the ones done folded into a row with their answers. Errors
// show on "Dalje", the first wrong field takes the focus (§10).

const emailError = (v) => (!v.trim() ? requiredError() : /^\S+@\S+\.\S+$/.test(v.trim()) ? null : t('Unesite ispravnu email adresu.'));
const CHANNELS = [
  ['whatsapp', 'WhatsApp'],
  ['viber', 'Viber'],
  ['meet', msg('Google Meet ili Zoom')],
];

// cols: the chips in a grid, each as wide as its cell (docs/patterns.md §10),
// for short answers; long ones keep wrapping
function Chips({ label, value, onChange, options, multiple = true, required, error, cols }) {
  return (
    <Field label={label} required={required}>
      <ToggleGroup
        type={multiple ? 'multiple' : 'single'}
        size="sm"
        className={cols ? `grid *:w-full ${cols}` : 'flex-wrap'}
        value={value}
        onValueChange={(v) => (multiple ? onChange(v) : v && onChange(v))}
        aria-label={label}
      >
        {options.map(([id, text]) => (
          <ToggleGroupItem key={id} value={id}>
            {text}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

const yesNo = [
  ['no', msg('Ne')],
  ['yes', msg('Da')],
];
// two answers, so two equal columns, wherever it is in the form
function YesNo({ label, value, onChange }) {
  return <Chips label={label} cols="grid-cols-2" multiple={false} value={value ? 'yes' : 'no'} onChange={(v) => onChange(v === 'yes')} options={yesNo.map(([k, l]) => [k, t(l)])} />;
}

export default function CaregiverSignUp({ onDone, onBack, onForm }) {
  const [screen, setScreen] = useState('country');
  const [market, setMarket] = useState(null);
  const [f, setF] = useState(null);
  const [account, setAccount] = useState({ email: '', password: '', processing: false, accuracy: false });
  // the application, saved on "Zakaži razgovor": kept even if the tab closes on
  // the thanks; a second press does not make a second one
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState(false);
  const check = useCheck();
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  // past the country and the account it is a form: the page drops its photos
  useEffect(() => {
    onForm?.(!['country', 'account'].includes(screen));
    return () => onForm?.(false);
  }, [screen, onForm]);
  // the form's parts, which one is open, and the ones done
  const parts = market ? STEPS[market] : [];
  const [open, setOpen] = useState(0);
  const [done, setDone] = useState([]);
  const at = screen === 'form' ? parts[open]?.id : screen;
  const errors = f ? stepErrors(at, f) : {};
  const show = (k) => check.show(errors[k]);
  const wrong = (id) => Object.values(stepErrors(id, f)).some(Boolean);
  // the parts go in order: a part opens, or shows as done, only when every
  // part before it is done; the next one is the first not done
  const reached = (i, list = done) => parts.slice(0, i).every((p) => list.includes(p.id));
  const firstOpen = (list = done) => {
    const i = parts.findIndex((p) => !list.includes(p.id));
    return i >= 0 ? i : null;
  };
  const setE = (patch) => set({ emergency: { ...f.emergency, ...patch } });

  const next = () => {
    if (screen === 'account') {
      const e = [emailError(account.email), account.password.length < 8 && t('Kratka je - treba najmanje 8 karaktera.'), !account.processing && requiredError(), !account.accuracy && requiredError()];
      if (!check.check(e)) return;
      check.reset();
      setOpen(firstOpen());
      return setScreen('form');
    }
    if (!check.check(Object.values(errors))) return;
    check.reset();
    const order = ['form', ...afterSteps(f)];
    const i = order.indexOf(screen);
    setScreen(order[i + 1]);
    window.scrollTo?.(0, 0);
  };
  const back = () => {
    check.reset();
    const order = ['account', 'form', ...afterSteps(f || {})];
    const i = order.indexOf(screen);
    setScreen(i > 0 ? order[i - 1] : 'country');
  };
  // "Dalje" in a part: only that part is checked; then it folds, and the next
  // one not done yet opens
  const partNext = (i) => {
    if (!check.check(Object.values(stepErrors(parts[i].id, f)))) return;
    check.reset();
    const now = done.includes(parts[i].id) ? done : [...done, parts[i].id];
    setDone(now);
    setOpen(firstOpen(now));
  };
  // the part left open folds as done when it is right, and as not done when
  // it is not, whichever way it was left
  const leave = (now = done) => {
    const was = parts[open]?.id;
    if (!was) return now;
    return wrong(was) ? now.filter((x) => x !== was) : now.includes(was) ? now : [...now, was];
  };
  // a row opens its part again: back to any part, and on only past parts that
  // are done; the part open, when it is not right, keeps you with its errors
  const openPart = (i) => {
    const was = parts[open]?.id;
    if (was && i > open && wrong(was)) {
      check.check(Object.values(stepErrors(was, f)));
      return;
    }
    const now = leave();
    if (!reached(i, now)) return;
    check.reset();
    setDone(now);
    setOpen(i);
  };
  // the page's button: on, or the first part that is not right opens with its
  // errors, and every part that is right folds as done
  const sendForm = () => {
    const bad = parts.findIndex((p) => wrong(p.id));
    const right = parts.filter((p) => !wrong(p.id)).map((p) => p.id);
    setDone(right);
    if (bad < 0) {
      check.reset();
      setOpen(null);
      setScreen(afterSteps(f)[0]);
      window.scrollTo?.(0, 0);
      return;
    }
    setOpen(bad);
    check.check(Object.values(stepErrors(parts[bad].id, f)));
  };
  const submit = async () => {
    if (busy || sent) return;
    if (!check.check(Object.values(errors))) return;
    setBusy(true);
    const id = `reg-${Date.now()}`;
    const record = recordFrom(f, id, account.email.trim());
    const user = {
      role: 'caregiver',
      caregiverId: id,
      status: 'interview',
      channel: f.channel,
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      name: record.name,
      email: account.email.trim(),
      phone: f.phone.trim(),
      country: record.market,
      registeredAt: new Date().toISOString(),
      // her record too, so signing in again puts it back where families look
      record,
    };
    await saveAccount(user, account.password);
    setSent({ user, record });
    setBusy(false);
    check.reset();
    setScreen('thanks');
  };

  const footer = (label = t('Dalje'), onNext = next) => (
    <Actions>
      <Button size="lg" className="w-full" onClick={onNext}>
        {label}
      </Button>
      <Button variant="secondary" size="lg" className="w-full" onClick={back}>
        {t('Nazad')}
      </Button>
    </Actions>
  );

  if (screen === 'country')
    return (
      <>
        <Welcome title={t('Gde želite da radite?')} sub={t('Izaberite zemlju u kojoj želite da negujete starije.')} />
        <Actions>
          {[
            ['sr', t('Srbija')],
            ['fi', t('Finska')],
          ].map(([id, label]) => (
            <Button
              key={id}
              size="lg"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setMarket(id);
                setF(emptyForm(id));
                setScreen('account');
              }}
            >
              {label}
            </Button>
          ))}
          <Button variant="ghost" size="lg" onClick={onBack}>
            {t('Nazad')}
          </Button>
        </Actions>
      </>
    );

  if (screen === 'account')
    return (
      <>
        <Welcome title={t('Prijavite se kao negovateljica')} sub={t('Unesite podatke da započnete prijavu.')} />
        <FormCard>
          <Field label={t('Email')} required error={check.show(emailError(account.email))}>
            <Input value={account.email} onChange={(v) => setAccount((a) => ({ ...a, email: v }))} type="email" autoComplete="email" />
          </Field>
          <Field label={t('Lozinka')} required error={check.show(account.password.length < 8 && t('Kratka je - treba najmanje 8 karaktera.'))}>
            <Password value={account.password} onChange={(v) => setAccount((a) => ({ ...a, password: v }))} autoComplete="new-password" />
          </Field>
          <Consent required checked={account.processing} onChange={(v) => setAccount((a) => ({ ...a, processing: v }))} error={check.show(!account.processing && requiredError())}>
            {t('Saglasna sam sa obradom podataka')}
          </Consent>
          <Consent required checked={account.accuracy} onChange={(v) => setAccount((a) => ({ ...a, accuracy: v }))} error={check.show(!account.accuracy && requiredError())}>
            {t('Potvrđujem da su podaci tačni')}
          </Consent>
        </FormCard>
        {footer(t('Nastavi'))}
      </>
    );

  const sr = market === 'sr';
  const n = (id) => parts.findIndex((p) => p.id === id) + 1;

  // what each part holds, in the open card
  const body = {
    basic: (
      <>
        <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
          <Field label={t('Vaše ime')} required error={show('firstName')}>
            <Input value={f.firstName} onChange={(v) => set({ firstName: v })} placeholder="Sarah" autoComplete="given-name" />
          </Field>
          <Field label={t('Vaše prezime')} required error={show('lastName')}>
            <Input value={f.lastName} onChange={(v) => set({ lastName: v })} placeholder="Doe" autoComplete="family-name" />
          </Field>
        </div>
        <Field label={t('Datum rođenja')} required error={show('birth')}>
          {/* years back: month and year as dropdowns in the calendar */}
          {/* opens on today; someone under 18 is told so under the field
              (docs/patterns.md §10), the days are not switched off */}
          <DateInput
            value={f.birth ? new Date(f.birth) : null}
            onChange={(d) => set({ birth: d.getTime() })}
            from={new Date(1920, 0, 1)}
            to={new Date()}
            today={new Date()}
            pickYear
            placeholder={t('Izaberite datum rođenja')}
          />
        </Field>
        <Field label={t('Prebivalište')} required error={show('address')}>
          <Input value={f.address} onChange={(v) => set({ address: v })} placeholder={t('Unesite adresu iz lične karte')} />
        </Field>
        <Field label={t('Opština')} required error={show('area')}>
          <Combobox value={f.area} onChange={(v) => set({ area: v })} groups={municipalityGroups(market)} placeholder={t('Pretražite opštine')} searchPlaceholder={t('Pretražite opštine')} />
        </Field>
        <Field label={t('Broj telefona')} required labelId="su-phone" error={show('phone')}>
          <Phone country={f.phoneCountry} onCountry={(v) => set({ phoneCountry: v })} value={f.phone} onChange={(v) => set({ phone: v })} labelledBy="su-phone" />
        </Field>
      </>
    ),
    profession: (
      <>
        {/* each classification with what it is and whether it needs a
            document, together: a grey row each in the white card; the hint
            on documents goes with them, under the same line */}
        <div className="flex flex-col gap-3">
          <Field label={t('Klasifikacije')} required hint={t('Izaberite sve koje važe. Za neke klasifikacije treba priložiti sertifikat.')} error={show('classifications')}>
            <div className="flex flex-col gap-2">
              {CLASSIFICATIONS.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-start gap-3 rounded-lg bg-muted p-3">
                  <Checkbox
                    checked={f.classifications.includes(c.id)}
                    onCheckedChange={(on) => set({ classifications: on ? [...f.classifications, c.id] : f.classifications.filter((x) => x !== c.id) })}
                    className="mt-0.5"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-xs font-medium text-foreground">{c.id}</span>
                    <span className="text-xs leading-body text-muted-foreground">{t(c.text)}</span>
                  </span>
                  <Badge variant={c.document ? 'warning' : 'secondary'}>{c.document ? t('Potreban sertifikat') : t('Bez dokumenta')}</Badge>
                </label>
              ))}
            </div>
          </Field>
          {documentsNeeded(f).length > 0 && <PaneHint>{t('Sertifikate za označene klasifikacije prilažete u sledećem delu prijave.')}</PaneHint>}
        </div>
        <Field label={t('Nivo obrazovanja')} required error={show('education')}>
          <Select value={f.education} onChange={(v) => set({ education: v })} placeholder={t('Izaberite nivo obrazovanja')} options={EDUCATION.map((e) => ({ value: e, label: t(e) }))} />
        </Field>
        <Field label={t('Jezici koje govorite')}>
          <MultiCombobox values={f.languages} onChange={(v) => set({ languages: v })} options={LANGUAGES_OFFERED.map((l) => ({ value: l, label: t(l) }))} placeholder={t('Engleski, nemački, švedski…')} />
        </Field>
        <Field label={t('Biografija')} required error={show('bio')}>
          <TextArea value={f.bio} onChange={(v) => set({ bio: v })} rows={4} placeholder={t('Ukratko opišite iskustvo, posebno sa starijima, i šta vas čini pouzdanom.')} />
        </Field>
      </>
    ),
    qualifications: (
      <>
        <Field label={t('Nivo obrazovanja')} required error={show('education')}>
          <Select value={f.education} onChange={(v) => set({ education: v })} placeholder={t('Izaberite nivo obrazovanja')} options={EDUCATION_SR.map((e) => ({ value: e, label: educationText(e, true) }))} />
        </Field>
        <YesNo label={t('Sertifikat akreditovane škole za negovateljice')} value={f.certificate} onChange={(v) => set({ certificate: v })} />
        <Field label={t('Kursevi')}>
          <Input value={f.courses} onChange={(v) => set({ courses: v })} placeholder={t('Naziv završenog kursa')} />
        </Field>
        <Field label={t('Opis radnog iskustva i veština')} required error={show('bio')}>
          <TextArea value={f.bio} onChange={(v) => set({ bio: v })} rows={4} placeholder={t('Ukratko opišite iskustvo, posebno sa starijima, i šta vas čini pouzdanom.')} />
        </Field>
      </>
    ),
    availability: (
      <>
        {sr && (
          <div className="flex flex-col gap-3">
            <Chips
              label={t('Angažman')}
              required
              cols="grid-cols-2"
              value={f.engagement}
              onChange={(v) => set({ engagement: v })}
              options={[
                ['daily', t('Dnevne posete')],
                ['shift24', t('Smena 24 h')],
              ]}
              error={show('engagement')}
            />
            {f.engagement.length === 2 && <PaneHint>{t('Smena od 24 sata je vaš prvi izbor, a otvoreni ste i za dnevne posete kod drugih korisnika kad niste na dužnosti.')}</PaneHint>}
          </div>
        )}
        <Chips label={t('Koje dane želite da radite?')} required cols="grid-cols-7 phone:grid-cols-4" value={f.days} onChange={(v) => set({ days: v })} options={DAYS.map((d, i) => [String(i), t(d)])} error={show('days')} />
        <div className="flex flex-col gap-3">
          <Chips
            label={t('Izaberite raspored koji vam najviše odgovara')}
            required
            cols="grid-cols-2"
            value={f.slots}
            onChange={(v) => set({ slots: v })}
            options={Object.entries(SLOTS).map(([id, s]) => [id, `${t(s.label)} ${s.hours}`])}
            error={show('slots')}
          />
          {/* easy to miss as small grey text, and it changes what the choice means */}
          {f.slots.length > 1 && <Note>{t('Izborom više delova dana kažete da prihvatate pojedinačne smene u to vreme, a ne neprekidan rad ceo dan.')}</Note>}
        </div>
        {sr && <YesNo label={t('Rad u inostranstvu')} value={f.abroad} onChange={(v) => set({ abroad: v })} />}
        <Radius value={f.radius} onChange={(v) => set({ radius: v })} />
        {sr ? (
          <PaneHint>{t('Tržišna cena je oko 1.000 RSD na sat i oko 6.000 RSD za 24 sata.')}</PaneHint>
        ) : (
          <Field label={t('Cena koju naplaćujete za negu starijih (EUR/sat)')} required hint={t('Tržišna cena je oko 15–25 € / h.')} error={show('rate')}>
            <div className="grid grid-cols-2 gap-3">
              <Input value={f.rateMin} onChange={(v) => set({ rateMin: v })} inputMode="decimal" suffix="€/h" placeholder="15" aria-label={t('Od')} />
              <Input value={f.rateMax} onChange={(v) => set({ rateMax: v })} inputMode="decimal" suffix="€/h" placeholder="25" aria-label={t('Do')} />
            </div>
          </Field>
        )}
      </>
    ),
    health: (
      <>
        {HABITS.map(([id, label]) => (
          <YesNo key={id} label={t(label)} value={f.habits[id]} onChange={(v) => set({ habits: { ...f.habits, [id]: v } })} />
        ))}
        <Field label={t('Jezici koje govorite')}>
          <MultiCombobox values={f.languages} onChange={(v) => set({ languages: v })} options={LANGUAGES_OFFERED.map((l) => ({ value: l, label: t(l) }))} placeholder={t('Engleski, nemački, švedski…')} />
        </Field>
        {HEALTH_QUESTIONS.map(([id, label]) => (
          <YesNo key={id} label={t(label)} value={f.health[id]} onChange={(v) => set({ health: { ...f.health, [id]: v } })} />
        ))}
        <Chips label={t('Spremnost za rad')} value={f.readiness} onChange={(v) => set({ readiness: v })} options={READINESS.map(([id, l]) => [id, t(l)])} />
        <Field label={t('Šta ne želite da radite')}>
          <TextArea value={f.unwilling} onChange={(v) => set({ unwilling: v })} rows={2} placeholder={t('Npr. menjanje pelena, kupanje, rad sa nepokretnim osobama.')} />
        </Field>
      </>
    ),
    emergency: (
      <>
        <Field label={t('Ime i prezime')} required error={show('emergencyName')}>
          <Input value={f.emergency.name} onChange={(v) => setE({ name: v })} placeholder={t('Unesite ime i prezime')} />
        </Field>
        <Field label={t('Srodstvo')} required error={show('emergencyRelation')}>
          <Select value={f.emergency.relation} onChange={(v) => setE({ relation: v })} placeholder={t('Majka, otac, sestra i sl.')} options={RELATIONS.map((r) => ({ value: r, label: t(r) }))} />
        </Field>
        <Field label={t('Broj telefona')} required labelId="su-e-phone" error={show('emergencyPhone')}>
          <Phone country={f.emergency.phoneCountry} onCountry={(v) => setE({ phoneCountry: v })} value={f.emergency.phone} onChange={(v) => setE({ phone: v })} labelledBy="su-e-phone" />
        </Field>
        <Field label={t('Adresa')} required error={show('emergencyAddress')}>
          <Input value={f.emergency.address} onChange={(v) => setE({ address: v })} />
        </Field>
      </>
    ),
  };
  // what a part folded into its row says it holds
  const summary = {
    basic: [`${f.firstName} ${f.lastName}`.trim(), f.area, f.phone && `${dialOf(f.phoneCountry)} ${f.phone}`, f.birth && new Date(f.birth).toLocaleDateString(locale()), f.address],
    profession: [...f.classifications, f.education && t(f.education)],
    qualifications: [f.education && educationText(f.education, true), f.certificate && t('Sertifikat negovateljice'), f.courses],
    availability: [
      ...(sr ? f.engagement.map((e) => (e === 'daily' ? t('Dnevne posete') : t('Smena 24 h'))) : []),
      f.days.length > 0 && daysText(f.days.map(Number).sort()),
      ...f.slots.map((s) => t(SLOTS[s].label)),
      t('do {km} km', { km: f.radius }),
    ],
    health: [...f.languages.map((l) => t(l)), ...READINESS.filter(([id]) => f.readiness.includes(id)).map(([, l]) => t(l))],
    emergency: [f.emergency.name, f.emergency.relation && t(f.emergency.relation)],
  };
  const sub = {
    emergency: t('Ova osoba se kontaktira ako ne možemo da vas dobijemo ili ako je broj pogrešan.'),
  };

  if (screen === 'form')
    return (
      <>
        <Welcome title={t('Vaši podaci')} sub={t('Za popunjavanje treba 10 do 20 minuta.')} />
        <StepCards className={column}>
          {parts.map((p, i) => (
            <StepCard
              key={p.id}
              n={n(p.id)}
              title={t(p.title)}
              sub={sub[p.id]}
              state={i === open ? 'active' : done.includes(p.id) && reached(i) ? 'done' : 'upcoming'}
              summary={summary[p.id]}
              onOpen={() => openPart(i)}
              onNext={() => partNext(i)}
            >
              {i === open && body[p.id]}
            </StepCard>
          ))}
        </StepCards>
        {footer(t('Pošalji prijavu'), sendForm)}
      </>
    );

  if (screen === 'documents')
    return (
      <>
        <Welcome title={t('Dokumenti')} sub={t('Za klasifikacije koje ste izabrali treba dokument.')} />
        <FormCard>
          {documentsNeeded(f).map((c) => (
            <Field key={c} label={CLASSIFICATIONS.find((x) => x.id === c).document} required error={show('doc-' + c)}>
              <FileField value={f.documents[c] || ''} onChange={(name) => set({ documents: { ...f.documents, [c]: name } })} ariaLabel={c} />
            </Field>
          ))}
          <PaneHint>{t('Dokumenti se čuvaju bezbedno i brišu se posle provere.')}</PaneHint>
        </FormCard>
        {footer()}
      </>
    );

  if (screen === 'test')
    return <PersonalityTest f={f} set={set} onBack={back} onSend={next} />;

  if (screen === 'interview')
    return (
      <>
        <Welcome title={t('Zakažite razgovor')} sub={t('Kratak video razgovor sa koordinatorkom je poslednji korak prijave.')} />
        <FormCard>
          <Chips
            label={t('Kako vam je najlakše?')}
            required
            multiple={false}
            value={f.channel}
            onChange={(v) => set({ channel: v })}
            options={CHANNELS.map(([id, l]) => [id, t(l)])}
            error={show('channel')}
          />
          {f.channel && <PaneHint>{t('Koordinatorka vam se javlja preko kanala {channel} da dogovorite vreme.', { channel: t(CHANNELS.find(([id]) => id === f.channel)[1]) })}</PaneHint>}
        </FormCard>
        {footer(t('Zakaži razgovor'), submit)}
      </>
    );

  // thanks
  return (
    <>
      <Welcome title={t('Hvala!')} sub={t('Prijava je poslata.')} />
      <FormCard>
        <p className="text-xs leading-body text-foreground">
          {t('Profil se aktivira posle kratkog razgovora sa koordinatorkom. Javiće vam se preko kanala {channel} i reći sve što treba da znate. Posle toga možete da primate upite.', {
            channel: t(CHANNELS.find(([id]) => id === f.channel)?.[1] || ''),
          })}
        </p>
      </FormCard>
      <Actions>
        <Button size="lg" className="w-full" onClick={() => sent && onDone(sent.user, sent.record)}>
          {t('Na početnu')}
        </Button>
      </Actions>
    </>
  );
}
