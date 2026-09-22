import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CalendarPlus, Check, CheckCheck, Clock, FileText, Send, X } from 'lucide-react';
import Button from '../Button';
import Chip from '../Chip';
import {
  awaitingFor,
  dueVisit,
  frailtyLabel,
  heldFor,
  money,
  serviceShort,
  workOrderTotals,
} from '../../data/caregiverBoard';

// One family, on the caregiver's board. The card is the same object in every
// column — same person, same header — and only the middle and the buttons
// change, because what changes between columns is not who they are but what is
// owed to them next.

function Pill({ tone, icon: Icon, children }) {
  return (
    <span className={`status-pill is-${tone}`}>
      {Icon && <Icon size={12} strokeWidth={2} />}
      {children}
    </span>
  );
}

// The request that has been sitting longest is the one that reads as being
// ignored, so waiting is stated in the units it hurts in.
function waitedFor(client) {
  if (client.waitingDays) return `Čeka ${client.waitingDays} d`;
  return `Pre ${client.waitingHours} h`;
}

function Status({ client }) {
  if (client.stage === 'request') {
    const stale = Boolean(client.waitingDays);
    return (
      <Pill tone={stale ? 'pending' : 'muted'} icon={Clock}>
        {waitedFor(client)}
      </Pill>
    );
  }
  if (client.stage === 'agreement') {
    return client.agreementSent ? (
      <Pill tone="pending" icon={Clock}>
        Čeka potpis
      </Pill>
    ) : (
      <Pill tone="accepted" icon={Check}>
        Prihvaćeno
      </Pill>
    );
  }
  if (client.stage === 'active') {
    return <Pill tone="muted">Od {client.since}</Pill>;
  }
  // An unsent work order has no clock of its own. It is money she has done the
  // work for and not yet asked for — the 24 hours belong to the family, and
  // only start once it is sent.
  return (
    <Pill tone="pending" icon={AlertTriangle}>
      Nije poslato
    </Pill>
  );
}

function Line({ label, value }) {
  return (
    <p className="bc-line">
      <span className="bc-line-label">{label}</span>
      <span className="bc-line-value">{value}</span>
    </p>
  );
}

// The ref is not decoration: the board's columns animate with `popLayout`, which
// measures a leaving card so the ones under it can close the gap smoothly, and
// it can only measure a child that hands back a DOM node.
const BoardCard = forwardRef(function BoardCard(
  { client, onOpen, onAccept, onDecline, onRemind, onVisitDone },
  ref
) {
  const due = client.stage === 'work-order' ? dueVisit(client) : null;
  const totals = due ? workOrderTotals(client) : null;

  // The whole card opens the client. Every button inside it stops there, so a
  // decline is never also a navigation.
  const act = (fn) => (e) => {
    e.stopPropagation();
    fn(client.id);
  };

  return (
    <motion.article
      ref={ref}
      layout
      className="bc"
      // Clicking anywhere opens the client, which is convenient with a mouse
      // and nothing more: the card is not announced as a button, because a
      // button holding Accept and Decline inside it is a lie to anything
      // reading the page aloud. The name below is the real control.
      onClick={() => onOpen(client.id)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
    >
      <div className="bc-head">
        <span className="cg-avatar">{client.initials}</span>
        {/* The age sits with the place, not with the name: on the same line as
            the name it left long names wrapping around a two-character number
            and the status pill pushed off on its own. */}
        <div className="bc-id">
          <button type="button" className="bc-name" onClick={act(onOpen)}>
            {client.elder}
          </button>
          <p className="bc-meta">
            {client.age} · {client.area} · {client.distance}
          </p>
        </div>
        <Status client={client} />
      </div>

      {client.stage === 'request' && (
        <>
          <p className="bc-frailty">
            Krhkost {client.frailty} · {frailtyLabel(client.frailty)}
          </p>
          <div className="bc-chips">
            {client.needs.map((n) => (
              <Chip key={n}>{serviceShort(n)}</Chip>
            ))}
          </div>
          <div className="bc-lines">
            <Line label="Sati" value={`${client.hours} h nedeljno`} />
            <Line label="Kada" value={client.schedule} />
            <Line label="Početak" value={client.startsOn} />
            <Line label="Pitao/la" value={`${client.family} · ${client.relation}`} />
          </div>
        </>
      )}

      {client.stage === 'agreement' && !client.agreementSent && (
        <>
          <p className="bc-note">
            Prihvaćeno {client.acceptedOn}. Postavite usluge i cenu po satu — svaka poseta, radni nalog
            i uplata posle ovoga računaju se iz toga.
          </p>
          <div className="bc-chips">
            {client.needs.map((n) => (
              <Chip key={n}>{serviceShort(n)}</Chip>
            ))}
          </div>
          <div className="bc-lines">
            <Line label="Sati" value={`${client.hours} h nedeljno`} />
            <Line label="Kada" value={client.schedule} />
          </div>
        </>
      )}

      {client.stage === 'agreement' && client.agreementSent && (
        <>
          <p className="bc-note">
            Poslato {client.sentOn}. Ništa ne može da se zakaže dok porodica ne potpiše.
            {client.remindedOn && ` Podsetnik poslat ${client.remindedOn}.`}
          </p>
          <div className="bc-lines">
            <Line label="Cena" value={`${money(client.rate)}/h`} />
            <Line label="Sati" value={`${client.hours} h nedeljno`} />
          </div>
        </>
      )}

      {client.stage === 'active' && (
        <div className="bc-lines">
          <Line
            label="Sledeća poseta"
            value={
              client.plan ? `${client.plan.date} · ${client.plan.time}` : 'Još ništa nije planirano'
            }
          />
          {client.plan ? (
            <Line label="Rezervisano" value={`${money(heldFor(client))} · poslato ${client.plan.sentOn}`} />
          ) : (
            <Line label="Cena" value={`${money(client.rate)}/h`} />
          )}
          {awaitingFor(client) > 0 ? (
            <Line label="U obradi" value={`${money(awaitingFor(client))} · u roku od 24 h`} />
          ) : (
            <Line label="Dogovoreno" value={`${client.hours} h nedeljno`} />
          )}
        </div>
      )}

      {client.stage === 'work-order' && due && (
        <>
          <div className="bc-lines">
            <Line label="Poseta" value={`${due.date} · ${due.time}`} />
            <Line label="Radila" value={`${due.hours} h po ${money(client.rate)}/h`} />
            <Line label="Završeno" value={client.sinceVisit} />
          </div>
          <div className="bc-total">
            <Line label="Naplaćeno" value={money(totals.charged)} />
            <Line label="Provizija (10%)" value={`−${money(totals.fee)}`} />
            <p className="bc-line is-net">
              <span className="bc-line-label">Vi dobijate</span>
              <span className="bc-line-value">{money(totals.net)}</span>
            </p>
          </div>
        </>
      )}

      <div className="bc-actions">
        {client.stage === 'request' && (
          <>
            <Button variant="secondary" onClick={act(onDecline)}>
              <X size={14} strokeWidth={2} />
              Odbij
            </Button>
            <Button variant="primary" onClick={act(onAccept)}>
              <Check size={14} strokeWidth={2} />
              Prihvati
            </Button>
          </>
        )}

        {client.stage === 'agreement' && !client.agreementSent && (
          <Button variant="primary" onClick={act(onOpen)}>
            <FileText size={14} strokeWidth={1.75} />
            Postavi ugovor
          </Button>
        )}

        {client.stage === 'agreement' && client.agreementSent && (
          <Button variant="secondary" onClick={act(onRemind)}>
            <Send size={14} strokeWidth={1.75} />
            Pošalji podsetnik
          </Button>
        )}

        {/* Two steps, because they happen on different days: the plan is
            written before going, and the visit is marked done on the way out.
            Marking it done is what creates the work order. */}
        {client.stage === 'active' && !client.plan && (
          <Button variant="secondary" onClick={act(onOpen)}>
            <CalendarPlus size={14} strokeWidth={1.75} />
            Isplaniraj posetu
          </Button>
        )}

        {client.stage === 'active' && client.plan && (
          <Button variant="secondary" onClick={act(onVisitDone)}>
            <CheckCheck size={14} strokeWidth={1.75} />
            Poseta obavljena
          </Button>
        )}

        {/* The work order is a report, not a button: hours, how the person
            was, what actually got done. It is filled in on the client's page,
            which is where the agreement it prices against lives. */}
        {client.stage === 'work-order' && (
          <Button variant="primary" onClick={act(onOpen)}>
            <FileText size={14} strokeWidth={1.75} />
            Popuni radni nalog
          </Button>
        )}
      </div>
    </motion.article>
  );
});

export default BoardCard;
