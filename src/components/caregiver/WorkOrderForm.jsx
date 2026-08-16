import { useState } from 'react';
import { AlertTriangle, Check, ClipboardList, Send, Utensils, Footprints } from 'lucide-react';
import Button from '../Button';
import { money, serviceTitle, totalsFor } from '../../data/caregiverBoard';

// The work order is the visit's report and its invoice in one, because they are
// the same event: what was done decides what is charged. It prices itself
// against the agreement — the rate is the agreed rate, and the things that can
// be ticked are the services the agreement covers, nothing else.
//
// It opens against the visit order: the hours that were planned, the services
// that were planned, everything "as usual". A visit that went to plan is read
// and sent; only what actually differed has to be touched. Every service the
// agreement covers is still offered, because a visit can turn into something
// nobody planned.

const MOODS = [
  { id: 'low', label: 'Low' },
  { id: 'usual', label: 'As usual' },
  { id: 'good', label: 'Good' },
];

const AMOUNTS = [
  { id: 'less', label: 'Less than usual' },
  { id: 'usual', label: 'As usual' },
  { id: 'more', label: 'More than usual' },
];

function Choice({ options, value, onChange, name }) {
  return (
    <div className="wo-choice" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          className={`svc is-sm${value === o.id ? ' is-on' : ''}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function WorkOrderForm({ client, visit, onSend, onCancel }) {
  const [hours, setHours] = useState(String(visit.hours));
  const [note, setNote] = useState('');
  const [mood, setMood] = useState('usual');
  const [eating, setEating] = useState('usual');
  const [moving, setMoving] = useState('usual');
  const [services, setServices] = useState(visit.planned || client.services);
  const [concernOpen, setConcernOpen] = useState(false);
  const [concern, setConcern] = useState('');

  const worked = Number(hours);
  const valid = worked > 0;
  const totals = totalsFor(valid ? worked : 0, client.rate);
  const overtime = valid && worked !== visit.hours;

  const toggle = (id) =>
    setServices((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      <p className="ag-lead">
        {visit.date} · {visit.time} — {visit.hours} h planned, at the agreed {money(client.rate)}/h.
      </p>
      {visit.planNotes && (
        <p className="wo-plan-note">
          <ClipboardList size={13} strokeWidth={1.75} />
          Planned: {visit.planNotes}
        </p>
      )}

      <div className="wo-row">
        <label className="wo-field">
          <span className="ag-label">Hours worked</span>
          <div className="ag-rate">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
            <span className="ag-rate-suffix">h</span>
          </div>
        </label>
        <label className="wo-field is-wide">
          <span className="ag-label">What you did</span>
          <input
            type="text"
            className="wo-text"
            value={note}
            placeholder="Morning routine, breakfast, short walk."
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>
      {overtime && (
        <p className="ag-hint">
          {worked > visit.hours
            ? `More than the ${visit.hours} h held against ${client.family}'s card. The extra is charged when they confirm.`
            : `Less than the ${visit.hours} h held — the difference is released back to ${client.family}.`}
        </p>
      )}

      <p className="ag-label">How was {client.elder.split(' ')[0]} today?</p>
      <Choice options={MOODS} value={mood} onChange={setMood} name="Mood" />

      <div className="wo-row">
        <div className="wo-field">
          <span className="ag-label">
            <Utensils size={13} strokeWidth={1.75} /> Eating
          </span>
          <Choice options={AMOUNTS} value={eating} onChange={setEating} name="Eating" />
        </div>
        <div className="wo-field">
          <span className="ag-label">
            <Footprints size={13} strokeWidth={1.75} /> Moving around
          </span>
          <Choice options={AMOUNTS} value={moving} onChange={setMoving} name="Moving around" />
        </div>
      </div>

      <p className="ag-label">What you got to</p>
      <p className="ag-hint">
        Ticked from the visit order — untick anything that did not happen, tick anything that
        came up.
      </p>
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

      {/* Somewhere for the thing that does not fit in a rating. It reaches the
          family, so it is deliberately not a checkbox with no words. */}
      {concernOpen ? (
        <div className="wo-concern">
          <span className="ag-label">
            <AlertTriangle size={13} strokeWidth={1.75} /> Something worried me today
          </span>
          <textarea
            rows={2}
            className="wo-text"
            value={concern}
            placeholder="What you noticed, in your own words. The family sees this."
            onChange={(e) => setConcern(e.target.value)}
          />
        </div>
      ) : (
        <button type="button" className="wo-concern-open" onClick={() => setConcernOpen(true)}>
          <AlertTriangle size={13} strokeWidth={1.75} />
          Something worried me today
        </button>
      )}

      <p className="ag-hint">
        Sending this starts {client.family}'s 24 hours. Nothing is asked of them — it charges
        itself when the time is up, unless they raise something in that window.
      </p>

      <div className="bc-total wo-total">
        <p className="bc-line">
          <span className="bc-line-label">Charged · {valid ? worked : 0} h</span>
          <span className="bc-line-value">{money(totals.charged)}</span>
        </p>
        <p className="bc-line">
          <span className="bc-line-label">Service fee (10%)</span>
          <span className="bc-line-value">−{money(totals.fee)}</span>
        </p>
        <p className="bc-line is-net">
          <span className="bc-line-label">You receive</span>
          <span className="bc-line-value">{money(totals.net)}</span>
        </p>
      </div>

      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() =>
            onSend(client.id, {
              hours: worked,
              note: note.trim(),
              mood,
              eating,
              moving,
              services,
              concern: concern.trim(),
            })
          }
        >
          <Send size={14} strokeWidth={1.75} />
          Send work order
        </Button>
      </div>
    </>
  );
}
