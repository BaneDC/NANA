import { Pencil } from 'lucide-react';
import { questionById } from '../data/flow';
import { srField } from '../data/flow.sr';
import Button from '../components/Button';
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

export default function Profile({ user, answers, onGoToChat, onAskAssistant }) {
  const elderly = fieldsOf('about-person', answers);
  const contact = fieldsOf('about-you', answers);
  const goal = fieldsOf('family-goal', answers);

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
          { label: 'Ime', value: user.name || '—' },
          { label: 'Imejl', value: user.email || '—' },
        ]}
      />

      {elderly.length > 0 ? (
        <>
          <Section title="O kome brinemo" rows={elderly} onEdit={onGoToChat} />
          {contact.length > 0 && (
            <Section title="Glavni kontakt" rows={contact} onEdit={onGoToChat} />
          )}
          {goal.length > 0 && <Section title="Čemu se nadate" rows={goal} onEdit={onGoToChat} />}
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
    </div>
  );
}
