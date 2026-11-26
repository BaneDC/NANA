import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Fact, Facts } from '@/components/data-list';
import { PaneHint } from '@/components/pane';
import { useKept } from '@/hooks/use-kept';
import Dialog from './Dialog';
import { Group, Groups } from './Tags';
import { Field, Input, Phone, requiredError, useCheck } from './TextField';
import { dialOf, splitPhone } from '../data/countries';
import { msg, t } from '../i18n';

// Who is signed in: their name, e-mail and phone, first in Settings. This was
// the Profile page; once everything about the person they care for moved to
// her medical record (docs/patterns.md §10a), the account was all that page
// held, so it is a card here. Changed in a dialog, as the password is; in
// Settings a button with a label has no icon (§11).
//
// Only the name and the phone change here. The e-mail is what they sign in
// with; a real change needs the new address confirmed, the old one told and
// the password or a code, and until that exists it goes through the
// coordinator. So the dialog shows it on its top as text, not a field, with
// why under it (§10, "Šta se u prozoru za izmenu ne menja…", 26. 11.; until
// then a note under it on the card).
const FIELDS = [
  { id: 'name', label: msg('Ime i prezime') },
  { id: 'email', label: msg('Email') },
  { id: 'phone', label: msg('Telefon') },
];

// the phone as every phone field is (Phone, §10): the country's code apart
// from the number, kept whole ("+381 64 123 4567"); a number without a code
// is taken as from where they live, as at the sign-up
function AccountDialog({ open, user, onSave, onClose }) {
  const [name, setName] = useState(user.name || '');
  const [{ country, number: phone }, setPhone] = useState(() => splitPhone(user.phone, user.country === 'RS' ? 'RS' : 'FI'));
  const check = useCheck();
  // as the sign-up checks it (Register.jsx): empty, or too short to be whole
  const errors = {
    name: !name.trim() && requiredError(),
    phone: !phone.trim() ? requiredError() : phone.replace(/\D/g, '').length < 6 ? t('Unesite ceo broj telefona.') : null,
  };
  const save = () => check.check(Object.values(errors)) && onSave({ name: name.trim(), phone: `${dialOf(country)} ${phone.trim()}` });
  return (
    <Dialog eyebrow={t('Nalog')} title={t('Vaši podaci')} open={open} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Groups>
          <Group label={t('Email')} text={user.email || '-'} />
          <PaneHint>{t('Email ne može da se menja, jer je vezan za vaš nalog.')}</PaneHint>
        </Groups>
        <Field label={t('Ime i prezime')} required error={check.show(errors.name)}>
          <Input value={name} onChange={setName} />
        </Field>
        <Field label={t('Telefon')} required labelId="acct-phone" error={check.show(errors.phone)}>
          <Phone country={country} onCountry={(v) => setPhone((p) => ({ ...p, country: v }))} value={phone} onChange={(v) => setPhone((p) => ({ ...p, number: v }))} labelledBy="acct-phone" />
        </Field>
      </div>
      <DialogFooter>
        <Button onClick={save}>
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
          <Fact key={f.id} label={t(f.label)}>
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
