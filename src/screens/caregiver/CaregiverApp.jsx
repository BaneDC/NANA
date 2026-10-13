import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { AppPane } from '@/components/page';
import CaregiverTopBar from '../../components/caregiver/CaregiverTopBar';
import Board from './Board';
import ClientPage from './ClientPage';
import {
  DEFAULT_RATE,
  clients as seedClients,
  paidThisMonth,
  servicesNamed,
  totalsFor,
} from '../../data/caregiverBoard';
import { msg, say } from '../../i18n';

// The caregiver's whole application: the board, one client, and the state both
// read from. It lives here rather than in the board because the client page
// changes the same records — an agreement sent from the client page has to move
// the card on the board, and the board's buttons have to show up in the
// client's activity.

export default function CaregiverApp({ user }) {
  const [clients, setClients] = useState(seedClients);
  const [paid] = useState(paidThisMonth);
  const [openId, setOpenId] = useState(null);

  const patch = (id, fn) =>
    setClients((cs) => cs.map((c) => (c.id === id ? { ...c, ...fn(c) } : c)));

  // Every action the caregiver takes leaves a line behind. The activity feed is
  // only worth having if it is written by the same code that does the thing.
  // The text is kept as its Serbian key and its values, and translated where it
  // is shown (ClientPage), so a line written before a language switch follows it.
  const logged = (client, kind, text, vars) => [
    ...(client.activity || []),
    { kind, when: msg('upravo'), text, vars },
  ];

  const actions = {
    onOpen: (id) => setOpenId(id),
    onSendWorkOrder: (id) => setOpenId(id),

    onAccept: (id) =>
      patch(id, (c) => ({
        stage: 'agreement',
        agreementSent: false,
        acceptedOn: msg('upravo'),
        activity: logged(c, 'accepted', msg('Prihvatili ste. Ugovor tek treba postaviti.')),
      })),

    onDecline: (id) => setClients((cs) => cs.filter((c) => c.id !== id)),

    onRemind: (id) =>
      patch(id, (c) => ({
        remindedOn: msg('upravo'),
        activity: logged(c, 'note', msg('Poslali ste podsetnik da se ugovor potpiše ({family}).'), { family: c.family }),
      })),

    // Marking a visit done is what creates the work order, and it takes the
    // plan with it: the report is filled in against what was meant to happen,
    // not against the agreement in general.
    onVisitDone: (id) =>
      patch(id, (c) => ({
        stage: 'work-order',
        sinceVisit: msg('upravo'),
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
          msg('Poseta obavljena - {date} · {time}, {hours} h. Treba poslati radni nalog.'),
          { date: { $t: c.plan.date }, time: c.plan.time, hours: c.plan.hours }
        ),
      })),
  };

  // The visit order, written before going. Editing an existing plan and making
  // the first one are the same thing from here.
  const planVisit = (id, plan) =>
    patch(id, (c) => {
      const hold = totalsFor(plan.hours, c.rate).charged;
      return {
        plan: { ...plan, sentOn: msg('upravo') },
        activity: logged(
          c,
          'visit-planned',
          msg('Plan posete poslat za {date} · {time}, {hours} h. Na kartici porodice rezervisano je {hold}.'),
          { date: { $t: plan.date }, time: plan.time, hours: plan.hours, hold: { $eur: hold } }
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
              note: report.note || msg('Bez napomena.'),
              status: 'awaiting',
              sentOn: msg('upravo'),
              confirmsInHours: 24,
            }
          : v
      ),
      activity: logged(
        c,
        'work-order',
        report.concern
          ? msg('Radni nalog poslat za posetu od {hours} h - {services}. {net} stiže vama kad se naplati za 24 sata, osim ako porodica nešto prijavi. Napomenuli ste: {concern}')
          : msg('Radni nalog poslat za posetu od {hours} h - {services}. {net} stiže vama kad se naplati za 24 sata, osim ako porodica nešto prijavi.'),
        {
          hours: report.hours,
          services: report.services.length ? servicesNamed(report.services) : say('ništa nije označeno'),
          net: { $eur: net },
          concern: report.concern,
        }
      ),
    }));
    setOpenId(null);
  };

  const sendAgreement = (id, { services, rate }) =>
    patch(id, (c) => ({
      agreementSent: true,
      sentOn: msg('upravo'),
      services,
      rate: rate || DEFAULT_RATE,
      activity: logged(
        c,
        'agreement-sent',
        msg('Ugovor poslat: {services} po {rate}/h. Čeka se potpis ({family}).'),
        { services: servicesNamed(services), rate: { $eur: rate || DEFAULT_RATE }, family: c.family }
      ),
    }));

  // A declined family is gone from the list, so an id can outlive its record.
  const open = clients.find((c) => c.id === openId);

  return (
    <AppPane>
      <CaregiverTopBar user={user} />
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
    </AppPane>
  );
}
