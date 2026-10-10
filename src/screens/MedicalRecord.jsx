import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemLink, ItemTitle } from '@/components/ui/item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Page, PageActions, PageDescription, PageHeader, PageHeaderText, PagePerson, PageSection, PageTitle } from '@/components/page';
import { Fact, Facts } from '@/components/data-list';
import { useKept } from '@/hooks/use-kept';
import { useShowMore } from '@/hooks/use-show-more';
import Attention from '../components/Attention';
import Dialog from '../components/Dialog';
import MoveDialog from '../components/MoveDialog';
import PlaceField from '../components/PlaceField';
import FrailtyScale from '../components/FrailtyScale';
import RecordChangeDialog from '../components/RecordChangeDialog';
import RecordEntryDialog from '../components/RecordEntryDialog';
import ShowMore from '../components/ShowMore';
import Tags, { Group } from '../components/Tags';
import { dayLabel, hourText, pl, todayOf } from '../data/familyCare';
import {
  HEALTH,
  HISTORY_KIND,
  NOTED_ONLY,
  RECORD_PARTS,
  alertsOf,
  entryLine,
  partRows,
  recordHistory,
  written,
} from '../data/record';

// The medical record of the person being cared for (docs/patterns.md §10a):
// her page, opened from who is signed in, at the foot of the menu. Two views
// of the one chart: how she is now, and everything that has been written
// since it was opened.
//
// Now: what to watch for and where she is on the frailty scale; how she moves
// and manages and what support she needs; her diagnoses, medicines, allergies
// and aids; who she is and who to call. Why the family called and how it began
// is the plan's, not hers, and is not here.
//
// The family does not change her state by hand. When something has happened,
// "Prijavi promenu", the page's one action, opens the assistant, which asks what it needs, proposes
// what follows and, once agreed, writes the event here; the plan is built
// again as a new version. The pencil on a part is only for putting right what
// was written wrong (RecordChangeDialog), and that too says what it does to
// the plan before it is saved. The lists under "Zdravlje" can also be kept by
// hand: the plan is not built from them.

// the badge in a row's name stands over the line, not in it
const overLine = 'my-[calc((var(--text-xs-leading)-20px)/2)]';

const initialsOf = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

// a part read from the answers: its lines, and the way in to change them
function PartCard({ part, answers, onEdit }) {
  const { rows, missing } = partRows(part, answers);
  if (!rows.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{part.title}</CardTitle>
        <CardAction>
          {missing > 0 && <Badge>Nije upisano: {missing}</Badge>}
          <Button variant="secondary" size="icon" aria-label={`Ispravi: ${part.title}`} title="Ispravi zapis" onClick={onEdit}>
            <Pencil size={14} strokeWidth={1.75} />
          </Button>
        </CardAction>
      </CardHeader>
      <Facts>
        {rows.map((r) => (
          <Fact key={r.key} label={r.label}>
            {r.value}
          </Fact>
        ))}
      </Facts>
    </Card>
  );
}

// Where she lives, picked: the first of two dialogs. What the change is (a
// move, a stay elsewhere, a correction) and what it does to the caregivers is
// asked by the one after it (MoveDialog).
function PlaceDialog({ open, value, onNext, onClose }) {
  const [place, setPlace] = useState(value);
  const moved = place.trim() && place.trim() !== value.trim();
  return (
    <Dialog eyebrow="Medicinski karton" title="Gde živi" open={open} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <PlaceField label="Grad" value={value} onChange={setPlace} />
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        <Button disabled={!moved} onClick={() => onNext(place.trim())}>
          Dalje
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// a list of entries: each a row that opens it, and the way to add one
function HealthCard({ list, items, onAdd, onOpen }) {
  return (
    <Card className="[&>[data-slot=item-group]]:mt-2">
      <CardHeader>
        <CardTitle>{list.title}</CardTitle>
        <CardAction>
          <Button variant="secondary" size="icon" aria-label={list.add} title={list.add} onClick={onAdd}>
            <Plus size={14} strokeWidth={1.75} />
          </Button>
        </CardAction>
      </CardHeader>
      {items.length > 0 ? (
        <ItemGroup>
          {items.map((e) => (
            <Item key={e.id}>
              <ItemContent>
                <ItemTitle className={entryLine(e) ? 'mb-1' : undefined}>
                  <ItemLink onClick={() => onOpen(e)}>{e.name}</ItemLink>
                </ItemTitle>
                {entryLine(e) && <ItemDescription>{entryLine(e)}</ItemDescription>}
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      ) : (
        <CardDescription>{list.empty}</CardDescription>
      )}
    </Card>
  );
}

// who wrote it and when, as the line under an entry says
const byText = (e) =>
  e.by === 'you' ? (e.via === 'assistant' ? 'vi, preko asistenta' : 'vi') : e.by === 'minna' ? 'Minna' : e.who || 'negovateljica';
const whenText = (e, today) => (e.day ? e.day.toLowerCase() : `${dayLabel(Math.floor(e.at / 24), today).toLowerCase()} u ${hourText(e.at)}`);

function History({ entries, today }) {
  const list = useShowMore(entries);
  return (
    <Card className="[&>[data-slot=item-group]]:mt-2">
      <CardHeader>
        <CardTitle>Istorija kartona</CardTitle>
      </CardHeader>
      <CardDescription>
        {pl(entries.length, 'stavka', 'stavke', 'stavki')} · najnovije prvo. Ništa se odavde ne briše: izmena se upisuje pored onoga
        što je bilo.
      </CardDescription>
      <ItemGroup>
        {list.visible.map((e) => (
          <Item key={e.id}>
            <ItemContent>
              <ItemTitle className="mb-1 flex-wrap">
                <span className="min-w-0">{e.title}</span>
                <Badge variant={e.kind === 'state' ? 'default' : 'secondary'} className={overLine}>
                  {HISTORY_KIND[e.kind]}
                </Badge>
              </ItemTitle>
              <ItemDescription>
                {byText(e)} · {whenText(e, today)}
              </ItemDescription>
              {e.lines.map((line) => (
                <ItemDescription key={line}>{line}</ItemDescription>
              ))}
              {e.next?.map((line) => (
                <ItemDescription key={line}>Šta dalje: {line}</ItemDescription>
              ))}
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
      {list.rest > 0 && (
        <CardFooter>
          <ShowMore list={list} />
        </CardFooter>
      )}
    </Card>
  );
}

export default function MedicalRecord({
  answers,
  notes,
  plan,
  care,
  record,
  planChange,
  onChange,
  onRecord,
  onFlash,
  onGoToChat,
  onOpenPlan,
  onReportChange,
}) {
  const [side, setSide] = useState('now');
  // what is being changed: { part } or { list, entry? }; kept while it closes
  const [editing, setEditing] = useState(null);
  const shown = useKept(editing);
  // each opening is a dialog of its own, starting from what is written now
  const open = (what) => setEditing({ ...what, n: Date.now() });

  const person = answers['about-person']?.values || {};
  // a change of where she lives, waiting on what it is; kept while it closes
  const [move, setMove] = useState(null);
  const shownMove = useKept(move);

  if (!person.name) {
    return (
      <Page>
        <PageHeader>
          <PageHeaderText>
            <PageTitle>Medicinski karton</PageTitle>
            <PageDescription>Sve o osobi o kojoj brinete, na jednom mestu.</PageDescription>
          </PageHeaderText>
        </PageHeader>
        {/* empty, the next step as on Moja nega (docs/patterns.md §5) */}
        <Attention title="Kartona još nema">
          <Card>
            <CardDescription>
              Karton se otvara iz upoznavanja sa Minnom. Čim odgovorite na njena pitanja, ovde je sve o osobi o kojoj brinete.
            </CardDescription>
            <CardFooter>
              <Button onClick={onGoToChat}>Idi na razgovor</Button>
            </CardFooter>
          </Card>
        </Attention>
      </Page>
    );
  }

  const age = parseInt(person.age, 10);
  const alerts = alertsOf(answers, record);
  const today = todayOf(care);
  const history = recordHistory(record, care);

  // the new place written in, with its line of history and what is said after
  const place = (kind, lines, flash) => {
    onChange({
      changes: [{ questionId: 'about-person', answer: { values: { ...person, city: move.to } } }],
      flash,
      entry: { kind, by: 'you', title: `Gde živi: ${move.from || '-'} → ${move.to}`, lines },
    });
    setMove(null);
  };
  // something about where she is that does not change the address
  const note = (entry, flash) => {
    onRecord((r) => written(r, care.now, { by: 'you', ...entry }));
    onFlash(flash);
    setMove(null);
  };

  // an entry of a list, written into the record with its line of history
  const saveEntry = (list, entry) => (values, mode) => {
    const id = entry?.id || `h${Date.now()}`;
    const line = entryLine(values);
    onRecord((r) =>
      written(
        {
          ...r,
          health: {
            ...r.health,
            [list.id]: entry ? r.health[list.id].map((e) => (e.id === id ? { ...e, ...values } : e)) : [...r.health[list.id], { id, ...values }],
          },
        },
        care.now,
        {
          kind: mode === 'change' ? 'state' : mode,
          by: 'you',
          title: `${list.title}: ${values.name}`,
          lines: entry
            ? [`Bilo je: ${[entry.name, entryLine(entry)].filter(Boolean).join(' · ')}.`, mode === 'correction' ? 'Ispravka zapisa.' : 'Promena stanja.']
            : [line].filter(Boolean),
        }
      )
    );
    onFlash('Upisano u karton.');
    setEditing(null);
  };
  const endEntry = (list, entry) => (when) => {
    onRecord((r) =>
      written({ ...r, health: { ...r.health, [list.id]: r.health[list.id].filter((e) => e.id !== entry.id) } }, care.now, {
        kind: 'ended',
        by: 'you',
        title: `${list.title}: ${entry.name}`,
        lines: [`${list.end} od ${when}.`],
      })
    );
    onFlash('Zapis je zaključen i ostaje u istoriji kartona.');
    setEditing(null);
  };

  return (
    <Page>
      <PageHeader>
        <PagePerson>
          <Avatar>
            <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
          </Avatar>
          <PageHeaderText>
            <PageTitle>{person.name}</PageTitle>
            <PageDescription>
              {['Medicinski karton', age ? pl(age, 'godina', 'godine', 'godina') : person.age, person.city].filter(Boolean).join(' · ')}
            </PageDescription>
          </PageHeaderText>
        </PagePerson>
        {/* The page's one action, and the one way to say her state has
            changed: the assistant opens already asking what. Anything else can
            be asked in the same conversation, so there is no second button. */}
        <PageActions>
          <Button onClick={onReportChange}>Prijavi promenu</Button>
        </PageActions>
      </PageHeader>

      {/* a change here rewrote the plan: where to see it, and take it back */}
      {planChange && plan && (
        <Attention title="Plan nege je izmenjen">
          <Card>
            <CardDescription>
              {planChange.touched.length > 0 ? `Promenilo se: ${planChange.touched.join(', ')}. ` : ''}
              Na planu vidite šta je drugačije i možete da poništite izmenu.
            </CardDescription>
            {/* what to do next, from the last thing written here */}
            {planChange.fromRecord && record.log[0]?.next?.length > 0 && (
              <Group label="Šta dalje">
                <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-body text-foreground">
                  {record.log[0].next.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </Group>
            )}
            <CardFooter>
              <Button onClick={onOpenPlan}>Pogledaj plan nege</Button>
            </CardFooter>
          </Card>
        </Attention>
      )}

      {/* the chart as it stands, and everything written into it: two views of one thing */}
      <Tabs value={side} onValueChange={setSide}>
        <TabsList aria-label="Šta prikazati">
          <TabsTrigger value="now">Stanje sada</TabsTrigger>
          <TabsTrigger value="history">Istorija</TabsTrigger>
        </TabsList>

        <TabsContent value="now" className="flex flex-col gap-8">
          <PageSection title="Ukratko">
            {alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Na šta paziti</CardTitle>
                </CardHeader>
                <Tags items={alerts} />
              </Card>
            )}
            <FrailtyScale answers={answers} />
          </PageSection>

          <PageSection title="Svakodnevica">
            <PartCard part={RECORD_PARTS.daily} answers={answers} onEdit={() => open({ part: RECORD_PARTS.daily })} />
            <PartCard part={RECORD_PARTS.support} answers={answers} onEdit={() => open({ part: RECORD_PARTS.support })} />
          </PageSection>

          <PageSection title="Zdravlje">
            {HEALTH.map((list) => (
              <HealthCard
                key={list.id}
                list={list}
                items={record.health[list.id]}
                onAdd={() => open({ list })}
                onOpen={(entry) => open({ list, entry })}
              />
            ))}
            {/* what these lists are, said once under them, where the cards' text starts */}
            <p className="px-4 text-small text-disabled">{NOTED_ONLY}</p>
          </PageSection>

          <PageSection title="Osnovno">
            <PartCard part={RECORD_PARTS.person} answers={answers} onEdit={() => open({ part: RECORD_PARTS.person })} />
            {/* her address is a card of its own: changing it is a move, with a flow of its own */}
            <Card>
              <CardHeader>
                <CardTitle>Gde živi</CardTitle>
                <CardAction>
                  <Button variant="secondary" size="icon" aria-label="Izmeni: Gde živi" title="Izmeni" onClick={() => open({ place: true })}>
                    <Pencil size={14} strokeWidth={1.75} />
                  </Button>
                </CardAction>
              </CardHeader>
              <Facts>
                <Fact label="Mesto">{person.city?.trim() || '-'}</Fact>
              </Facts>
            </Card>
            <PartCard part={RECORD_PARTS.contact} answers={answers} onEdit={() => open({ part: RECORD_PARTS.contact })} />
          </PageSection>
        </TabsContent>

        <TabsContent value="history">
          <History entries={history} today={today} />
        </TabsContent>
      </Tabs>

      {shown?.part && (
        <RecordChangeDialog
          key={shown.n}
          open={Boolean(editing?.part)}
          part={shown.part}
          answers={answers}
          notes={notes}
          plan={plan}
          care={care}
          onConfirm={(change) => {
            onChange(change);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {shown?.place && (
        <PlaceDialog
          key={shown.n}
          open={Boolean(editing?.place)}
          value={person.city || ''}
          onNext={(to) => {
            setEditing(null);
            setMove({ from: person.city || '', to });
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {shownMove && (
        <MoveDialog
          open={Boolean(move)}
          care={care}
          from={shownMove.from}
          to={shownMove.to}
          onCorrect={() => place('correction', ['Ispravka zapisa.'], 'Upisano u karton.')}
          onMove={(when) =>
            when
              ? place(
                  'state',
                  [`Selidba od ${when}.`, 'Koordinatorka zove oko negovateljica.'],
                  `Selidba je zabeležena od ${when}. Koordinatorka će vas pozvati oko negovateljica.`
                )
              : note(
                  { kind: 'added', title: `Selidba prijavljena: ${move.to}`, lines: ['Tamo još ne radimo. Koordinatorka zove da dogovori šta dalje.'] },
                  'Koordinatorka će vas pozvati oko selidbe.'
                )
          }
          onPause={(until) =>
            note(
              { kind: 'state', title: 'Privremeno je negde drugde', lines: [`Do ${until}. Adresa je ostala ista, a posete su pauzirane.`] },
              `Posete su pauzirane do ${until}. Adresa je ostala ista.`
            )
          }
          onClose={() => setMove(null)}
        />
      )}

      {shown?.list && (
        <RecordEntryDialog
          key={shown.n}
          open={Boolean(editing?.list)}
          list={shown.list}
          entry={shown.entry}
          care={care}
          onSave={saveEntry(shown.list, shown.entry)}
          onEnd={endEntry(shown.list, shown.entry)}
          onClose={() => setEditing(null)}
        />
      )}
    </Page>
  );
}
