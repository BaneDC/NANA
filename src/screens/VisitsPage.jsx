import VisitRow from '../components/family/VisitRow';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemGroup } from '@/components/ui/item';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import BackButton from '../components/BackButton';
import ShowMore from '../components/ShowMore';
import { useVisitHistory } from '@/hooks/use-visit-history';
import { t, tn } from '../i18n';

// Every visit, newest first, across everyone who has come: who came, how long
// they stayed, how the day went and what it cost. Grouped by month, because
// that is how a family looks something up ("what happened in April"). A step
// at a time, "Prikaži još" adding the next (docs/patterns.md §8a).

export default function VisitsPage({ care, onDrawer, onBack }) {
  const { who, setWho, all, picked, list, groups, people } = useVisitHistory(care);

  return (
    <Page>
      <BackButton label={t('Moja nega')} onClick={onBack} />

      <PageHeader>
        <PageHeaderText>
          <PageTitle>{t('Posete')}</PageTitle>
          <PageDescription>{t('Sve posete, od najnovije. Ko je dolazio, koliko je ostao i kako je prošao dan.')}</PageDescription>
        </PageHeaderText>
      </PageHeader>

      {/* one is always chosen: pressing the chosen one again does nothing */}
      <ToggleGroup
        type="single"
        size="sm"
        // 16 in, on the line the title's text keeps (docs/patterns.md §4)
        className="items-center pl-4"
        value={who}
        onValueChange={(id) => {
          if (!id) return;
          setWho(id);
        }}
        aria-label={t('Čije posete')}
      >
        {[{ id: 'all', name: t('Sve') }, ...people].map((p) => (
          <ToggleGroupItem key={p.id} value={p.id}>
            {p.name}
            {p.ended && (
              <span className="text-small text-disabled in-data-[state=on]:text-inherit in-data-[state=on]:opacity-80">{t('ranije')}</span>
            )}
          </ToggleGroupItem>
        ))}
        <span className="ml-auto text-small text-disabled">
          {picked.length === all.length ? tn(all.length, 'poseta', 'posete', 'poseta') : t('{picked} od {all}', { picked: picked.length, all: all.length })}
        </span>
      </ToggleGroup>

      {groups.map((g) => (
        <Card key={g.month}>
          <CardHeader>
            <CardTitle>{g.month === 'Zakazano' ? t('Zakazano') : g.month}</CardTitle>
            <CardAction>
              <Badge variant="secondary">{tn(g.visits.length, 'poseta', 'posete', 'poseta')}</Badge>
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
          <p className="text-xs leading-body text-muted-foreground">{t('Još nema poseta.')}</p>
        </Card>
      )}

      <ShowMore list={list} className="mt-1" />
    </Page>
  );
}
