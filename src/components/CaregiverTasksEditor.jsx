import { useState } from 'react';
import { Check } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { TASK_GROUPS, tasksOf } from '../data/caregiverTasks';

// Everything the caregiver is asked to do, in one place, to read and change.
//
// The plan proposes this set from the answers; here the family says otherwise
// without touching the answers — "she manages bathing, but I want the shopping
// done" is not a change to how independent her mother is. Anything that *would*
// change that belongs in the plan, and the plan is edited through the assistant.
export default function CaregiverTasksEditor({ care, onSave, onClose }) {
  const [picked, setPicked] = useState(() => new Set(tasksOf(care)));
  const [priority, setPriority] = useState(care?.tasks?.priority || '');
  const [special, setSpecial] = useState(care?.tasks?.special || '');

  const toggle = (id) =>
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Modal
      eyebrow="Podešavanja"
      title="Zadaci negovateljice"
      wide
      onClose={onClose}
    >
      <p className="ag-lead">
        Ovo stoji u svakom upitu koji pošaljete i u uslovima koje negovateljica ponudi. Plan nege
        predlaže sadržaj na osnovu vaših odgovora; ovde ga možete izmeniti.
      </p>

      {TASK_GROUPS.map((g) => (
        <section key={g.id} className="ct-group">
          <p className="ag-label">{g.title}</p>
          <div className="ct-list">
            {g.items.map((item) => {
              const on = picked.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`ct-item${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  onClick={() => toggle(item.id)}
                >
                  <span className="ct-box">{on && <Check size={12} strokeWidth={3} />}</span>
                  <span className="ct-text">
                    <span className="ct-title">{item.title}</span>
                    <span className="ct-note">{item.note}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <label className="pw-message">
        <span className="tf-label">Šta je najvažnije</span>
        <textarea
          rows={2}
          value={priority}
          placeholder="npr. obroci i lekovi, pre svega ostalog"
          onChange={(e) => setPriority(e.target.value)}
        />
      </label>

      <label className="pw-message">
        <span className="tf-label">Posebni zahtevi (nije obavezno)</span>
        <textarea
          rows={2}
          value={special}
          placeholder="npr. vežbe koje je propisao fizijatar"
          onChange={(e) => setSpecial(e.target.value)}
        />
      </label>

      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        <Button
          variant="primary"
          disabled={picked.size === 0}
          onClick={() =>
            onSave({ services: [...picked], priority: priority.trim(), special: special.trim() })
          }
        >
          <Check size={14} strokeWidth={2} />
          Sačuvaj
        </Button>
      </div>
    </Modal>
  );
}
