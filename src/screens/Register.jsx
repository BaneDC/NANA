import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Logo from '../components/Logo';
import PhotoCarousel from '../components/PhotoCarousel';
import SelectCard from '../components/SelectCard';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Field, Input, Password, Select } from '../components/TextField';
import { saveAccount, signIn, spendBackupCode } from '../lib/account';
import { verifyCode } from '../lib/totp';
import { CodeInput } from '../components/TwoFactorSetup';

// Registering, and signing back in. For now only the family's side signs up
// here; the caregiver's is reached from the same shell once it is back. Everything asked here is kept with the
// account and handed to the rest of the app, so nothing the family has already
// said is asked again: their name and number go straight into the onboarding.

const ROLES = [
  {
    id: 'family',
    letter: 'a',
    title: 'Treba mi nega za roditelja',
    description: 'Odgovorite na nekoliko pitanja i naći ćemo nekoga blizu vas',
  },
  {
    id: 'caregiver',
    letter: 'b',
    title: 'Ja sam negovateljica',
    description: 'Primajte upite porodica, dogovorite uslove, budite plaćeni',
  },
];

const COUNTRIES = [
  { id: 'FI', name: 'Finska', flag: '🇫🇮', code: '+358' },
  { id: 'RS', name: 'Srbija', flag: '🇷🇸', code: '+381' },
  { id: 'HR', name: 'Hrvatska', flag: '🇭🇷', code: '+385' },
  { id: 'BA', name: 'Bosna i Hercegovina', flag: '🇧🇦', code: '+387' },
  { id: 'ME', name: 'Crna Gora', flag: '🇲🇪', code: '+382' },
  { id: 'MK', name: 'Severna Makedonija', flag: '🇲🇰', code: '+389' },
  { id: 'SI', name: 'Slovenija', flag: '🇸🇮', code: '+386' },
  { id: 'DE', name: 'Nemačka', flag: '🇩🇪', code: '+49' },
  { id: 'AT', name: 'Austrija', flag: '🇦🇹', code: '+43' },
  { id: 'CH', name: 'Švajcarska', flag: '🇨🇭', code: '+41' },
];

const SOURCES = [
  'Preko prijatelja ili porodice',
  'Google pretraga',
  'Društvene mreže',
  'Lekar ili bolnica',
  'Oglas',
  'Drugo',
];

// the list shows where the code is from; the closed field only needs the code
const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  value: c.id,
  label: c.name,
  icon: c.flag,
  meta: c.code,
  display: `${c.flag} ${c.code}`,
}));
const SOURCE_OPTIONS = SOURCES.map((s) => ({ value: s, label: s }));

const MIN_PASSWORD = 8;

// A consent: the box and its sentence, the whole line its label.
function Consent({ checked, onChange, children, required }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-xs text-foreground">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <span>
        {children}
        {required && <span className="text-primary-600"> *</span>}
      </span>
    </label>
  );
}

// The sign-up's parts, all 480 wide at most: a heading, a grey form card
// (24 corners, 16 inside, fields 16 apart) and the actions under it.
const column = 'w-[480px] max-w-full shrink-0';

// the role picker is hidden while only the family side is being shown
const SHOW_ROLES = false;

function SignUp({ onContinue, onSignIn, onDemo }) {
  const [role, setRole] = useState('family');
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

  const dial = COUNTRIES.find((c) => c.id === country);
  const valid =
    firstName.trim() &&
    lastName.trim() &&
    /\S+@\S+\.\S+/.test(email) &&
    phone.replace(/\D/g, '').length >= 6 &&
    password.length >= MIN_PASSWORD &&
    source &&
    processing &&
    accuracy;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    const user = {
      role,
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

  return (
    <>
      <Welcome title="Dobro došli u NANA Prime" sub="Polja označena zvezdicom su obavezna" />
      {/* a real form, so the browser's password manager knows this is a sign-up */}
      <form className="contents" onSubmit={(e) => (e.preventDefault(), submit())}>

        {SHOW_ROLES && (
        <FormCard>
          <div className="flex flex-col gap-2">
            <Label className="px-3">Ovde sam kao</Label>
            {ROLES.map((r) => (
              <SelectCard
                key={r.id}
                letter={r.letter}
                title={r.title}
                description={r.description}
                selected={role === r.id}
                onClick={() => setRole(r.id)}
              />
            ))}
          </div>
        </FormCard>
        )}

        <FormCard>
          <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
            <Field label="Ime" required>
              <Input value={firstName} onChange={setFirstName} placeholder="Anna" autoComplete="given-name" />
            </Field>
            <Field label="Prezime" required>
              <Input value={lastName} onChange={setLastName} placeholder="Korhonen" autoComplete="family-name" />
            </Field>
          </div>
          <Field label="Email" required>
            <Input value={email} onChange={setEmail} type="email" placeholder="anna@mail.com" autoComplete="email" />
          </Field>
          <Field label="Broj telefona" required as="div" labelId="reg-phone">
            {/* the country's code in front, behind a line, then the number */}
            <InputGroup>
              <Select
                bare
                value={country}
                onChange={setCountry}
                ariaLabel="Pozivni broj države"
                options={COUNTRY_OPTIONS}
              />
              <InputGroupInput
                type="tel"
                value={phone}
                placeholder="40 123 4567"
                autoComplete="tel-national"
                aria-labelledby="reg-phone"
                onChange={(e) => setPhone(e.target.value)}
              />
            </InputGroup>
          </Field>
          <Field label="Lozinka" required hint={password && password.length < MIN_PASSWORD ? `Još ${MIN_PASSWORD - password.length} karaktera` : null}>
            <Password value={password} onChange={setPassword} placeholder="Najmanje 8 karaktera" autoComplete="new-password" />
          </Field>
          <Field label="Kako ste čuli za nas?" required as="div" labelId="reg-source">
            <Select value={source} onChange={setSource} labelledBy="reg-source" options={SOURCE_OPTIONS} />
          </Field>

          <div className="flex flex-col gap-2 px-1">
            <Consent checked={processing} onChange={setProcessing} required>
              Saglasan/na sam sa obradom podataka
            </Consent>
            <Consent checked={accuracy} onChange={setAccuracy} required>
              Potvrđujem da su podaci tačni
            </Consent>
            <Consent checked={newsletter} onChange={setNewsletter}>
              Želim da primam novosti i posebne ponude na email
            </Consent>
          </div>
        </FormCard>

        <Actions>
          <Button type="submit" size="lg" className="w-full" disabled={!valid || busy}>
            Napravi nalog
          </Button>
          <p className="w-full text-center text-small text-muted-foreground [&_a]:text-primary-600">
            Registracijom prihvatate naše{' '}
            <a href="#uslovi" onClick={(e) => e.preventDefault()}>
              uslove korišćenja
            </a>{' '}
            i{' '}
            <a href="#privatnost" onClick={(e) => e.preventDefault()}>
              politiku privatnosti
            </a>
            .{' '}
            <a href="#kolacici" onClick={(e) => e.preventDefault()}>
              Podešavanja kolačića
            </a>
          </p>
          <p className="mt-2 flex w-full items-start gap-2 border-t-[0.8px] pt-4 text-small text-muted-foreground">
            <ShieldCheck size={16} strokeWidth={1.75} className="shrink-0 text-primary-600" />
            NANA Prime je finska kompanija. Vaši podaci se čuvaju i obrađuju bezbedno, u skladu sa EU GDPR propisima o
            zaštiti podataka.
          </p>
          <Button type="button" variant="ghost" size="lg" onClick={onSignIn}>
            Već imate nalog? Prijavite se
          </Button>
          <DemoLink onDemo={onDemo} />
        </Actions>
      </form>
    </>
  );
}

function Welcome({ title, sub }) {
  return (
    <div className={`${column} px-7 text-center text-foreground`}>
      <h1 className="text-base font-medium">{title}</h1>
      <p className="text-sm">{sub}</p>
    </div>
  );
}

function FormCard(props) {
  return <div className={`${column} flex flex-col gap-4 rounded-3xl bg-muted p-4`} {...props} />;
}

function Actions(props) {
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
      <button type="button" className={demoLink} onClick={onDemo}>
        Za testiranje: otvori demo sa gotovim planom
      </button>
      {/* every card on one page (/?kartice), for comparing them */}
      <button type="button" className={demoLink} onClick={() => (window.location.href = '/?kartice')}>
        Za pregled: sve kartice na jednoj stranici
      </button>
    </>
  );
}

function SignIn({ onContinue, onSignUp, onDemo }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failed, setFailed] = useState(false);
  const valid = /\S+@\S+\.\S+/.test(email) && password;

  // with two-factor on, the right password leads to the code, not in
  const [pending, setPending] = useState(null);

  const submit = async () => {
    if (!valid) return;
    const user = await signIn(email, password);
    if (!user) setFailed(true);
    else if (user.twoFactor && user.twoFactorSecret) setPending(user);
    else onContinue(user);
  };

  if (pending) return <TwoFactorStep user={pending} onContinue={onContinue} onBack={() => setPending(null)} />;

  return (
    <>
      <Welcome title="Prijavite se" sub="Email adresom i lozinkom kojima ste napravili nalog" />
      <form className="contents" onSubmit={(e) => (e.preventDefault(), submit())}>
        <FormCard>
          <Field label="Email" required>
            <Input value={email} onChange={(v) => (setEmail(v), setFailed(false))} type="email" placeholder="anna@mail.com" autoComplete="email" />
          </Field>
          <Field label="Lozinka" required hint={failed ? 'Email ili lozinka nisu tačni.' : null}>
            <Password value={password} onChange={(v) => (setPassword(v), setFailed(false))} placeholder="Vaša lozinka" />
          </Field>
        </FormCard>
        <Actions>
          <Button type="submit" size="lg" className="w-full" disabled={!valid}>
            Prijavi se
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={onSignUp}>
            Nemate nalog? Napravite ga
          </Button>
          <DemoLink onDemo={onDemo} />
        </Actions>
      </form>
    </>
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
  const ready = backup ? typed.trim().length >= 8 : code.length === 6;

  const submit = async () => {
    if (!ready || checking) return;
    setChecking(true);
    const next = backup ? await spendBackupCode(user, typed) : (await verifyCode(user.twoFactorSecret, code)) && user;
    setChecking(false);
    if (next) return onContinue(next);
    setError(
      backup
        ? 'Ovaj rezervni kod ne važi ili je već iskorišćen.'
        : 'Kod nije tačan. Proverite da li ste prepisali poslednji koji aplikacija prikazuje.'
    );
  };

  const switchTo = (toBackup) => {
    setBackup(toBackup);
    setError(null);
  };

  return (
    <>
      <Welcome
        title="Dvofaktorska prijava"
        sub={backup ? 'Unesite jedan od rezervnih kodova koje ste sačuvali' : 'Unesite šestocifreni kod iz aplikacije za kodove'}
      />
      <form className="contents" onSubmit={(e) => (e.preventDefault(), submit())}>
        <FormCard>
          {backup ? (
            <Field label="Rezervni kod" required>
              <Input
                value={typed}
                onChange={(v) => (setTyped(v), setError(null))}
                autoFocus
                autoComplete="one-time-code"
                spellCheck={false}
                placeholder="npr. a9883806"
              />
            </Field>
          ) : (
            <CodeInput value={code} onChange={(v) => (setCode(v), setError(null))} />
          )}
          {error && <p className="text-center text-xs leading-body text-destructive">{error}</p>}
        </FormCard>
        <Actions>
          <Button type="submit" size="lg" className="w-full" disabled={!ready || checking}>
            Potvrdi
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={() => switchTo(!backup)}>
            {backup ? 'Koristite kod iz aplikacije' : 'Koristite rezervni kod'}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={onBack}>
            Nazad na prijavu
          </Button>
        </Actions>
      </form>
    </>
  );
}

export default function Register({ onContinue, onDemo }) {
  const [mode, setMode] = useState('sign-up');
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
      <PhotoCarousel />
      {mode === 'sign-up' ? (
        <SignUp onContinue={onContinue} onSignIn={() => setMode('sign-in')} onDemo={onDemo} />
      ) : (
        <SignIn onContinue={onContinue} onSignUp={() => setMode('sign-up')} onDemo={onDemo} />
      )}
    </motion.div>
  );
}
