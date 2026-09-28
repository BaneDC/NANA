import { useState } from 'react';
import { Bell, Check, Cookie, CreditCard, Crown, Globe, KeyRound, Shield, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import AskAssistant from '../components/AskAssistant';
import CookieSettings from '../components/CookieSettings';
import TwoFactorSetup, { TwoFactorDisable } from '../components/TwoFactorSetup';
import { Field, Password } from '../components/TextField';
import { chargingVisit, heldNow, money, paidThisMonth, visitCharge } from '../data/familyCare';
import { COOKIE_DEFAULT, COOKIE_GROUPS } from '../data/cookies';
import { changePassword } from '../lib/account';
import { priceLine } from '../data/plans';

// What the account remembers besides the person: kept on the user record, so
// signing back in finds it as it was left.
const LANGUAGES = [
  { id: 'sr', label: 'Srpski' },
  { id: 'en', label: 'English' },
  { id: 'fi', label: 'Suomi' },
];

function Toggle({ label, hint, on, onChange, fixed }) {
  return (
    <button
      type="button"
      className={`toggle-row${fixed ? ' is-fixed' : ''}`}
      onClick={() => !fixed && onChange(!on)}
      role="switch"
      aria-checked={on}
      aria-disabled={fixed || undefined}
    >
      <span className="toggle-text">
        <span className="tip-title">{label}</span>
        <span className="tip-body">{hint}</span>
      </span>
      <span className={`switch${on ? ' is-on' : ''}`}>
        <span className="switch-knob" />
      </span>
    </button>
  );
}

// Changing the password. The current one has to check out, the new one is
// typed twice, and neither leaves this dialog: `changePassword` compares and
// stores hashes (see lib/account).
function PasswordModal({ email, onDone, onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const short = next.length > 0 && next.length < 8;
  const mismatch = again.length > 0 && next !== again;
  const ready = current && next.length >= 8 && next === again && !saving;

  const submit = async () => {
    setSaving(true);
    const fault = await changePassword(email, current, next);
    setSaving(false);
    if (!fault) return setDone(true);
    setError(
      fault === 'wrong-current'
        ? 'Trenutna lozinka nije tačna.'
        : fault === 'no-account'
          ? 'Nalog nije pronađen na ovom uređaju.'
          : 'Nije sačuvano — proverite da li je čuvanje podataka dozvoljeno u pregledaču.'
    );
  };

  if (done) {
    return (
      <Modal eyebrow="Nalog" title="Lozinka je promenjena" onClose={onDone}>
        <p className="doc-p">
          Od sledeće prijave koristite novu lozinku. Ako ste je negde sačuvali, promenite je i tamo.
        </p>
        <div className="panel-card-actions is-end">
          <Button variant="primary" onClick={onDone}>
            U redu
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal eyebrow="Nalog" title="Promenite lozinku" onClose={onClose}>
      <p className="doc-p">Nova lozinka mora imati najmanje 8 karaktera.</p>
      <div className="pe-fields">
        <Field label="Trenutna lozinka">
          <Password
            value={current}
            onChange={(v) => {
              setCurrent(v);
              setError(null);
            }}
          />
        </Field>
        <Field label="Nova lozinka" hint={short ? 'Kratka je — treba najmanje 8 karaktera.' : null}>
          <Password value={next} onChange={setNext} autoComplete="new-password" />
        </Field>
        <Field label="Nova lozinka još jednom" hint={mismatch ? 'Dva unosa se ne poklapaju.' : null}>
          <Password value={again} onChange={setAgain} autoComplete="new-password" />
        </Field>
      </div>

      {error && <p className="tf-error">{error}</p>}

      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        <Button variant="primary" disabled={!ready} onClick={submit}>
          <Check size={14} strokeWidth={2} />
          Sačuvaj lozinku
        </Button>
      </div>
    </Modal>
  );
}

export default function Settings({ unlocked, care, user, onCare, onSaveUser, onAskAssistant, onSubscribe }) {
  const [prefs, setPrefs] = useState({
    digest: false,
    marketing: false,
  });
  const set = (key) => (v) => setPrefs((p) => ({ ...p, [key]: v }));
  const [cardOpen, setCardOpen] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [twoFactorOff, setTwoFactorOff] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const cookies = user?.cookies || COOKIE_DEFAULT;
  const twoFactor = Boolean(user?.twoFactor);
  const language = user?.language || 'sr';

  const { payment } = care;
  const charging = chargingVisit(care);

  // No card details are collected here, and none should be: this is where a
  // real build hands off to Stripe and gets a token back.
  const connect = () => {
    onCare((c) => ({
      ...c,
      payment: { connected: true, brand: 'Visa', last4: '4242', connectedOn: 'upravo' },
    }));
    setCardOpen(false);
  };

  // Four groups, each under its own title, in the order people come looking:
  // what they pay, how the account is kept safe, how the app talks to them, and
  // what is kept about them.
  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Podešavanja</h1>
          <p className="view-sub">Plaćanje, bezbednost, jezik i obaveštenja, privatnost.</p>
        </div>
        <AskAssistant onClick={onAskAssistant} />
      </div>

      <section className="set-group">
        <h2 className="set-group-title">Plaćanje</h2>
        {/* Started and stopped from here. It used to be startable only from the
            dialog on the care plan, which is where somebody runs into the
            paywall — not where they go looking for what they pay for. */}
        <div className="panel-card">
          <div className="panel-card-head">
            <p className="doc-section-title">
              <Crown size={14} strokeWidth={1.75} />
              Pretplata
            </p>
            <span className={`status-pill is-${unlocked ? 'accepted' : 'muted'}`}>
              {unlocked ? 'Aktivna' : 'Niste pretplaćeni'}
            </span>
          </div>
          {unlocked ? (
            <>
              <ul className="paywall-list">
                <li>
                  <Check size={12} strokeWidth={2.5} /> Kontakti negovateljica
                </li>
                <li>
                  <Check size={12} strokeWidth={2.5} /> Pregledi i pomagala kod partnera, do 10% jeftinije
                </li>
              </ul>
              <p className="tip-body">{priceLine(user?.country)} · obnavlja se 4. septembra 2026.</p>
              {/* What adds or changes something is primary; what switches
                  something off or cancels it is not — orange is what we
                  recommend, and we do not recommend this. It asks first. */}
              <div className="panel-card-actions">
                <Button variant="secondary" onClick={() => setCancelling(true)}>
                  Otkaži pretplatu
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="tip-body">
                Otključava brojeve negovateljica, preporuke lekara i predložena pomagala.
                {' '}
                {priceLine(user?.country)}.
              </p>
              <div className="panel-card-actions">
                <Button variant="primary" onClick={onSubscribe}>
                  Pretplatite se
                </Button>
              </div>
            </>
          )}
        </div>
        {/* Set up once and then never thought about again, which is exactly why
            it belongs here and not on the dashboard. */}
        <div className="panel-card">
          <div className="panel-card-head">
            <p className="doc-section-title">
              <CreditCard size={14} strokeWidth={1.75} />
              Način plaćanja
            </p>
            {payment.connected ? (
              <span className="status-pill is-accepted">
                <ShieldCheck size={12} strokeWidth={2} />
                {payment.brand} ···· {payment.last4}
              </span>
            ) : (
              <span className="status-pill is-declined">Nije podešeno</span>
            )}
          </div>

          {payment.connected ? (
            <>
              <p className="tip-body">
                Dodato {payment.connectedOn}. Svaka poseta se naplaćuje 24 sata pošto negovateljica
                pošalje izveštaj — od vas se ništa ne traži, a u tom roku naplatu možete da zaustavite
                sa stranice Moja nega.
              </p>
              <div className="bc-lines ag-terms">
                <p className="bc-line">
                  <span className="bc-line-label">Rezervisano za zakazane posete</span>
                  <span className="bc-line-value">{money(heldNow(care))}</span>
                </p>
                <p className="bc-line">
                  <span className="bc-line-label">Naplaćuje se sada</span>
                  <span className="bc-line-value">
                    {charging
                      ? `${money(visitCharge(charging))} · za ${charging.chargesInHours} h`
                      : 'Ništa'}
                  </span>
                </p>
                <p className="bc-line">
                  <span className="bc-line-label">Naplaćeno u avgustu</span>
                  <span className="bc-line-value">{money(paidThisMonth(care))}</span>
                </p>
              </div>
              <div className="panel-card-actions">
                <Button variant="primary" onClick={() => setCardOpen(true)}>
                  <CreditCard size={14} strokeWidth={1.75} />
                  Promeni karticu
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="tip-body">
                Posete se plaćaju automatski, pa kartica mora biti sačuvana pre nego što se ijedna zakaže.
                Dodaje se preko Stripe-a — mi nikad ne vidimo broj.
              </p>
              <div className="panel-card-actions">
                <Button variant="primary" onClick={() => setCardOpen(true)}>
                  <CreditCard size={14} strokeWidth={1.75} />
                  Dodaj karticu
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="set-group">
        <h2 className="set-group-title">Bezbednost</h2>
        <div className="panel-card">
          <div className="panel-card-head">
            <p className="doc-section-title">
              <KeyRound size={14} strokeWidth={1.75} />
              Lozinka
            </p>
          </div>
          <p className="tip-body">Promenite lozinku kojom se prijavljujete.</p>
          <div className="panel-card-actions">
            <Button variant="primary" onClick={() => setPasswordOpen(true)}>
              Promenite lozinku
            </Button>
          </div>
        </div>
        <div className="panel-card">
          <div className="panel-card-head">
            <p className="doc-section-title">
              <Shield size={14} strokeWidth={1.75} />
              Dvofaktorska prijava
            </p>
            <span className={`status-pill is-${twoFactor ? 'accepted' : 'muted'}`}>
              {twoFactor ? 'Uključena' : 'Isključena'}
            </span>
          </div>
          <p className="tip-body">
            Uz lozinku traži se i šestocifreni kod iz aplikacije na vašem telefonu.
            {twoFactor && user?.backupCodesLeft
              ? ` Ostalo vam je ${user.backupCodesLeft} rezervnih kodova.`
              : ''}
          </p>
          <div className="panel-card-actions">
            {twoFactor ? (
              <Button variant="secondary" onClick={() => setTwoFactorOff(true)}>
                Isključi
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setTwoFactorOpen(true)}>
                <Shield size={14} strokeWidth={1.75} />
                Uključi
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="set-group">
        <h2 className="set-group-title">Opšte</h2>
        {/* Language, cookies and the second factor: the account's own settings,
            the three the old platform kept together. */}
        <div className="panel-card">
          <div className="panel-card-head">
            <p className="doc-section-title">
              <Globe size={14} strokeWidth={1.75} />
              Jezik
            </p>
          </div>
          <p className="tip-body">Jezik aplikacije i poruka koje vam šaljemo.</p>
          <div className="set-choice">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`svc${language === l.id ? ' is-on' : ''}`}
                aria-pressed={language === l.id}
                onClick={() => onSaveUser({ language: l.id })}
              >
                {language === l.id && <Check size={13} strokeWidth={2.5} />}
                {l.label}
              </button>
            ))}
          </div>
          {language !== 'sr' && (
            <p className="ag-hint">Prevod još nije napravljen — za sada je izbor samo zapamćen.</p>
          )}
        </div>
        <div className="panel-card">
          <p className="doc-section-title">
            <Bell size={14} strokeWidth={1.75} />
            Obaveštenja
          </p>
          <div className="toggle-list">
            <Toggle
              label="Mesečni pregled"
              hint="Jednom mesečno, kratak pregled poseta tog meseca"
              on={prefs.digest}
              onChange={set('digest')}
            />
            <Toggle
              label="Novosti"
              hint="Povremene vesti o NANA Prime"
              on={prefs.marketing}
              onChange={set('marketing')}
            />
          </div>
        </div>
      </section>

      <section className="set-group">
        <h2 className="set-group-title">Privatnost i nalog</h2>
        <div className="panel-card">
          <div className="panel-card-head">
            <p className="doc-section-title">
              <Cookie size={14} strokeWidth={1.75} />
              Kolačići
            </p>
          </div>
          <p className="tip-body">
            Izaberite koje kolačiće dozvoljavate. Izbor važi i za nanaprime.com.
          </p>
          {/* Every group and where it stands, in words. Rows rather than chips:
              a chip here is the same shape as the ones that are pressed
              elsewhere, and this is a reading of the state, not a control. */}
          <div className="bc-lines ag-terms">
            {COOKIE_GROUPS.map((g) => {
              const on = g.fixed || cookies[g.id];
              return (
                <p className="bc-line" key={g.id}>
                  <span className="bc-line-label">{g.label}</span>
                  <span className={`bc-line-value${on ? '' : ' is-off'}`}>
                    {on ? 'Uključeno' : 'Isključeno'}
                    {g.fixed ? ' · uvek' : ''}
                  </span>
                </p>
              );
            })}
          </div>
          <div className="panel-card-actions">
            <Button variant="primary" onClick={() => setCookiesOpen(true)}>
              Podešavanja kolačića
            </Button>
          </div>
        </div>
        <div className="panel-card">
          <p className="doc-section-title">
            <UserRound size={14} strokeWidth={1.75} />
            Nalog
          </p>
          <p className="tip-body">
            Preuzmite sve što čuvamo o vama, ili zatvorite nalog i obrišite ga.
          </p>
          {/* Deleting is the one thing here that cannot be undone, so it is the
              one button that is red. */}
          <div className="panel-card-actions">
            <Button variant="primary">Preuzmi moje podatke</Button>
            <Button variant="danger">
              <Trash2 size={14} strokeWidth={1.75} />
              Obriši nalog
            </Button>
          </div>
        </div>
      </section>

      {cookiesOpen && (
        <CookieSettings
          cookies={cookies}
          onSave={(next) => {
            onSaveUser({ cookies: next });
            setCookiesOpen(false);
          }}
          onClose={() => setCookiesOpen(false)}
        />
      )}

      {cancelling && (
        <Modal eyebrow="Pretplata" title="Otkazati pretplatu?" onClose={() => setCancelling(false)}>
          <p className="doc-p">
            Plan nege vam ostaje, ali brojevi negovateljica i pune preporuke se zatvaraju na kraju
            plaćenog perioda. Možete da se pretplatite ponovo kad god želite.
          </p>
          <div className="panel-card-actions is-end">
            <Button variant="secondary" onClick={() => setCancelling(false)}>
              Zadrži pretplatu
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setCancelling(false);
                onSubscribe?.(false);
              }}
            >
              Otkaži pretplatu
            </Button>
          </div>
        </Modal>
      )}

      {passwordOpen && (
        <PasswordModal
          email={user?.email}
          onDone={() => setPasswordOpen(false)}
          onClose={() => setPasswordOpen(false)}
        />
      )}

      {twoFactorOpen && (
        <TwoFactorSetup
          email={user?.email}
          onDone={(codes, secret) => {
            // Of the codes, how many are left is the only thing worth keeping:
            // they belong on the server, hashed, not in the account here. The
            // secret is kept so turning it off can ask for a code — prototype
            // only; a real build never lets it back to the client.
            onSaveUser({ twoFactor: true, twoFactorSecret: secret, backupCodesLeft: codes.length });
            setTwoFactorOpen(false);
          }}
          onClose={() => setTwoFactorOpen(false)}
        />
      )}

      {twoFactorOff && (
        <TwoFactorDisable
          secret={user?.twoFactorSecret}
          onDone={() => {
            onSaveUser({ twoFactor: false, twoFactorSecret: null, backupCodesLeft: 0 });
            setTwoFactorOff(false);
          }}
          onClose={() => setTwoFactorOff(false)}
        />
      )}

      {cardOpen && (
        <Modal eyebrow="Plaćanje" title="Dodajte karticu" onClose={() => setCardOpen(false)}>
          <p className="doc-p">
            Kartice čuva Stripe, ne mi — broj unosite na njihovoj stranici i mi ga nikad ne vidimo.
            Kad je sačuvana, posete se naplaćuju automatski i više vas ništa ne pitamo.
          </p>
          <ul className="paywall-list">
            <li>
              <Check size={12} strokeWidth={2.5} /> Naplata 24 sata posle svakog izveštaja o poseti
            </li>
            <li>
              <Check size={12} strokeWidth={2.5} /> Ništa se ne uzima pre nego što se poseta obavi
            </li>
            <li>
              <Check size={12} strokeWidth={2.5} /> U tom roku možete da zaustavite svaku naplatu
            </li>
          </ul>
          <div className="panel-card-actions is-end">
            <Button variant="secondary" onClick={() => setCardOpen(false)}>
              Otkaži
            </Button>
            <Button variant="primary" onClick={connect}>
              <CreditCard size={14} strokeWidth={1.75} />
              Nastavi na Stripe
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
