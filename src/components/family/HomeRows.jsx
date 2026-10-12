import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Item, ItemContent, ItemLink } from '@/components/ui/item';
import { cn } from '@/lib/utils';
import { activeVersion, allVisits, dayOf, lastVersion, money, pendingVersion, todayOf } from '../../data/familyCare';
import { PARTNERS } from '../../data/partners';

// The rows of the home's cards (docs/patterns.md §4a), and what each card
// lists. They are here, not in the home, because a card shows three and the
// drawer it opens for all of them shows the same rows.

// How many rows a card on the home shows before the rest is a drawer away.
export const HOME_ROWS = 3;

// a row's title is 14 medium, whatever it names (docs/patterns.md §2)
export const rowTitle = 'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground';
// beside an avatar the name is 2 from the line under it, not 4 (§6)
export const rowName = `${rowTitle} -mb-0.5`;
export const rowBody = 'text-xs leading-body text-muted-foreground';

// what is booked, soonest first
export const comingVisits = (care) =>
  allVisits(care)
    .filter((v) => v.status === 'planned')
    .sort((a, b) => dayOf(a.date, todayOf(care)) - dayOf(b.date, todayOf(care)));

// who comes first, who no longer does last: what holds is never the part
// behind the button
export const currentFirst = (arrangements) =>
  [...arrangements].sort((a, b) => Boolean(a.endedOn) - Boolean(b.endedOn));

// what the plan offers through partners, beside the caregivers
export const partnerOffers = (plan) => (plan?.recommendations || []).filter((r) => r.kind === 'offer');

// A row in a card of the overview (docs/patterns.md §4a): the avatar as tall
// as the name and the line under it, 2 apart, the one gap off the grid
// (§6); the text beside it. The name is a row's title, 14 (`rowName`). The row opens what it is
// about from anywhere on it and has nothing on its right: half a page wide,
// there is no room for a button, and the details have the action.
export function Row({ initials, ended, className, children }) {
  return (
    <Item
      className={cn(
        'items-start gap-3 [--avatar:calc(var(--text-xs-leading)+2px+var(--text-body-leading))]',
        className
      )}
    >
      <Avatar>
        <AvatarFallback className={cn(ended && 'bg-muted text-muted-foreground')}>{initials}</AvatarFallback>
      </Avatar>
      {children}
    </Item>
  );
}

// Who cares for her, and where things stand with her; the row opens her page.
export function ArrangementRow({ arrangement: a, onOpen }) {
  const act = activeVersion(a);
  const pen = pendingVersion(a);
  const ended = Boolean(a.endedOn);
  return (
    <Row initials={a.caregiver.initials} ended={ended}>
      <ItemContent>
        <p className={cn(rowName, ended && 'text-muted-foreground')}>
          <ItemLink onClick={() => onOpen(a.caregiver.id)}>{a.caregiver.name}</ItemLink>
          {pen && <Badge variant="warning">{act ? 'Novi uslovi' : 'Ugovor čeka'}</Badge>}
          {!pen && !act && !ended && lastVersion(a)?.status === 'declined' && (
            <Badge variant="destructive">Uslovi odbijeni</Badge>
          )}
        </p>
        <p className={rowBody}>
          {ended
            ? `Završeno ${a.endedOn}`
            : a.since
              ? `${a.caregiver.area} · od ${a.since}${act ? ` · ${money(act.rate)}/h` : ''}`
              : pen
                ? `${a.caregiver.area} · čeka da prihvatite ugovor`
                : a.versions.length
                  ? `${a.caregiver.area} · ništa još ne važi`
                  : `${a.caregiver.area} · prihvatila, ugovor stiže uskoro`}
        </p>
      </ItemContent>
    </Row>
  );
}

// What a partner offers, from the plan: the partner first (its logo, or its
// name where it has none) with what it costs less through Minna beside it, and
// under them what it is for. The row opens the offer: the prices and the way
// to book.
export function OfferRow({ rec, onOpen }) {
  const partner = PARTNERS[rec.partner];
  return (
    <Item>
      <ItemContent className="gap-2">
        <div className="flex items-center justify-between gap-3">
          {partner.logo ? (
            <img className="block h-5 w-auto rounded-sm" src={partner.logo} alt={partner.name} />
          ) : (
            <span className="text-xs font-medium text-foreground">{partner.name}</span>
          )}
          <Badge variant="success">−{partner.discount}% preko Minne</Badge>
        </div>
        {/* the partner is the row's title; what the offer is for reads as the
            line under it, not a second title */}
        <p className={rowBody}>
          <ItemLink onClick={onOpen}>{rec.title}</ItemLink>
        </p>
      </ItemContent>
    </Item>
  );
}
