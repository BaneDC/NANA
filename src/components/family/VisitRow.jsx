import { ChevronRight } from 'lucide-react';
import Button from '../Button';
import { Group } from '../Tags';
import VisitReport from './VisitReport';
import { chargedFor, firstName, money, returnedFor, visitCharge } from '../../data/familyCare';

// One visit, as the family sees it: when, who, where the money is, and — when
// there is one — the thing they can do about it. Her page and the list of every
// visit both show visits this way, so a visit reads the same wherever it is.
//
// Its state is a short pill beside the date. The money column already says
// what happened to the money and the line under says the rest, so the pill
// only names the step. A visit with something to open is a clickable row: the
// date is the link, the button says the same on a wide screen, and on a phone
// a chevron stands in for it (docs/patterns.md §7).

const STATUS = {
  planned: { label: 'Plan posete', pill: 'is-pending' },
  awaiting: { label: 'Čeka radni nalog', pill: 'is-muted' },
  charging: { label: 'Radni nalog stigao', pill: 'is-attention' },
  disputed: { label: 'Prijavljeno', pill: 'is-declined' },
  paid: { label: 'Plaćeno', pill: 'is-accepted' },
  cancelled: { label: 'Otkazano', pill: 'is-muted' },
};

function amountOf(v) {
  if (v.status === 'planned') return { amount: money(chargedFor(v.hours, v.rate)), note: 'rezervisano' };
  if (v.status === 'paid') return { amount: money(visitCharge(v)), note: 'naplaćeno' };
  if (v.status === 'charging') return { amount: money(visitCharge(v)), note: 'biće naplaćeno' };
  if (v.status === 'disputed') return { amount: money(chargedFor(v.hours, v.rate)), note: 'zadržano' };
  if (v.status === 'awaiting') return { amount: money(chargedFor(v.hours, v.rate)), note: 'još nije naplaćeno' };
  return v.lateCharge
    ? { amount: money(chargedFor(v.hours, v.rate)), note: 'naplaćeno, kasno otkazano' }
    : { amount: '-', note: 'vraćeno' };
}

function lineFor(v) {
  const first = firstName(v.caregiver.name);
  switch (v.status) {
    case 'planned':
      return 'Rezervisano, nije naplaćeno - novac se uzima tek posle posete, kad stigne radni nalog.';
    case 'awaiting':
      return `${first} još treba da potvrdi šta je uradila pre nego što se išta naplati.`;
    case 'charging':
      return `Naplaćuje se za ${v.chargesInHours} h, osim ako kažete da nešto nije u redu.${
        v.extra?.status === 'asked' ? ` ${first} traži i ${v.extra.hours} h preko rezervisanog.` : ''
      }`;
    case 'disputed':
      return 'Ništa se ne naplaćuje dok je ovo otvoreno. Koordinatorka proverava i pozvaće vas.';
    case 'paid': {
      const said = v.resolution
        ? v.resolution.text
        : v.confirmed === 'you'
          ? 'Vi ste potvrdili.'
          : 'Potvrđeno automatski posle 24 sata.';
      // what the coordinator settled already says what was charged
      const back = v.resolution ? 0 : returnedFor(v);
      const extra =
        v.extra?.status === 'asked'
          ? ` ${first} traži još ${v.extra.hours} h, čeka vaš odgovor.`
          : v.extra?.status === 'approved'
            ? ` Dodatni sati su odobreni.`
            : '';
      return `${said}${back ? ` ${money(back)} je vraćeno, radila je kraće.` : ''}${extra}`;
    }
    default:
      if (v.lateCharge) return 'Otkazano u poslednjem satu, pa je naplaćeno u celosti.';
      if (v.resolution) return v.resolution.text;
      if (v.cancelledBy === 'caregiver') return `${v.cancelReason}. Ništa nije naplaćeno.`;
      return v.cancelReason ? `Otkazano - ${v.cancelReason.toLowerCase()}. Ništa nije naplaćeno.` : 'Rezervacija je vraćena. Ništa nije naplaćeno.';
  }
}

export default function VisitRow({ visit: v, showWho, onDrawer }) {
  const s = STATUS[v.status] || STATUS.paid;
  const m = amountOf(v);
  const action =
    v.status === 'charging' || v.extra?.status === 'asked'
      ? { label: 'Pogledaj radni nalog', variant: 'primary', drawer: { kind: 'work-order', visitId: v.id } }
      : v.status === 'planned'
        ? { label: 'Pogledaj plan posete', variant: 'secondary', drawer: { kind: 'plan', visitId: v.id } }
        : (v.status === 'paid' || v.status === 'disputed' || v.resolution) && v.report
          ? { label: 'Radni nalog', variant: 'ghost', drawer: { kind: 'work-order', visitId: v.id } }
          : null;

  const open = action && (() => onDrawer(action.drawer));

  return (
    <li className={`fam-visit is-${v.status}${open ? ' is-clickable' : ''}`}>
      <div className="fam-visit-head">
        <div className="fam-visit-when">
          <p className="fam-row-title">
            {open ? (
              <button type="button" className="card-link" onClick={open}>
                {v.date} · {v.time}
              </button>
            ) : (
              <span>
                {v.date} · {v.time}
              </span>
            )}
            <span className={`status-pill ${s.pill}`}>{s.label}</span>
          </p>
          <p className="fam-row-body">
            {showWho ? `${v.caregiver.name} · ` : ''}
            {v.hours} h po {money(v.rate)}/h
          </p>
        </div>
        <div className="fam-visit-money">
          <p className="fam-visit-amount">{m.amount}</p>
          <p className="fam-visit-note">{m.note}</p>
        </div>
        {open && <ChevronRight size={16} strokeWidth={1.75} className="card-go" aria-hidden="true" />}
      </div>

      {v.report && (v.status === 'paid' || v.status === 'charging') && (
        <VisitReport report={v.report} first={firstName(v.caregiver.name)} />
      )}
      {v.status === 'disputed' && v.queryReason && (
        <div className="tag-rows">
          <Group label="Vi ste napisali" text={v.queryReason} />
        </div>
      )}

      <div className="fam-visit-foot">
        <p className="fam-visit-line">{lineFor(v)}</p>
        {action && (
          <Button variant={action.variant} className="card-action" onClick={open}>
            {action.label}
          </Button>
        )}
      </div>
    </li>
  );
}
