import { Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import { ItemGroup } from '@/components/ui/item';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaneHint, PaneLabel } from '@/components/pane';
import { useVisitHistory } from '@/hooks/use-visit-history';
import Modal from '../Modal';
import ShowMore from '../ShowMore';
import VisitRow from './VisitRow';
import { t, tn } from '@/i18n';

// Every visit, read without leaving the home (docs/patterns.md §4a): opened
// from "Sve posete" on the last visit's card and from the number of visits so
// far. Laid out as "Šta se desilo" is: who
// came, as chips, when more than one has; how many; then the visits by month,
// each the row a visit is everywhere, ten at a time. A visit with something to
// open opens it in place of this.
export default function VisitsDrawer({ open = true, care, onClose, onOpen }) {
  const { who, setWho, all, picked, list, groups, people } = useVisitHistory(care);
  return (
    <Modal eyebrow={care.elder.name || t('Vaša nega')} title={t('Sve posete')} wide open={open} onClose={onClose}>
      {/* one is always chosen: pressing the chosen one again does nothing. On
          a phone one row that scrolls sideways, out to the screen's edges, not
          four rows of 44 under one another (docs/patterns.md §12). */}
      {people.length > 1 && (
        <ToggleGroup
          type="single"
          size="sm"
          className="items-center phone:-mx-4 phone:-my-1 phone:shrink-0 phone:flex-nowrap phone:overflow-x-auto phone:px-4 phone:py-1 phone:[scrollbar-width:none] phone:[&>*]:shrink-0 phone:[&::-webkit-scrollbar]:hidden"
          value={who} onValueChange={(id) => id && setWho(id)} aria-label={t('Čije posete')}>
          {[{ id: 'all', name: t('Sve') }, ...people].map((p) => (
            <ToggleGroupItem key={p.id} value={p.id}>
              {p.name}
              {p.ended && (
                <span className="text-small text-disabled in-data-[state=on]:text-inherit in-data-[state=on]:opacity-80">{t('ranije')}</span>
              )}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {picked.length > 0 && (
        <PaneHint>
          {picked.length === all.length
            ? t('{count} · najnovije prvo', { count: tn(all.length, 'poseta', 'posete', 'poseta') })
            : t('{picked} od {all} · najnovije prvo', { picked: picked.length, all: all.length })}
        </PaneHint>
      )}
      {groups.map((g) => (
        <Fragment key={g.month}>
          <div className="flex items-center gap-2 phone:flex-wrap phone:gap-y-2">
            <PaneLabel>{g.month}</PaneLabel>
            <Badge variant="secondary" className="ml-auto phone:ml-0">
              {g.visits.length}
            </Badge>
          </div>
          <ItemGroup>
            {g.visits.map((v) => (
              <VisitRow key={v.id} visit={v} showWho onDrawer={onOpen} />
            ))}
          </ItemGroup>
        </Fragment>
      ))}
      <ShowMore list={list} />
      {!picked.length && <PaneHint>{t('Još nema poseta.')}</PaneHint>}
    </Modal>
  );
}
