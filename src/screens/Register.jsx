import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Logo from '../components/Logo';
import PhotoCarousel from '../components/PhotoCarousel';
import { Field, FieldError, Input, Password, Phone, Select, requiredError, useCheck } from '../components/TextField';
import { COUNTRIES } from '../data/countries';
import { saveAccount, saveTestTwoFactorAccount, signIn, spendBackupCode } from '../lib/account';
import { currentCode, verifyCode } from '../lib/totp';
import { demoTwoFactor } from '../data/demoCase';
import { session } from '../data/demo';
import CaregiverSignUp from './caregiver/SignUp';
import { LANGUAGES, msg, setLang, t, useLang } from '../i18n';
import { CodeInput } from '../components/TwoFactorSetup';

// Registering, and signing back in. For now only the family's side signs up
// here; the caregiver's is reached from the same shell once it is back. Everything asked here is kept with the
// account and handed to the rest of the app, so nothing the family has already
// said is asked again: their name and number go straight into the onboarding.


const SOURCES = [
  msg('Preko prijatelja ili porodice'),
  msg('Google pretraga'),
  msg('Društvene mreže'),
  msg('Lekar ili bolnica'),
  msg('Oglas'),
  msg('Drugo'),
];

// the list shows where the code is from; the closed field only needs the code.
// Built when shown, so the names are in the language of the moment.
// the answer is kept as its Serbian key; only the label is translated
const sourceOptions = () => SOURCES.map((s) => ({ value: s, label: t(s) }));

const MIN_PASSWORD = 8;

// A consent: the box and its sentence, the whole line its label.
// `error` under it once a press has asked (docs/patterns.md §10).
export function Consent({ checked, onChange, children, required, error }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex cursor-pointer items-start gap-2 text-xs text-foreground">
        <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} aria-invalid={error ? true : undefined} />
        <span>
          {children}
          {required && <span className="text-primary-600"> *</span>}
        </span>
      </label>
      <FieldError className="px-0 pl-6">{error}</FieldError>
    </div>
  );
}

// what a filled field can still get wrong
const emailError = (email) => (!email.trim() ? requiredError() : !/\S+@\S+\.\S+/.test(email) ? t('Unesite ispravnu email adresu.') : null);
const passwordError = (password) =>
  !password ? requiredError() : password.length < MIN_PASSWORD ? t('Kratka je - treba najmanje 8 karaktera.') : null;

// The sign-up's parts, all 480 wide at most: a heading, a grey form card
// (24 corners, 16 inside, fields 16 apart) and the actions under it.
export const column = 'w-[480px] max-w-full shrink-0';


function SignUp({ onContinue, onSignIn, onDemo, onForm }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('FI');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [source, setSource] = useState('');
  const [processing, setProcessing] = useState(false);
  const [accuracy, setAccuracy] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [busy, setBusy] = useState(false);
  // who is signing up: a family goes on to the form below; a caregiver's own
  // sign-up comes with part 5, so for now she is shown her side on the demo
  const [who, setWho] = useState(null);

  const dial = COUNTRIES.find((c) => c.id === country);
  const check = useCheck();
  const errors = {
    firstName: !firstName.trim() && requiredError(),
    lastName: !lastName.trim() && requiredError(),
    email: emailError(email),
    phone: !phone.trim() ? requiredError() : phone.replace(/\D/g, '').length < 6 ? t('Unesite ceo broj telefona.') : null,
    password: passwordError(password),
    source: !source && requiredError(),
    processing: !processing && requiredError(),
    accuracy: !accuracy && requiredError(),
  };
  const show = (k) => check.show(errors[k]);

  const submit = async () => {
    if (busy || !check.check(Object.values(errors))) return;
    setBusy(true);
    const user = {
      // the app is the family's side; caregivers are simulated (SimPanel)
      role: 'family',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      phone: `${dial.code} ${phone.trim()}`,
      country,
      source,
      consents: { processing, accuracy, newsletter },
      registeredAt: new Date().toISOString(),
    };
    await saveAccount(user, password);
    onContinue(user);
  };

  if (who === null)
    return (
      <>
        <Welcome title={t('Ko ste?')} sub={t('Porodica traži negu za nekoga. Negovateljica nudi negu.')} />
        <Actions>
          <Button size="lg" className="w-full" onClick={() => setWho('family')}>
            {t('Porodica')}
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => setWho('caregiver')}>
            {t('Negovateljica')}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={onSignIn}>
            {t('Već imate nalog? Prijavite se')}
          </Button>
          <DemoLink onDemo={onDemo} />
        </Actions>
      </>
    );

  // her own sign-up (part 5), in this same frame
  if (who === 'caregiver') return <CaregiverSignUp onBack={() => setWho(null)} onForm={onForm} onDone={(u, record) => onContinue(u, { record })} />;

  return (
    <>
      <Welcome title={t('Dobro došli u NANA Prime')} sub={t('Polja označena zvezdicom su obavezna')} />
      {/* a real form, so the browser's password manager knows this is a sign-up */}
      <form className="contents" onSubmit={(e) => (e.preventDefault(), submit())}>

        <FormCard>
          <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
            <Field label={t('Ime')} required error={show('firstName')}>
              <Input value={firstName} onChange={setFirstName} placeholder="Anna" autoComplete="given-name" />
            </Field>
            <Field label={t('Prezime')} required error={show('lastName')}>
              <Input value={lastName} onChange={setLastName} placeholder="Korhonen" autoComplete="family-name" />
            </Field>
          </div>
          <Field label={t('Email')} required error={show('email')}>
            <Input value={email} onChange={setEmail} type="email" placeholder="anna@mail.com" autoComplete="email" />
          </Field>
          <Field label={t('Broj telefona')} required as="div" labelId="reg-phone" error={show('phone')}>
            {/* the country's code in front, behind a line, then the number (TextField's Phone) */}
            <Phone country={country} onCountry={setCountry} value={phone} onChange={setPhone} labelledBy="reg-phone" />
          </Field>
          <Field
            label={t('Lozinka')}
            required
            hint={password && password.length < MIN_PASSWORD ? t('Još {n} karaktera', { n: MIN_PASSWORD - password.length }) : null}
            error={show('password')}
          >
            <Password value={password} onChange={setPassword} placeholder={t('Najmanje 8 karaktera')} autoComplete="new-password" />
          </Field>
          <Field label={t('Kako ste čuli za nas?')} required as="div" labelId="reg-source" error={show('source')}>
            <Select value={source} onChange={setSource} labelledBy="reg-source" options={sourceOptions()} />
          </Field>

          <div className="flex flex-col gap-2 px-1">
            <Consent checked={processing} onChange={setProcessing} required error={show('processing')}>
              {t('Saglasan/na sam sa obradom podataka')}
            </Consent>
            <Consent checked={accuracy} onChange={setAccuracy} required error={show('accuracy')}>
              {t('Potvrđujem da su podaci tačni')}
            </Consent>
            <Consent checked={newsletter} onChange={setNewsletter}>
              {t('Želim da primam novosti i posebne ponude na email')}
            </Consent>
          </div>
        </FormCard>

        <Actions>
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            {t('Napravi nalog')}
          </Button>
          <p className="w-full text-center text-small text-muted-foreground [&_a]:text-primary-600">
            {t('Registracijom prihvatate naše')}{' '}
            <a href="#uslovi" onClick={(e) => e.preventDefault()}>
              {t('uslove korišćenja')}
            </a>{' '}
            {t('i')}{' '}
            <a href="#privatnost" onClick={(e) => e.preventDefault()}>
              {t('politiku privatnosti')}
            </a>
            .{' '}
            <a href="#kolacici" onClick={(e) => e.preventDefault()}>
              {t('Podešavanja kolačića')}
            </a>
          </p>
          <p className="mt-2 flex w-full items-start gap-2 border-t-[0.8px] pt-4 text-small text-muted-foreground">
            <ShieldCheck size={16} strokeWidth={1.75} className="shrink-0 text-primary-600" />
            {t(
              'NANA Prime je finska kompanija. Vaši podaci se čuvaju i obrađuju bezbedno, u skladu sa EU GDPR propisima o zaštiti podataka.'
            )}
          </p>
          <Button type="button" variant="ghost" size="lg" onClick={onSignIn}>
            {t('Već imate nalog? Prijavite se')}
          </Button>
          <DemoLink onDemo={onDemo} />
        </Actions>
      </form>
    </>
  );
}

export function Welcome({ title, sub }) {
  return (
    <div className={`${column} px-7 text-center text-foreground`}>
      <h1 className="text-base font-medium">{title}</h1>
      <p className="text-sm">{sub}</p>
    </div>
  );
}

export function FormCard(props) {
  return <div className={`${column} flex flex-col gap-4 rounded-3xl bg-muted p-4`} {...props} />;
}

export function Actions(props) {
  return <div className={`${column} flex flex-col items-center gap-2 px-4`} {...props} />;
}

// for testing only, so plain underlined text rather than a button
const demoLink =
  'cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground';

// Straight into the app on a finished plan, for trying the chat and everything
// after the plan without running (and paying for) the onboarding each time.
function DemoLink({ onDemo }) {
  return (
    <>
      <button type="button" className={demoLink} onClick={() => onDemo('family')}>
        {t('Za demo: porodica')}
      </button>
      <button type="button" className={demoLink} onClick={() => onDemo('caregiver')}>
        {t('Za demo: negovateljica')}
      </button>
      {/* every card on one page (/?kartice), for comparing them */}
      <button type="button" className={demoLink} onClick={() => (window.location.href = '/?kartice')}>
        {t('Za pregled: sve kartice na jednoj stranici')}
      </button>
      <DemoMarket />
      <DemoLanguage />
    </>
  );
}

// Which market the demo opens on: the same row as the language, kept for this
// tab (src/data/demo.js), so the two links above open on it.
function DemoMarket() {
  const [market, setMarket] = useState(() => session.read()?.market || 'fi');
  const pick = (m) => {
    setMarket(m);
    session.write({ role: session.read()?.role || 'family', market: m });
  };
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{t('Za demo: tržište')}</span>
      {[
        ['fi', t('Finska')],
        ['sr', t('Srbija')],
      ].map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={id === market}
          className={id === market ? 'text-xs font-medium text-foreground' : demoLink}
          onClick={() => pick(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// For showing the demo in another language: the same choice as in Settings,
// made before there is an account, so the onboarding is held in it too.
function DemoLanguage() {
  const lang = useLang();
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{t('Za demo: jezik')}</span>
      {LANGUAGES.map((l) => (
        <button
          key={l.id}
          type="button"
          aria-pressed={l.id === lang}
          className={l.id === lang ? 'text-xs font-medium text-foreground' : demoLink}
          onClick={() => setLang(l.id)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function SignIn({ onContinue, onSignUp, onDemo }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failed, setFailed] = useState(false);
  const check = useCheck();
  const errors = { email: emailError(email), password: !password && requiredError() };

  // with two-factor on, the right password leads to the code, not in
  const [pending, setPending] = useState(null);

  const submit = async () => {
    if (!check.check(Object.values(errors))) return;
    const user = await signIn(email, password);
    if (!user) setFailed(true);
    else if (user.twoFactor && user.twoFactorSecret) setPending(user);
    else onContinue(user);
  };

  if (pending) return <TwoFactorStep user={pending} onContinue={onContinue} onBack={() => setPending(null)} />;

  return (
    <>
      <Welcome title={t('Prijavite se')} sub={t('Email adresom i lozinkom kojima ste napravili nalog')} />
      <form className="contents" onSubmit={(e) => (e.preventDefault(), submit())}>
        <FormCard>
          <Field label={t('Email')} required error={check.show(errors.email)}>
            <Input value={email} onChange={(v) => (setEmail(v), setFailed(false))} type="email" placeholder="anna@mail.com" autoComplete="email" />
          </Field>
          <Field label={t('Lozinka')} required error={check.show(errors.password) || (failed ? t('Email ili lozinka nisu tačni.') : null)}>
            <Password value={password} onChange={(v) => (setPassword(v), setFailed(false))} placeholder={t('Vaša lozinka')} />
          </Field>
        </FormCard>
        <Actions>
          <Button type="submit" size="lg" className="w-full">
            {t('Prijavi se')}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={onSignUp}>
            {t('Nemate nalog? Napravite ga')}
          </Button>
          <DemoLink onDemo={onDemo} />
          <button
            type="button"
            className={demoLink}
            onClick={async () => {
              await saveTestTwoFactorAccount(demoTwoFactor);
              setEmail(demoTwoFactor.user.email);
              setPassword(demoTwoFactor.password);
              setFailed(false);
            }}
          >
            {t('Za testiranje: nalog sa dvofaktorskom prijavom')}
          </button>
        </Actions>
      </form>
    </>
  );
}

// For the test account only: the code its app would show now, and its backup
// codes, under the actions as the other testing links are.
function TestCodes() {
  const [code, setCode] = useState('');
  useEffect(() => {
    const tick = () => currentCode(demoTwoFactor.user.twoFactorSecret).then(setCode);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="text-center text-xs leading-body text-muted-foreground">
      {t('Za testiranje: kod iz aplikacije je {code}. Rezervni kodovi: {codes}.', {
        code,
        codes: demoTwoFactor.backupCodes.join(', '),
      })}
    </p>
  );
}

// The second step of signing in when two-factor is on: the six digits from
// the app, or one of the backup codes saved when it was turned on (each signs
// in once). Laid out as signing in is: the welcome, the grey form, the actions
// under it. "Nazad na prijavu" goes back to the email and password.
function TwoFactorStep({ user, onContinue, onBack }) {
  const [backup, setBackup] = useState(false);
  const [code, setCode] = useState('');
  const [typed, setTyped] = useState('');
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const check = useCheck();
  const missing = backup
    ? !typed.trim()
      ? requiredError()
      : typed.trim().length < 8 && t('Unesite ceo rezervni kod.')
    : code.length < 6 && t('Unesite svih 6 cifara.');

  // `entered` is the six digits as they complete: the code goes on its own,
  // with no need to press "Potvrdi"
  const submit = async (entered = code) => {
    if (checking) return;
    // the six digits complete call this with them before the state has them
    if (!(entered.length === 6 && !backup) && !check.check([missing])) return;
    setChecking(true);
    const next = backup ? await spendBackupCode(user, typed) : (await verifyCode(user.twoFactorSecret, entered)) && user;
    setChecking(false);
    if (next) return onContinue(next);
    // a wrong code is cleared, so the right one goes straight in
    if (!backup) setCode('');
    setError(
      backup
        ? t('Ovaj rezervni kod ne važi ili je već iskorišćen.')
        : t('Kod nije tačan. Proverite da li ste prepisali poslednji koji aplikacija prikazuje.')
    );
  };

  const switchTo = (toBackup) => {
    setBackup(toBackup);
    setError(null);
    check.reset();
  };
  const shown = error || check.show(missing);

  return (
    <>
      <Welcome
        title={t('Dvofaktorska prijava')}
        sub={backup ? t('Unesite jedan od rezervnih kodova koje ste sačuvali') : t('Unesite šestocifreni kod iz aplikacije za kodove')}
      />
      <form className="contents" onSubmit={(e) => (e.preventDefault(), submit())}>
        <FormCard>
          {backup ? (
            <Field label={t('Rezervni kod')} required error={shown}>
              <Input
                value={typed}
                onChange={(v) => (setTyped(v), setError(null))}
                autoFocus
                autoComplete="one-time-code"
                spellCheck={false}
                placeholder={t('npr. a9883806')}
              />
            </Field>
          ) : (
            <>
              <CodeInput value={code} onChange={(v) => (setCode(v), v && setError(null))} onComplete={submit} invalid={Boolean(shown)} />
              <FieldError className="text-center">{shown}</FieldError>
            </>
          )}
        </FormCard>
        <Actions>
          {/* the other way in and "Potvrdi" side by side, halves of the row;
              on a phone, where half is too narrow for the longer one, each
              takes what it needs and "Potvrdi" the rest */}
          <div className="grid w-full grid-cols-2 gap-2 phone:flex phone:*:flex-auto">
            <Button type="button" variant="secondary" size="lg" onClick={() => switchTo(!backup)}>
              {backup ? t('Koristite kod iz aplikacije') : t('Koristite rezervni kod')}
            </Button>
            <Button type="submit" size="lg" loading={checking}>
              {t('Potvrdi')}
            </Button>
          </div>
          <Button type="button" variant="ghost" size="lg" onClick={onBack}>
            {t('Nazad na prijavu')}
          </Button>
          {user.email === demoTwoFactor.user.email && <TestCodes />}
        </Actions>
      </form>
    </>
  );
}

export default function Register({ onContinue, onDemo }) {
  const [mode, setMode] = useState('sign-up');
  // a caregiver's sign-up past her account: a form, no photos over it
  const [form, setForm] = useState(false);
  return (
    // the whole screen, its column centred and scrolling (safe: a tall form is
    // not cut off at the top)
    <motion.div
      className="flex min-h-0 flex-1 flex-col items-center justify-[safe_center] gap-6 overflow-y-auto px-6 py-12 *:shrink-0"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.2, ease: 'easeIn' } }}
    >
      <Logo width={150} />
      {/* the photos on the sign-in and sign-up pages only, not over a form's steps */}
      {!form && <PhotoCarousel />}
      {mode === 'sign-up' ? (
        <SignUp onContinue={onContinue} onSignIn={() => setMode('sign-in')} onDemo={onDemo} onForm={setForm} />
      ) : (
        <SignIn onContinue={onContinue} onSignUp={() => setMode('sign-up')} onDemo={onDemo} />
      )}
    </motion.div>
  );
}
