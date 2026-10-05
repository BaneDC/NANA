import { useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { questionById } from '../data/flow';
import { srField, srTitle } from '../data/flow.sr';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { Fact, Facts } from '@/components/data-list';
import Dialog from '../components/Dialog';
import { useKept } from '@/hooks/use-kept';
import { Field, Input } from '../components/TextField';
import AskAssistant from '../components/AskAssistant';

// Reads straight from the questionnaire answers, so the profile is whatever the
// user told the assistant — no second source of truth.
function fieldsOf(questionId, answers) {
  const q = questionById[questionId];
  const values = answers[questionId]?.values;
  if (!q?.fields || !values) return [];
  return q.fields.map((f) => ({ label: srField(q, f.id), value: values[f.id] || '-' }));
}

function Section({ title, rows, onEdit }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {onEdit && (
          <CardAction>
            <Button variant="secondary" size="icon" aria-label={`Izmeni: ${title}`} onClick={onEdit}>
              <Pencil size={14} strokeWidth={1.75} />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <Facts>
        {rows.map((r) => (
          <Fact key={r.label} label={r.label}>
            {r.value}
          </Fact>
        ))}
      </Facts>
    </Card>
  );
}

// Editing it by hand, rather than telling the assistant to. The account's own
// fields are the account's; everything else is an answer the plan is built
// from, so saving one goes through the same change the plan shows.
function FieldEditor({ open = true, title, fields, onSave, onClose }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.id, f.value])));
  const complete = fields.every((f) => f.optional || String(values[f.id] || '').trim());

  return (
    <Dialog eyebrow="Profil" title={title} open={open} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {fields.map((f) => (
          <Field key={f.id} label={f.label}>
            <Input
              type={f.type || 'text'}
              value={values[f.id] || ''}
              placeholder={f.placeholder}
              onChange={(value) => setValues((v) => ({ ...v, [f.id]: value }))}
            />
          </Field>
        ))}
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        <Button disabled={!complete} onClick={() => onSave(values)}>
          <Check size={14} strokeWidth={2} />
          Sačuvaj
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default function Profile({ user, answers, onGoToChat, onAskAssistant, onSaveUser, onEditAnswers }) {
  const elderly = fieldsOf('about-person', answers);
  const contact = fieldsOf('about-you', answers);
  const goal = fieldsOf('family-goal', answers);
  // 'account', or the id of the question being edited
  const [editing, setEditing] = useState(null);
  // kept while the dialog closes, so it closes on what it showed
  const shown = useKept(editing);

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
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Profil</PageTitle>
          <PageDescription>Sve što ste podelili, na jednom mestu.</PageDescription>
        </PageHeaderText>
        <AskAssistant onClick={onAskAssistant} />
      </PageHeader>

      <Section
        title="Vaš nalog"
        rows={[
          { label: 'Ime i prezime', value: user.name || '-' },
          { label: 'Email', value: user.email || '-' },
          { label: 'Telefon', value: user.phone || '-' },
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
        <Empty>
          <EmptyTitle>Ovde još nema ničega</EmptyTitle>
          <EmptyDescription>Odgovorite na pitanja u razgovoru i profil će se sam popuniti.</EmptyDescription>
          <Button onClick={onGoToChat}>Idi na razgovor</Button>
        </Empty>
      )}

      {shown === 'account' && (
        <FieldEditor
          open={editing === 'account'}
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

      {shown && shown !== 'account' && (
        <FieldEditor
          key={shown}
          open={editing === shown}
          title={srTitle(questionById[shown])}
          fields={questionFields(shown)}
          onSave={saveQuestion(shown)}
          onClose={() => setEditing(null)}
        />
      )}
    </Page>
  );
}
