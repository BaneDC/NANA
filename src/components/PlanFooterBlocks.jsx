import { useState } from 'react';
import { Mail, MessageCircle, Phone, Plus } from 'lucide-react';
import Button from './Button';

// Two blocks the client's document ends on. Both are the same idea: the plan is not
// a finished document handed down, it is a conversation the family can push back on.

// "Ukoliko želite da postavite neko dodatno pitanje ili prilagodite neki segment
// plana, slobodno ovde upišite" — the plan takes additions from the family.
export function PlanAsk({ onAdd }) {
  const [text, setText] = useState('');
  const [added, setAdded] = useState([]);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    setAdded((a) => [...a, value]);
    setText('');
    onAdd?.(value);
  };

  return (
    <div className="plan-ask">
      <p className="rec-title">Želite nešto da dodate ili promenite?</p>
      <p className="doc-p">
        Ako želite nešto da pitate ili da prilagodite deo plana, napišite ovde i ja ću to
        preuzeti.
      </p>

      {added.map((a, i) => (
        <p className="plan-ask-added" key={i}>
          <Plus size={13} strokeWidth={2} /> {a}
        </p>
      ))}

      <div className="plan-ask-row">
        <input
          type="text"
          value={text}
          placeholder="Može li za početak samo pre podne?"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <Button variant="secondary" disabled={!text.trim()} onClick={submit}>
          <Plus size={13} strokeWidth={2} /> Dodaj u plan
        </Button>
      </div>
    </div>
  );
}

// "Od sada ne morate sve sami da organizujete." Reaching the coordinator is never
// behind the paywall — the paywall is on caregiver numbers.
export function CoordinatorContact({ coordinator }) {
  return (
    <div className="coordinator-contact">
      <p className="rec-title">Ako želite da se direktno javite koordinatorki</p>
      <div className="contact-rows">
        <a className="contact-row" href={`https://wa.me/${coordinator.whatsapp.replace(/\D/g, '')}`}>
          <MessageCircle size={14} strokeWidth={1.75} />
          <span className="contact-label">WhatsApp</span>
          <span className="contact-value">{coordinator.whatsapp}</span>
        </a>
        <a className="contact-row" href={`tel:${coordinator.phone.replace(/\s/g, '')}`}>
          <Phone size={14} strokeWidth={1.75} />
          <span className="contact-label">Telefon</span>
          <span className="contact-value">{coordinator.phone}</span>
        </a>
        <a className="contact-row" href={`mailto:${coordinator.email}`}>
          <Mail size={14} strokeWidth={1.75} />
          <span className="contact-label">Email</span>
          <span className="contact-value">{coordinator.email}</span>
        </a>
      </div>
      <p className="contact-note">
        Od sada ne morate sve sami da organizujete. Kad god vam zatreba pomoć, pozovite me.
      </p>
    </div>
  );
}
