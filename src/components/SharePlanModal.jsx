import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { pl } from '../data/familyCare';

// Sending the care plan to someone who is not in the app: a sister who shares
// the driving, a son abroad, the doctor the family wants to show it to. They
// get the plan as it is now, to read; nothing about the account goes with it.
//
// Several addresses at once, because this is rarely one person: they are typed
// the way people paste them, separated by commas, spaces or new lines.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parse = (text) =>
  text
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

export default function SharePlanModal({ plan, sentTo = [], onSend, onClose }) {
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const entered = parse(text);
  const wrong = entered.filter((e) => !EMAIL.test(e));
  const ready = entered.length > 0 && wrong.length === 0;

  return (
    <Modal eyebrow={`Plan nege · ${plan.name}`} title="Pošaljite plan nekome" wide onClose={onClose}>
      <p className="ag-lead">
        Onaj ko ga dobije vidi plan nege onakav kakav je sada: šta preporučujemo, zašto, i ko od
        negovateljica odgovara. Ne vidi vaš nalog, plaćanje ni poruke sa negovateljicama.
      </p>

      <label className="pw-message">
        <span className="tf-label">Imejl adrese</span>
        <textarea
          rows={3}
          value={text}
          placeholder="ana@mail.com, milan@mail.com"
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      {entered.length > 0 && (
        <div className="share-list">
          {entered.map((e) => (
            <span key={e} className={`status-pill ${EMAIL.test(e) ? 'is-accepted' : 'is-declined'}`}>
              <Mail size={12} strokeWidth={2} />
              {e}
            </span>
          ))}
        </div>
      )}
      {wrong.length > 0 && (
        <p className="ag-hint">Ovo ne liči na imejl adresu: {wrong.join(', ')}.</p>
      )}

      <label className="pw-message">
        <span className="tf-label">Poruka uz plan (nije obavezno)</span>
        <textarea
          rows={2}
          value={note}
          placeholder="Evo šta smo dogovorili za mamu."
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      {sentTo.length > 0 && (
        <p className="fam-sub is-flush">Već poslato: {sentTo.join(', ')}.</p>
      )}

      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        <Button variant="primary" disabled={!ready} onClick={() => onSend(entered, note.trim())}>
          <Send size={14} strokeWidth={1.75} />
          {entered.length > 1 ? `Pošalji na ${pl(entered.length, 'adresu', 'adrese', 'adresa')}` : 'Pošalji'}
        </Button>
      </div>
    </Modal>
  );
}
