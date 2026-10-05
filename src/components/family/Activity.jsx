import { Item, ItemContent, ItemGroup } from '@/components/ui/item';
import { dayLabel, firstName, hourText, nameOf } from '../../data/familyCare';

// What has happened with the family's care, newest first: every request,
// every version of terms, every visit and every euro, each said once, with who
// did it and when (care.log, written by familyCare and sim). Read in a drawer,
// opened from an icon in the page head: everyone's on Moja nega, only hers on
// her page.

// who did it, as the line under it says
const byText = (care, e) =>
  e.by === 'you' ? 'vi' : e.by === 'coordinator' ? 'koordinatorka' : e.caregiverId ? firstName(nameOf(care, e.caregiverId)) : 'negovateljica';

export function ActivityRows({ care, entries, showWho }) {
  const today = Math.floor(care.now / 24);
  return (
    <ItemGroup>
      {entries.map((e) => (
        <Item key={e.id} className="items-start gap-3">
          <ItemContent>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground">{e.title}</p>
            <p className="text-xs leading-body text-muted-foreground">
              {[
                showWho && e.caregiverId && nameOf(care, e.caregiverId),
                // her own name once is enough
                !(showWho && e.by === 'caregiver' && e.caregiverId) && byText(care, e),
                `${dayLabel(Math.floor(e.at / 24), today).toLowerCase()} u ${hourText(e.at)}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {e.detail && <p className="text-xs leading-body text-muted-foreground">{e.detail}</p>}
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}
