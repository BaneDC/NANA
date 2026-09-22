import { useState } from 'react';
import { Check, Send } from 'lucide-react';
import Button from '../Button';
import { DEFAULT_RATE, SERVICES, money, totalsFor } from '../../data/caregiverBoard';

// The agreement, the first and only time it is built: which services, and one
// shared hourly rate. Both are pre-filled from what the family actually asked
// for in their request, so the common case is reading it and pressing send
// rather than composing it from nothing.
export default function AgreementForm({ client, onSend, onCancel }) {
  const [services, setServices] = useState(client.needs);
  const [rate, setRate] = useState(String(client.rate || DEFAULT_RATE));

  const toggle = (id) =>
    setServices((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const rateNumber = Number(rate);
  const valid = services.length > 0 && rateNumber > 0;
  const weekly = valid ? rateNumber * client.hours : 0;

  return (
    <>
      <p className="ag-lead">
        Ovde postavljate koje usluge pružate i jednu zajedničku cenu po satu. Sve posle toga —
        posete, radni nalozi, uplate — računa se iz ovoga.
      </p>

      <p className="ag-label">Usluge iz ovog ugovora</p>
      <div className="ag-services">
        {SERVICES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`svc${services.includes(s.id) ? ' is-on' : ''}`}
            onClick={() => toggle(s.id)}
            aria-pressed={services.includes(s.id)}
          >
            {services.includes(s.id) && <Check size={13} strokeWidth={2.5} />}
            {s.title}
          </button>
        ))}
      </div>
      <p className="ag-hint">
        Označeno prema onome što je porodica tražila. Dodajte ili uklonite šta ne odgovara.
      </p>

      <p className="ag-label">Cena po satu</p>
      <div className="ag-rate">
        <input
          type="number"
          inputMode="numeric"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          aria-label="Cena po satu u dinarima"
        />
        <span className="ag-rate-suffix">RSD / h</span>
      </div>
      {valid && (
        <p className="ag-hint">
          Za {client.hours} h nedeljno to je {money(weekly)} nedeljno,{' '}
          {money(totalsFor(client.hours, rateNumber).net)} vama posle provizije od 10%.
        </p>
      )}

      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={onCancel}>
          Otkaži
        </Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => onSend(client.id, { services, rate: rateNumber })}
        >
          <Send size={14} strokeWidth={1.75} />
          Pošalji porodici
        </Button>
      </div>
    </>
  );
}
