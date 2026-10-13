import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SheetDescription } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaneHint, PaneLabel } from '@/components/pane';
import Modal from '../Modal';
import {
  activeVersion,
  firstName,
  hourText,
  nameOf,
  pendingVersion,
  todayOf,
  dateText,
  unsettled,
  lowerDate,
} from '../../data/familyCare';
import { msg, t } from '@/i18n';
import {
  DECLINE_REASONS,
  RESOLUTIONS,
  answerRequest,
  canSendTerms,
  cannotPlan,
  caregiverEnds,
  passTime,
  planVisit,
  resolveQuery,
  sendTerms,
  sendWorkOrder,
  visitNotHappened,
  withdrawTerms,
} from '../../data/sim';

// The other side, by hand. This build has only the family's app, so whatever a
// caregiver or the coordinator would do is a button here: answer a request,
// send terms, plan a visit, send a work order, settle a query, and let time
// pass. Hidden: Ctrl+H opens it, and nothing in it runs on its own.

export default function SimPanel({ open = true, care, onCare, onFlash, onFill, onClose }) {
  const [reason, setReason] = useState(DECLINE_REASONS[0]);
  const run = (fn, said) => {
    onCare(fn);
    if (said) onFlash(said);
  };
  const now = care.now;
  const pending = care.requests.filter((r) => r.status === 'pending');
  const live = care.arrangements.filter((a) => !a.endedOn || canSendTerms(care, a.caregiver.id) || pendingVersion(a));

  return (
    <Modal eyebrow={t('Samo za demo · Ctrl+H')} title={t('Simulacija')} wide open={open} onClose={onClose}>
      <SheetDescription>
        {t('Ono što bi uradile negovateljice i koordinatorka, ručno. Ništa se ne dešava samo od sebe.')}
      </SheetDescription>

      {/* the whole example at once, for when clicking through it is not the point */}
      {onFill && (
        <>
          <PaneLabel>{t('Primer')}</PaneLabel>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onFill}>
              {t('Popuni primer nege')}
            </Button>
          </div>
          <PaneHint>
            {t('Nedelju dana nege u jednom kliku: dve negovateljice, plaćene posete, radni nalog i plan posete koji čekaju na vas. Briše ono što je do sada kliknuto. Isto otvara i adresa /?demo&puno.')}
          </PaneHint>
        </>
      )}

      <PaneLabel>{t('Vreme')}</PaneLabel>
      <SheetDescription>
        {t('Sada je {date}, {time}.', { date: dateText(todayOf(care)), time: hourText(now % 24) })}
      </SheetDescription>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => run(passTime(1), t('Prošao je sat.'))}>
          {t('Prođe sat')}
        </Button>
        <Button variant="secondary" onClick={() => run(passTime(24), t('Prošao je dan.'))}>
          {t('Prođe dan')}
        </Button>
      </div>

      {pending.length > 0 && (
        <>
          <PaneLabel>{t('Upiti koji čekaju')}</PaneLabel>
          <PaneHint>{t('Razlog ako odbije:')}</PaneHint>
          <ToggleGroup type="single" size="sm" value={reason} onValueChange={(v) => v && setReason(v)} aria-label={t('Razlog ako odbije')}>
            {DECLINE_REASONS.map((r) => (
              <ToggleGroupItem key={r} value={r}>
                {t(r)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {pending.map((r) => {
            const first = firstName(nameOf(care, r.caregiverId));
            return (
              <div key={r.id || r.caregiverId} className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => run(answerRequest(r.caregiverId, true), t('{name} je prihvatila upit.', { name: first }))}>
                  {t('{name}: prihvati', { name: first })}
                </Button>
                <Button variant="secondary" onClick={() => run(answerRequest(r.caregiverId, false, reason), t('{name} ne može da preuzme.', { name: first }))}>
                  {t('{name}: odbij', { name: first })}
                </Button>
              </div>
            );
          })}
        </>
      )}

      {live.map((a) => {
        const id = a.caregiver.id;
        const first = firstName(a.caregiver.name);
        const act = activeVersion(a);
        const pen = pendingVersion(a);
        const noPlan = cannotPlan(care, id);
        const awaiting = a.visits.filter((v) => v.status === 'awaiting');
        const planned = a.visits.filter((v) => v.status === 'planned');
        const disputed = a.visits.filter((v) => v.status === 'disputed');
        return (
          <Fragment key={id}>
            <PaneLabel>{a.caregiver.name}</PaneLabel>
            <div className="flex flex-wrap gap-2">
              {canSendTerms(care, id) && (
                <Button variant="secondary" onClick={() => run(sendTerms(id), act ? t('{name} je poslala nove uslove.', { name: first }) : t('{name} je poslala ugovor o nezi.', { name: first }))}>
                  {act || a.versions.length ? t('Pošalji nove uslove') : t('Pošalji ugovor')}
                </Button>
              )}
              {pen && (
                <Button variant="secondary" onClick={() => run(withdrawTerms(id), t('{name} je povukla predlog.', { name: first }))}>
                  {t('Povuci predlog')}
                </Button>
              )}
              {act && (
                <>
                  <Button variant="secondary" disabled={Boolean(noPlan)} onClick={() => run(planVisit(id), t('{name} je poslala plan posete za sutra.', { name: first }))}>
                    {t('Plan posete za sutra')}
                  </Button>
                  <Button variant="secondary" disabled={Boolean(noPlan)} onClick={() => run(planVisit(id, true), t('{name} dolazi za pola sata.', { name: first }))}>
                    {t('Plan posete za pola sata')}
                  </Button>
                </>
              )}
              {act && !a.endedOn && !unsettled(a).length && (
                <Button variant="secondary" onClick={() => run(caregiverEnds(id), t('{name} je završila saradnju.', { name: first }))}>
                  {t('Završi saradnju')}
                </Button>
              )}
            </div>
            {act && noPlan && <PaneHint>{t('Plan posete ne može: {reason}', { reason: noPlan.toLowerCase() })}</PaneHint>}

            {awaiting.map((v) => (
              <Fragment key={v.id}>
                <PaneHint>{t('Poseta {date} {time} je prošla, radni nalog:', { date: lowerDate(v.date), time: v.time })}</PaneHint>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => run(sendWorkOrder(v.id), t('{name} je poslala radni nalog.', { name: first }))}>
                    {t('Kako je planirano')}
                  </Button>
                  <Button variant="secondary" onClick={() => run(sendWorkOrder(v.id, 'less'), t('{name} je poslala radni nalog.', { name: first }))}>
                    {t('Sat manje')}
                  </Button>
                  <Button variant="secondary" onClick={() => run(sendWorkOrder(v.id, 'more'), t('{name} je poslala radni nalog sa dodatnim satom.', { name: first }))}>
                    {t('Sat više')}
                  </Button>
                  <Button variant="secondary" onClick={() => run(visitNotHappened(v.id), t('Poseta se nije desila.'))}>
                    {t('Poseta se nije desila')}
                  </Button>
                </div>
              </Fragment>
            ))}

            {planned.map((v) => (
              <Fragment key={v.id}>
                <PaneHint>{t('Plan posete {date} {time}:', { date: lowerDate(v.date), time: v.time })}</PaneHint>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => run(visitNotHappened(v.id, msg('Bila sam bolesna')), t('{name} je otkazala posetu.', { name: first }))}>
                    {t('Negovateljica otkazuje')}
                  </Button>
                </div>
              </Fragment>
            ))}

            {disputed.map((v) => (
              <Fragment key={v.id}>
                <PaneHint>{t('Koordinatorka, prijava za {date}:', { date: lowerDate(v.date) })}</PaneHint>
                <div className="flex flex-wrap gap-2">
                  {RESOLUTIONS[v.queriedFrom === 'planned' ? 'planned' : 'charging'].map((r) => (
                    <Button key={r.id} variant="secondary" onClick={() => run(resolveQuery(v.id, r.id), t('Prijava je rešena.'))}>
                      {t(r.label)}
                    </Button>
                  ))}
                </div>
              </Fragment>
            ))}
          </Fragment>
        );
      })}

      {!pending.length && !live.length && (
        <PaneHint>{t('Još nema ničega za simulaciju. Pošaljite upit nekoj negovateljici.')}</PaneHint>
      )}
    </Modal>
  );
}
