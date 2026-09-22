import { useState } from 'react';
import { Check, CreditCard, ShieldCheck } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import AskAssistant from '../components/AskAssistant';
import { chargingVisit, heldNow, money, paidThisMonth, visitCharge } from '../data/familyCare';

function Toggle({ label, hint, on, onChange }) {
  return (
    <button
      type="button"
      className="toggle-row"
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
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

export default function Settings({ unlocked, care, onCare, onAskAssistant }) {
  const [prefs, setPrefs] = useState({
    replies: true,
    schedule: true,
    digest: false,
    marketing: false,
  });
  const set = (key) => (v) => setPrefs((p) => ({ ...p, [key]: v }));
  const [cardOpen, setCardOpen] = useState(false);

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

      <div className="panel-card">
        <p className="doc-section-title">Obaveštenja</p>
        <div className="toggle-list">
          <Toggle
            label="Odgovori negovateljica"
            hint="Kad neko prihvati ili odbije vaš upit"
            on={prefs.replies}
            onChange={set('replies')}
          />
          <Toggle
            label="Promene rasporeda"
            hint="Otkazane ili pomerene posete"
            on={prefs.schedule}
            onChange={set('schedule')}
          />
          <Toggle
            label="Nedeljni pregled"
            hint="Nedeljom, kratak pregled poseta te nedelje"
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
            <p className="tip-body">1.490 RSD mesečno · obnavlja se 4. septembra 2026.</p>
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
