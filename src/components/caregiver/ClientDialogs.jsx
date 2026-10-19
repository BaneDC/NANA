import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Part } from '@/components/pane';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useKept } from '@/hooks/use-kept';
import Dialog from '../Dialog';
import Modal from '../Modal';
import { SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { DataList, DataRow } from '@/components/data-list';
import { PaneHint, PaneLabel } from '@/components/pane';
import { RECORD_PARTS, partRows } from '../../data/record';
import { scheduleText } from '../../data/familyStart';
import { serviceTitle } from '../../data/serviceCatalog';
import { AgreementDialog, CALL_OFF_REASONS, NO_VISIT_REASONS, ReasonDialog, VisitPlanDialog, WorkOrderDialog } from './Forms';
import {
  DECLINE_REASONS,
  answerRequest,
  caregiverEnds,
  planVisit,
  sendTerms,
  sendWorkOrder,
  visitNotHappened,
  withdrawTerms,
} from '../../data/caregiverCare';
import { findVisit, firstName } from '../../data/familyCare';
import { market } from '../../data/market';
import { t } from '@/i18n';

// Every action she takes on a family, from the board or from the family's page:
// `open({ kind, client, visitId })` opens the right dialog, and what she sends
// goes through the same functions the simulation uses (caregiverCare.js), on
// that family's care. Accepting a request and withdrawing terms need no dialog.
export function useClientActions({ caregiverId, onClientCare, onFlash }) {
  const [open, setOpen] = useState(null);
  const kept = useKept(open);
  const close = () => setOpen(null);
  const run = (client, fn, said) => {
    onClientCare(client.id, fn);
    if (said) onFlash(said);
  };
  const family = (client) => firstName(client.care.family.name || '') || t('Porodica');

  const act = (kind, client, extra = {}) => {
    if (kind === 'accept')
      return run(
        client,
        answerRequest(caregiverId, true),
        market() === 'RS' ? t('Prihvatili ste. {name} vidi vaš telefon i e-mail.', { name: family(client) }) : t('Prihvatili ste. Sledeće su uslovi saradnje.')
      );
    if (kind === 'withdraw') return run(client, withdrawTerms(caregiverId), t('Predlog je povučen.'));
    setOpen({ kind, client, ...extra });
  };

  let dialog = null;
  if (kept) {
    const { kind, client } = kept;
    const shown = Boolean(open);
    const visit = kept.visitId && findVisit(client.care, kept.visitId);
    const done = (fn, said) => {
      run(client, fn, said);
      close();
    };
    if (kind === 'request')
      dialog = (
        <RequestDrawer
          open={shown}
          client={client}
          onClose={close}
          onAccept={() => {
            close();
            act('accept', client);
          }}
          onDecline={() => setOpen({ kind: 'decline', client, over: true })}
        />
      );
    else if (kind === 'decline') {
      const decline = (
        <DeclineDialog
          open={shown}
          name={client.care.elder.name}
          // from the request's drawer, "Nazad" goes back to it (§7)
          onClose={kept.over ? () => setOpen({ kind: 'request', client }) : close}
          onConfirm={(reason) => done(answerRequest(caregiverId, false, reason), t('Upit je odbijen. {name} je obaveštena.', { name: family(client) }))}
        />
      );
      // opened from the request's drawer: the drawer stays under it
      dialog = kept.over ? (
        <>
          <RequestDrawer open={shown} client={client} onClose={close} onAccept={() => {}} onDecline={() => {}} />
          {decline}
        </>
      ) : (
        decline
      );
    }
    else if (kind === 'terms')
      dialog = <AgreementDialog open={shown} care={client.care} caregiverId={caregiverId} onClose={close} onSend={(opts) => done(sendTerms(caregiverId, opts), t('Ugovor je poslat. {name} ga prihvata ili odbija.', { name: family(client) }))} />;
    else if (kind === 'plan')
      dialog = <VisitPlanDialog open={shown} care={client.care} caregiverId={caregiverId} onClose={close} onSend={(opts) => done(planVisit(caregiverId, opts), t('Plan posete je poslat, a iznos je rezervisan na kartici porodice.'))} />;
    else if (kind === 'work-order' && visit)
      dialog = <WorkOrderDialog open={shown} care={client.care} visit={visit} onClose={close} onSend={(report) => done(sendWorkOrder(visit.id, report), t('Radni nalog je poslat. Naplaćuje se za 24 sata, osim ako porodica nešto prijavi.'))} />;
    else if (kind === 'call-off' && visit)
      dialog = <ReasonDialog open={shown} eyebrow={`${visit.date} · ${visit.time}`} title={t('Otkazati posetu?')} text={t('Rezervacija se vraća porodici i ništa se ne naplaćuje.')} reasons={CALL_OFF_REASONS} action={t('Otkaži posetu')} onClose={close} onConfirm={(r) => done(visitNotHappened(visit.id, r), t('Poseta je otkazana.'))} />;
    else if (kind === 'no-visit' && visit)
      dialog = <ReasonDialog open={shown} eyebrow={`${visit.date} · ${visit.time}`} title={t('Poseta se nije desila')} text={t('Rezervacija se vraća porodici i ništa se ne naplaćuje.')} reasons={NO_VISIT_REASONS} action={t('Potvrdi')} onClose={close} onConfirm={(r) => done(visitNotHappened(visit.id, r), t('Zabeleženo je da se poseta nije desila.'))} />;
    else if (kind === 'end')
      dialog = <ReasonDialog open={shown} eyebrow={client.care.elder.name} title={t('Završiti saradnju?')} text={t('Zakazane posete se otkazuju i rezervacije vraćaju. Obavljene posete ostaju u evidenciji. Poseta koja je u toku mora prvo da se završi.')} action={t('Završi saradnju')} back={t('Nastavi saradnju')} onClose={close} onConfirm={() => done(caregiverEnds(caregiverId), t('Saradnja je završena.'))} />;
  }
  return { act, dialog };
}

function DeclineDialog({ open, name, onClose, onConfirm }) {
  const [reason, setReason] = useState(DECLINE_REASONS[0]);
  return (
    <Dialog open={open} eyebrow={name} title={t('Odbiti upit?')} onClose={onClose}>
      <Part label={t('Zašto')}>
        <ToggleGroup type="single" size="sm" className="flex-wrap" value={reason} onValueChange={(v) => v && setReason(v)} aria-label={t('Zašto')}>
          {DECLINE_REASONS.map((x) => (
            <ToggleGroupItem key={x} value={x}>
              {t(x)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Part>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('Nazad')}
        </Button>
        {/* nothing is deleted: default, not destructive (§9) */}
        <Button onClick={() => onConfirm(reason)}>{t('Odbij upit')}</Button>
      </DialogFooter>
    </Dialog>
  );
}

// A new request, opened from its card on the board: who asks, why and what for,
// with the family's address and contact hidden until she says yes. Details are
// a drawer (docs/patterns.md §7), a bottom sheet on a phone; "Odbij" opens its
// reason over it, "Prihvati" closes it and moves the card on.
function RequestDrawer({ open, client, onClose, onAccept, onDecline }) {
  const { person, care, request: r } = client;
  const answers = person.answers || {};
  const age = answers['about-person']?.values?.age;
  const household = partRows(RECORD_PARTS.person, answers).rows.find((x) => x.key === 'household');
  return (
    <Modal
      eyebrow={t('Nov upit')}
      title={care.elder.name}
      wide
      open={open}
      onClose={onClose}
    >
      <SheetDescription>
        {[age && t('{n} godina', { n: age }), care.elder.area, t('upit {when}', { when: r.requested })].filter(Boolean).join(' · ')}
      </SheetDescription>
      {r.message && (
        <>
          <PaneLabel>{t('Zašto pitaju')}</PaneLabel>
          <SheetDescription className="text-foreground">{t(r.message)}</SheetDescription>
          <PaneHint>{care.family.name}</PaneHint>
        </>
      )}
      <PaneLabel>{t('Šta traže')}</PaneLabel>
      <DataList className="mt-2">
        {care.need?.services?.length > 0 && <DataRow label={t('Usluge')}>{care.need.services.map(serviceTitle).join(', ')}</DataRow>}
        {care.need?.schedule && <DataRow label={t('Kada')}>{scheduleText(care.need.schedule)}</DataRow>}
        {care.need?.hours && <DataRow label={t('Sati')}>{t('{hours} h nedeljno', { hours: care.need.hours })}</DataRow>}
        {household && household.value !== '-' && <DataRow label={t('Domaćinstvo')}>{household.value}</DataRow>}
        <DataRow label={t('Gde')}>{`********, ${care.elder.area}`}</DataRow>
        <DataRow label={t('Kontakt')}>{'********, ********@*****'}</DataRow>
      </DataList>
      <PaneHint>{t('Adresu i kontakt porodice vidite kad prihvatite upit.')}</PaneHint>
      <SheetFooter>
        <Button variant="secondary" onClick={onDecline}>
          {t('Odbij')}
        </Button>
        <Button onClick={onAccept}>{t('Prihvati')}</Button>
      </SheetFooter>
    </Modal>
  );
}
