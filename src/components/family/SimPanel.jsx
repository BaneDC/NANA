import { Fragment, useState } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import {
  activeVersion,
  firstName,
  hourText,
  nameOf,
  pendingVersion,
  todayOf,
  dateText,
  unsettled,
} from '../../data/familyCare';
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

export default function SimPanel({ care, onCare, onFlash, onClose }) {
  const [reason, setReason] = useState(DECLINE_REASONS[0]);
  const run = (fn, said) => {
    onCare(fn);
    if (said) onFlash(said);
  };
  const now = care.now;
  const pending = care.requests.filter((r) => r.status === 'pending');
  const live = care.arrangements.filter((a) => !a.endedOn || canSendTerms(care, a.caregiver.id) || pendingVersion(a));

  return (
    <Modal eyebrow="Samo za demo · Ctrl+H" title="Simulacija" wide onClose={onClose}>
      <p className="ag-lead">
        Ono što bi uradile negovateljice i koordinatorka, ručno. Ništa se ne dešava samo od sebe.
      </p>

      <p className="ag-label">Vreme</p>
      <p className="doc-p">
        Sada je {dateText(todayOf(care))}, {hourText(now % 24)}.
      </p>
      <div className="wo-choice">
        <Button variant="secondary" onClick={() => run(passTime(1), 'Prošao je sat.')}>
          Prođe sat
        </Button>
        <Button variant="secondary" onClick={() => run(passTime(24), 'Prošao je dan.')}>
          Prođe dan
        </Button>
      </div>

      {pending.length > 0 && (
        <>
          <p className="ag-label">Upiti koji čekaju</p>
          <p className="ag-hint">Razlog ako odbije:</p>
          <div className="wo-choice">
            {DECLINE_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`svc is-sm${reason === r ? ' is-on' : ''}`}
                aria-pressed={reason === r}
                onClick={() => setReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
          {pending.map((r) => {
            const first = firstName(nameOf(care, r.caregiverId));
            return (
              <div key={r.id || r.caregiverId} className="wo-choice">
                <Button variant="secondary" onClick={() => run(answerRequest(r.caregiverId, true), `${first} je prihvatila upit.`)}>
                  {first}: prihvati
                </Button>
                <Button variant="secondary" onClick={() => run(answerRequest(r.caregiverId, false, reason), `${first} ne može da preuzme.`)}>
                  {first}: odbij
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
            <p className="ag-label">{a.caregiver.name}</p>
            <div className="wo-choice">
              {canSendTerms(care, id) && (
                <Button variant="secondary" onClick={() => run(sendTerms(id), `${first} je poslala ${act ? 'nove uslove' : 'ugovor o nezi'}.`)}>
                  {act ? 'Pošalji nove uslove' : a.versions.length ? 'Pošalji nove uslove' : 'Pošalji ugovor'}
                </Button>
              )}
              {pen && (
                <Button variant="secondary" onClick={() => run(withdrawTerms(id), `${first} je povukla predlog.`)}>
                  Povuci predlog
                </Button>
              )}
              {act && (
                <>
                  <Button variant="secondary" disabled={Boolean(noPlan)} onClick={() => run(planVisit(id), `${first} je poslala plan posete za sutra.`)}>
                    Plan posete za sutra
                  </Button>
                  <Button variant="secondary" disabled={Boolean(noPlan)} onClick={() => run(planVisit(id, true), `${first} dolazi za pola sata.`)}>
                    Plan posete za pola sata
                  </Button>
                </>
              )}
              {act && !a.endedOn && !unsettled(a).length && (
                <Button variant="secondary" onClick={() => run(caregiverEnds(id), `${first} je završila saradnju.`)}>
                  Završi saradnju
                </Button>
              )}
            </div>
            {act && noPlan && <p className="ag-hint">Plan posete ne može: {noPlan.toLowerCase()}</p>}

            {awaiting.map((v) => (
              <Fragment key={v.id}>
                <p className="ag-hint">Poseta {v.date.toLowerCase()} {v.time} je prošla, radni nalog:</p>
                <div className="wo-choice">
                  <Button variant="secondary" onClick={() => run(sendWorkOrder(v.id), `${first} je poslala radni nalog.`)}>
                    Kako je planirano
                  </Button>
                  <Button variant="secondary" onClick={() => run(sendWorkOrder(v.id, 'less'), `${first} je poslala radni nalog.`)}>
                    Sat manje
                  </Button>
                  <Button variant="secondary" onClick={() => run(sendWorkOrder(v.id, 'more'), `${first} je poslala radni nalog sa dodatnim satom.`)}>
                    Sat više
                  </Button>
                  <Button variant="secondary" onClick={() => run(visitNotHappened(v.id), 'Poseta se nije desila.')}>
                    Poseta se nije desila
                  </Button>
                </div>
              </Fragment>
            ))}

            {planned.map((v) => (
              <Fragment key={v.id}>
                <p className="ag-hint">Plan posete {v.date.toLowerCase()} {v.time}:</p>
                <div className="wo-choice">
                  <Button variant="secondary" onClick={() => run(visitNotHappened(v.id, 'Bila sam bolesna'), `${first} je otkazala posetu.`)}>
                    Negovateljica otkazuje
                  </Button>
                </div>
              </Fragment>
            ))}

            {disputed.map((v) => (
              <Fragment key={v.id}>
                <p className="ag-hint">Koordinatorka, prijava za {v.date.toLowerCase()}:</p>
                <div className="wo-choice">
                  {RESOLUTIONS[v.queriedFrom === 'planned' ? 'planned' : 'charging'].map((r) => (
                    <Button key={r.id} variant="secondary" onClick={() => run(resolveQuery(v.id, r.id), 'Prijava je rešena.')}>
                      {r.label}
                    </Button>
                  ))}
                </div>
              </Fragment>
            ))}
          </Fragment>
        );
      })}

      {!pending.length && !live.length && (
        <p className="ag-hint">Još nema ničega za simulaciju. Pošaljite upit nekoj negovateljici.</p>
      )}
    </Modal>
  );
}
