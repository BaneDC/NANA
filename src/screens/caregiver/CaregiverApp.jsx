import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import CaregiverTopBar from '../../components/caregiver/CaregiverTopBar';
import Board from './Board';
import ClientPage from './ClientPage';
import {
  DEFAULT_RATE,
  clients as seedClients,
  money,
  paidThisMonth,
  serviceShort,
  serviceTitle,
  totalsFor,
} from '../../data/caregiverBoard';

// The caregiver's whole application: the board, one client, and the state both
// read from. It lives here rather than in the board because the client page
// changes the same records — an agreement sent from the client page has to move
// the card on the board, and the board's buttons have to show up in the
// client's activity.

export default function CaregiverApp({ user, onRestart }) {
  const [clients, setClients] = useState(seedClients);
  const [paid] = useState(paidThisMonth);
  const [openId, setOpenId] = useState(null);

  const patch = (id, fn) =>
    setClients((cs) => cs.map((c) => (c.id === id ? { ...c, ...fn(c) } : c)));

  // Every action the caregiver takes leaves a line behind. The activity feed is
  // only worth having if it is written by the same code that does the thing.
  const logged = (client, kind, text) => [...(client.activity || []), { kind, when: 'just now', text }];

  const actions = {
    onOpen: (id) => setOpenId(id),
    onSendWorkOrder: (id) => setOpenId(id),

    onAccept: (id) =>
      patch(id, (c) => ({
        stage: 'agreement',
        agreementSent: false,
        acceptedOn: 'just now',
        activity: logged(c, 'accepted', 'You accepted. The agreement is still to be set.'),
      })),

    onDecline: (id) => setClients((cs) => cs.filter((c) => c.id !== id)),

    onRemind: (id) =>
      patch(id, (c) => ({
        remindedOn: 'just now',
        activity: logged(c, 'note', `You sent ${c.family} a reminder to sign the agreement.`),
      })),

    // Marking a visit done is what creates the work order, and it takes the
    // plan with it: the report is filled in against what was meant to happen,
    // not against the agreement in general.
    onVisitDone: (id) =>
      patch(id, (c) => ({
        stage: 'work-order',
        sinceVisit: 'just now',
        plan: null,
        visits: [
          {
            date: c.plan.date,
            time: c.plan.time,
            hours: c.plan.hours,
            planned: c.plan.services,
            planNotes: c.plan.notes,
            status: 'due',
          },
          ...(c.visits || []),
        ],
        activity: logged(
          c,
          'visit',
          `Visit done — ${c.plan.date} · ${c.plan.time}, ${c.plan.hours} h. The work order is due.`
        ),
      })),
  };

  // The visit order, written before going. Editing an existing plan and making
  // the first one are the same thing from here.
  const planVisit = (id, plan) =>
    patch(id, (c) => {
      const hold = totalsFor(plan.hours, c.rate).charged;
      return {
        plan: { ...plan, sentOn: 'just now' },
        activity: logged(
          c,
          'visit-planned',
          `Visit order sent for ${plan.date} · ${plan.time}, ${plan.hours} h. ${money(hold)} held from ${c.family}'s card.`
        ),
      };
    });

  // Sending it settles the visit and pays for it. The report is written onto
  // the visit rather than kept beside it, because the hours that were charged
  // and the account of what happened are the same record.
  const sendWorkOrder = (id, report) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    const net = totalsFor(report.hours, client.rate).net;
    patch(id, (c) => ({
      stage: 'active',
      sinceVisit: null,
      visits: (c.visits || []).map((v) =>
        v.status === 'due'
          ? {
              ...v,
              ...report,
              note: report.note || 'No notes.',
              status: 'awaiting',
              sentOn: 'just now',
              confirmsInHours: 24,
            }
          : v
      ),
      activity: logged(
        c,
        'work-order',
        `Work order sent for the ${report.hours} h visit — ${report.services.map(serviceShort).join(', ').toLowerCase() || 'nothing ticked'}. ${money(net)} to you when it charges in 24 hours, unless ${c.family} raises something.` +
          (report.concern ? ` You flagged: ${report.concern}` : '')
      ),
    }));
    setOpenId(null);
  };

  const sendAgreement = (id, { services, rate }) =>
    patch(id, (c) => ({
      agreementSent: true,
      sentOn: 'just now',
      services,
      rate: rate || DEFAULT_RATE,
      activity: logged(
        c,
        'agreement-sent',
        `Agreement sent: ${services.map(serviceTitle).join(', ').toLowerCase()} at ${money(rate)}/h. Waiting for ${c.family} to sign.`
      ),
    }));

  // A declined family is gone from the list, so an id can outlive its record.
  const open = clients.find((c) => c.id === openId);

  return (
    <div className="chat-container">
      <CaregiverTopBar user={user} onRestart={onRestart} />
      <AnimatePresence mode="wait">
        {open ? (
          <ClientPage
            key={open.id}
            client={open}
            onBack={() => setOpenId(null)}
            onSendAgreement={sendAgreement}
            onRemind={actions.onRemind}
            onPlanVisit={planVisit}
            onVisitDone={actions.onVisitDone}
            onSendWorkOrder={sendWorkOrder}
          />
        ) : (
          <Board key="board" user={user} clients={clients} paid={paid} actions={actions} />
        )}
      </AnimatePresence>
    </div>
  );
}
