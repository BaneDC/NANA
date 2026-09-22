import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import SelectCard from '../components/SelectCard';
import Button from '../components/Button';
import { saveAccount, signIn } from '../lib/account';

// Registering, and signing back in. Everything asked here is kept with the
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
  { id: 'RS', flag: '🇷🇸', code: '+381' },
  { id: 'FI', flag: '🇫🇮', code: '+358' },
  { id: 'HR', flag: '🇭🇷', code: '+385' },
  { id: 'BA', flag: '🇧🇦', code: '+387' },
  { id: 'ME', flag: '🇲🇪', code: '+382' },
  { id: 'MK', flag: '🇲🇰', code: '+389' },
  { id: 'SI', flag: '🇸🇮', code: '+386' },
  { id: 'DE', flag: '🇩🇪', code: '+49' },
  { id: 'AT', flag: '🇦🇹', code: '+43' },
  { id: 'CH', flag: '🇨🇭', code: '+41' },
];

const SOURCES = [
  'Preko prijatelja ili porodice',
  'Google pretraga',
  'Društvene mreže',
  'Lekar ili bolnica',
  'Oglas',
  'Drugo',
];

const MIN_PASSWORD = 8;

function Field({ label, required, children, hint }) {
  return (
    <label className="text-field">
      <span className="tf-label">
        {label}
        {required && <span className="tf-required"> *</span>}
      </span>
      {children}
      {hint && <span className="tf-hint">{hint}</span>}
    </label>
  );
}

function Input({ value, onChange, onEnter, ...rest }) {
  return (
    <span className="tf-input">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        {...rest}
      />
    </span>
  );
}

function Password({ value, onChange, onEnter, placeholder = 'Najmanje 8 karaktera' }) {
  const [shown, setShown] = useState(false);
  return (
    <span className="tf-input">
      <input
        type={shown ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        autoComplete="new-password"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      />
      <button
        type="button"
        className="tf-trailing"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Sakrij lozinku' : 'Prikaži lozinku'}
      >
        {shown ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
      </button>
    </span>
  );
}

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

function SignUp({ onContinue, onSignIn }) {
  const [role, setRole] = useState('family');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('RS');
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

      <div className="form-card">
        <div className="reg-row">
          <Field label="Ime" required>
            <Input value={firstName} onChange={setFirstName} placeholder="Milena" autoComplete="given-name" />
          </Field>
          <Field label="Prezime" required>
            <Input value={lastName} onChange={setLastName} placeholder="Ilić" autoComplete="family-name" />
          </Field>
        </div>
        <Field label="Imejl" required>
          <Input value={email} onChange={setEmail} type="email" placeholder="milena@mail.com" autoComplete="email" />
        </Field>
        <Field label="Broj telefona" required>
          <span className="tf-input has-prefix">
            <span className="tf-prefix">
              <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Država">
                {COUNTRIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} strokeWidth={1.75} />
            </span>
            <input
              type="tel"
              value={phone}
              placeholder="64 123 4567"
              autoComplete="tel-national"
              onChange={(e) => setPhone(e.target.value)}
            />
          </span>
        </Field>
        <Field label="Lozinka" required hint={password && password.length < MIN_PASSWORD ? `Još ${MIN_PASSWORD - password.length} karaktera` : null}>
          <Password value={password} onChange={setPassword} onEnter={submit} />
        </Field>
        <Field label="Kako ste čuli za nas?" required>
          <span className="tf-input">
            <select className={source ? '' : 'is-empty'} value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="" disabled>
                Izaberite
              </option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown size={14} strokeWidth={1.75} className="tf-icon" />
          </span>
        </Field>

        <div className="reg-checks">
          <Consent checked={processing} onChange={setProcessing} required>
            Saglasan/na sam sa obradom podataka
          </Consent>
          <Consent checked={accuracy} onChange={setAccuracy} required>
            Potvrđujem da su podaci tačni
          </Consent>
          <Consent checked={newsletter} onChange={setNewsletter}>
            Želim da primam novosti i posebne ponude imejlom
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
      </div>
    </>
  );
}

function SignIn({ onContinue, onSignUp }) {
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
        <p>Imejlom i lozinkom kojima ste napravili nalog</p>
      </div>
      <div className="form-card">
        <Field label="Imejl" required>
          <Input value={email} onChange={(v) => (setEmail(v), setFailed(false))} type="email" placeholder="milena@mail.com" autoComplete="email" />
        </Field>
        <Field label="Lozinka" required hint={failed ? 'Imejl ili lozinka nisu tačni.' : null}>
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
      </div>
    </>
  );
}

export default function Register({ onContinue }) {
  const [mode, setMode] = useState('sign-up');
  return (
    <motion.div
      className="register"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.2, ease: 'easeIn' } }}
    >
      <Logo width={150} />
      {mode === 'sign-up' ? (
        <SignUp onContinue={onContinue} onSignIn={() => setMode('sign-in')} />
      ) : (
        <SignIn onContinue={onContinue} onSignUp={() => setMode('sign-up')} />
      )}
    </motion.div>
  );
}
