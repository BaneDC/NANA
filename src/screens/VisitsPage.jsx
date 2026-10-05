import { useState } from 'react';
import VisitRow from '../components/family/VisitRow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemGroup } from '@/components/ui/item';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import BackButton from '../components/BackButton';
import { allVisits, dayOf, monthOf, pl, todayOf } from '../data/familyCare';

// Every visit, newest first, across everyone who has come: who came, how long
// they stayed, how the day went and what it cost. Grouped by month, because
// that is how a family looks something up ("what happened in April").

const PAGE = 8;

export default function VisitsPage({ care, onDrawer, onBack }) {
  const [who, setWho] = useState('all');
  const [shown, setShown] = useState(PAGE);
  const today = todayOf(care);

  const all = allVisits(care)
    .filter((v) => v.status !== 'cancelled' || v.cancelledBy)
    .sort((a, b) => dayOf(b.date, today) - dayOf(a.date, today));
  const picked = who === 'all' ? all : all.filter((v) => v.caregiver.id === who);
  const visible = picked.slice(0, shown);

  const groups = [];
  for (const v of visible) {
    const month = monthOf(v.date, today);
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
          setShown(PAGE);
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

      {picked.length > shown && (
        <div className="mt-1 flex gap-2 phone:flex-wrap phone:*:flex-auto">
          <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
            Prikaži još {Math.min(PAGE, picked.length - shown)}
          </Button>
        </div>
      )}
    </Page>
  );
}
