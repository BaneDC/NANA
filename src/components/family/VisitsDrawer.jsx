import { Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import { ItemGroup } from '@/components/ui/item';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaneHint, PaneLabel } from '@/components/pane';
import { useVisitHistory } from '@/hooks/use-visit-history';
import Modal from '../Modal';
import ShowMore from '../ShowMore';
import VisitRow from './VisitRow';
import { pl } from '../../data/familyCare';

// Every visit, read without leaving the home (docs/patterns.md §4a): opened
// from "Sve posete" on the last visit's card and from the number of visits so
// far. The same list as the page "Posete", laid out as "Šta se desilo" is: who
// came, as chips, when more than one has; how many; then the visits by month,
// each the row a visit is everywhere, ten at a time. A visit with something to
// open opens it in place of this.
export default function VisitsDrawer({ open = true, care, onClose, onOpen }) {
  const { who, setWho, all, picked, list, groups, people } = useVisitHistory(care);
  return (
    <Modal eyebrow={care.elder.name || 'Vaša nega'} title="Sve posete" wide open={open} onClose={onClose}>
      {/* one is always chosen: pressing the chosen one again does nothing */}
      {people.length > 1 && (
        <ToggleGroup type="single" size="sm" className="items-center" value={who} onValueChange={(id) => id && setWho(id)} aria-label="Čije posete">
          {[{ id: 'all', name: 'Sve' }, ...people].map((p) => (
            <ToggleGroupItem key={p.id} value={p.id}>
              {p.name}
              {p.ended && (
                <span className="text-small text-disabled in-data-[state=on]:text-inherit in-data-[state=on]:opacity-80">ranije</span>
              )}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {picked.length > 0 && (
        <PaneHint>
          {picked.length === all.length
            ? `${pl(all.length, 'poseta', 'posete', 'poseta')} · najnovije prvo`
            : `${picked.length} od ${all.length} · najnovije prvo`}
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
      {!picked.length && <PaneHint>Još nema poseta.</PaneHint>}
    </Modal>
  );
}
