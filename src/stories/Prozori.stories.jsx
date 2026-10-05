import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, TextArea } from '@/components/TextField';
import Modal from '@/components/Modal';
import Dialog from '@/components/Dialog';
import FamilyDrawer from '@/components/family/FamilyDrawer';
import { sampleCare } from '@/screens/CardGallery';

// Drawer for details, modal for an action (docs/patterns.md §7); on a phone
// both are a bottom sheet that drags down to close (§12). Pick "Telefon
// 375×812" in the toolbar to see the sheet. Every family drawer is here on the
// gallery's sample: what is decided in one does not change the sample.

export default { title: 'Prozori' };

const care = sampleCare();
const noop = () => {};

// Opens on load; closed, it leaves a button to open it again.
function Opened({ label, children }) {
  const [open, setOpen] = useState(true);
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
  render: () => (
    <Opened label="Otvori drawer">
      {(open, close) => (
        <Modal open={open} onClose={close} eyebrow="Sanna Virtanen · Helsinki" title="Detalji">
          <p className="text-xs leading-body text-muted-foreground">
            Drawer je za detalje nečega sa stranice, kad akcija nije jedino što je bitno.
          </p>
        </Modal>
      )}
    </Opened>
  ),
};

export const ModalOsnovni = {
  name: 'Modal (Dialog)',
  render: function Story() {
    const [text, setText] = useState('');
    return (
      <Opened label="Otvori modal">
        {(open, close) => (
          <Dialog open={open} onClose={close} eyebrow="Radni nalog · juče" title="Nešto nije u redu?">
            <Field label="Šta nije u redu">
              <TextArea value={text} onChange={setText} rows={3} placeholder="Opišite ukratko." />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={close}>
                Nazad
              </Button>
              <Button onClick={close}>Pošalji koordinatorki</Button>
            </div>
          </Dialog>
        )}
      </Opened>
    );
  },
};

// the app's own drawers, each on the sample
const family = (drawer) => ({
  render: () => (
    <Opened label="Otvori ponovo">
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
  ),
});

export const Uslovi = { ...family({ kind: 'terms', caregiverId: 'paivi' }), name: 'Ugovor o nezi (novi uslovi)' };
export const RadniNalog = { ...family({ kind: 'work-order', visitId: 'g-charging' }), name: 'Radni nalog' };
export const PlanPosete = { ...family({ kind: 'plan', visitId: 'g-planned' }), name: 'Plan posete' };
export const ProfilNegovateljice = { ...family({ kind: 'profile', caregiverId: 'johanna' }), name: 'Informacije o negovateljici' };
export const SvePosete = { ...family({ kind: 'visits', caregiverId: 'sanna' }), name: 'Sve posete' };
export const StaSeDesilo = { ...family({ kind: 'activity', caregiverId: 'sanna' }), name: 'Šta se desilo' };
export const Pregled = { ...family({ kind: 'overview', caregiverId: 'sanna' }) };
export const Verzije = { ...family({ kind: 'versions', caregiverId: 'paivi' }), name: 'Sve verzije ugovora' };
export const ZavrsiSaradnju = { ...family({ kind: 'end', caregiverId: 'sanna' }), name: 'Završiti saradnju?' };
