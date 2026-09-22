import { useState } from 'react';
import { Check, Send } from 'lucide-react';
import Button from '../Button';
import { hoursIn, money, serviceTitle, totalsFor } from '../../data/caregiverBoard';

// The visit order: what is meant to happen, written before going. It sits
// between the agreement and the work order and is the reason those two can be
// compared at all — without it, "4 hours worked" is a number with nothing to be
// measured against, and the things to remember on the way live in someone's
// head.
//
// It is filled from the agreement: the pattern gives the time, the time gives
// the hours, and the services are the ones the agreement covers.
export default function VisitPlanForm({ client, plan, onSave, onCancel }) {
  const patternTime = client.schedule?.split('· ')[1] || '';
  const [date, setDate] = useState(plan?.date || '');
  const [time, setTime] = useState(plan?.time || patternTime);
  const [services, setServices] = useState(plan?.services || client.services);
  const [notes, setNotes] = useState(plan?.notes || '');

  const hours = hoursIn(time);
  const valid = date.trim().length > 0 && hours > 0;

  const toggle = (id) =>
    setServices((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      <p className="ag-lead">
        Zašto dolazite. Kad ovo pošaljete porodici, novac za posetu se rezerviše pre nego što
        krenete, a radni nalog se posle otvara prema ovome — pa ono što ovde promenite je ono prema
        čemu se poseta meri.
      </p>

      <div className="wo-row">
        <label className="wo-field is-wide">
          <span className="ag-label">Dan</span>
          <input
            type="text"
            className="wo-text"
            value={date}
            placeholder="četvrtak, 14. avgusta"
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="wo-field">
          <span className="ag-label">Vreme</span>
          <input
            type="text"
            className="wo-text is-time"
            value={time}
            placeholder="09:00–13:00"
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
      </div>
      <p className="ag-hint">
        {hours
          ? `${hours} h po dogovorenih ${money(client.rate)}/h. Na kartici porodice rezerviše se ${money(
              totalsFor(hours, client.rate).charged
            )}, od toga ${money(
              totalsFor(hours, client.rate).net
            )} vama ako poseta prođe po planu. Raspored iz ugovora: ${client.schedule}.`
          : `Vreme kao raspon, npr. 09:00–13:00. Raspored iz ugovora: ${client.schedule}.`}
      </p>

      <p className="ag-label">Šta planirate da radite</p>
      <div className="ag-services">
        {client.services.map((id) => (
          <button
            key={id}
            type="button"
            className={`svc${services.includes(id) ? ' is-on' : ''}`}
            onClick={() => toggle(id)}
            aria-pressed={services.includes(id)}
          >
            {services.includes(id) && <Check size={13} strokeWidth={2.5} />}
            {serviceTitle(id)}
          </button>
        ))}
      </div>

      <label className="wo-field">
        <span className="ag-label">Šta treba zapamtiti</span>
        <textarea
          rows={2}
          className="wo-text"
          value={notes}
          placeholder="Recept za podizanje, nešto što je porodica tražila, nešto što treba proveriti."
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={onCancel}>
          Otkaži
        </Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() =>
            onSave(client.id, { date: date.trim(), time: time.trim(), hours, services, notes: notes.trim() })
          }
        >
          <Send size={14} strokeWidth={1.75} />
          {plan ? 'Pošalji izmenu' : 'Pošalji porodici'}
        </Button>
      </div>
    </>
  );
}
