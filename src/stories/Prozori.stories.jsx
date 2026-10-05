import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, TextArea } from '@/components/TextField';
import Modal from '@/components/Modal';
import Dialog from '@/components/Dialog';
import FamilyDrawer from '@/components/family/FamilyDrawer';
import { Card, CardDescription } from '@/components/ui/card';
import { caregivers } from '@/data/carePlan';
import { allVisits, arrangementOf, pendingVersion } from '@/data/familyCare';
import { sampleCare } from '@/screens/CardGallery';

// Drawer for details, modal for an action (docs/patterns.md §7); on a phone
// both are a bottom sheet that drags down to close (§12). Pick "Telefon
// 375×812" in the toolbar to see the sheet. Every family drawer is in one
// story, picked from the Controls panel, on the gallery's sample: what is
// decided in one does not change the sample.

export default { title: 'Prozori' };

const care = sampleCare();
const noop = () => {};

// Opens on load, and again when `watch` changes (another drawer picked);
// closed, it leaves a button to open it again.
function Opened({ label, watch, children }) {
  const [open, setOpen] = useState(true);
  useEffect(() => setOpen(true), [watch]);
  return (
    <>
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          {label}
        </Button>
      </div>
      {children(open, () => setOpen(false))}
    </>
  );
}

export const DrawerOsnovni = {
  name: 'Drawer (Modal)',
  args: {
    eyebrow: 'Sanna Virtanen · Helsinki',
    title: 'Detalji',
    text: 'Drawer je za detalje nečega sa stranice, kad akcija nije jedino što je bitno.',
    wide: false,
  },
  argTypes: {
    eyebrow: { control: 'text', description: 'Mali red iznad naslova; prazno = bez njega.' },
    title: { control: 'text' },
    text: { control: 'text' },
    wide: { control: 'boolean', description: 'Širi drawer, za liste (sve posete, verzije).' },
  },
  render: ({ eyebrow, title, text, wide }) => (
    <Opened label="Otvori drawer">
      {(open, close) => (
        <Modal open={open} onClose={close} eyebrow={eyebrow || undefined} title={title} wide={wide}>
          <p className="text-xs leading-body text-muted-foreground">{text}</p>
        </Modal>
      )}
    </Opened>
  ),
};

export const ModalOsnovni = {
  name: 'Modal (Dialog)',
  args: { eyebrow: 'Radni nalog · juče', title: 'Nešto nije u redu?', confirm: 'Pošalji koordinatorki', destructive: false },
  argTypes: {
    eyebrow: { control: 'text', description: 'Mali red iznad naslova; prazno = bez njega.' },
    title: { control: 'text' },
    confirm: { control: 'text', description: 'Tekst glavnog dugmeta.' },
    destructive: { control: 'boolean', description: 'Glavno dugme je crveno: samo kad nešto briše (§9).' },
  },
  render: function Story({ eyebrow, title, confirm, destructive }) {
    const [text, setText] = useState('');
    return (
      <Opened label="Otvori modal">
        {(open, close) => (
          <Dialog open={open} onClose={close} eyebrow={eyebrow || undefined} title={title}>
            <Field label="Šta nije u redu">
              <TextArea value={text} onChange={setText} rows={3} placeholder="Opišite ukratko." />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={close}>
                Nazad
              </Button>
              <Button variant={destructive ? 'destructive' : 'default'} onClick={close}>
                {confirm}
              </Button>
            </div>
          </Dialog>
        )}
      </Opened>
    );
  },
};

// the app's own drawers, on the sample
const KINDS = {
  terms: 'Ugovor o nezi (novi uslovi)',
  'work-order': 'Radni nalog',
  plan: 'Plan posete',
  profile: 'Informacije o negovateljici',
  visits: 'Sve posete',
  activity: 'Šta se desilo',
  overview: 'Pregled',
  versions: 'Sve verzije ugovora',
  end: 'Završiti saradnju?',
};
// the two that are about one visit; the rest are about a caregiver
const BY_VISIT = ['work-order', 'plan'];

const visits = allVisits(care);
const STATUS = {
  planned: 'plan posete',
  awaiting: 'čeka radni nalog',
  charging: 'radni nalog stigao',
  disputed: 'prijavljeno',
  paid: 'plaćeno',
  cancelled: 'otkazano',
};
const visitLabel = (v) => `${v.caregiver.name.split(' ')[0]} · ${v.date} · ${STATUS[v.status]}`;

// whom (or which visit) each drawer has something to show for in the sample
const FITS = {
  terms: (id) => !!pendingVersion(arrangementOf(care, id) || { versions: [] }),
  'work-order': (id) => !!visits.find((v) => v.id === id)?.report,
  plan: (id) => visits.find((v) => v.id === id)?.status === 'planned',
  profile: () => true,
  activity: () => true,
  visits: (id) => !!arrangementOf(care, id)?.visits.length,
  overview: (id) => !!arrangementOf(care, id),
  versions: (id) => !!arrangementOf(care, id)?.versions.length,
  end: (id) => !!arrangementOf(care, id) && !arrangementOf(care, id).endedOn,
};

export const DrawerPorodice = {
  name: 'Drawer porodice',
  args: { kind: 'terms', caregiverId: 'paivi', visitId: 'g-charging' },
  argTypes: {
    kind: { control: { type: 'select', labels: KINDS }, options: Object.keys(KINDS), description: 'Koji drawer.' },
    caregiverId: {
      control: { type: 'select', labels: Object.fromEntries(caregivers.map((c) => [c.id, c.name])) },
      options: caregivers.map((c) => c.id),
      description: 'Za svaki drawer osim radnog naloga i plana posete.',
    },
    visitId: {
      control: { type: 'select', labels: Object.fromEntries(visits.map((v) => [v.id, visitLabel(v)])) },
      options: visits.map((v) => v.id),
      description: 'Za radni nalog i plan posete.',
    },
  },
  render: ({ kind, caregiverId, visitId }) => {
    const byVisit = BY_VISIT.includes(kind);
    const id = byVisit ? visitId : caregiverId;
    if (!FITS[kind](id)) {
      const fit = byVisit
        ? visits.filter((v) => FITS[kind](v.id)).map(visitLabel)
        : caregivers.filter((c) => FITS[kind](c.id)).map((c) => c.name);
      return (
        <Card>
          <CardDescription>
            U primeru ovaj drawer nema šta da pokaže za {byVisit ? 'tu posetu' : 'nju'}. Izaberi: {fit.join(', ')}.
          </CardDescription>
        </Card>
      );
    }
    const drawer = byVisit ? { kind, visitId } : { kind, caregiverId };
    return (
      <Opened label="Otvori ponovo" watch={`${kind}-${id}`}>
        {(open, close) => (
          <FamilyDrawer
            drawer={drawer}
            open={open}
            care={care}
            unlocked
            onCare={noop}
            onFlash={noop}
            onClose={close}
            onOpen={noop}
            onContact={noop}
            onCaregiver={noop}
          />
        )}
      </Opened>
    );
  },
};
