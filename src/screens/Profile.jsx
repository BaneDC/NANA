import { useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { questionById } from '../data/flow';
import { srField, srTitle } from '../data/flow.sr';
import Button from '../components/Button';
import Modal from '../components/Modal';
import AskAssistant from '../components/AskAssistant';

// Reads straight from the questionnaire answers, so the profile is whatever the
// user told the assistant — no second source of truth.
function fieldsOf(questionId, answers) {
  const q = questionById[questionId];
  const values = answers[questionId]?.values;
  if (!q?.fields || !values) return [];
  return q.fields.map((f) => ({ label: srField(q, f.id), value: values[f.id] || '—' }));
}

function Section({ title, rows, onEdit }) {
  return (
    <div className="panel-card">
      <div className="panel-card-head">
        <p className="doc-section-title">{title}</p>
        {onEdit && (
          <Button variant="secondary" iconOnly aria-label={`Izmeni: ${title}`} onClick={onEdit}>
            <Pencil size={14} strokeWidth={1.75} />
          </Button>
        )}
      </div>
      <div className="facts">
        {rows.map((r) => (
          <div className="fact" key={r.label}>
            <span className="fact-label">{r.label}</span>
            <span className="fact-value">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Editing it by hand, rather than telling the assistant to. The account's own
// fields are the account's; everything else is an answer the plan is built
// from, so saving one goes through the same change the plan shows.
function FieldEditor({ title, fields, onSave, onClose }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.id, f.value])));
  const complete = fields.every((f) => f.optional || String(values[f.id] || '').trim());

  return (
    <Modal eyebrow="Profil" title={title} onClose={onClose}>
      <div className="pe-fields">
        {fields.map((f) => (
          <label key={f.id} className="wo-field">
            <span className="ag-label">{f.label}</span>
            <input
              className="wo-text is-line"
              type={f.type || 'text'}
              value={values[f.id] || ''}
              placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        <Button variant="primary" disabled={!complete} onClick={() => onSave(values)}>
          <Check size={14} strokeWidth={2} />
          Sačuvaj
        </Button>
      </div>
    </Modal>
  );
}

export default function Profile({ user, answers, onGoToChat, onAskAssistant, onSaveUser, onEditAnswers }) {
  const elderly = fieldsOf('about-person', answers);
  const contact = fieldsOf('about-you', answers);
  const goal = fieldsOf('family-goal', answers);
  // 'account', or the id of the question being edited
  const [editing, setEditing] = useState(null);

  const questionFields = (id) => {
    const q = questionById[id];
    const values = answers[id]?.values || {};
    return q.fields.map((f) => ({ id: f.id, label: srField(q, f.id), value: values[f.id] || '', placeholder: f.placeholder, optional: f.optional }));
  };
  const saveQuestion = (id) => (values) => {
    onEditAnswers([{ questionId: id, answer: { values } }]);
    setEditing(null);
  };

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Profil</h1>
          <p className="view-sub">Sve što ste podelili, na jednom mestu.</p>
        </div>
        <AskAssistant onClick={onAskAssistant} />
      </div>

      <Section
        title="Vaš nalog"
        rows={[
          { label: 'Ime i prezime', value: user.name || '—' },
          { label: 'Email', value: user.email || '—' },
          { label: 'Telefon', value: user.phone || '—' },
        ]}
        onEdit={onSaveUser ? () => setEditing('account') : null}
      />

      {elderly.length > 0 ? (
        <>
          <Section title="O kome brinemo" rows={elderly} onEdit={() => setEditing('about-person')} />
          {contact.length > 0 && (
            <Section title="Glavni kontakt" rows={contact} onEdit={() => setEditing('about-you')} />
          )}
          {goal.length > 0 && (
            <Section title="Čemu se nadate" rows={goal} onEdit={() => setEditing('family-goal')} />
          )}
        </>
      ) : (
        <div className="empty">
          <p className="locked-title">Ovde još nema ničega</p>
          <p className="locked-note">
            Odgovorite na pitanja u razgovoru i profil će se sam popuniti.
          </p>
          <Button variant="primary" onClick={onGoToChat}>
            Idi na razgovor
          </Button>
        </div>
      )}

      {editing === 'account' && (
        <FieldEditor
          title="Vaš nalog"
          fields={[
            { id: 'name', label: 'Ime i prezime', value: user.name || '' },
            { id: 'email', label: 'Email', value: user.email || '', type: 'email' },
            { id: 'phone', label: 'Telefon', value: user.phone || '' },
          ]}
          onSave={(values) => {
            onSaveUser(values);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {editing && editing !== 'account' && (
        <FieldEditor
          title={srTitle(questionById[editing])}
          fields={questionFields(editing)}
          onSave={saveQuestion(editing)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
