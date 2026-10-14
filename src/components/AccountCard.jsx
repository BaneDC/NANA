import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Fact, Facts } from '@/components/data-list';
import { useKept } from '@/hooks/use-kept';
import Dialog from './Dialog';
import { Field, Input } from './TextField';
import { msg, t } from '../i18n';

// Who is signed in: their name, e-mail and phone, first in Settings. This was
// the Profile page; once everything about the person they care for moved to
// her medical record (docs/patterns.md §10a), the account was all that page
// held, so it is a card here. Changed in a dialog, as the password is; in
// Settings a button with a label has no icon (§11).
//
// Only the name and the phone change here. The e-mail is what they sign in
// with, so it is not in the dialog, not even greyed out; a real change needs
// the new address confirmed, the old one told and the password or a code, and
// until that exists it goes through the coordinator.
const FIELDS = [
  { id: 'name', label: msg('Ime i prezime') },
  { id: 'email', label: msg('Email'), fixed: true },
  { id: 'phone', label: msg('Telefon'), type: 'tel' },
];
const EDITABLE = FIELDS.filter((f) => !f.fixed);

function AccountDialog({ open, user, onSave, onClose }) {
  const [values, setValues] = useState(() => Object.fromEntries(EDITABLE.map((f) => [f.id, user[f.id] || ''])));
  const complete = EDITABLE.every((f) => values[f.id].trim());
  return (
    <Dialog eyebrow={t('Nalog')} title={t('Vaši podaci')} open={open} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {EDITABLE.map((f) => (
          <Field key={f.id} label={t(f.label)}>
            <Input type={f.type || 'text'} value={values[f.id]} onChange={(value) => setValues((v) => ({ ...v, [f.id]: value }))} />
          </Field>
        ))}
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('Otkaži')}
        </Button>
        <Button disabled={!complete} onClick={() => onSave(values)}>
          {t('Sačuvaj')}
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
        <CardTitle>{t('Vaši podaci')}</CardTitle>
      </CardHeader>
      <Facts>
        {FIELDS.map((f) => (
          <Fact
            key={f.id}
            label={t(f.label)}
            note={f.fixed ? t('Email je vaše ime za prijavu. Ako treba da ga promenite, javite se koordinatorki.') : null}
          >
            {user?.[f.id] || '-'}
          </Fact>
        ))}
      </Facts>
      {onSave && (
        <CardFooter>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            {t('Izmenite podatke')}
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
