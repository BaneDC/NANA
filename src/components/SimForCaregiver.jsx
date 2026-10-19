import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { PaneHint, PaneLabel } from '@/components/pane';
import {
  agreeTerms,
  allVisits,
  answerExtra,
  confirmVisit,
  arrangementOf,
  askCaregiver,
  callOffVisit,
  canAsk,
  declineTerms,
  latestRequest,
  linkCard,
  lowerDate,
  pendingVersion,
  queryVisit,
  withdrawRequest,
} from '../data/familyCare';
import { RESOLUTIONS, resolveQuery } from '../data/sim';
import { requestSaid } from '../data/familyStart';
import { market } from '../data/market';
import { msg, t } from '@/i18n';

// The simulation from her side: what the family and the coordinator would do,
// for the one caregiver signed in. The same functions the family's own screens
// call (familyCare.js), so a step here is the step the family's tab would take.
// In Serbia only the request goes through the platform.
export default function SimForCaregiver({ care, caregiverId, onCare, onFlash }) {
  const run = (fn, said) => {
    onCare(fn);
    if (said) onFlash(said);
  };
  const r = latestRequest(care, caregiverId);
  const rs = market() === 'RS';
  const a = arrangementOf(care, caregiverId);
  const pending = a && pendingVersion(a);
  const visits = allVisits(care).filter((v) => v.caregiver.id === caregiverId);
  const planned = visits.filter((v) => v.status === 'planned');
  const charging = visits.filter((v) => v.status === 'charging');
  const disputed = visits.filter((v) => v.status === 'disputed');

  return (
    <>
      <PaneLabel>{t('Porodica')}</PaneLabel>
      <div className="flex flex-wrap gap-2">
        {r?.status === 'pending' ? (
          <Button variant="secondary" onClick={() => run(withdrawRequest(caregiverId), t('Porodica je otkazala upit.'))}>
            {t('Otkaži upit')}
          </Button>
        ) : canAsk(care, caregiverId) ? (
          <Button variant="secondary" onClick={() => run(askCaregiver(caregiverId, requestSaid(care)), t('Stigao je upit.'))}>
            {t('Pošalji upit')}
          </Button>
        ) : null}
        {!rs && pending && (
          <>
            <Button variant="secondary" onClick={() => run(agreeTerms(caregiverId), t('Porodica je prihvatila uslove.'))}>
              {t('Prihvati uslove')}
            </Button>
            <Button variant="secondary" onClick={() => run(declineTerms(caregiverId), t('Porodica je odbila uslove.'))}>
              {t('Odbij uslove')}
            </Button>
          </>
        )}
        {!rs && a && !care.payment.connected && (
          <Button variant="secondary" onClick={() => run(linkCard, t('Porodica je dodala karticu.'))}>
            {t('Dodaj karticu')}
          </Button>
        )}
      </div>
      {/* why the family cannot write to her again, instead of a button that
          would do nothing (docs/patterns.md §12a) */}
      {r?.status !== 'pending' && !canAsk(care, caregiverId) && (
        <PaneHint>{rs ? t('Porodica je već u kontaktu sa vama.') : t('Saradnja traje, pa porodica ne šalje nov upit.')}</PaneHint>
      )}

      {!rs &&
        planned.map((v) => (
          <Fragment key={v.id}>
            <PaneHint>{t('Plan posete {date} {time}:', { date: lowerDate(v.date), time: v.time })}</PaneHint>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => run(callOffVisit(v.id, msg('Nije nam potrebna')), t('Porodica je otkazala posetu.'))}>
                {t('Porodica otkazuje')}
              </Button>
              <Button variant="secondary" onClick={() => run(queryVisit(v.id, msg('Nešto drugo')), t('Porodica je prijavila da nešto nije u redu.'))}>
                {t('Nešto nije u redu')}
              </Button>
            </div>
          </Fragment>
        ))}

      {!rs &&
        charging.map((v) => (
          <Fragment key={v.id}>
            <PaneHint>{t('Radni nalog za {date}:', { date: lowerDate(v.date) })}</PaneHint>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => run(confirmVisit(v.id), t('Porodica je potvrdila radni nalog. Naplaćeno je.'))}>
                {t('Porodica potvrdi')}
              </Button>
              {v.extra?.status === 'asked' && (
                <>
                  <Button variant="secondary" onClick={() => run(answerExtra(v.id, true), t('Porodica je odobrila dodatni sat.'))}>
                    {t('Odobri dodatni sat')}
                  </Button>
                  <Button variant="secondary" onClick={() => run(answerExtra(v.id, false), t('Porodica je odbila dodatni sat.'))}>
                    {t('Odbij dodatni sat')}
                  </Button>
                </>
              )}
              <Button variant="secondary" onClick={() => run(queryVisit(v.id, msg('Sati nisu tačni')), t('Porodica je prijavila da nešto nije u redu.'))}>
                {t('Nešto nije u redu')}
              </Button>
            </div>
          </Fragment>
        ))}

      {!rs && disputed.length > 0 && <PaneLabel>{t('Koordinatorka')}</PaneLabel>}
      {!rs &&
        disputed.map((v) => (
          <Fragment key={v.id}>
            <PaneHint>{t('Prijava za {date}:', { date: lowerDate(v.date) })}</PaneHint>
            <div className="flex flex-wrap gap-2">
              {RESOLUTIONS[v.queriedFrom === 'planned' ? 'planned' : 'charging'].map((x) => (
                <Button key={x.id} variant="secondary" onClick={() => run(resolveQuery(v.id, x.id), t('Prijava je rešena.'))}>
                  {t(x.label)}
                </Button>
              ))}
            </div>
          </Fragment>
        ))}
    </>
  );
}
