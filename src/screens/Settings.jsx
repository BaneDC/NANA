import { useState } from 'react';
import { Check, Cookie, CreditCard, Globe, Pencil, Shield, ShieldCheck } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import AskAssistant from '../components/AskAssistant';
import CaregiverTasksEditor from '../components/CaregiverTasksEditor';
import { chargingVisit, heldNow, money, paidThisMonth, visitCharge, serviceTitle } from '../data/familyCare';
import { tasksOf } from '../data/caregiverTasks';
import { priceLine } from '../data/plans';

// What the account remembers besides the person: kept on the user record, so
// signing back in finds it as it was left.
const LANGUAGES = [
  { id: 'sr', label: 'Srpski' },
  { id: 'en', label: 'English' },
  { id: 'fi', label: 'Suomi' },
];

const COOKIE_KINDS = [
  { id: 'needed', label: 'Neophodni', hint: 'Prijava i bezbednost. Bez njih sajt ne radi.', fixed: true },
  { id: 'analytics', label: 'Analitika', hint: 'Koliko se koja stranica koristi, bez imena.' },
  { id: 'marketing', label: 'Marketing', hint: 'Merenje oglasa i preporuka.' },
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

// Which cookies are allowed. The necessary ones are shown but cannot be turned
// off — a switch that does nothing is worse than a sentence saying why.
function CookieModal({ cookies, onSave, onClose }) {
  const [draft, setDraft] = useState({ analytics: cookies.analytics, marketing: cookies.marketing });

  return (
    <Modal eyebrow="Privatnost" title="Podešavanja kolačića" onClose={onClose}>
      <p className="doc-p">
        Izbor važi i za nanaprime.com. Možete ga promeniti kad god želite, odavde.
      </p>
      <div className="toggle-list">
        {COOKIE_KINDS.map((k) => (
          <Toggle
            key={k.id}
            label={k.label}
            hint={k.hint}
            fixed={k.fixed}
            on={k.fixed ? true : draft[k.id]}
            onChange={(v) => setDraft((d) => ({ ...d, [k.id]: v }))}
          />
        ))}
      </div>
      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={() => onSave({ analytics: false, marketing: false })}>
          Samo neophodni
        </Button>
        <Button variant="primary" onClick={() => onSave(draft)}>
          <Check size={14} strokeWidth={2} />
          Sačuvaj izbor
        </Button>
      </div>
    </Modal>
  );
}

// Turning the second factor on. The setup key comes from the server, and there
// is no server yet — so the step that would show it says so plainly rather than
// printing something that looks like a real key.
function TwoFactorModal({ onDone, onClose }) {
  const [code, setCode] = useState('');
  const ready = /^\d{6}$/.test(code.trim());

  return (
    <Modal eyebrow="Bezbednost" title="Uključite dvofaktorsku prijavu" onClose={onClose}>
      <p className="doc-p">
        Uz lozinku tražiće se i šestocifreni kod iz aplikacije na vašem telefonu (Google
        Authenticator, 1Password, Authy — bilo koja).
      </p>
      <ol className="paywall-list is-steps">
        <li>Otvorite aplikaciju za kodove na telefonu.</li>
        <li>Dodajte nalog i unesite ključ koji ćemo prikazati ovde.</li>
        <li>Prepišite šestocifreni kod koji se pojavi.</li>
      </ol>
      <p className="ag-hint">
        Ključ stiže sa servera, a server još nije povezan — ovaj korak radi tek kad bude.
      </p>
      <label className="pw-message">
        <span className="tf-label">Kod iz aplikacije</span>
        <input
          className="wo-text is-line"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          placeholder="123456"
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
      </label>
      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        <Button variant="primary" disabled={!ready} onClick={onDone}>
          <Shield size={14} strokeWidth={1.75} />
          Uključi
        </Button>
      </div>
    </Modal>
  );
}

export default function Settings({ unlocked, care, user, onCare, onSaveUser, onAskAssistant }) {
  const [prefs, setPrefs] = useState({
    digest: false,
    marketing: false,
  });
  const set = (key) => (v) => setPrefs((p) => ({ ...p, [key]: v }));
  const [cardOpen, setCardOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);

  const tasks = tasksOf(care);
  const cookies = user?.cookies || { analytics: true, marketing: false };
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

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Podešavanja</h1>
          <p className="view-sub">Obaveštenja, pretplata i nalog.</p>
        </div>
        <AskAssistant onClick={onAskAssistant} />
      </div>

      {/* What the caregiver is asked to do. The plan proposes it from the
          answers; this is where the family says otherwise without touching the
          answers the plan is built from. */}
      <div className="panel-card">
        <div className="panel-card-head">
          <p className="doc-section-title">Zadaci negovateljice</p>
          <span className="status-pill is-muted">{tasks.length} izabrano</span>
          <Button variant="secondary" iconOnly aria-label="Izmeni zadatke" title="Izmeni zadatke" onClick={() => setTasksOpen(true)}>
            <Pencil size={14} strokeWidth={1.75} />
          </Button>
        </div>
        <p className="tip-body">
          Ovo stoji u svakom upitu koji pošaljete i u uslovima koje negovateljica ponudi.
        </p>
        <div className="ag-services">
          {tasks.map((id) => (
            <span key={id} className="svc is-set">
              <Check size={13} strokeWidth={2.5} />
              {serviceTitle(id)}
            </span>
          ))}
        </div>
        {care?.tasks?.priority && (
          <div className="bc-lines ag-terms">
            <p className="bc-line">
              <span className="bc-line-label">Najvažnije</span>
              <span className="bc-line-value">{care.tasks.priority}</span>
            </p>
            {care.tasks.special && (
              <p className="bc-line">
                <span className="bc-line-label">Posebni zahtevi</span>
                <span className="bc-line-value">{care.tasks.special}</span>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="panel-card">
        <p className="doc-section-title">Obaveštenja</p>
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

      {/* Set up once and then never thought about again, which is exactly why
          it belongs here and not on the dashboard. */}
      <div className="panel-card">
        <div className="panel-card-head">
          <p className="doc-section-title">Način plaćanja</p>
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
              <Button variant="secondary" onClick={() => setCardOpen(true)}>
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

      <div className="panel-card">
        <div className="panel-card-head">
          <p className="doc-section-title">Pretplata</p>
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
                <Check size={12} strokeWidth={2.5} /> Preporuke lekara i pomagala
              </li>
            </ul>
            <p className="tip-body">{priceLine(user?.country)} · obnavlja se 4. septembra 2026.</p>
            <div className="panel-card-actions">
              <Button variant="secondary">Upravljaj plaćanjem</Button>
            </div>
          </>
        ) : (
          <p className="tip-body">
            Pretplatite se iz plana nege da otključate brojeve negovateljica i sve preporuke.
          </p>
        )}
      </div>

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
        <div className="panel-card-head">
          <p className="doc-section-title">
            <Cookie size={14} strokeWidth={1.75} />
            Kolačići
          </p>
          <span className="status-pill is-muted">
            {[cookies.analytics && 'analitika', cookies.marketing && 'marketing'].filter(Boolean).join(', ') ||
              'samo neophodni'}
          </span>
        </div>
        <p className="tip-body">
          Izaberite koje kolačiće dozvoljavate. Izbor važi i za nanaprime.com.
        </p>
        <div className="panel-card-actions">
          <Button variant="secondary" onClick={() => setCookiesOpen(true)}>
            Podešavanja kolačića
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
        </p>
        <div className="panel-card-actions">
          {twoFactor ? (
            <Button variant="secondary" onClick={() => onSaveUser({ twoFactor: false })}>
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

      <div className="panel-card">
        <p className="doc-section-title">Nalog</p>
        <p className="tip-body">
          Preuzmite sve što čuvamo o vama, ili zatvorite nalog i obrišite ga.
        </p>
        <div className="panel-card-actions">
          <Button variant="secondary">Preuzmi moje podatke</Button>
          <Button variant="ghost">Obriši nalog</Button>
        </div>
      </div>

      {tasksOpen && (
        <CaregiverTasksEditor
          care={care}
          onClose={() => setTasksOpen(false)}
          onSave={(tasks) => {
            onCare((c) => ({ ...c, tasks, need: { ...c.need, services: tasks.services } }));
            setTasksOpen(false);
          }}
        />
      )}

      {cookiesOpen && (
        <CookieModal
          cookies={cookies}
          onSave={(next) => {
            onSaveUser({ cookies: next });
            setCookiesOpen(false);
          }}
          onClose={() => setCookiesOpen(false)}
        />
      )}

      {twoFactorOpen && (
        <TwoFactorModal
          onDone={() => {
            onSaveUser({ twoFactor: true });
            setTwoFactorOpen(false);
          }}
          onClose={() => setTwoFactorOpen(false)}
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
            <Button variant="primary" size="lg" onClick={connect}>
              <CreditCard size={14} strokeWidth={1.75} />
              Nastavi na Stripe
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
