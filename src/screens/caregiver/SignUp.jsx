import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { siteMarket } from '../../lib/siteLink';
import { Note, PaneHint } from '@/components/pane';
import { StepCard, StepCards, StepPage, StepPanel, StepReview } from '@/components/StepCards';
import PersonalityTest from './PersonalityTest';
import CookieSettings from '../../components/CookieSettings';
import { COOKIE_DEFAULT } from '../../data/cookies';
import { Radius, radiusText } from '../../components/caregiver/ProfileForms';
import { Checks, Combobox, DateInput, Field, FieldError, FileField, Input, Phone, Select, TextArea, choiceError, choiceRow, requiredError, useCheck } from '../../components/TextField';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { activateCaregiver, saveAccount } from '../../lib/account';
import { goBackTo, href, navigate, useRoute } from '../../lib/route';
import { clearDraft, loadDraft, saveDraft } from '../../data/signupDraft';
import { dialOf } from '../../data/countries';
import { CLASSIFICATIONS, EXAMPLE, STEPS, afterSteps, documentsNeeded, emptyForm, firstUnfinished, recordFrom, stepErrors } from '../../data/caregiverSignUp';
import { marketDate } from '../../data/familyCare';
import { DAYS, EDUCATION, EDUCATION_SR, educationText, HABITS, HEALTH_QUESTIONS, READINESS, languageOptions, RELATIONS, municipalityGroups } from '../../data/caregiverProfile';
import { SLOTS, daysText } from '../../data/carePlan';
import { getLang, msg, t, useLang } from '@/i18n';
import { cn } from '@/lib/utils';

// The caregiver's sign-up (docs/superpowers/specs/2026-10-19-registracija-negovateljice-design.md):
// her account, with where she wants to work, then the parts of the form for that market
// on one page, then her documents (Finland) or the personality test (Serbia),
// the channel for the talk with the coordinator, and thanks. After the part that
// finishes the form a review of all that was given comes, before
// the next step. Every screen is in
// the sign-up's own frame (Register.jsx): a title, grey panels with the fields,
// the buttons under them. The form's parts are step cards (docs/patterns.md
// §10): one open, the ones done folded into a row with their answers. Errors
// show on "Dalje", the first wrong field takes the focus (§10).

const emailError = (v) => (!v.trim() ? requiredError() : /^\S+@\S+\.\S+$/.test(v.trim()) ? null : t('Unesite ispravnu email adresu.'));
// the caregivers' terms and privacy, as production links them
const LEGAL = {
  terms: 'https://www.nanaprime.com/fi/legal/terms-of-use-caregivers',
  privacy: 'https://www.nanaprime.com/fi/legal/data-processing',
};
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

// a consent on her account, a row as a radio's (choiceRow), its star and its
// error with it; the family's sign-up has the same (Register.jsx)
export function ConsentRow({ checked, onChange, required, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className={choiceRow}>
        <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} aria-invalid={error ? true : undefined} className="mt-0.5" />
        <span className="min-w-0">
          {children}
          {required && <span className="text-primary-600"> *</span>}
        </span>
      </label>
      {error && <FieldError className={cn(choiceError, 'pb-1.5 pl-6 pointer-coarse:pb-0')}>{error}</FieldError>}
    </div>
  );
}

function Radios({ label, value, onChange, options, required, error }) {
  return (
    <Field label={label} required={required}>
      <RadioGroup value={value} onValueChange={onChange} aria-label={label} className="flex flex-col gap-0">
        {options.map(([id, text]) => (
          <label key={id} className={choiceRow}>
            <RadioGroupItem value={id} className="mt-0.5" />
            <span className="min-w-0">{text}</span>
          </label>
        ))}
      </RadioGroup>
      {error && <FieldError className={choiceError}>{error}</FieldError>}
    </Field>
  );
}

// what a "Da" asks for, in a field under it
const HEALTH_DETAILS = {
  allergies: msg('Na šta ste alergični?'),
  limits: msg('Koje ograničenje imate?'),
  problems: msg('Koji problem imate i kako utiče na rad?'),
};

const yesNo = [
  ['no', msg('Ne')],
  ['yes', msg('Da')],
];
// two answers, so two equal columns, wherever it is in the form
function YesNo({ label, value, onChange }) {
  return <Chips label={label} cols="grid-cols-2" multiple={false} value={value ? 'yes' : 'no'} onChange={(v) => onChange(v === 'yes')} options={yesNo.map(([k, l]) => [k, t(l)])} />;
}

// her steps, each an address: /signup/caregiver (the account), then /signup/caregiver/<step>
const toStep = (step, opts) => navigate({ page: 'signup', who: 'caregiver', step: step === 'account' ? undefined : step }, opts);
const backToStep = (step) => goBackTo({ page: 'signup', who: 'caregiver', step: step === 'account' ? undefined : step });
const stepHref = (step) => href({ page: 'signup', who: 'caregiver', step: step === 'account' ? undefined : step });

// the market her language points to: Serbian Serbia, Finnish Finland, English none
const marketOfLang = (lang) => (lang === 'sr' || lang === 'fi' ? lang : null);
const MARKET_OPTIONS = [
  ['sr', msg('Srbija')],
  ['fi', msg('Finska')],
];
// a draft from before the account was her first step (12. 11.)
const draftNow = () => {
  const d = loadDraft();
  // the website (or the demo's market row) names the other market while she
  // is still on the account: that market, what she typed is let go; once she
  // is past the account it is hers to finish, whatever a link says (rule 17;
  // decided 13. 11., Branislav, as on production)
  if (d?.f && d.reached === 'account' && siteMarket() && d.f.market !== siteMarket()) {
    clearDraft();
    return null;
  }
  return d && { ...d, screen: d.screen === 'country' ? 'account' : d.screen, reached: d.reached === 'country' ? 'account' : d.reached };
};

export default function CaregiverSignUp({ onForm }) {
  // what she had written, if she was here in the last week (signupDraft.js)
  const [kept] = useState(draftNow);
  // Where she wants to work, asked on the account (rule 16 in the routing
  // spec): the form's once it is made, else what the website's link said, else
  // what she chose before, else what her language says; in English nothing
  // until she picks.
  // (a form only binds once she is past the account: the old flow made one on
  // the country, before the account)
  const begun = kept?.f && kept.reached !== 'account' ? kept.f.market : null;
  const [market, setMarket] = useState(() => begun ?? siteMarket() ?? kept?.chosen ?? marketOfLang(getLang()));
  // only a market she picked herself is kept with the draft (as `chosen`);
  // one from a link or her language is not, so the next visit's link and
  // language decide again
  const [picked, setPicked] = useState(() => Boolean(kept?.chosen) && !siteMarket());
  const pickMarket = (m) => (setMarket(m), setPicked(true));
  const [f, setF] = useState(kept?.f ?? null);
  // no password here: the system makes one when her profile is activated, and
  // she changes it on her first sign-in (as on production)
  const [account, setAccount] = useState(kept?.account ?? { email: '', processing: false, accuracy: false, cookies: COOKIE_DEFAULT });
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const lang = useLang();
  // a change of language does not change her market; it only fills one not chosen
  useEffect(() => {
    if (!market && marketOfLang(lang)) setMarket(marketOfLang(lang));
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  // the application, saved on "Zakaži razgovor": kept even if the tab closes on
  // the thanks; a second press does not make a second one
  const [sent, setSent] = useState(kept?.sent ?? null);
  const [busy, setBusy] = useState(false);
  const check = useCheck();
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  // the form's parts, which one is open, and the ones done
  const parts = f ? STEPS[f.market] : [];
  const [open, setOpen] = useState(kept?.open ?? 0);
  const [done, setDone] = useState(kept?.done ?? []);
  // The steps in order, and the furthest one whose checks have passed: forward
  // (the browser's too) goes no further than that. The step is the address's;
  // one she may not be on yet (a reload with nothing kept, a link, a step of
  // the other country) shows, and becomes, the furthest she may.
  const order = f ? ['account', 'form', 'review', ...afterSteps(f)] : ['account'];
  const [furthest, setFurthest] = useState(kept?.reached ?? 'account');
  // a step that is no longer on her way (documents she no longer needs) counts as the one after the review
  const indexOf = (step) => (order.includes(step) ? order.indexOf(step) : Math.max(0, order.indexOf('interview')));
  const wanted = useRoute().route.step ?? 'account';
  // past the account her market is set (rule 17): the account is behind her
  const locked = Boolean(f) && indexOf(furthest) > 0;
  // and no further than the first step that is not right now (forward
  // included): what she changes after a step is checked again
  const stop = !f ? null : emailError(account.email) || !account.processing || !account.accuracy ? 'account' : firstUnfinished(order, f);
  const limit = stop ? Math.min(indexOf(furthest), order.indexOf(stop)) : indexOf(furthest);
  const allowed = sent ? wanted === 'thanks' : order.includes(wanted) && order.indexOf(wanted) <= limit && wanted !== 'thanks' && !(locked && wanted === 'account');
  const screen = allowed ? wanted : sent ? 'thanks' : order[locked ? Math.max(1, limit) : limit];
  useEffect(() => {
    if (screen !== wanted) toStep(screen, { replace: true });
  }, [screen, wanted]);
  // Coming back after a while ("Negovateljica", a reload in a new tab): the
  // step she was on. The browser has none of her steps before it, so they are
  // written into the history (the form, then each after it), and its back goes
  // to the step before, as our "Nazad" does, not out to "Ko ste?". Arrived the
  // usual way (the step before is the one before in the history), nothing is
  // added. The account is not among them: it is behind her (rule 17).
  // once (StrictMode runs a mount's effect twice, the second time on the first
  // render's address, and would write her steps in again)
  const resumed = useRef(false);
  useEffect(() => {
    if (resumed.current) return;
    resumed.current = true;
    const at = wanted === 'account' && kept?.screen && kept.screen !== 'account' ? kept.screen : screen;
    const i = order.indexOf(at);
    if (sent || i < 2) {
      if (at !== wanted) toStep(at, { replace: true });
      return;
    }
    if (at === wanted && window.history.state?.prev === stepHref(order[i - 1])) return;
    order.slice(1, i + 1).forEach((step, j) => toStep(step, { replace: j === 0 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // kept as she goes, once her market is known, until it is sent and she goes on
  useEffect(() => {
    if (f || picked || account.email) saveDraft({ screen, reached: furthest, chosen: picked ? market : null, f, account, open, done, sent });
  }, [screen, furthest, market, picked, f, account, open, done, sent]);
  // a part opened by "Izmeni" on the review: its top to the top of the
  // screen, as a part opened from its row (§10); the parts above are rows already
  const fromReview = useRef(false);
  useEffect(() => {
    if (screen !== 'form' || !fromReview.current) return;
    fromReview.current = false;
    const card = document.querySelectorAll('[data-slot=step-card]')[open];
    const page = card?.closest('[data-slot=step-scroll]');
    if (page) page.scrollTop += card.getBoundingClientRect().top - page.getBoundingClientRect().top;
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (step, opts) => {
    if (indexOf(step) > indexOf(furthest)) setFurthest(step);
    toStep(step, opts);
  };
  // every page of hers is on the form's own sky, the account too (decided
  // 11. 11., dizajner): the sign-up's photos and its language are not over them
  useEffect(() => {
    onForm?.(true);
    return () => onForm?.(false);
  }, [onForm]);
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
  // the health question just answered "Da", whose field takes the focus as it comes
  const [asked, setAsked] = useState(null);

  const next = () => {
    if (screen === 'account') {
      const e = [!market && requiredError(), emailError(account.email), !account.processing && requiredError(), !account.accuracy && requiredError()];
      if (!check.check(e)) return;
      check.reset();
      // the form for her market; from here on the market stays
      if (f?.market !== market) {
        setF(emptyForm(market));
        setOpen(0);
        setDone([]);
        // the form is not in her steps until this render is over
        setFurthest('form');
      } else setOpen(firstOpen());
      return go('form');
    }
    if (!check.check(Object.values(errors))) return;
    check.reset();
    go(order[order.indexOf(screen) + 1]);
    window.scrollTo?.(0, 0);
  };
  const back = () => {
    check.reset();
    backToStep(order[Math.max(0, order.indexOf(screen) - 1)]);
  };
  // the part's button: only that part is checked; then it folds, and the next
  // one not done yet opens. After the part that finishes the form the review
  // comes: "Dalje" the first time, "Sačuvaj" when every part was done already
  // (a change from the review, which it goes straight back to)
  const editing = parts.length > 0 && parts.every((p) => done.includes(p.id));
  const partNext = (i) => {
    if (!check.check(Object.values(stepErrors(parts[i].id, f)))) return;
    check.reset();
    const now = done.includes(parts[i].id) ? done : [...done, parts[i].id];
    const to = firstOpen(now);
    setDone(now);
    setOpen(to);
    if (to === null) go('review');
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
      cookies: account.cookies,
      language: lang,
      // her record too, so signing in again puts it back where families look
      record,
    };
    // a stand-in for the password the system sends when the profile is activated
    await saveAccount(user, crypto.randomUUID());
    setSent({ user, record });
    setBusy(false);
    check.reset();
    // sent: the steps before are behind her (the address is replaced, and
    // every step leads to the thanks from now on)
    setFurthest('thanks');
    toStep('thanks', { replace: true });
  };

  // Once begun, the only way is through (decided 13. 11., Branislav, as on
  // production): no way out in the head of any of her pages; the browser's
  // back is not held, but coming back to the sign-up opens the step she
  // stopped at (docs/patterns.md §4, §12d)

  // the terms under the card, the one thing out of it (decided 12. 11.)
  const terms = (
    <p className="-mt-4 px-4 text-small text-muted-foreground phone:text-center [&_a]:text-primary-600">
      {t('Prijavom ste saglasni sa našim')}{' '}
      <a href={LEGAL.terms} target="_blank" rel="noreferrer">
        {t('uslovima korišćenja')}
      </a>{' '}
      {t('i')}{' '}
      <a href={LEGAL.privacy} target="_blank" rel="noreferrer">
        {t('politikom privatnosti')}
      </a>
      .{' '}
      <a href="#kolacici" onClick={(e) => (e.preventDefault(), setCookiesOpen(true))}>
        {t('Podešavanja kolačića')}
      </a>
    </p>
  );

  // her account, with where she wants to work, is the first step of the same
  // process as the form, so on its sky (docs/patterns.md §12d, decided 11. 11.;
  // the market on it since 12. 11., Branislav); the language in the head,
  // across from the way back, as on every page before the account (§12b)
  if (screen === 'account')
    return (
      <StepPage
        title={t('Prijavite se kao negovateljica')}
        sub={t('Unesite svoje podatke da biste započeli proces prijave.')}
        language
      >
        {/* one card, as a part of the form: where, the email, the consents
            and "Nastavi" in it, the terms alone under it (decided 12. 11.,
            dizajner; until then the consents and the button were under it) */}
        <StepPanel>
          <Radios
            label={t('Gde želite da radite?')}
            required
            value={market ?? ''}
            onChange={pickMarket}
            options={MARKET_OPTIONS.map(([id, l]) => [id, t(l)])}
            error={check.show(!market && requiredError())}
          />
          <Field label={t('Email adresa')} required error={check.show(emailError(account.email))}>
            <Input value={account.email} onChange={(v) => setAccount((a) => ({ ...a, email: v }))} type="email" autoComplete="email" placeholder={market ? EXAMPLE[market].email : t('Unesite svoju email adresu')} />
          </Field>
          {/* rows as the radios over them: a box, the sentence, the whole row the target */}
          <div className="flex flex-col">
            <ConsentRow required checked={account.processing} onChange={(v) => setAccount((a) => ({ ...a, processing: v }))} error={check.show(!account.processing && requiredError())}>
              {t('Saglasnost za obradu podataka')}
            </ConsentRow>
            <ConsentRow required checked={account.accuracy} onChange={(v) => setAccount((a) => ({ ...a, accuracy: v }))} error={check.show(!account.accuracy && requiredError())}>
              {t('Potvrda tačnosti podataka')}
            </ConsentRow>
          </div>
          {/* as "Dalje" in the form's card: at its right, on a phone across it */}
          <div className="flex justify-end phone:*:flex-1">
            <Button onClick={next}>{t('Nastavi')}</Button>
          </div>
        </StepPanel>
        {terms}
        {cookiesOpen && <CookieSettings cookies={account.cookies} onSave={(cookies) => (setAccount((a) => ({ ...a, cookies })), setCookiesOpen(false))} onClose={() => setCookiesOpen(false)} />}
      </StepPage>
    );

  const sr = f.market === 'sr';
  const n = (id) => parts.findIndex((p) => p.id === id) + 1;

  // what each part holds, in the open card
  const body = {
    basic: (
      <>
        {/* one under the other on a phone, 24 apart as every question */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 max-[480px]:grid-cols-1">
          <Field label={t('Vaše ime')} required error={show('firstName')}>
            <Input value={f.firstName} onChange={(v) => set({ firstName: v })} placeholder={EXAMPLE[f.market].firstName} autoComplete="given-name" />
          </Field>
          <Field label={t('Vaše prezime')} required error={show('lastName')}>
            <Input value={f.lastName} onChange={(v) => set({ lastName: v })} placeholder={EXAMPLE[f.market].lastName} autoComplete="family-name" />
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
            market={f.market}
            placeholder={t('Izaberite datum rođenja')}
          />
        </Field>
        <Field label={t('Prebivalište')} required error={show('address')}>
          <Input value={f.address} onChange={(v) => set({ address: v })} placeholder={EXAMPLE[f.market].address} />
        </Field>
        <Field label={t('Opština')} required error={show('area')}>
          <Combobox value={f.area} onChange={(v) => set({ area: v })} groups={municipalityGroups(f.market)} placeholder={t('Pretražite opštine')} searchPlaceholder={t('Pretražite opštine')} />
        </Field>
        <Field label={t('Broj telefona')} required labelId="su-phone" error={show('phone')}>
          <Phone country={f.phoneCountry} onCountry={(v) => set({ phoneCountry: v })} value={f.phone} onChange={(v) => set({ phone: v })} labelledBy="su-phone" />
        </Field>
      </>
    ),
    profession: (
      <>
        {/* each classification with what it is and whether it needs a
            document, together: a white row each on the card's glass (grey read
            poorly, decided 11. 11.); the hint
            on documents goes with them, under the same line */}
        <div className="flex flex-col gap-3">
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
        </div>
        <Field label={t('Nivo obrazovanja')} required error={show('education')}>
          <Select value={f.education} onChange={(v) => set({ education: v })} placeholder={t('Izaberite nivo obrazovanja')} options={EDUCATION.map((e) => ({ value: e, label: t(e) }))} />
        </Field>
        {/* a box each, the four of her market at sight (decided 12. 11., dizajner; was a dropdown) */}
        <Checks label={t('Jezici koje govorite')} required error={show('languages')} value={f.languages} onChange={(v) => set({ languages: v })} options={languageOptions(f.market, f.languages).map((o) => [o.value, o.label])} />
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
        <Chips
          label={t('Koje dane želite da radite?')}
          required
          cols="grid-cols-7 phone:grid-cols-4"
          value={f.days}
          onChange={(v) => set({ days: v })}
          options={DAYS.map((d, i) => [String(i), t(d)])}
          error={show('days')}
        />
        <div className="flex flex-col gap-3">
          <Chips
            label={t('Izaberite raspored koji vam najviše odgovara')}
            required
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
        {/* a box each, the four of her market at sight (decided 12. 11., dizajner; was a dropdown) */}
        <Checks label={t('Jezici koje govorite')} required error={show('languages')} value={f.languages} onChange={(v) => set({ languages: v })} options={languageOptions(f.market, f.languages).map((o) => [o.value, o.label])} />
        {/* a "Da" on allergies, a limit or a health problem asks what it is,
            12 under the answer, and takes the focus */}
        {HEALTH_QUESTIONS.map(([id, label]) => (
          <div key={id} className="flex flex-col gap-3">
            <YesNo
              label={t(label)}
              value={f.health[id]}
              onChange={(v) => {
                set({ health: { ...f.health, [id]: v } });
                setAsked(v ? id : null);
              }}
            />
            {HEALTH_DETAILS[id] && f.health[id] && (
              <Field error={show('health-' + id)}>
                <TextArea
                  id={`su-health-${id}`}
                  autoFocus={asked === id}
                  rows={2}
                  value={f.healthNotes?.[id] ?? ''}
                  onChange={(v) => set({ healthNotes: { ...f.healthNotes, [id]: v } })}
                  placeholder={t(HEALTH_DETAILS[id])}
                  aria-label={t(label)}
                />
              </Field>
            )}
          </div>
        ))}
        <Checks label={t('Spremnost za rad')} value={f.readiness} onChange={(v) => set({ readiness: v })} options={READINESS.map(([id, l]) => [id, t(l)])} />
        <Field label={t('Šta ne želite da radite')}>
          <TextArea value={f.unwilling} onChange={(v) => set({ unwilling: v })} rows={2} placeholder={t('Npr. menjanje pelena, kupanje, rad sa nepokretnim osobama.')} />
        </Field>
      </>
    ),
    emergency: (
      <>
        <Field label={t('Ime i prezime')} required error={show('emergencyName')}>
          <Input value={f.emergency.name} onChange={(v) => setE({ name: v })} placeholder={EXAMPLE[f.market].emergencyName} />
        </Field>
        <Field label={t('Srodstvo')} required error={show('emergencyRelation')}>
          <Select value={f.emergency.relation} onChange={(v) => setE({ relation: v })} placeholder={t('Majka, otac, sestra i sl.')} options={RELATIONS.map((r) => ({ value: r, label: t(r) }))} />
        </Field>
        <Field label={t('Broj telefona')} required labelId="su-e-phone" error={show('emergencyPhone')}>
          <Phone country={f.emergency.phoneCountry} onCountry={(v) => setE({ phoneCountry: v })} value={f.emergency.phone} onChange={(v) => setE({ phone: v })} labelledBy="su-e-phone" />
        </Field>
        <Field label={t('Adresa')} required error={show('emergencyAddress')}>
          <Input value={f.emergency.address} onChange={(v) => setE({ address: v })} placeholder={EXAMPLE[f.market].emergencyAddress} />
        </Field>
      </>
    ),
  };
  // what a part folded into its row says it holds
  const summary = {
    basic: [`${f.firstName} ${f.lastName}`.trim(), f.area, f.phone && `${dialOf(f.phoneCountry)} ${f.phone}`, f.birth && marketDate(new Date(f.birth), f.market), f.address],
    profession: [...f.classifications, f.education && t(f.education)],
    qualifications: [f.education && educationText(f.education, true), f.certificate && t('Sertifikat negovateljice'), f.courses],
    availability: [
      ...(sr ? f.engagement.map((e) => (e === 'daily' ? t('Dnevne posete') : t('Smena 24 h'))) : []),
      f.days.length > 0 && daysText(f.days.map(Number).sort()),
      ...f.slots.map((s) => t(SLOTS[s].label)),
      radiusText(f.radius, true),
    ],
    health: [...f.languages.map((l) => t(l)), ...READINESS.filter(([id]) => f.readiness.includes(id)).map(([, l]) => t(l))],
    emergency: [f.emergency.name, f.emergency.relation && t(f.emergency.relation)],
  };
  const sub = {
    emergency: t('Ova osoba se kontaktira ako ne možemo da vas dobijemo ili ako je broj pogrešan.'),
  };

  if (screen === 'form')
    return (
      // no buttons under the parts: the part that finishes the form leads to the review
      <StepPage title={t('Vaši podaci')} sub={t('Za popunjavanje je potrebno 5 do 10 minuta.')}>
        <StepCards>
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
              nextLabel={editing ? t('Sačuvaj') : undefined}
            >
              {i === open && body[p.id]}
            </StepCard>
          ))}
        </StepCards>
      </StepPage>
    );

  // everything she gave, part by part, before the next step; "Izmeni" by a
  // part opens just that one in the form (a new step in the history, so the
  // browser's back comes back here)
  const edit = (i) => {
    check.reset();
    setOpen(i);
    fromReview.current = true;
    go('form');
  };
  const yn = (v) => (v ? t('Da') : t('Ne'));
  const list = (xs) => xs.filter(Boolean).join(', ');
  const phone = (c, x) => x && `${dialOf(c)} ${x}`;
  const review = {
    basic: [
      [t('Ime i prezime'), `${f.firstName} ${f.lastName}`.trim()],
      [t('Datum rođenja'), f.birth && marketDate(new Date(f.birth), f.market)],
      [t('Prebivalište'), f.address],
      [t('Opština'), f.area],
      [t('Broj telefona'), phone(f.phoneCountry, f.phone)],
    ],
    profession: [
      [t('Klasifikacije'), list(f.classifications)],
      [t('Nivo obrazovanja'), f.education && t(f.education)],
      [t('Jezici koje govorite'), list(f.languages.map((l) => t(l)))],
      [t('Biografija'), f.bio],
    ],
    qualifications: [
      [t('Nivo obrazovanja'), f.education && educationText(f.education, true)],
      [t('Sertifikat akreditovane škole za negovateljice'), yn(f.certificate)],
      [t('Kursevi'), f.courses],
      [t('Opis radnog iskustva i veština'), f.bio],
    ],
    availability: [
      ...(sr ? [[t('Angažman'), list(f.engagement.map((e) => (e === 'daily' ? t('Dnevne posete') : t('Smena 24 h'))))]] : []),
      [t('Dani'), f.days.length > 0 && daysText(f.days.map(Number).sort())],
      [t('Delovi dana'), list(f.slots.map((s) => `${t(SLOTS[s].label)} ${SLOTS[s].hours}`))],
      ...(sr ? [[t('Rad u inostranstvu'), yn(f.abroad)]] : [[t('Cena'), f.rateMin && f.rateMax && `${f.rateMin}–${f.rateMax} €/h`]]),
      [t('Radijus'), radiusText(f.radius, true)],
    ],
    health: [
      ...HABITS.map(([id, label]) => [t(label), yn(f.habits[id])]),
      [t('Jezici koje govorite'), list(f.languages.map((l) => t(l)))],
      ...HEALTH_QUESTIONS.map(([id, label]) => [t(label), f.health[id] && f.healthNotes?.[id]?.trim() ? `${t('Da')}: ${f.healthNotes[id].trim()}` : yn(f.health[id])]),
      [t('Spremnost za rad'), list(READINESS.filter(([id]) => f.readiness.includes(id)).map(([, l]) => t(l)))],
      [t('Šta ne želite da radite'), f.unwilling],
    ],
    emergency: [
      [t('Ime i prezime'), f.emergency.name],
      [t('Srodstvo'), f.emergency.relation && t(f.emergency.relation)],
      [t('Broj telefona'), phone(f.emergency.phoneCountry, f.emergency.phone)],
      [t('Adresa'), f.emergency.address],
    ],
  };
  const ahead = {
    test: t('Proverite podatke. Sledeći korak je test ličnosti.'),
    documents: t('Proverite podatke. Sledeći korak su dokumenti.'),
    interview: t('Proverite podatke. Sledeći korak je razgovor sa koordinatorkom.'),
  };

  if (screen === 'review')
    return (
      <StepPage
        start
        eyebrow={t('Vaša prijava')}
        title={t('Ovo ste upisali')}
        sub={ahead[afterSteps(f)[0]]}
        // "Nastavi" alone, at the right; on a phone the full width
        actions={
          <div className="flex justify-end phone:*:w-full">
            <Button size="lg" onClick={next}>
              {t('Nastavi')}
            </Button>
          </div>
        }
      >
        <div>
          {parts.map((p, i) => (
            <StepReview key={p.id} title={t(p.title)} rows={review[p.id]} onEdit={() => edit(i)} />
          ))}
        </div>
      </StepPage>
    );

  // the pages after the review, in the form's look on the same sky
  // (docs/patterns.md §10): the parts' glass card and the review's buttons
  const pageButtons = (label, onNext) => (
    <div className="flex justify-between gap-2 phone:flex-col-reverse phone:*:w-full">
      <Button variant="secondary" size="lg" onClick={back}>
        {t('Nazad')}
      </Button>
      <Button size="lg" onClick={onNext}>
        {label}
      </Button>
    </div>
  );

  if (screen === 'documents')
    return (
      <StepPage title={t('Dokumenti')} sub={t('Za klasifikacije koje ste izabrali treba dokument.')} actions={pageButtons(t('Dalje'), next)}>
        <StepPanel>
          {documentsNeeded(f).map((c) => (
            <Field key={c} label={CLASSIFICATIONS.find((x) => x.id === c).document} required error={show('doc-' + c)}>
              <FileField value={f.documents[c] || ''} onChange={(name) => set({ documents: { ...f.documents, [c]: name } })} ariaLabel={c} />
            </Field>
          ))}
          <PaneHint>{t('Dokumenti se čuvaju bezbedno i brišu se posle provere.')}</PaneHint>
        </StepPanel>
      </StepPage>
    );

  if (screen === 'test') return <PersonalityTest f={f} set={set} onBack={back} onSend={next} />;

  if (screen === 'interview')
    return (
      <StepPage title={t('Zakažite razgovor')} sub={t('Kratak video razgovor sa koordinatorkom je poslednji korak prijave.')} actions={pageButtons(t('Zakaži razgovor'), submit)}>
        <StepPanel>
          {/* the hint goes with its question, 12 under it */}
          <div className="flex flex-col gap-3">
            <Radios label={t('Kako vam je najlakše?')} required value={f.channel} onChange={(v) => set({ channel: v })} options={CHANNELS.map(([id, l]) => [id, t(l)])} error={show('channel')} />
            <PaneHint>
              {f.channel
                ? t('Koordinatorka vam se javlja preko kanala {channel} da dogovorite vreme.', { channel: t(CHANNELS.find(([id]) => id === f.channel)[1]) })
                : t('Koordinatorka vam se javlja preko kanala koji izaberete da dogovorite vreme.')}
            </PaneHint>
          </div>
        </StepPanel>
      </StepPage>
    );

  // thanks: what comes next said with the thanks, under the title as one
  // text, no card (decided 11. 11.). No button: until the coordinator
  // approves her she cannot sign in, and there is nothing more to do (decided
  // 13. 11., Branislav). The prototype goes on from the demo's row under it.
  return (
    <StepPage
      title={t('Hvala!')}
      sub={`${t('Prijava je poslata.')} ${t('Koordinatorka će vam se javiti preko kanala {channel} za kratak razgovor. Kad odobri vaš profil, dobićete e-mail sa podacima za prijavu. Do tada ne morate ništa da radite.', {
        channel: t(CHANNELS.find(([id]) => id === f.channel)?.[1] || ''),
      })}`}
    >
      {sent && <DemoApproval email={sent.user.email} />}
    </StepPage>
  );
}

// For the demo only, as the rows under "Ko ste?": the coordinator approves her
// application, the email she would get is shown, and the sign-in opens with
// its address and temporary password filled in. Her application is done with
// then, so the draft goes.
const demoLink = 'cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground';
function DemoApproval({ email }) {
  const [temp, setTemp] = useState(null);
  const approve = async () => setTemp(await activateCaregiver(email));
  const signIn = () => {
    clearDraft();
    navigate({ page: 'signin' }, { state: { email, password: temp } });
  };
  return (
    <div className="mt-8 flex flex-col items-center gap-2 text-center">
      {!temp ? (
        <button type="button" className={demoLink} onClick={approve}>
          {t('Za demo: koordinatorka odobrava prijavu')}
        </button>
      ) : (
        <>
          <p className="max-w-md text-xs leading-body text-muted-foreground">
            {t('Za demo, e-mail koji stiže: „Vaš profil je aktiviran. Prijavite se adresom {email} i privremenom lozinkom {password}. Pri prvoj prijavi birate svoju lozinku."', { email, password: temp })}
          </p>
          <button type="button" className={demoLink} onClick={signIn}>
            {t('Za demo: na prijavu')}
          </button>
        </>
      )}
    </div>
  );
}
