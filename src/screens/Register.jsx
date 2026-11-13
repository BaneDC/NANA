import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '../components/Logo';
import PhotoCarousel from '../components/PhotoCarousel';
import { Field, Input, Password, Phone, Select, requiredError, useCheck } from '../components/TextField';
import { COUNTRIES } from '../data/countries';
import { activateCaregiver, awaitingFirstSignIn, changePassword, saveAccount, saveTestTwoFactorAccount, signIn, spendBackupCode, updateAccount } from '../lib/account';
import { currentCode, verifyCode } from '../lib/totp';
import { demoTwoFactor } from '../data/demoCase';
import { session } from '../data/demo';
import { setSiteMarket, siteMarket } from '../lib/siteLink';
import CaregiverSignUp, { ConsentRow } from './caregiver/SignUp';
import { StepPage, StepPanel } from '../components/StepCards';
import LanguagePicker from '../components/LanguagePicker';
import { HeaderBackSlot, PageHead, useHeaderBack } from '../components/HeaderBack';
import { goBackTo, navigate, useRoute } from '../lib/route';
import { msg, t, useLang } from '../i18n';
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
  // her market, as the caregiver's (decided 13. 11., Branislav): what the
  // website's link (in the prototype the demo's market row) said, else her
  // language; in English with no link Finland, as before. It gives the
  // fields' examples and the phone's country code, until she picks a code.
  const lang = useLang();
  const market = siteMarket() ?? siteRow.read() ?? (lang === 'sr' ? 'sr' : 'fi');
  const [picked, setPicked] = useState(null);
  const country = picked ?? (market === 'sr' ? 'RS' : 'FI');
  const setCountry = setPicked;
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [source, setSource] = useState('');
  const [processing, setProcessing] = useState(false);
  const [accuracy, setAccuracy] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [busy, setBusy] = useState(false);
  // who is signing up, from the address: /signup/family goes on to the form
  // below, /signup/caregiver to her own sign-up; /signup asks (in the
  // prototype it stands in for the website, where production asks)
  const who = useRoute().route.who ?? null;
  // "Ko ste?" stands in for the website: the market row below goes along to
  // her sign-up as the website's link would, ?market= for Finska or Srbija,
  // nothing for "Po jeziku" (her language decides; in English she picks)
  const setWho = (w) => {
    setSiteMarket(siteRow.read());
    navigate({ page: 'signup', who: w });
  };

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
          {/* kept above the fold: the carousel gives way (PhotoCarousel) */}
          <Button type="button" variant="ghost" size="lg" data-fold="" onClick={onSignIn}>
            {t('Već imate nalog? Prijavite se')}
          </Button>
          <DemoLink onDemo={onDemo} />
        </Actions>
      </>
    );

  // her own sign-up (part 5), in this same frame
  if (who === 'caregiver') return <CaregiverSignUp onBack={() => goBackTo({ page: 'signup' })} onForm={onForm} />;

  // on the onboarding's sky, as her account (docs/patterns.md §10, decided
  // 13. 11.): the photos are not over it, and Minna comes next on the same sky
  return <FamilySignUp {...{ example: FAMILY_EXAMPLE[market], firstName, setFirstName, lastName, setLastName, email, setEmail, country, setCountry, phone, setPhone, password, setPassword, source, setSource, processing, setProcessing, accuracy, setAccuracy, newsletter, setNewsletter, busy, show, submit, onSignIn, onDemo, onForm }} />;
}

// the examples in the family's fields, from her market (as the caregiver's, EXAMPLE)
const FAMILY_EXAMPLE = {
  sr: { firstName: 'Marko', lastName: 'Petrović', email: 'marko.petrovic@gmail.com' }, // i18n-ignore: a name, not translated
  fi: { firstName: 'Anna', lastName: 'Korhonen', email: 'anna@mail.com' },
};

function FamilySignUp(p) {
  const { show, onForm } = p;
  useEffect(() => {
    onForm?.(true);
    return () => onForm?.(false);
  }, [onForm]);
  return (
    <StepPage
      title={t('Dobro došli u NANA Prime')}
      sub={t('Polja označena zvezdicom su obavezna')}
      // opened from the website in a new tab: nothing behind it, so the logo, not a way back
      lead={
        <span className="flex h-(--button-size) items-center px-3">
          <Logo width={120} />
        </span>
      }
      language
    >
      {/* a real form, so the browser's password manager knows this is a sign-up */}
      <form className="contents" onSubmit={(e) => (e.preventDefault(), p.submit())}>
        <StepPanel>
          {/* one under the other on a phone, 24 apart as every question */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 max-[480px]:grid-cols-1">
            <Field label={t('Ime')} required error={show('firstName')}>
              <Input value={p.firstName} onChange={p.setFirstName} placeholder={p.example.firstName} autoComplete="given-name" />
            </Field>
            <Field label={t('Prezime')} required error={show('lastName')}>
              <Input value={p.lastName} onChange={p.setLastName} placeholder={p.example.lastName} autoComplete="family-name" />
            </Field>
          </div>
          <Field label={t('Email')} required error={show('email')}>
            <Input value={p.email} onChange={p.setEmail} type="email" placeholder={p.example.email} autoComplete="email" />
          </Field>
          <Field label={t('Broj telefona')} required as="div" labelId="reg-phone" error={show('phone')}>
            {/* the country's code in front, behind a line, then the number (TextField's Phone) */}
            <Phone country={p.country} onCountry={p.setCountry} value={p.phone} onChange={p.setPhone} labelledBy="reg-phone" />
          </Field>
          <Field
            label={t('Lozinka')}
            required
            hint={p.password && p.password.length < MIN_PASSWORD ? t('Još {n} karaktera', { n: MIN_PASSWORD - p.password.length }) : null}
            error={show('password')}
          >
            <Password value={p.password} onChange={p.setPassword} placeholder={t('Najmanje 8 karaktera')} autoComplete="new-password" />
          </Field>
          <Field label={t('Kako ste čuli za nas?')} required as="div" labelId="reg-source" error={show('source')}>
            <Select value={p.source} onChange={p.setSource} labelledBy="reg-source" options={sourceOptions()} />
          </Field>
          {/* rows as on her account: a box, the sentence, the whole row the target */}
          <div className="flex flex-col">
            <ConsentRow required checked={p.processing} onChange={p.setProcessing} error={show('processing')}>
              {t('Saglasan/na sam sa obradom podataka')}
            </ConsentRow>
            <ConsentRow required checked={p.accuracy} onChange={p.setAccuracy} error={show('accuracy')}>
              {t('Potvrđujem da su podaci tačni')}
            </ConsentRow>
            <ConsentRow checked={p.newsletter} onChange={p.setNewsletter}>
              {t('Želim da primam novosti i posebne ponude na email')}
            </ConsentRow>
          </div>
          {/* as "Nastavi" on her account: at the card's right, on a phone across it */}
          <div className="flex justify-end phone:*:flex-1">
            <Button type="submit" loading={p.busy}>
              {t('Napravi nalog')}
            </Button>
          </div>
        </StepPanel>
      </form>
      {/* out of the card: the terms and the GDPR line, 16 under it, in by 16 */}
      <div className="-mt-4 flex flex-col gap-4 px-4 text-small text-muted-foreground">
        <p className="phone:text-center [&_a]:text-primary-600">
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
        <p className="flex items-start gap-2">
          <ShieldCheck size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-primary-600" />
          {t('NANA Prime je finska kompanija. Vaši podaci se čuvaju i obrađuju bezbedno, u skladu sa EU GDPR propisima o zaštiti podataka.')}
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button type="button" variant="ghost" size="lg" onClick={p.onSignIn}>
          {t('Već imate nalog? Prijavite se')}
        </Button>
        <DemoLink onDemo={p.onDemo} />
      </div>
    </StepPage>
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
    </>
  );
}

// What the market row says for the "website" (setWho), kept for this tab:
// 'fi' or 'sr', or null for "Po jeziku"
const SITE_ROW = 'nana.demo.site';
const siteRow = {
  read() {
    try {
      return sessionStorage.getItem(SITE_ROW);
    } catch {
      return null;
    }
  },
  write(m) {
    try {
      if (m) sessionStorage.setItem(SITE_ROW, m);
      else sessionStorage.removeItem(SITE_ROW);
    } catch {
      /* lasts until the page is left */
    }
  },
};

// Which market the demo opens on (kept for this tab, src/data/demo.js, so the
// two links above open on it), and which one "Ko ste?", the website's stand-in,
// hands to the caregiver's sign-up. "Po jeziku" (the start) hands none, as a
// website link without ?market=, and the demo links then open on Finland.
function DemoMarket() {
  const [market, setMarket] = useState(() => siteRow.read() || 'lang');
  const pick = (m) => {
    setMarket(m);
    siteRow.write(m === 'lang' ? null : m);
    session.write({ role: session.read()?.role || 'family', market: m === 'lang' ? 'fi' : m });
  };
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{t('Za demo: tržište')}</span>
      {[
        ['lang', t('Po jeziku')],
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

function SignIn({ onContinue, onSignUp, onDemo }) {
  // the demo's "na prijavu" from a caregiver's thanks brings the email's
  // address and temporary password
  const given = useRoute().state;
  const [email, setEmail] = useState(given?.email || '');
  const [password, setPassword] = useState(given?.password || '');
  const [awaiting] = useState(awaitingFirstSignIn);
  const [failed, setFailed] = useState(false);
  const check = useCheck();
  const errors = { email: emailError(email), password: !password && requiredError() };

  // with two-factor on, the right password leads to the code, not in
  const [pending, setPending] = useState(null);
  const { step } = useRoute().route;

  const submit = async () => {
    if (!check.check(Object.values(errors))) return;
    const user = await signIn(email, password);
    if (!user) setFailed(true);
    // a caregiver's first sign-in, with the coordinator's temporary password:
    // her own password first (docs/patterns.md §12d)
    else if (user.mustChangePassword) {
      setPending(user);
      navigate({ page: 'signin', step: 'password' });
    } else if (user.twoFactor && user.twoFactorSecret) {
      setPending(user);
      navigate({ page: 'signin', step: 'verify' });
    }
    else onContinue(user);
  };

  // the code's step is /signin/verify, only after the password: opened
  // without it (a reload, a link) it is the sign-in again
  const verifying = step === 'verify' && pending;
  const choosing = step === 'password' && pending?.mustChangePassword;
  useEffect(() => {
    if ((step === 'verify' || step === 'password') && !pending) navigate({ page: 'signin' }, { replace: true });
  }, [step, pending]);
  const toSignIn = () => goBackTo({ page: 'signin' });

  if (verifying)
    return (
      <TwoFactorStep
        user={pending}
        onContinue={onContinue}
        onBack={() => {
          setPending(null);
          toSignIn();
        }}
      />
    );
  if (choosing)
    return (
      <FirstPassword
        user={pending}
        temp={password}
        onContinue={onContinue}
        onBack={() => {
          setPending(null);
          toSignIn();
        }}
      />
    );
  // a forgotten password: its own step, /signin/reset
  if (step === 'reset') return <ResetPassword email={email} onBack={toSignIn} />;

  return (
    <>
      <Welcome title={t('Prijavite se')} sub={t('Email adresom i lozinkom kojima ste napravili nalog')} />
      <form className="contents" onSubmit={(e) => (e.preventDefault(), submit())}>
        <FormCard>
          <Field label={t('Email')} required error={check.show(errors.email)}>
            <Input value={email} onChange={(v) => (setEmail(v), setFailed(false))} type="email" placeholder="anna@mail.com" autoComplete="email" />
          </Field>
          {/* the link 8 under the password, at its right edge */}
          <div className="flex flex-col items-end gap-2">
            <Field label={t('Lozinka')} required error={check.show(errors.password) || (failed ? t('Email ili lozinka nisu tačni.') : null)}>
              <Password value={password} onChange={(v) => (setPassword(v), setFailed(false))} placeholder={t('Vaša lozinka')} />
            </Field>
            <Button type="button" variant="link" size="sm" className="-mr-2 pointer-coarse:h-11" onClick={() => (check.reset(), navigate({ page: 'signin', step: 'reset' }))}>
              {t('Zaboravili ste lozinku?')}
            </Button>
          </div>
        </FormCard>
        <Actions>
          <Button type="submit" size="lg" className="w-full">
            {t('Prijavi se')}
          </Button>
          {/* kept above the fold: the carousel gives way (PhotoCarousel) */}
          <Button type="button" variant="ghost" size="lg" data-fold="" onClick={onSignUp}>
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
          {/* an approved caregiver whose email (temporary password) is gone */}
          {awaiting && (
            <button
              type="button"
              className={demoLink}
              onClick={async () => {
                const temp = await activateCaregiver(awaiting);
                if (!temp) return;
                setEmail(awaiting);
                setPassword(temp);
                setFailed(false);
              }}
            >
              {t('Za demo: nova privremena lozinka za {email}', { email: awaiting })}
            </button>
          )}
        </Actions>
      </form>
    </>
  );
}

// A caregiver's first sign-in: the coordinator's email gave a temporary
// password, and she picks her own before going in (docs/patterns.md §12d),
// typed twice, at least 8, as in Settings.
function FirstPassword({ user, temp, onContinue, onBack }) {
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const check = useCheck();
  const errors = {
    next: passwordError(next),
    again: !again ? requiredError() : again !== next && t('Dva unosa se ne poklapaju.'),
  };
  useHeaderBack(t('Nazad na prijavu'), onBack);
  const submit = async () => {
    if (saving || !check.check(Object.values(errors))) return;
    setSaving(true);
    const fault = await changePassword(user.email, temp, next);
    setSaving(false);
    if (fault) return setFailed(true);
    const ready = { ...user, mustChangePassword: false };
    updateAccount(ready);
    onContinue(ready);
  };
  return (
    <>
      <Welcome title={t('Izaberite lozinku')} sub={t('Privremenu lozinku iz e-maila menjate pri prvoj prijavi. Nova lozinka mora imati najmanje 8 karaktera.')} />
      <form className="contents" onSubmit={(e) => (e.preventDefault(), submit())}>
        <FormCard>
          <Field label={t('Nova lozinka')} required error={check.show(errors.next) || (failed ? t('Nije sačuvano - proverite da li je čuvanje podataka dozvoljeno u pregledaču.') : null)}>
            <Password value={next} onChange={(v) => (setNext(v), setFailed(false))} autoComplete="new-password" />
          </Field>
          <Field label={t('Nova lozinka još jednom')} required error={check.show(errors.again)}>
            <Password value={again} onChange={setAgain} autoComplete="new-password" />
          </Field>
        </FormCard>
        <Actions>
          <Button type="submit" size="lg" className="w-full" loading={saving}>
            {t('Sačuvaj i nastavi')}
          </Button>
        </Actions>
      </form>
    </>
  );
}

// A link for a new password, to the account's email (docs/patterns.md §10).
// It never says whether the account exists, so addresses cannot be tried out.
// The prototype sends nothing.
function ResetPassword({ email: given, onBack }) {
  const [email, setEmail] = useState(given);
  const [sent, setSent] = useState(false);
  const check = useCheck();
  const send = () => {
    if (!check.check([emailError(email)])) return;
    setSent(true);
  };

  // back to signing in, from the head (docs/patterns.md §4, decided 12. 11.)
  useHeaderBack(t('Nazad na prijavu'), onBack);

  if (sent) return <Welcome title={t('Proverite email')} sub={t('Ako postoji nalog sa adresom {email}, poslali smo vam link za novu lozinku.', { email: email.trim() })} />;

  return (
    <>
      <Welcome title={t('Nova lozinka')} sub={t('Upišite email adresu naloga i poslaćemo vam link za novu lozinku.')} />
      <form className="contents" onSubmit={(e) => (e.preventDefault(), send())}>
        <FormCard>
          <Field label={t('Email adresa')} required error={check.show(emailError(email))}>
            <Input value={email} onChange={setEmail} type="email" placeholder={t('Unesite svoju email adresu')} autoComplete="email" />
          </Field>
        </FormCard>
        <Actions>
          <Button type="submit" size="lg" className="w-full">
            {t('Pošalji link')}
          </Button>
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
// under it. "Nazad na prijavu", in the head, goes back to the email and password.
function TwoFactorStep({ user, onContinue, onBack }) {
  useHeaderBack(t('Nazad na prijavu'), onBack);
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
          {user.email === demoTwoFactor.user.email && <TestCodes />}
        </Actions>
      </form>
    </>
  );
}

export default function Register({ onContinue, onDemo }) {
  // signing up or in: the address says which (src/lib/route.js)
  const mode = useRoute().route.page === 'signin' ? 'sign-in' : 'sign-up';
  // a caregiver's sign-up past her account: a form, no photos over it
  const [form, setForm] = useState(false);
  // a page's way back, drawn in the head over the logo (docs/patterns.md §4)
  const [back, setBack] = useState(null);
  return (
    // the whole screen, its column centred and scrolling (safe: a tall form is
    // not cut off at the top)
    <motion.div
      className="flex min-h-0 flex-1 flex-col items-center justify-[safe_center] gap-6 overflow-y-auto px-6 py-12 *:shrink-0"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.2, ease: 'easeIn' } }}
    >
      {/* the head (§4, §12b): the logo at the left, or the way back where
          there is one, and the language at the right; the logo's text where
          the arrow's is (decided 12. 11., dizajner) */}
      {(back || !form) && (
        <PageHead
          back={back}
          lead={
            <span className="flex h-(--button-size) items-center px-3">
              <Logo width={120} />
            </span>
          }
          className={`${column} -mt-8 phone:-mx-2 phone:w-auto phone:max-w-none phone:self-stretch`}
        >
          {!form && <LanguagePicker />}
        </PageHead>
      )}
      {/* a page with a way back keeps the logo, under the head */}
      {back && <Logo width={150} />}
      {/* the photos on the sign-in and sign-up pages only, not over a form's steps */}
      {!form && <PhotoCarousel />}
      <HeaderBackSlot value={setBack}>
        {mode === 'sign-up' ? (
          <SignUp onContinue={onContinue} onSignIn={() => navigate({ page: 'signin' })} onDemo={onDemo} onForm={setForm} />
        ) : (
          <SignIn onContinue={onContinue} onSignUp={() => navigate({ page: 'signup' })} onDemo={onDemo} />
        )}
      </HeaderBackSlot>
    </motion.div>
  );
}
