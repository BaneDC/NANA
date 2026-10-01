import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, ChevronDown, Copy, Shield } from 'lucide-react';
import Dialog from './Dialog';
import Button from './Button';
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
    <ol className="tf-steps">
      {STEPS.map((s, i) => {
        const done = i < at;
        return (
          <li key={s.id} className={`tf-step${i === at ? ' is-on' : ''}${done ? ' is-done' : ''}`}>
            <span className="tf-step-mark">
              {done ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            <span className="tf-step-label">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

// Six boxes, three and three — but one field behind them.
//
// The obvious build is six one-character inputs that move the cursor along as
// you type. It reads well and it drops characters: the focus hops on the
// keystroke, React re-renders after it, and anything typed in between lands
// nowhere. Tested at typing speed, five of six digits were lost. So the
// boxes are a drawing of one input that holds all six — which also makes
// pasting a code from the phone work without a paste handler.
function CodeInput({ value, onChange, onDone }) {
  const ref = useRef(null);
  const digits = [0, 1, 2, 3, 4, 5];

  return (
    <div className="tf-code" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        className="tf-code-field"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="Kod iz aplikacije"
        maxLength={6}
        value={value}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, '').slice(0, 6);
          onChange(next);
          if (next.length === 6) onDone?.();
        }}
      />
      {digits.map((i) => (
        <span key={i} aria-hidden="true" className="tf-code-group">
          <span className={`tf-digit${value.length === i ? ' is-next' : ''}`}>{value[i] || ''}</span>
          {i === 2 && <span className="tf-code-dash">-</span>}
        </span>
      ))}
    </div>
  );
}

// Turning it off takes a code from the phone too. Otherwise anyone who finds
// the account signed in could take the second factor away with one click, and
// the second factor is there for exactly that person.
export function TwoFactorDisable({ secret, onDone, onClose }) {
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
    <Dialog eyebrow="Bezbednost" title="Isključite dvofaktorsku prijavu" onClose={onClose}>
      <p className="doc-p">
        Unesite šestocifreni kod iz aplikacije da isključite dvofaktorsku prijavu. Posle toga je za
        prijavu dovoljna lozinka, pa je nalog manje zaštićen.
      </p>

      <div className="tf-verify">
        <p className="tf-label">Kod iz aplikacije</p>
        <CodeInput
          value={code}
          onChange={(v) => {
            setCode(v);
            setError(null);
          }}
        />
      </div>

      {error && <p className="tf-error">{error}</p>}

      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        <Button variant="primary" disabled={code.length !== 6 || checking} onClick={confirm}>
          Isključi
        </Button>
      </div>
    </Dialog>
  );
}

export default function TwoFactorSetup({ email, onDone, onClose }) {
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
      <Dialog eyebrow="Bezbednost" title="Rezervni kodovi" dismissible={false} onClose={onClose}>
        <p className="doc-p">
          Sačuvajte ove kodove na sigurnom mestu. Svaki se koristi jednom, za prijavu ako izgubite
          pristup aplikaciji sa kodovima. Prikazujemo ih samo sada.
        </p>

        <ul className="tf-codes">
          {codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>

        <div className="panel-card-actions">
          <Button variant="secondary" onClick={() => copy(codes.join('\n'), 'codes')}>
            {copied === 'codes' ? 'Kopirano' : 'Kopiraj'}
          </Button>
          <Button variant="secondary" onClick={download}>
            Preuzmi
          </Button>
        </div>

        <div className="panel-card-actions is-end">
          <Button variant="primary" onClick={() => onDone(codes, secret)}>
            Sačuvao sam rezervne kodove
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog eyebrow="Bezbednost" title="Uključite dvofaktorsku prijavu" onClose={onClose}>
      <Stepper at={step} />

      {step === 0 ? (
        <>
          <p className="doc-p">
            Skenirajte ovaj kod aplikacijom za kodove (Google Authenticator, Authy, 1Password…).
          </p>

          <div className="tf-qr-wrap">
            {qr ? (
              <img className="tf-qr-img" src={qr} alt="QR kod za aplikaciju sa kodovima" />
            ) : (
              <div className="tf-qr-box">
                <Shield size={28} strokeWidth={1.5} />
              </div>
            )}
          </div>

          <button
            type="button"
            className="tf-manual"
            aria-expanded={manual}
            onClick={() => setManual((v) => !v)}
          >
            <span>Ne možete da skenirate? Unesite ključ ručno</span>
            <ChevronDown size={14} strokeWidth={2} className={manual ? 'is-open' : ''} />
          </button>

          {manual && (
            <div className="tf-secret">
              <code>{secret}</code>
              <Button
                variant="secondary"
                iconOnly
                aria-label="Kopiraj ključ"
                title="Kopiraj ključ"
                onClick={() => copy(secret, 'secret')}
              >
                {copied === 'secret' ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.75} />}
              </Button>
            </div>
          )}

          <div className="panel-card-actions is-end">
            <Button variant="secondary" onClick={onClose}>
              Otkaži
            </Button>
            <Button variant="primary" onClick={() => setStep(1)}>
              Dalje
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="doc-p">
            Unesite šestocifreni kod iz aplikacije da potvrdimo da je podešavanje prošlo.
          </p>

          <div className="tf-verify">
            <p className="tf-label">Kod iz aplikacije</p>
            <CodeInput value={code} onChange={setCode} />
          </div>

          {error && <p className="tf-error">{error}</p>}

          <div className="panel-card-actions is-end">
            <Button variant="ghost" onClick={onClose}>
              Otkaži
            </Button>
            <Button variant="secondary" onClick={() => setStep(0)}>
              Nazad
            </Button>
            <Button variant="primary" disabled={code.length !== 6 || checking} onClick={confirm}>
              Potvrdi
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
