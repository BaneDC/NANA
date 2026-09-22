import { Check, Send, Star } from 'lucide-react';
import { caregivers } from '../data/carePlan';
import { allVisits, firstName, money, pendingVersion, services, waitingOnYou } from '../data/familyCare';
import PlanContents from './PlanContents';
import VisitRow from './family/VisitRow';
import Button from './Button';

// What opens beside the conversation when the family presses a card in the
// chat. The kit draws the pane and decides where it goes; these are what is in
// it — the same things the app's pages show, cut to the pane's width, so a
// question asked in the chat is answered without leaving it.
//
// Each has an id (`page:<kind>`) the assistant's answer carries as an artifact
// part; `paneFor` turns an open id into the pane's title and contents, and
// `previewFor` into the few lines the card in the answer shows.

const STATUS = { pending: 'Čeka odgovor', accepted: 'Prihvatila', declined: 'Ne može' };
const PILL = { pending: 'is-pending', accepted: 'is-accepted', declined: 'is-declined' };

function Empty({ children }) {
  return <p className="fam-sub is-flush">{children}</p>;
}

function RequestsPane({ care }) {
  if (!care.requests.length) return <Empty>Još niste pisali nijednoj negovateljici.</Empty>;
  return (
    <div className="fam-rows">
      {care.requests.map((r) => {
        const c = caregivers.find((x) => x.id === r.caregiverId);
        return (
          <div key={r.caregiverId} className="fam-row">
            <span className="cg-avatar">{c?.initials}</span>
            <div className="fam-row-main">
              <p className="fam-row-title">{c?.name}</p>
              <p className="fam-row-body">{r.detail}</p>
            </div>
            <span className={`status-pill ${PILL[r.status]}`}>{STATUS[r.status]}</span>
          </div>
        );
      })}
    </div>
  );
}

function CarePane({ care, onDrawer }) {
  const waiting = waitingOnYou(care);
  const coming = allVisits(care).filter((v) => v.status === 'planned');
  if (!waiting.length && !coming.length && !care.arrangements.length) {
    return <Empty>Još ništa nije dogovoreno. Kad negovateljica odgovori na poruku, ovde se vidi šta je sledeće.</Empty>;
  }
  return (
    <>
      {waiting.length > 0 && <p className="doc-section-title">Čeka na vas</p>}
      <div className="fam-rows">
        {waiting.map((w) =>
          w.kind === 'terms' ? (
            <div key={`t-${w.arrangement.caregiver.id}`} className="fam-row is-action">
              <span className="cg-avatar">{w.arrangement.caregiver.initials}</span>
              <div className="fam-row-main">
                <p className="fam-row-title">{firstName(w.arrangement.caregiver.name)} je poslala uslove</p>
                <p className="fam-row-body">
                  {services(w.version.services.length)} po {money(w.version.rate)} na sat
                </p>
              </div>
              <Button variant="primary" onClick={() => onDrawer({ kind: 'terms', caregiverId: w.arrangement.caregiver.id })}>
                Pogledaj
              </Button>
            </div>
          ) : (
            <div key={`w-${w.visit.id}`} className="fam-row is-action">
              <span className="cg-avatar">{w.visit.caregiver.initials}</span>
              <div className="fam-row-main">
                <p className="fam-row-title">Radni nalog za {w.visit.date}</p>
              </div>
              <Button variant="secondary" onClick={() => onDrawer({ kind: 'work-order', visitId: w.visit.id })}>
                Pogledaj
              </Button>
            </div>
          )
        )}
      </div>
      {coming.length > 0 && <p className="doc-section-title">Predstoji</p>}
      <div className="fam-rows">
        {coming.map((v) => (
          <VisitRow key={v.id} visit={v} showWho onDrawer={onDrawer} />
        ))}
      </div>
    </>
  );
}

function VisitsPane({ care, onDrawer }) {
  const visits = allVisits(care);
  if (!visits.length) return <Empty>Još nema nijedne posete.</Empty>;
  return (
    <div className="fam-rows">
      {visits.map((v) => (
        <VisitRow key={v.id} visit={v} showWho onDrawer={onDrawer} />
      ))}
    </div>
  );
}

function CaregiversPane({ care, onContact }) {
  const list = [...caregivers].sort((a, b) => b.match - a.match);
  return (
    <div className="fam-rows">
      {list.map((c) => {
        const asked = care.requests.some((r) => r.caregiverId === c.id);
        return (
          <div key={c.id} className="fam-row">
            <span className="cg-avatar">{c.initials}</span>
            <div className="fam-row-main">
              <p className="fam-row-title">{c.name}</p>
              <p className="fam-row-body">
                <Star size={11} strokeWidth={2} className="cg-star" /> {c.rating} · {c.rate} · {c.area}, {c.distance}
              </p>
            </div>
            {asked ? (
              <span className="status-pill is-accepted">
                <Check size={12} strokeWidth={2} />
                Poslato
              </span>
            ) : (
              <Button variant="primary" onClick={() => onContact(c)}>
                <Send size={14} strokeWidth={1.75} />
                Poruka
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SettingsPane({ care, unlocked, onUnlock }) {
  return (
    <div className="bc-lines ag-terms">
      <div className="bc-line">
        <span className="bc-line-label">Pretplata</span>
        <span>{unlocked ? 'Aktivna · 1.490 RSD mesečno' : 'Nije aktivna'}</span>
      </div>
      <div className="bc-line">
        <span className="bc-line-label">Kartica</span>
        <span>{care.payment.connected ? `${care.payment.brand} ···· ${care.payment.last4}` : 'Još nije dodata'}</span>
      </div>
      {!unlocked && (
        <div className="panel-card-actions">
          <Button variant="primary" onClick={onUnlock}>
            Pretplati se
          </Button>
        </div>
      )}
    </div>
  );
}

// The pane for an open id, or null for one this build does not know.
export function paneFor(openId, ctx) {
  const kind = String(openId).split(':')[1];
  const { plan, care, unlocked, planChange, onContact, onUnlock, onDrawer } = ctx;
  switch (kind) {
    case 'plan':
      return plan
        ? {
            title: `Plan nege · ${plan.name}`,
            meta: 'Aktivan',
            children: (
              <div className="nana-pane is-plan">
                <PlanContents plan={plan} unlocked={unlocked} onSelectCaregiver={onContact} onUnlock={onUnlock} change={planChange} />
              </div>
            ),
          }
        : null;
    case 'my-care':
      return { title: 'Moja nega', children: <div className="nana-pane"><CarePane care={care} onDrawer={onDrawer} /></div> };
    case 'requests':
      return { title: 'Vaši upiti', meta: `${care.requests.length}`, children: <div className="nana-pane"><RequestsPane care={care} /></div> };
    case 'visits':
      return { title: 'Posete', children: <div className="nana-pane"><VisitsPane care={care} onDrawer={onDrawer} /></div> };
    case 'find-caregiver':
      return { title: 'Negovateljice za vas', meta: `${caregivers.length}`, children: <div className="nana-pane"><CaregiversPane care={care} onContact={onContact} /></div> };
    case 'settings':
      return { title: 'Pretplata i plaćanje', children: <div className="nana-pane"><SettingsPane care={care} unlocked={unlocked} onUnlock={onUnlock} /></div> };
    default:
      return null;
  }
}

// What the card in the answer shows before it is opened: a few plain lines.
export function previewFor(kind, { plan, care }) {
  switch (kind) {
    case 'plan':
      return { title: `Plan nege · ${plan?.name || ''}`, meta: 'Aktivan', content: (plan?.recommendations || []).map((r) => r.title).join('\n') };
    case 'my-care': {
      const waiting = waitingOnYou(care);
      const coming = allVisits(care).filter((v) => v.status === 'planned');
      return {
        title: 'Moja nega',
        content: [
          waiting.length ? `Čeka na vas: ${waiting.length}` : 'Ništa ne čeka na vas',
          ...coming.map((v) => `${v.date} · ${v.time} · ${v.caregiver.name}`),
          ...care.arrangements.filter((a) => pendingVersion(a)).map((a) => `${a.caregiver.name} je poslala uslove`),
        ].join('\n'),
      };
    }
    case 'requests':
      return {
        title: 'Vaši upiti',
        meta: `${care.requests.length}`,
        content: care.requests.length
          ? care.requests.map((r) => `${caregivers.find((c) => c.id === r.caregiverId)?.name} · ${STATUS[r.status]}`).join('\n')
          : 'Još nijedan upit',
      };
    case 'visits': {
      const visits = allVisits(care);
      return { title: 'Posete', content: visits.length ? visits.map((v) => `${v.date} · ${v.caregiver.name}`).join('\n') : 'Još nema poseta' };
    }
    case 'find-caregiver':
      return {
        title: 'Negovateljice za vas',
        meta: `${caregivers.length}`,
        content: [...caregivers].sort((a, b) => b.match - a.match).map((c) => `${c.name} · ${c.match}% · ${c.rate}`).join('\n'),
      };
    case 'settings':
      return { title: 'Pretplata i plaćanje', content: care.payment.connected ? 'Kartica je sačuvana' : 'Kartica još nije dodata' };
    default:
      return null;
  }
}
