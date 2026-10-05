import { useState } from 'react';
import { ArrowRight, CalendarCheck, Check, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemGroup } from '@/components/ui/item';
import { cn } from '@/lib/utils';
import { caregiversFor } from '../data/carePlan';
import { PARTNERS, discounted, price } from '../data/partners';
import CaregiverRow from './CaregiverRow';

// One recommendation, in the shape the client's document sketched: what we suggest,
// *why we suggest it for this person*, and who would do it. Where a partner does
// it, the card shows their price and the lower one the family pays when Minna
// books it — that difference is the reason to go through us — and a single action
// that hands it to her.
//
// A recommendation the assistant just rewrote is ringed and says "Izmenjeno";
// the ring flares once and settles.
export default function RecommendationCard({
  rec,
  standingOf,
  unlocked,
  bookable = true,
  changed,
  changeKey,
  onSelectCaregiver,
  onOpenCaregiver,
  onFindCaregivers,
}) {
  return (
    // keyed by the change, so the highlight plays again for a second change
    <Card
      className={cn(changed && 'animate-plan-changed shadow-[0_0_0_1px_var(--color-primary-300),var(--shadow-card)]')}
      key={changed ? changeKey : 'rec'}
    >
      <CardHeader>
        <CardTitle>{rec.title}</CardTitle>
        {changed && (
          <CardAction>
            <Badge>Izmenjeno</Badge>
          </CardAction>
        )}
      </CardHeader>

      <p className="text-small font-medium text-muted-foreground">Zašto ovo preporučujemo</p>
      <CardDescription>{rec.why}</CardDescription>

      {rec.kind === 'caregivers' && (
        <ItemGroup>
          {caregiversFor(unlocked)
            .slice(0, 5)
            .map((c) => (
              <CaregiverRow key={c.id} caregiver={c} standing={standingOf?.(c.id)} onSelect={onSelectCaregiver} onOpen={onOpenCaregiver} />
            ))}
          {onFindCaregivers && (
            <CardFooter className="mt-0">
              <Button variant="secondary" onClick={onFindCaregivers}>
                Pogledajte još negovateljica
                <ArrowRight size={14} strokeWidth={1.75} />
              </Button>
            </CardFooter>
          )}
        </ItemGroup>
      )}

      {rec.kind === 'offer' && <Offer rec={rec} bookable={unlocked && bookable} />}

      {rec.kind === 'list' && (
        <ul className="mt-1 flex list-none flex-col gap-2">
          {rec.items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs leading-body text-muted-foreground">
              <Check size={13} strokeWidth={2} className="h-[1lh] shrink-0 text-primary-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// A partner's price list. Every row shows what the partner charges and what the
// family pays through Minna, so the saving is read row by row, not worked out
// (docs/patterns.md §8: the one exception to label and value).
function Offer({ rec, bookable }) {
  const partner = PARTNERS[rec.partner];
  const [sent, setSent] = useState(false);
  const ordering = rec.id === 'aids';
  const Icon = ordering ? Package : CalendarCheck;

  return (
    <div className="mt-1 flex flex-col gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {partner.logo ? (
          <img className="block h-5 w-auto rounded-sm" src={partner.logo} alt={partner.name} />
        ) : (
          <span className="text-sm leading-5 font-medium text-foreground">{partner.name}</span>
        )}
        {partner.what && <span className="min-w-0 truncate text-xs text-muted-foreground">{partner.what}</span>}
        <Badge variant="success" className="ml-auto">
          −{partner.discount}% preko Minne
        </Badge>
      </div>

      <ul className="flex list-none flex-col">
        {rec.items.map((item) => (
          <li key={item.title} className="flex items-start justify-between gap-3 border-t py-2 last:border-b">
            <span className="flex min-w-0 flex-col text-xs leading-body">
              <span className="font-medium text-foreground">{item.title}</span>
              {item.who && <span className="text-muted-foreground">{item.who}</span>}
            </span>
            <span className="flex shrink-0 flex-col items-end text-xs leading-body font-medium whitespace-nowrap text-foreground">
              <s className="font-normal text-disabled" aria-label={`Redovna cena ${price(item.price)}`}>
                {price(item.price)}
              </s>
              <span>{price(discounted(item.price, partner.discount))}</span>
            </span>
          </li>
        ))}
      </ul>

      {bookable &&
        (sent ? (
          <p className="flex items-start gap-2 text-xs leading-body text-success" role="status">
            <Check size={14} strokeWidth={2} className="h-[1lh] shrink-0" />
            Minna je dobila zahtev i javiće vam se danas {ordering ? 'sa danom isporuke' : 'sa terminom'}.
          </p>
        ) : (
          <CardFooter className="mt-1">
            <Button onClick={() => setSent(true)}>
              <Icon size={14} strokeWidth={1.75} />
              Neka Minna {ordering ? 'naruči' : 'zakaže'}
            </Button>
          </CardFooter>
        ))}
    </div>
  );
}
