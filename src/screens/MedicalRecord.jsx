import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemLink, ItemTitle } from '@/components/ui/item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Page, PageActions, PageDescription, PageHeader, PageHeaderText, PagePerson, PageSection, PageTitle } from '@/components/page';
import { Fact, Facts } from '@/components/data-list';
import { useKept } from '@/hooks/use-kept';
import { useShowMore } from '@/hooks/use-show-more';
import AskAssistant from '../components/AskAssistant';
import Attention from '../components/Attention';
import FrailtyScale from '../components/FrailtyScale';
import RecordChangeDialog from '../components/RecordChangeDialog';
import RecordEntryDialog from '../components/RecordEntryDialog';
import ShowMore from '../components/ShowMore';
import Tags from '../components/Tags';
import { dayLabel, hourText, pl, todayOf } from '../data/familyCare';
import { questionById } from '../data/flow';
import { srField } from '../data/flow.sr';
import {
  HEALTH,
  HISTORY_KIND,
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
// and aids; who she is and who to call; how it began. Every part that can
// change has its own way in, and nothing is saved as it is typed: a change
// says what it does to the care plan first (RecordChangeDialog), and is then
// written into the history.

// a group's name starts where the text in its cards does, 16 in
const group = '[&>h2]:pl-4';

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
          <Button variant="secondary" size="icon" aria-label={`Izmeni: ${part.title}`} title="Izmeni" onClick={onEdit}>
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
const byText = (e) => (e.by === 'you' ? 'vi' : e.by === 'minna' ? 'Minna' : e.who || 'negovateljica');
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
  onAskAssistant,
}) {
  const [side, setSide] = useState('now');
  // what is being changed: { part } or { list, entry? }; kept while it closes
  const [editing, setEditing] = useState(null);
  const shown = useKept(editing);
  // each opening is a dialog of its own, starting from what is written now
  const open = (what) => setEditing({ ...what, n: Date.now() });

  const person = answers['about-person']?.values || {};
  const you = answers['about-you']?.values || {};

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
  const contact = questionById['about-you'].fields.map((f) => ({
    key: f.id,
    label: srField(questionById['about-you'], f.id),
    value: you[f.id] || '-',
  }));

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
        {/* on a narrow screen the assistant is in the top bar, and nothing is
            left here to go under her name */}
        <PageActions className="narrow:hidden">
          <AskAssistant onClick={onAskAssistant} />
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
          <PageSection className={group} title="Ukratko">
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

          <PageSection className={group} title="Svakodnevica">
            <PartCard part={RECORD_PARTS.daily} answers={answers} onEdit={() => open({ part: RECORD_PARTS.daily })} />
            <PartCard part={RECORD_PARTS.support} answers={answers} onEdit={() => open({ part: RECORD_PARTS.support })} />
          </PageSection>

          <PageSection className={group} title="Zdravlje">
            {HEALTH.map((list) => (
              <HealthCard
                key={list.id}
                list={list}
                items={record.health[list.id]}
                onAdd={() => open({ list })}
                onOpen={(entry) => open({ list, entry })}
              />
            ))}
          </PageSection>

          <PageSection className={group} title="Osnovno">
            <PartCard part={RECORD_PARTS.person} answers={answers} onEdit={() => open({ part: RECORD_PARTS.person })} />
            <Card>
              <CardHeader>
                <CardTitle>Kontakt osoba</CardTitle>
              </CardHeader>
              <Facts>
                {contact.map((r) => (
                  <Fact key={r.key} label={r.label}>
                    {r.value}
                  </Fact>
                ))}
              </Facts>
            </Card>
          </PageSection>

          <PageSection className={group} title="Povod">
            <PartCard part={RECORD_PARTS.onset} answers={answers} onEdit={() => open({ part: RECORD_PARTS.onset })} />
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
