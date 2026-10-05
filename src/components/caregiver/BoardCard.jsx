import { forwardRef } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CalendarPlus, Check, CheckCheck, Clock, FileText, Send, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataList, DataRow } from '@/components/data-list';
import { Total } from '@/components/pane';
import { statusVariant } from '../Standing';
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
    <Badge variant={statusVariant(`is-${tone}`)}>
      {Icon && <Icon size={12} strokeWidth={2} />}
      {children}
    </Badge>
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
  return <DataRow label={label}>{value}</DataRow>;
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
      // r16 with 12 inside, so the avatar in its corner is r4 (16 = 4 + 12)
      className="flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-card"
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
      <div className="mb-3 flex items-start gap-3 [--avatar:calc(var(--text-sm-leading)+16px)]">
        <Avatar className="rounded-sm">
          <AvatarFallback>{client.initials}</AvatarFallback>
        </Avatar>
        {/* The age sits with the place, not with the name: on the same line as
            the name it left long names wrapping around a two-character number
            and the status pill pushed off on its own. */}
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="block w-full cursor-pointer text-left text-sm font-medium text-foreground hover:text-primary-600"
            onClick={act(onOpen)}
          >
            {client.elder}
          </button>
          <p className="text-[11px] leading-4 text-disabled">
            {client.age} · {client.area} · {client.distance}
          </p>
        </div>
        <Status client={client} />
      </div>

      {client.stage === 'request' && (
        <>
          <p className="text-xs text-primary-600">
            Krhkost {client.frailty} · {frailtyLabel(client.frailty)}
          </p>
          <div className="flex flex-wrap gap-2">
            {client.needs.map((n) => (
              <Chip key={n}>{serviceShort(n)}</Chip>
            ))}
          </div>
          <DataList>
            <Line label="Sati" value={`${client.hours} h nedeljno`} />
            <Line label="Kada" value={client.schedule} />
            <Line label="Početak" value={client.startsOn} />
            <Line label="Pitao/la" value={`${client.family} · ${client.relation}`} />
          </DataList>
        </>
      )}

      {client.stage === 'agreement' && !client.agreementSent && (
        <>
          <p className="text-xs leading-body text-muted-foreground">
            Prihvaćeno {client.acceptedOn}. Postavite usluge i cenu po satu - svaka poseta, radni nalog
            i uplata posle ovoga računaju se iz toga.
          </p>
          <div className="flex flex-wrap gap-2">
            {client.needs.map((n) => (
              <Chip key={n}>{serviceShort(n)}</Chip>
            ))}
          </div>
          <DataList>
            <Line label="Sati" value={`${client.hours} h nedeljno`} />
            <Line label="Kada" value={client.schedule} />
          </DataList>
        </>
      )}

      {client.stage === 'agreement' && client.agreementSent && (
        <>
          <p className="text-xs leading-body text-muted-foreground">
            Poslato {client.sentOn}. Ništa ne može da se zakaže dok porodica ne potpiše.
            {client.remindedOn && ` Podsetnik poslat ${client.remindedOn}.`}
          </p>
          <DataList>
            <Line label="Cena" value={`${money(client.rate)}/h`} />
            <Line label="Sati" value={`${client.hours} h nedeljno`} />
          </DataList>
        </>
      )}

      {client.stage === 'active' && (
        <DataList>
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
        </DataList>
      )}

      {client.stage === 'work-order' && due && (
        <>
          <DataList>
            <Line label="Poseta" value={`${due.date} · ${due.time}`} />
            <Line label="Radila" value={`${due.hours} h po ${money(client.rate)}/h`} />
            <Line label="Završeno" value={client.sinceVisit} />
          </DataList>
          <Total>
            <Line label="Naplaćeno" value={money(totals.charged)} />
            <Line label="Provizija (10%)" value={`−${money(totals.fee)}`} />
            <DataRow total label="Vi dobijate">
              {money(totals.net)}
            </DataRow>
          </Total>
        </>
      )}

      <div className="flex gap-2 *:flex-1">
        {client.stage === 'request' && (
          <>
            <Button variant="secondary" onClick={act(onDecline)}>
              <X size={14} strokeWidth={2} />
              Odbij
            </Button>
            <Button onClick={act(onAccept)}>
              <Check size={14} strokeWidth={2} />
              Prihvati
            </Button>
          </>
        )}

        {client.stage === 'agreement' && !client.agreementSent && (
          <Button onClick={act(onOpen)}>
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
          <Button onClick={act(onOpen)}>
            <FileText size={14} strokeWidth={1.75} />
            Popuni radni nalog
          </Button>
        )}
      </div>
    </motion.article>
  );
});

export default BoardCard;
