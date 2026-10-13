import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Item, ItemAction, ItemLink } from '@/components/ui/item';
import { statusVariant } from '../Standing';
import { Group, Groups } from '../Tags';
import VisitReport from './VisitReport';
import { chargedFor, firstName, money, returnedFor, visitCharge } from '../../data/familyCare';
import { msg, t } from '@/i18n';

// One visit, as the family sees it: when, who, where the money is, and — when
// there is one — the thing they can do about it. Her page and the list of every
// visit both show visits this way, so a visit reads the same wherever it is.
//
// Its state is a short badge beside the date. The money column already says
// what happened to the money and the line under says the rest, so the badge
// only names the step. A visit with something to open is a clickable row
// (`Item`): the date is the link, the button says the same on a wide screen,
// and on a phone the row opens on a tap (docs/patterns.md §7).
//
// Three parts, 12 apart: when and the money, the report, and the sentence on
// what happens next with its button under it, left, like a card's footer.

const STATUS = {
  planned: { label: msg('Plan posete'), pill: 'is-pending' },
  awaiting: { label: msg('Čeka radni nalog'), pill: 'is-muted' },
  charging: { label: msg('Radni nalog stigao'), pill: 'is-attention' },
  disputed: { label: msg('Prijavljeno'), pill: 'is-declined' },
  paid: { label: msg('Plaćeno'), pill: 'is-accepted' },
  cancelled: { label: msg('Otkazano'), pill: 'is-muted' },
};

// what the money of a visit is at, said short: the home's last visit says it too
export function amountOf(v) {
  if (v.status === 'planned') return { amount: money(chargedFor(v.hours, v.rate)), note: t('rezervisano') };
  if (v.status === 'paid') return { amount: money(visitCharge(v)), note: t('naplaćeno') };
  if (v.status === 'charging') return { amount: money(visitCharge(v)), note: t('biće naplaćeno') };
  if (v.status === 'disputed') return { amount: money(chargedFor(v.hours, v.rate)), note: t('zadržano') };
  if (v.status === 'awaiting') return { amount: money(chargedFor(v.hours, v.rate)), note: t('još nije naplaćeno') };
  return v.lateCharge
    ? { amount: money(chargedFor(v.hours, v.rate)), note: t('naplaćeno, kasno otkazano') }
    : { amount: '-', note: t('vraćeno') };
}

function lineFor(v) {
  const first = firstName(v.caregiver.name);
  switch (v.status) {
    case 'planned':
      return t('Rezervisano, nije naplaćeno - novac se uzima tek posle posete, kad stigne radni nalog.');
    case 'awaiting':
      return t('{name} još treba da potvrdi šta je uradila pre nego što se išta naplati.', { name: first });
    case 'charging':
      return [
        t('Naplaćuje se za {hours} h, osim ako kažete da nešto nije u redu.', { hours: v.chargesInHours }),
        v.extra?.status === 'asked' && t('{name} traži i {hours} h preko rezervisanog.', { name: first, hours: v.extra.hours }),
      ]
        .filter(Boolean)
        .join(' ');
    case 'disputed':
      return t('Ništa se ne naplaćuje dok je ovo otvoreno. Koordinatorka proverava i pozvaće vas.');
    case 'paid': {
      const said = v.resolution
        ? t(v.resolution.text)
        : v.confirmed === 'you'
          ? t('Vi ste potvrdili.')
          : t('Potvrđeno automatski posle 24 sata.');
      // what the coordinator settled already says what was charged
      const back = v.resolution ? 0 : returnedFor(v);
      const extra =
        v.extra?.status === 'asked'
          ? t('{name} traži još {hours} h, čeka vaš odgovor.', { name: first, hours: v.extra.hours })
          : v.extra?.status === 'approved'
            ? t('Dodatni sati su odobreni.')
            : '';
      return [said, back && t('{amount} je vraćeno, radila je kraće.', { amount: money(back) }), extra].filter(Boolean).join(' ');
    }
    default:
      if (v.lateCharge) return t('Otkazano u poslednjem satu, pa je naplaćeno u celosti.');
      if (v.resolution) return t(v.resolution.text);
      if (v.cancelledBy === 'caregiver') return t('{reason}. Ništa nije naplaćeno.', { reason: t(v.cancelReason) });
      return v.cancelReason
        ? t('Otkazano - {reason}. Ništa nije naplaćeno.', { reason: t(v.cancelReason).toLowerCase() })
        : t('Rezervacija je vraćena. Ništa nije naplaćeno.');
  }
}

export default function VisitRow({ visit: v, showWho, onDrawer }) {
  const s = STATUS[v.status] || STATUS.paid;
  const m = amountOf(v);
  const action =
    v.status === 'charging' || v.extra?.status === 'asked'
      ? { label: t('Pogledaj radni nalog'), variant: 'default', drawer: { kind: 'work-order', visitId: v.id } }
      : v.status === 'planned'
        ? { label: t('Pogledaj plan posete'), variant: 'secondary', drawer: { kind: 'plan', visitId: v.id } }
        : (v.status === 'paid' || v.status === 'disputed' || v.resolution) && v.report
          ? { label: t('Radni nalog'), variant: 'secondary', drawer: { kind: 'work-order', visitId: v.id } }
          : null;

  const open = action && (() => onDrawer(action.drawer));

  return (
    <Item role="listitem" className="flex-col items-start gap-3">
      <div className="flex w-full items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground">
            {open ? (
              <ItemLink onClick={open}>
                {v.date} · {v.time}
              </ItemLink>
            ) : (
              <span>
                {v.date} · {v.time}
              </span>
            )}
            <Badge variant={statusVariant(s.pill)} className="my-[calc((var(--text-xs-leading)-20px)/2)]">
              {t(s.label)}
            </Badge>
          </p>
          <p className="text-xs leading-body text-muted-foreground">
            {showWho ? `${v.caregiver.name} · ` : ''}
            {t('{hours} h po {rate}/h', { hours: v.hours, rate: money(v.rate) })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{m.amount}</p>
          <p className="text-small text-disabled">{m.note}</p>
        </div>
      </div>

      {v.report && (v.status === 'paid' || v.status === 'charging') && (
        <VisitReport report={v.report} first={firstName(v.caregiver.name)} />
      )}
      {v.status === 'disputed' && v.queryReason && (
        <Groups>
          <Group label={t('Vi ste napisali')} text={t(v.queryReason)} />
        </Groups>
      )}

      <div className="flex w-full flex-col items-start gap-3 phone:flex-wrap">
        <p className="text-xs leading-body text-muted-foreground">{lineFor(v)}</p>
        {action && (
          <ItemAction>
            <Button variant={action.variant} onClick={open}>
              {action.label}
            </Button>
          </ItemAction>
        )}
      </div>
    </Item>
  );
}
