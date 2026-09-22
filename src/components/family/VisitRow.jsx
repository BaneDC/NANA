import Button from '../Button';
import { CareSignals } from './FamilyDrawer';
import { chargedFor, firstName, money, visitCharge } from '../../data/familyCare';

// One visit, as the family sees it: when, who, where the money is, and — when
// there is one — the thing they can do about it. Her page and the list of every
// visit both show visits this way, so a visit reads the same wherever it is.

const STATUS = {
  planned: { label: 'Plan posete · novac rezervisan', pill: 'is-pending' },
  awaiting: { label: 'Poseta obavljena · radni nalog još nije stigao', pill: 'is-muted' },
  charging: { label: 'Radni nalog · pogledajte', pill: 'is-attention' },
  disputed: { label: 'Prijavljeno · kod koordinatorke', pill: 'is-declined' },
  paid: { label: 'Radni nalog · plaćeno', pill: 'is-accepted' },
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
    : { amount: '—', note: 'vraćeno' };
}

function lineFor(v) {
  const first = firstName(v.caregiver.name);
  switch (v.status) {
    case 'planned':
      return 'Rezervisano, nije naplaćeno — novac se uzima tek posle posete, kad stigne radni nalog.';
    case 'awaiting':
      return `${first} još treba da potvrdi šta je uradila pre nego što se išta naplati.`;
    case 'charging':
      return `Naplaćuje se za ${v.chargesInHours} h, osim ako kažete da nešto nije u redu.`;
    case 'disputed':
      return 'Ništa se ne naplaćuje dok je ovo otvoreno. Koordinatorka proverava i pozvaće vas.';
    case 'paid':
      return v.confirmed === 'you' ? 'Vi ste potvrdili.' : 'Potvrđeno automatski posle 24 sata.';
    default:
      if (v.lateCharge) return 'Otkazano u poslednjem satu, pa je naplaćeno u celosti.';
      return v.cancelReason ? `Otkazano — ${v.cancelReason.toLowerCase()}. Ništa nije naplaćeno.` : 'Rezervacija je vraćena. Ništa nije naplaćeno.';
  }
}

export default function VisitRow({ visit: v, showWho, onDrawer }) {
  const s = STATUS[v.status] || STATUS.paid;
  const m = amountOf(v);
  const action =
    v.status === 'charging'
      ? { label: 'Pogledaj radni nalog', variant: 'primary', drawer: { kind: 'work-order', visitId: v.id } }
      : v.status === 'planned'
        ? { label: 'Pogledaj plan posete', variant: 'secondary', drawer: { kind: 'plan', visitId: v.id } }
        : v.status === 'paid' && v.report
          ? { label: 'Radni nalog', variant: 'ghost', drawer: { kind: 'work-order', visitId: v.id } }
          : null;

  return (
    <li className={`fam-visit is-${v.status}`}>
      <div className="fam-visit-head">
        <div className="fam-visit-when">
          <p className="fam-row-title">
            {v.date} · {v.time}
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
      </div>

      <span className={`status-pill ${s.pill}`}>{s.label}</span>

      {v.report && (v.status === 'paid' || v.status === 'charging') && (
        <>
          <CareSignals report={v.report} />
          <p className="fam-quote">„{v.report.note}“</p>
        </>
      )}
      {v.status === 'disputed' && v.queryReason && <p className="fam-quote">Vi ste napisali: „{v.queryReason}“</p>}

      <div className="fam-visit-foot">
        <p className="fam-visit-line">{lineFor(v)}</p>
        {action && (
          <Button variant={action.variant} onClick={() => onDrawer(action.drawer)}>
            {action.label}
          </Button>
        )}
      </div>
    </li>
  );
}
