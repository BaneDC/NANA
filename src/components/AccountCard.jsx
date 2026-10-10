import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Fact, Facts } from '@/components/data-list';
import { useKept } from '@/hooks/use-kept';
import Dialog from './Dialog';
import { Field, Input } from './TextField';

// Who is signed in: their name, e-mail and phone, first in Settings. This was
// the Profile page; once everything about the person they care for moved to
// her medical record (docs/patterns.md §10a), the account was all that page
// held, so it is a card here. Changed in a dialog, as the password is; in
// Settings a button with a label has no icon (§11).
const FIELDS = [
  { id: 'name', label: 'Ime i prezime' },
  { id: 'email', label: 'Email', type: 'email' },
  { id: 'phone', label: 'Telefon' },
];

function AccountDialog({ open, user, onSave, onClose }) {
  const [values, setValues] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.id, user[f.id] || ''])));
  const complete = FIELDS.every((f) => values[f.id].trim());
  return (
    <Dialog eyebrow="Nalog" title="Vaši podaci" open={open} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {FIELDS.map((f) => (
          <Field key={f.id} label={f.label}>
            <Input type={f.type || 'text'} value={values[f.id]} onChange={(value) => setValues((v) => ({ ...v, [f.id]: value }))} />
          </Field>
        ))}
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        <Button disabled={!complete} onClick={() => onSave(values)}>
          Sačuvaj
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default function AccountCard({ user, onSave }) {
  const [editing, setEditing] = useState(false);
  // kept while the dialog closes, so it plays its close
  const shown = useKept(editing);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vaši podaci</CardTitle>
      </CardHeader>
      <Facts>
        {FIELDS.map((f) => (
          <Fact key={f.id} label={f.label}>
            {user?.[f.id] || '-'}
          </Fact>
        ))}
      </Facts>
      {onSave && (
        <CardFooter>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Izmenite podatke
          </Button>
        </CardFooter>
      )}
      {shown && (
        <AccountDialog
          open={editing}
          user={user || {}}
          onSave={(values) => {
            onSave(values);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </Card>
  );
}
