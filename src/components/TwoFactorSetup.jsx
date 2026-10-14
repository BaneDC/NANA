import { useEffect, useId, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, ChevronDown, Copy, Shield } from 'lucide-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Dialog from './Dialog';
import { newBackupCodes, newSecret, otpauthUrl, verifyCode } from '../lib/totp';
import { msg, t } from '../i18n';

// Turning on the second factor, in the three steps the standard has: scan,
// verify, then the backup codes.
//
// The order is the security: nothing is turned on until a code from the phone
// has been checked, so a mis-scan cannot lock somebody out of their own
// account. The backup codes come last and only once, because they are the way
// back in when the phone is gone.

const STEPS = [
  { id: 'scan', label: msg('Skeniraj') },
  { id: 'verify', label: msg('Potvrdi') },
  { id: 'backup', label: msg('Rezervni kodovi') },
];

function Stepper({ at }) {
  return (
    <ol className="flex list-none items-center gap-4 phone:gap-3">
      {STEPS.map((s, i) => {
        const done = i < at;
        return (
          <li
            key={s.id}
            className={cn('flex items-center gap-2 text-small', i <= at ? 'text-foreground' : 'text-disabled')}
          >
            <span
              className={cn(
                'flex size-5 items-center justify-center rounded-full text-small',
                done
                  ? 'bg-success-muted text-success'
                  : i === at
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {done ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            <span>{t(s.label)}</span>
          </li>
        );
      })}
    </ol>
  );
}

// Six boxes, three and three, over one field: shadcn's InputOTP. Pasting a
// code from the phone fills all six, and typing at speed loses nothing. It is
// the one thing to do on its screen, so it has the focus as soon as it shows:
// on the step it appears on, and when the dialog opens on it (data-autofocus,
// which the pane's focus looks for). A wrong code is cleared by whoever checks
// it, and the field takes the focus back from "Potvrdi", so the next code goes
// straight in from the first box.
export function CodeInput({ value, onChange, onComplete }) {
  const id = useId();
  const box = useRef(null);
  const was = useRef(value);
  useEffect(() => {
    if (!value && was.current) box.current?.querySelector('input')?.focus();
    was.current = value;
  }, [value]);
  return (
    <div ref={box} className="flex flex-col items-center gap-2">
      <Label htmlFor={id}>{t('Kod iz aplikacije')}</Label>
      <InputOTP id={id} autoFocus data-autofocus="" maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={value} onChange={onChange} onComplete={onComplete}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

// The ten backup codes, shown once: after turning it on and after new ones are
// made. It cannot be dismissed, because a stray click past the pane would lose
// them.
function BackupCodes({ open, email, codes, onDone, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const blob = new Blob(
      [t('NANA Prime - rezervni kodovi za {email}', { email }) + '\n\n' + codes.join('\n') + '\n'],
      { type: 'text/plain' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = t('nana-prime-rezervni-kodovi.txt');
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Dialog eyebrow={t('Bezbednost')} title={t('Rezervni kodovi')} dismissible={false} open={open} onClose={onClose}>
      <DialogDescription>
        {t(
          'Sačuvajte ove kodove na sigurnom mestu. Svaki se koristi jednom, za prijavu ako izgubite pristup aplikaciji sa kodovima. Prikazujemo ih samo sada.'
        )}
      </DialogDescription>

      <ul className="grid list-none grid-cols-2 gap-x-4 gap-y-2 rounded-2xl bg-muted p-4 text-center font-mono text-sm text-foreground">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      {/* one row: keeping them (copy, download) on the left, done on the right */}
      <DialogFooter>
        <div className="mr-auto flex gap-2">
          <Button variant="secondary" onClick={copy}>
            {copied ? t('Kopirano') : t('Kopiraj')}
          </Button>
          <Button variant="secondary" onClick={download}>
            {t('Preuzmi')}
          </Button>
        </div>
        <Button onClick={onDone}>{t('Sačuvano')}</Button>
      </DialogFooter>
    </Dialog>
  );
}

// New backup codes take a code from the phone first, as turning it off does:
// the old ones stop working, and that is not for whoever finds the account
// signed in. Then the new ones, once.
export function TwoFactorNewCodes({ open = true, secret, email, onDone, onClose }) {
  const [codes, setCodes] = useState(null);
  if (codes) return <BackupCodes open={open} email={email} codes={codes} onDone={() => onDone(codes)} onClose={onClose} />;
  return (
    <CodeCheck
      open={open}
      secret={secret}
      title={t('Novi rezervni kodovi')}
      text={t(
        'Unesite šestocifreni kod iz aplikacije da napravimo nove rezervne kodove. Kodovi koje sada imate prestaju da važe.'
      )}
      action={t('Napravi nove')}
      onDone={() => setCodes(newBackupCodes())}
      onClose={onClose}
    />
  );
}

// Turning it off takes a code from the phone too. Otherwise anyone who finds
// the account signed in could take the second factor away with one click, and
// the second factor is there for exactly that person.
export function TwoFactorDisable({ open = true, secret, onDone, onClose }) {
  return (
    <CodeCheck
      open={open}
      secret={secret}
      title={t('Isključite dvofaktorsku prijavu')}
      text={t(
        'Unesite šestocifreni kod iz aplikacije da isključite dvofaktorsku prijavu. Posle toga je za prijavu dovoljna lozinka, pa je nalog manje zaštićen.'
      )}
      action={t('Isključi')}
      onDone={onDone}
      onClose={onClose}
    />
  );
}

// A code from the phone before something that changes the second factor.
function CodeCheck({ open, secret, title, text, action, onDone, onClose }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  const confirm = async () => {
    setChecking(true);
    // An account that turned it on before the key was kept has nothing to
    // check against; the prototype lets it through rather than lock it in.
    const ok = !secret || (await verifyCode(secret, code));
    setChecking(false);
    if (ok) return onDone();
    setCode('');
    setError(t('Kod nije tačan. Proverite da li ste prepisali poslednji koji aplikacija prikazuje.'));
  };

  return (
    <Dialog eyebrow={t('Bezbednost')} title={title} open={open} onClose={onClose}>
      <DialogDescription>{text}</DialogDescription>

      <CodeInput
        value={code}
        onChange={(v) => {
          setCode(v);
          if (v) setError(null);
        }}
      />

      {error && <p className="text-center text-xs leading-body text-destructive">{error}</p>}

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('Otkaži')}
        </Button>
        <Button disabled={code.length !== 6 || checking} onClick={confirm}>
          {action}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default function TwoFactorSetup({ open = true, email, onDone, onClose }) {
  const [step, setStep] = useState(0);
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const [qr, setQr] = useState(null);
  const [copied, setCopied] = useState(null);

  // One secret for this setup, made here and not again on every render.
  const secret = useMemo(() => newSecret(), []);
  const codes = useMemo(() => newBackupCodes(), []);
  const url = useMemo(() => otpauthUrl({ secret, account: email }), [secret, email]);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, { width: 480, margin: 1, color: { dark: '#4c2212', light: '#ffffff' } })
      .then((src) => alive && setQr(src))
      .catch(() => alive && setQr(null));
    return () => {
      alive = false;
    };
  }, [url]);

  const copy = (text, what) => {
    navigator.clipboard?.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1600);
  };

  const confirm = async () => {
    setChecking(true);
    const ok = await verifyCode(secret, code);
    setChecking(false);
    if (ok) {
      setError(null);
      setStep(2);
      return;
    }
    setCode('');
    setError(t('Kod nije tačan. Proverite da li ste prepisali poslednji koji aplikacija prikazuje.'));
  };

  // the last step: the codes, once
  if (step === 2) return <BackupCodes open={open} email={email} codes={codes} onDone={() => onDone(codes, secret)} onClose={onClose} />;

  return (
    <Dialog eyebrow={t('Bezbednost')} title={t('Uključite dvofaktorsku prijavu')} open={open} onClose={onClose}>
      <Stepper at={step} />

      {step === 0 ? (
        <>
          <DialogDescription>
            {t('Skenirajte ovaj kod aplikacijom za kodove (Google Authenticator, Authy, 1Password…).')}
          </DialogDescription>

          <div className="flex justify-center rounded-2xl bg-muted p-4">
            {qr ? (
              <img className="size-48 rounded-lg bg-card" src={qr} alt={t('QR kod za aplikaciju sa kodovima')} />
            ) : (
              <div className="flex size-48 items-center justify-center rounded-lg border border-dashed bg-card text-disabled">
                <Shield size={28} strokeWidth={1.5} />
              </div>
            )}
          </div>

          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl bg-muted p-3 text-left text-xs text-muted-foreground"
            aria-expanded={manual}
            onClick={() => setManual((v) => !v)}
          >
            <span>{t('Ne možete da skenirate? Unesite ključ ručno')}</span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={cn('shrink-0 transition-transform duration-200', manual && 'rotate-180')}
            />
          </button>

          {manual && (
            <div className="flex items-center gap-2 rounded-2xl bg-muted p-3">
              <code className="min-w-0 flex-1 font-mono text-xs leading-body tracking-[0.04em] break-all text-foreground">
                {secret}
              </code>
              <Button
                variant="secondary"
                size="icon"
                aria-label={t('Kopiraj ključ')}
                title={t('Kopiraj ključ')}
                onClick={() => copy(secret, 'secret')}
              >
                {copied === 'secret' ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.75} />}
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>
              {t('Otkaži')}
            </Button>
            <Button onClick={() => setStep(1)}>
              {t('Dalje')}
            </Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <DialogDescription>
            {t('Unesite šestocifreni kod iz aplikacije da potvrdimo da je podešavanje prošlo.')}
          </DialogDescription>

          <CodeInput value={code} onChange={(v) => (setCode(v), v && setError(null))} />

          {error && <p className="text-center text-xs leading-body text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              {t('Otkaži')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                // a new try after scanning again: no old code, no old error
                setCode('');
                setError(null);
                setStep(0);
              }}
            >
              {t('Nazad')}
            </Button>
            <Button disabled={code.length !== 6 || checking} onClick={confirm}>
              {t('Potvrdi')}
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
}
