import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import PhotoCarousel from '../components/PhotoCarousel';
import SelectCard from '../components/SelectCard';
import Button from '../components/Button';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Field, Input, Password, Select } from '../components/TextField';
import { saveAccount, signIn } from '../lib/account';

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

function Consent({ checked, onChange, children, required }) {
  return (
    <label className={`reg-check${checked ? ' is-on' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="reg-box" aria-hidden="true">
        {checked && <Check size={12} strokeWidth={2.5} />}
      </span>
      <span>
        {children}
        {required && <span className="tf-required"> *</span>}
      </span>
    </label>
  );
}

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
      <div className="welcome">
        <h1>Dobro došli u NANA Prime</h1>
        <p>Polja označena zvezdicom su obavezna</p>
      </div>

      {SHOW_ROLES && (
      <div className="form-card">
        <div className="role-choice">
          <p className="tf-label">Ovde sam kao</p>
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
      </div>
      )}

      <div className="form-card">
        <div className="reg-row">
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
          <Password value={password} onChange={setPassword} onEnter={submit} placeholder="Najmanje 8 karaktera" autoComplete="new-password" />
        </Field>
        <Field label="Kako ste čuli za nas?" required as="div" labelId="reg-source">
          <Select value={source} onChange={setSource} labelledBy="reg-source" options={SOURCE_OPTIONS} />
        </Field>

        <div className="reg-checks">
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
      </div>

      <div className="actions">
        <Button variant="primary" size="lg" full disabled={!valid || busy} onClick={submit}>
          Napravi nalog
        </Button>
        <p className="reg-legal">
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
        <p className="reg-gdpr">
          <ShieldCheck size={16} strokeWidth={1.75} />
          NANA Prime je finska kompanija. Vaši podaci se čuvaju i obrađuju bezbedno, u skladu sa EU GDPR propisima o
          zaštiti podataka.
        </p>
        <Button variant="ghost" size="lg" onClick={onSignIn}>
          Već imate nalog? Prijavite se
        </Button>
        <DemoLink onDemo={onDemo} />
      </div>
    </>
  );
}

// Straight into the app on a finished plan, for trying the chat and everything
// after the plan without running (and paying for) the onboarding each time.
function DemoLink({ onDemo }) {
  return (
    <>
      <button type="button" className="reg-demo" onClick={onDemo}>
        Za testiranje: otvori demo sa gotovim planom
      </button>
      {/* every card on one page (/?kartice), for comparing them */}
      <button type="button" className="reg-demo" onClick={() => (window.location.href = '/?kartice')}>
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

  const submit = async () => {
    if (!valid) return;
    const user = await signIn(email, password);
    if (user) onContinue(user);
    else setFailed(true);
  };

  return (
    <>
      <div className="welcome">
        <h1>Prijavite se</h1>
        <p>Email adresom i lozinkom kojima ste napravili nalog</p>
      </div>
      <div className="form-card">
        <Field label="Email" required>
          <Input value={email} onChange={(v) => (setEmail(v), setFailed(false))} type="email" placeholder="anna@mail.com" autoComplete="email" />
        </Field>
        <Field label="Lozinka" required hint={failed ? 'Email ili lozinka nisu tačni.' : null}>
          <Password value={password} onChange={(v) => (setPassword(v), setFailed(false))} onEnter={submit} placeholder="Vaša lozinka" />
        </Field>
      </div>
      <div className="actions">
        <Button variant="primary" size="lg" full disabled={!valid} onClick={submit}>
          Prijavi se
        </Button>
        <Button variant="ghost" size="lg" onClick={onSignUp}>
          Nemate nalog? Napravite ga
        </Button>
        <DemoLink onDemo={onDemo} />
      </div>
    </>
  );
}

export default function Register({ onContinue, onDemo }) {
  const [mode, setMode] = useState('sign-up');
  return (
    <motion.div
      className="register"
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
