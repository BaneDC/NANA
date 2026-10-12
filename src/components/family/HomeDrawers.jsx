import { ItemGroup } from '@/components/ui/item';
import { PaneHint } from '@/components/pane';
import { useShowMore } from '@/hooks/use-show-more';
import Modal from '../Modal';
import { Offer } from '../RecommendationCard';
import ShowMore from '../ShowMore';
import { Group, Groups } from '../Tags';
import VisitRow from './VisitRow';
import { ArrangementRow, OfferRow, comingVisits, currentFirst, partnerOffers } from './HomeRows';
import { pl } from '../../data/familyCare';

// The whole of a list the home shows three of (docs/patterns.md §4a): opened
// by the button in the head of its card ("Sve zakazane", "Sve negovateljice",
// "Sve ponude"), so the family reads the rest without leaving the home. Each
// says how many it holds, then the same rows the card has; a visit is the row
// a visit is everywhere, as in "Sve posete". Ten at a time, as any full list
// (§8a).

// Every visit that is booked, soonest first. A row opens that visit's plan.
export function ComingDrawer({ open = true, care, onClose, onOpen }) {
  const all = comingVisits(care);
  const list = useShowMore(all);
  return (
    <Modal eyebrow={care.elder.name || 'Vaša nega'} title="Zakazane posete" wide open={open} onClose={onClose}>
      {all.length > 0 ? (
        <PaneHint>{pl(all.length, 'poseta', 'posete', 'poseta')} · najbliže prvo</PaneHint>
      ) : (
        <PaneHint>Nijedna poseta nije zakazana.</PaneHint>
      )}
      <ItemGroup>
        {list.visible.map((v) => (
          <VisitRow key={v.id} visit={v} showWho onDrawer={onOpen} />
        ))}
      </ItemGroup>
      <ShowMore list={list} />
    </Modal>
  );
}

// Everyone who cares for her or has: who comes first. A row opens her page.
export function CaregiversDrawer({ open = true, care, onClose, onCaregiver }) {
  const all = currentFirst(care.arrangements);
  const list = useShowMore(all);
  return (
    <Modal eyebrow={care.elder.name || 'Vaša nega'} title="Vaše negovateljice" open={open} onClose={onClose}>
      <PaneHint>{pl(all.length, 'negovateljica', 'negovateljice', 'negovateljica')}</PaneHint>
      <ItemGroup>
        {list.visible.map((a) => (
          <ArrangementRow key={a.caregiver.id} arrangement={a} onOpen={onCaregiver} />
        ))}
      </ItemGroup>
      <ShowMore list={list} />
    </Modal>
  );
}

// Everything our partners offer from the plan. A row opens that offer, with
// the prices and the way to book.
export function OffersDrawer({ open = true, care, plan, onClose, onOpen }) {
  const all = partnerOffers(plan);
  const list = useShowMore(all);
  return (
    <Modal eyebrow={care.elder.name || 'Vaša nega'} title="Ponude partnera" open={open} onClose={onClose}>
      <PaneHint>Pregledi i pomagala iz plana nege, jeftinije kad ih zakaže Minna.</PaneHint>
      <ItemGroup>
        {list.visible.map((rec) => (
          <OfferRow key={rec.id} rec={rec} onOpen={() => onOpen({ kind: 'offer', recId: rec.id })} />
        ))}
      </ItemGroup>
      <ShowMore list={list} />
    </Modal>
  );
}

// One offer of a partner's, with what the home's row has no room for: why we
// recommend it, what the partner charges and what the family pays through
// Minna, and the way to have her book it. This is where the plan's page used
// to be needed (docs/patterns.md §4a).
export function OfferDrawer({ open = true, care, plan, recId, unlocked, onClose }) {
  const rec = partnerOffers(plan).find((r) => r.id === recId);
  if (!rec) return null;
  return (
    <Modal eyebrow={care.elder.name || 'Vaša nega'} title={rec.title} open={open} onClose={onClose}>
      <Groups>
        <Group label="Zašto ovo preporučujemo" text={rec.why} />
      </Groups>
      <Offer rec={rec} bookable={unlocked} />
    </Modal>
  );
}
