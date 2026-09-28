import { useState } from 'react';
import { AlertTriangle, Check, PenLine, Sparkles } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { Field, Input } from './TextField';
import { toAnswer } from '../data/conversation';
import { isLoadBearing } from '../data/dependencies';
import { answerText, describeChanges, planQuestions } from '../data/planEdits';
import { Q, srField, srOption, srShort, srTitle } from '../data/flow.sr';

// The care plan, edited by hand. The plan is built from the family's answers, so
// this is those answers, section by section; changing one rebuilds the plan
// around it. It opens as the same side pane every other detail does.

// A draft in the shape an answer is stored in, before it is checked.
function draftOf(q, answer) {
  if (q.type === 'inputs') return { values: { ...(answer?.values || {}) } };
  if (q.type === 'single') return { optionId: answer?.optionId || null };
  return { optionIds: [...(answer?.optionIds || [])], other: answer?.other || '' };
}

function AnswerEditor({ q, answer, answers, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => draftOf(q, answer));
  // The same check the assistant's changes go through: an answer that would not
  // be stored is not offered as saveable.
  const checked = toAnswer({ questionId: q.id, ...draft });
  const effect = checked ? describeChanges(answers, [{ questionId: q.id, answer: checked }]) : null;

  const toggle = (id) =>
    setDraft((d) => ({
      ...d,
      optionIds: d.optionIds.includes(id) ? d.optionIds.filter((x) => x !== id) : [...d.optionIds, id],
    }));

  return (
    <div className="pe-editor">
      <p className="pe-editor-title">{srTitle(q)}</p>
      {Q[q.id]?.subtitle && <p className="fam-sub is-flush">{Q[q.id].subtitle}</p>}

      {q.type === 'inputs' && (
        <div className="pe-fields">
          {q.fields.map((f) => (
            <Field key={f.id} label={srField(q, f.id)}>
              <Input
                type="text"
                value={draft.values[f.id] || ''}
                placeholder={f.placeholder}
                onChange={(value) => setDraft((d) => ({ values: { ...d.values, [f.id]: value } }))}
              />
            </Field>
          ))}
        </div>
      )}

      {q.type !== 'inputs' && (
        <>
          <p className="ag-hint">{q.type === 'single' ? 'Izaberite jedan odgovor' : 'Možete izabrati više odgovora'}</p>
          <div className="wo-choice">
            {q.options.map((o) => {
              const on = q.type === 'single' ? draft.optionId === o.id : draft.optionIds.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  className={`svc is-sm${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  onClick={() => (q.type === 'single' ? setDraft({ optionId: o.id }) : toggle(o.id))}
                >
                  {srOption(q, o.id)}
                </button>
              );
            })}
          </div>
          {q.type === 'multi' && q.allowOther && (
            <Input
              type="text"
              value={draft.other}
              placeholder="Nešto drugo, svojim rečima"
              aria-label="Nešto drugo"
              onChange={(value) => setDraft((d) => ({ ...d, other: value }))}
            />
          )}
        </>
      )}

      {/* The one consequence worth a warning: an answer that moves the frailty
          level re-plans everything after it. */}
      {effect?.frailty && (
        <p className="visit-concern">
          <AlertTriangle size={12} strokeWidth={2} />
          Ovo pomera nivo krhkosti sa {effect.frailty.before} na {effect.frailty.after}. Preporuke se
          prave iznova oko toga.
        </p>
      )}
      {effect?.dropped.length > 0 && (
        <p className="ag-hint">Ova pitanja se više ne postavljaju, pa se njihovi odgovori brišu: {effect.dropped.join(', ')}.</p>
      )}

      <div className="pe-editor-actions">
        <Button variant="secondary" onClick={onCancel}>
          Otkaži
        </Button>
        <Button variant="primary" disabled={!checked} onClick={() => onSave(checked)}>
          <Check size={14} strokeWidth={2} />
          Sačuvaj
        </Button>
      </div>
    </div>
  );
}

export default function PlanEditor({ answers, name, onApply, onAskAssistant, onClose }) {
  const [editing, setEditing] = useState(null);
  const sections = planQuestions(answers);

  return (
    <Modal eyebrow={`Plan nege · ${name}`} title="Izmenite odgovore" wide onClose={onClose}>
      <p className="ag-lead pe-lead">
        Plan je napravljen iz ovih odgovora. Kad promenite jedan, plan se pravi iznova oko njega,
        preporuke i negovateljice prate izmenu.
      </p>
      <p className="ag-hint pe-lead">
        Ovde menjate odgovore koji stoje sami za sebe. Oni od kojih zavisi ostatak plana idu kroz
        asistenta: on pita šta se još promenilo i predloži sve zajedno.
      </p>

      {sections.map((s) => (
        <section key={s.id} className="pe-section">
          <p className="ag-label">{s.title}</p>
          <div className="pe-list">
            {s.questions.map(({ q, answer }) =>
              editing === q.id ? (
                <AnswerEditor
                  key={q.id}
                  q={q}
                  answer={answer}
                  answers={answers}
                  onCancel={() => setEditing(null)}
                  // Saving closes the pane: what the change did is shown on the plan
                  // itself, and the plan is behind this.
                  onSave={(next) => {
                    onApply([{ questionId: q.id, answer: next }]);
                    setEditing(null);
                    onClose();
                  }}
                />
              ) : isLoadBearing(q.id) ? (
                // Changing this one moves the frailty level, and the level
                // decides which questions the plan asks at all — so it is not a
                // field to overwrite. The assistant takes it, asks what the
                // change opens up, and proposes the whole set.
                <div key={q.id} className="pe-row is-locked">
                  <span className="pe-q">{srShort(q)}</span>
                  <span className={`pe-a${answer ? '' : ' is-empty'}`}>{answerText(q, answer)}</span>
                  <span className="status-pill is-muted">Kroz asistenta</span>
                </div>
              ) : (
                <button key={q.id} type="button" className="pe-row" onClick={() => setEditing(q.id)}>
                  <span className="pe-q">{srShort(q)}</span>
                  <span className={`pe-a${answer ? '' : ' is-empty'}`}>{answerText(q, answer)}</span>
                  <PenLine size={14} strokeWidth={1.75} className="pe-edit" />
                </button>
              )
            )}
          </div>
        </section>
      ))}

      {/* One way out for all of them, rather than the same button on every
          locked row. */}
      <div className="panel-card-actions is-end">
        {onAskAssistant && (
          <Button variant="secondary" onClick={onAskAssistant}>
            <Sparkles size={14} strokeWidth={1.75} />
            Pitajte asistenta
          </Button>
        )}
        <Button variant="primary" onClick={onClose}>
          Gotovo
        </Button>
      </div>
    </Modal>
  );
}
