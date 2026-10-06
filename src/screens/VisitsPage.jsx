import { useState } from 'react';
import VisitRow from '../components/family/VisitRow';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemGroup } from '@/components/ui/item';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import BackButton from '../components/BackButton';
import ShowMore from '../components/ShowMore';
import { useShowMore } from '@/hooks/use-show-more';
import { allVisits, dayOf, monthOf, pl, todayOf } from '../data/familyCare';

// Every visit, newest first, across everyone who has come: who came, how long
// they stayed, how the day went and what it cost. Grouped by month, because
// that is how a family looks something up ("what happened in April"). A step
// at a time, "Prikaži još" adding the next (docs/patterns.md §8a).

export default function VisitsPage({ care, onDrawer, onBack }) {
  const [who, setWho] = useState('all');
  const today = todayOf(care);

  const all = allVisits(care)
    .filter((v) => v.status !== 'cancelled' || v.cancelledBy)
    .sort((a, b) => dayOf(b.date, today) - dayOf(a.date, today));
  const picked = who === 'all' ? all : all.filter((v) => v.caregiver.id === who);
  const list = useShowMore(picked, { reset: who });
  const visible = list.visible;

  // what is booked past tomorrow stands on its own at the top: by month it
  // split the month in two, either side of "Ove nedelje"
  const tomorrow = dayOf('sutra', today);
  const groups = [];
  for (const v of visible) {
    const month = dayOf(v.date, today) > tomorrow ? 'Zakazano' : monthOf(v.date, today);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.visits.push(v);
    else groups.push({ month, visits: [v] });
  }

  const people = care.arrangements.map((a) => ({ id: a.caregiver.id, name: a.caregiver.name, ended: Boolean(a.endedOn) }));

  return (
    <Page>
      <BackButton label="Moja nega" onClick={onBack} />

      <PageHeader>
        <PageHeaderText>
          <PageTitle>Posete</PageTitle>
          <PageDescription>Sve posete, od najnovije. Ko je dolazio, koliko je ostao i kako je prošao dan.</PageDescription>
        </PageHeaderText>
      </PageHeader>

      {/* one is always chosen: pressing the chosen one again does nothing */}
      <ToggleGroup
        type="single"
        size="sm"
        className="items-center"
        value={who}
        onValueChange={(id) => {
          if (!id) return;
          setWho(id);
        }}
        aria-label="Čije posete"
      >
        {[{ id: 'all', name: 'Sve' }, ...people].map((p) => (
          <ToggleGroupItem key={p.id} value={p.id}>
            {p.name}
            {p.ended && (
              <span className="text-small text-disabled in-data-[state=on]:text-inherit in-data-[state=on]:opacity-80">ranije</span>
            )}
          </ToggleGroupItem>
        ))}
        <span className="ml-auto text-small text-disabled">
          {picked.length === all.length ? pl(all.length, 'poseta', 'posete', 'poseta') : `${picked.length} od ${all.length}`}
        </span>
      </ToggleGroup>

      {groups.map((g) => (
        <Card key={g.month}>
          <CardHeader>
            <CardTitle>{g.month}</CardTitle>
            <CardAction>
              <Badge variant="secondary">{pl(g.visits.length, 'poseta', 'posete', 'poseta')}</Badge>
            </CardAction>
          </CardHeader>
          <ItemGroup>
            {g.visits.map((v) => (
              <VisitRow key={v.id} visit={v} showWho onDrawer={onDrawer} />
            ))}
          </ItemGroup>
        </Card>
      ))}

      {!picked.length && (
        <Card>
          <p className="text-xs leading-body text-muted-foreground">Još nema poseta.</p>
        </Card>
      )}

      <ShowMore list={list} className="mt-1" />
    </Page>
  );
}
