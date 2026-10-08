import { useEffect, useId, useMemo, useState } from 'react';
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

// Turning on the second factor, in the three steps the standard has: scan,
// verify, then the backup codes.
//
// The order is the security: nothing is turned on until a code from the phone
// has been checked, so a mis-scan cannot lock somebody out of their own
// account. The backup codes come last and only once, because they are the way
// back in when the phone is gone.

const STEPS = [
  { id: 'scan', label: 'Skeniraj' },
  { id: 'verify', label: 'Potvrdi' },
  { id: 'backup', label: 'Rezervni kodovi' },
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
                'flex size-5 items-center justify-center rounded-full text-[11px]',
                done
                  ? 'bg-success-muted text-success'
                  : i === at
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {done ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            <span>{s.label}</span>
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
// which the pane's focus looks for).
export function CodeInput({ value, onChange }) {
  const id = useId();
  return (
    <div className="flex flex-col items-center gap-2">
      <Label htmlFor={id}>Kod iz aplikacije</Label>
      <InputOTP id={id} autoFocus data-autofocus="" maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={value} onChange={onChange}>
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

// Turning it off takes a code from the phone too. Otherwise anyone who finds
// the account signed in could take the second factor away with one click, and
// the second factor is there for exactly that person.
export function TwoFactorDisable({ open = true, secret, onDone, onClose }) {
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
    setError('Kod nije tačan. Proverite da li ste prepisali poslednji koji aplikacija prikazuje.');
  };

  return (
    <Dialog eyebrow="Bezbednost" title="Isključite dvofaktorsku prijavu" open={open} onClose={onClose}>
      <DialogDescription>
        Unesite šestocifreni kod iz aplikacije da isključite dvofaktorsku prijavu. Posle toga je za
        prijavu dovoljna lozinka, pa je nalog manje zaštićen.
      </DialogDescription>

      <CodeInput
        value={code}
        onChange={(v) => {
          setCode(v);
          setError(null);
        }}
      />

      {error && <p className="text-center text-xs leading-body text-destructive">{error}</p>}

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        <Button disabled={code.length !== 6 || checking} onClick={confirm}>
          Isključi
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
    setError('Kod nije tačan. Proverite da li ste prepisali poslednji koji aplikacija prikazuje.');
  };

  const download = () => {
    const blob = new Blob(
      [`NANA Prime - rezervni kodovi za ${email}\n\n${codes.join('\n')}\n`],
      { type: 'text/plain' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nana-prime-rezervni-kodovi.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // The last step cannot be dismissed: the codes are shown once and a stray
  // click past the pane would lose them.
  if (step === 2) {
    return (
      <Dialog eyebrow="Bezbednost" title="Rezervni kodovi" dismissible={false} open={open} onClose={onClose}>
        <DialogDescription>
          Sačuvajte ove kodove na sigurnom mestu. Svaki se koristi jednom, za prijavu ako izgubite
          pristup aplikaciji sa kodovima. Prikazujemo ih samo sada.
        </DialogDescription>

        <ul className="grid list-none grid-cols-2 gap-x-4 gap-y-2 rounded-2xl bg-muted p-4 text-center font-mono text-sm text-foreground">
          {codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>

        {/* one row: keeping them (copy, download) on the left, done on the right */}
        <DialogFooter>
          <div className="mr-auto flex gap-2">
            <Button variant="secondary" onClick={() => copy(codes.join('\n'), 'codes')}>
              {copied === 'codes' ? 'Kopirano' : 'Kopiraj'}
            </Button>
            <Button variant="secondary" onClick={download}>
              Preuzmi
            </Button>
          </div>
          <Button onClick={() => onDone(codes, secret)}>Sačuvano</Button>
        </DialogFooter>
      </Dialog>
    );
  }

  return (
    <Dialog eyebrow="Bezbednost" title="Uključite dvofaktorsku prijavu" open={open} onClose={onClose}>
      <Stepper at={step} />

      {step === 0 ? (
        <>
          <DialogDescription>
            Skenirajte ovaj kod aplikacijom za kodove (Google Authenticator, Authy, 1Password…).
          </DialogDescription>

          <div className="flex justify-center rounded-2xl bg-muted p-4">
            {qr ? (
              <img className="size-48 rounded-lg bg-card" src={qr} alt="QR kod za aplikaciju sa kodovima" />
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
            <span>Ne možete da skenirate? Unesite ključ ručno</span>
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
                aria-label="Kopiraj ključ"
                title="Kopiraj ključ"
                onClick={() => copy(secret, 'secret')}
              >
                {copied === 'secret' ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.75} />}
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>
              Otkaži
            </Button>
            <Button onClick={() => setStep(1)}>
              Dalje
            </Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <DialogDescription>
            Unesite šestocifreni kod iz aplikacije da potvrdimo da je podešavanje prošlo.
          </DialogDescription>

          <CodeInput value={code} onChange={setCode} />

          {error && <p className="text-center text-xs leading-body text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              Otkaži
            </Button>
            <Button variant="secondary" onClick={() => setStep(0)}>
              Nazad
            </Button>
            <Button disabled={code.length !== 6 || checking} onClick={confirm}>
              Potvrdi
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
}
