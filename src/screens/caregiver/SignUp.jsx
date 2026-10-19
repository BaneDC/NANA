import { Fragment, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Fact, Facts } from '@/components/data-list';
import { PaneHint } from '@/components/pane';
import { cn } from '@/lib/utils';
import { Actions, Consent, FormCard, Welcome, column } from '../Register';
import { Radius } from '../../components/caregiver/ProfileForms';
import { Combobox, DateInput, Field, FieldError, FileField, Input, MultiCombobox, Password, Phone, Select, TextArea, requiredError, useCheck } from '../../components/TextField';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { saveAccount } from '../../lib/account';
import { CLASSIFICATIONS, STEPS, afterSteps, documentsNeeded, emptyForm, recordFrom, stepErrors } from '../../data/caregiverSignUp';
import { DAYS, EDUCATION, EDUCATION_SR, HABITS, HEALTH_QUESTIONS, LANGUAGES_OFFERED, READINESS, RELATIONS, municipalityGroups } from '../../data/caregiverProfile';
import { PAIRS, TRAITS, traitOf } from '../../data/personalityTest';
import { SLOTS, daysText } from '../../data/carePlan';
import { msg, t } from '@/i18n';

// The caregiver's sign-up (docs/superpowers/specs/2026-10-19-registracija-negovateljice-design.md):
// where she wants to work, her account, the steps of the form for that market,
// then her documents (Finland) or the personality test (Serbia), the channel
// for the talk with the coordinator, and thanks. Every screen is in the
// sign-up's own frame (Register.jsx): a title, grey panels with the fields,
// the buttons under them. Errors show on "Dalje", the first wrong field takes
// the focus (§10). This whole part waits for the designer.

const emailError = (v) => (!v.trim() ? requiredError() : /^\S+@\S+\.\S+$/.test(v.trim()) ? null : t('Unesite ispravnu email adresu.'));
const CHANNELS = [
  ['whatsapp', 'WhatsApp'],
  ['viber', 'Viber'],
  ['meet', msg('Google Meet ili Zoom')],
];

function Chips({ label, value, onChange, options, multiple = true, required, error }) {
  return (
    <Field label={label} required={required}>
      <ToggleGroup
        type={multiple ? 'multiple' : 'single'}
        size="sm"
        className="flex-wrap"
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
function YesNo({ label, value, onChange }) {
  return <Chips label={label} multiple={false} value={value ? 'yes' : 'no'} onChange={(v) => onChange(v === 'yes')} options={yesNo.map(([k, l]) => [k, t(l)])} />;
}

function Progress({ at, of }) {
  return (
    <div className={`${column} flex flex-col gap-2 px-4`}>
      <p className="text-small text-muted-foreground">{t('Korak {n} od {m}', { n: at + 1, m: of })}</p>
      {/* a bar, 4 tall: new, a proposal for the designer */}
      <div className="h-1 w-full overflow-hidden rounded-sm bg-muted">
        <div className="h-full rounded-sm bg-primary transition-[width] duration-300" style={{ width: `${((at + 1) / of) * 100}%` }} />
      </div>
    </div>
  );
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
  const steps = market ? STEPS[market] : [];
  const stepAt = steps.findIndex((s) => s.id === screen);
  const errors = f ? stepErrors(screen, f) : {};
  const show = (k) => check.show(errors[k]);

  const next = () => {
    if (screen === 'account') {
      const e = [emailError(account.email), account.password.length < 8 && t('Kratka je - treba najmanje 8 karaktera.'), !account.processing && requiredError(), !account.accuracy && requiredError()];
      if (!check.check(e)) return;
      check.reset();
      return setScreen(steps[0].id);
    }
    if (!check.check(Object.values(errors))) return;
    check.reset();
    const order = [...steps.map((s) => s.id), ...afterSteps(f)];
    const i = order.indexOf(screen);
    setScreen(order[i + 1]);
    window.scrollTo?.(0, 0);
  };
  const back = () => {
    check.reset();
    const order = ['account', ...steps.map((s) => s.id), ...afterSteps(f || {})];
    const i = order.indexOf(screen);
    setScreen(i > 0 ? order[i - 1] : 'country');
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

  const head = stepAt >= 0 && (
    <>
      <Welcome title={t(steps[stepAt].title)} sub={stepAt === 0 ? t('Za popunjavanje treba 10 do 20 minuta.') : ''} />
      <Progress at={stepAt} of={steps.length} />
    </>
  );
  const sr = market === 'sr';

  if (screen === 'basic')
    return (
      <>
        {head}
        <FormCard>
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
          {/* what she gave on the step before: a field like the others, but off (docs/patterns.md §10) */}
          <Field label={t('Email')} hint={t('Adresa sa kojom ste napravili nalog.')}>
            <Input value={account.email} onChange={() => {}} disabled />
          </Field>
        </FormCard>
        {footer()}
      </>
    );

  if (screen === 'profession')
    return (
      <>
        {head}
        <FormCard>
          {/* each classification with what it is and whether it needs a
              document, together: a box per row (new, for the designer) */}
          <Field label={t('Klasifikacije')} required hint={t('Izaberite sve koje važe. Za neke klasifikacije treba priložiti sertifikat.')} error={show('classifications')}>
            <div className="flex flex-col gap-2">
              {CLASSIFICATIONS.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-start gap-3 rounded-lg bg-card p-3">
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
          <Field label={t('Nivo obrazovanja')} required error={show('education')}>
            <Select value={f.education} onChange={(v) => set({ education: v })} placeholder={t('Izaberite nivo obrazovanja')} options={EDUCATION.map((e) => ({ value: e, label: t(e) }))} />
          </Field>
          <Field label={t('Jezici koje govorite')}>
            <MultiCombobox values={f.languages} onChange={(v) => set({ languages: v })} options={LANGUAGES_OFFERED.map((l) => ({ value: l, label: t(l) }))} placeholder={t('Engleski, nemački, švedski…')} />
          </Field>
          <Field label={t('Biografija')} required error={show('bio')}>
            <TextArea value={f.bio} onChange={(v) => set({ bio: v })} rows={4} placeholder={t('Ukratko opišite iskustvo, posebno sa starijima, i šta vas čini pouzdanom.')} />
          </Field>
        </FormCard>
        {footer()}
      </>
    );

  if (screen === 'qualifications')
    return (
      <>
        {head}
        <FormCard>
          <Field label={t('Nivo obrazovanja')} required error={show('education')}>
            <Select value={f.education} onChange={(v) => set({ education: v })} placeholder={t('Izaberite nivo obrazovanja')} options={EDUCATION_SR.map((e) => ({ value: e, label: t(e) }))} />
          </Field>
          <YesNo label={t('Sertifikat akreditovane škole za negovateljice')} value={f.certificate} onChange={(v) => set({ certificate: v })} />
          <Field label={t('Kursevi')}>
            <Input value={f.courses} onChange={(v) => set({ courses: v })} placeholder={t('Naziv završenog kursa')} />
          </Field>
          <Field label={t('Opis radnog iskustva i veština')} required error={show('bio')}>
            <TextArea value={f.bio} onChange={(v) => set({ bio: v })} rows={4} placeholder={t('Ukratko opišite iskustvo, posebno sa starijima, i šta vas čini pouzdanom.')} />
          </Field>
        </FormCard>
        {footer()}
      </>
    );

  if (screen === 'availability')
    return (
      <>
        {head}
        <FormCard>
          {sr && (
            <>
              <Chips
                label={t('Angažman')}
            required
                value={f.engagement}
                onChange={(v) => set({ engagement: v })}
                options={[
                  ['daily', t('Dnevne posete')],
                  ['shift24', t('Smena 24 h')],
                ]}
                error={show('engagement')}
              />
              {f.engagement.length === 2 && <PaneHint>{t('Smena od 24 sata je vaš prvi izbor, a otvoreni ste i za dnevne posete kod drugih korisnika kad niste na dužnosti.')}</PaneHint>}
            </>
          )}
          <Chips label={t('Koje dane želite da radite?')}
            required value={f.days} onChange={(v) => set({ days: v })} options={DAYS.map((d, i) => [String(i), t(d)])} error={show('days')} />
          <Chips label={t('Izaberite raspored koji vam najviše odgovara')}
            required value={f.slots} onChange={(v) => set({ slots: v })} options={Object.entries(SLOTS).map(([id, s]) => [id, `${t(s.label)} ${s.hours}`])} error={show('slots')} />
          {f.slots.length > 1 && <PaneHint>{t('Izborom više delova dana kažete da prihvatate pojedinačne smene u to vreme, a ne neprekidan rad ceo dan.')}</PaneHint>}
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
        </FormCard>
        {footer()}
      </>
    );

  if (screen === 'health')
    return (
      <>
        {head}
        <FormCard>
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
        </FormCard>
        {footer()}
      </>
    );

  if (screen === 'emergency') {
    const e = f.emergency;
    const setE = (patch) => set({ emergency: { ...e, ...patch } });
    return (
      <>
        {head}
        <FormCard>
          <PaneHint>{t('Ova osoba se kontaktira ako ne možemo da vas dobijemo ili ako je broj pogrešan.')}</PaneHint>
          <Field label={t('Ime i prezime')} required error={show('emergencyName')}>
            <Input value={e.name} onChange={(v) => setE({ name: v })} placeholder={t('Unesite ime i prezime')} />
          </Field>
          <Field label={t('Srodstvo')} required error={show('emergencyRelation')}>
            <Select value={e.relation} onChange={(v) => setE({ relation: v })} placeholder={t('Majka, otac, sestra i sl.')} options={RELATIONS.map((r) => ({ value: r, label: t(r) }))} />
          </Field>
          <Field label={t('Broj telefona')} required labelId="su-e-phone" error={show('emergencyPhone')}>
            <Phone country={e.phoneCountry} onCountry={(v) => setE({ phoneCountry: v })} value={e.phone} onChange={(v) => setE({ phone: v })} labelledBy="su-e-phone" />
          </Field>
          <Field label={t('Adresa')} required error={show('emergencyAddress')}>
            <Input value={e.address} onChange={(v) => setE({ address: v })} />
          </Field>
        </FormCard>
        {footer()}
      </>
    );
  }

  if (screen === 'review') {
    const go = (id) => setScreen(id);
    const card = (title, id, rows) => (
      <FormCard key={id}>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm font-medium text-foreground">{title}</p>
          <Button variant="secondary" onClick={() => go(id)}>
            {t('Izmenite')}
          </Button>
        </div>
        <Facts>
          {rows
            .filter(Boolean)
            .map(([label, value]) => (
              <Fact key={label} label={label}>
                {value || '-'}
              </Fact>
            ))}
        </Facts>
      </FormCard>
    );
    return (
      <>
        {head}
        {card(t('Osnovni podaci'), 'basic', [
          [t('Ime i prezime'), `${f.firstName} ${f.lastName}`],
          [t('Datum rođenja'), f.birth],
          [t('Adresa'), f.address],
          [t('Opština'), f.area],
          [t('Telefon'), f.phone],
        ])}
        {sr
          ? card(t('Kvalifikacije'), 'qualifications', [[t('Nivo obrazovanja'), t(f.education)], [t('Sertifikat negovateljice'), f.certificate ? t('Da') : t('Ne')], [t('Kursevi'), f.courses], [t('Opis radnog iskustva i veština'), f.bio]])
          : card(t('Profesija'), 'profession', [[t('Klasifikacije'), f.classifications.join(', ')], [t('Obrazovanje'), t(f.education)], [t('Jezici'), f.languages.map((l) => t(l)).join(', ')], [t('O sebi'), f.bio]])}
        {card(t('Dostupnost'), 'availability', [
          sr && [t('Angažman'), f.engagement.map((e) => (e === 'daily' ? t('Dnevne posete') : t('Smena 24 h'))).join(', ')],
          [t('Dani'), daysText(f.days.map(Number).sort())],
          [t('Doba dana'), f.slots.map((s) => t(SLOTS[s].label).toLowerCase()).join(', ')],
          [t('Radijus'), t('do {km} km', { km: f.radius })],
          !sr && [t('Cena'), `${f.rateMin}–${f.rateMax} €/h`],
          sr && [t('Rad u inostranstvu'), f.abroad ? t('Da') : t('Ne')],
        ])}
        {sr &&
          card(t('Zdravlje i navike'), 'health', [
            ...HABITS.map(([id, l]) => [t(l), f.habits[id] ? t('Da') : t('Ne')]),
            [t('Jezici'), f.languages.map((l) => t(l)).join(', ')],
            ...HEALTH_QUESTIONS.map(([id, l]) => [t(l), f.health[id] ? t('Da') : t('Ne')]),
            [t('Spremnost za rad'), READINESS.filter(([id]) => f.readiness.includes(id)).map(([, l]) => t(l)).join(', ')],
          ])}
        {sr && card(t('Kontakt za hitne slučajeve'), 'emergency', [[t('Ime i prezime'), f.emergency.name], [t('Srodstvo'), f.emergency.relation && t(f.emergency.relation)], [t('Telefon'), f.emergency.phone], [t('Adresa'), f.emergency.address]])}
        {footer(t('Pošalji prijavu'))}
      </>
    );
  }

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
    return <TestScreen f={f} set={set} show={show} footer={footer} />;

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

// The personality test, all on one page for now (B); one pair a screen (A) is
// the designer's other option (§ Registracija negovateljice in patterns.md).
function TestScreen({ f, set, show, footer }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Welcome title={t('Test ličnosti')} sub={t('{n} parova osobina', { n: PAIRS.length })} />
      <FormCard>
        <p className="text-xs leading-body text-foreground">
          {t('U svakom paru izaberite osobinu koja vas bolje opisuje. Pre toga pročitajte šta koja znači. Svaki par gledajte za sebe: normalno je da istu osobinu ne birate uvek.')}
        </p>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="-ml-3 self-start" aria-expanded={open}>
              {t('Definicije osobina')}
              <ChevronDown size={14} strokeWidth={1.75} className={cn('transition-transform duration-200', open && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Facts>
              {TRAITS.map((x) => (
                <Fact key={x.id} label={t(x.name)}>
                  {t(x.text)}
                </Fact>
              ))}
            </Facts>
          </CollapsibleContent>
        </Collapsible>
      </FormCard>
      <FormCard>
        {PAIRS.map(([a, b], i) => (
          <Fragment key={i}>
            <Chips
              label={t('Par {n}', { n: i + 1 })}
              multiple={false}
              value={f.test[i] == null ? '' : String(f.test[i])}
              onChange={(v) => set({ test: { ...f.test, [i]: Number(v) } })}
              options={[
                ['0', t(traitOf(a).name)],
                ['1', t(traitOf(b).name)],
              ]}
            />
          </Fragment>
        ))}
        {show('test') && <FieldError>{show('test')}</FieldError>}
      </FormCard>
      {footer(t('Pošalji test'))}
    </>
  );
}
