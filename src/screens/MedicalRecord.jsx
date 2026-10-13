import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Page, PageActions, PageDescription, PageHeader, PageHeaderText, PagePerson, PageSection, PageTitle } from '@/components/page';
import { Fact, Facts } from '@/components/data-list';
import { useShowMore } from '@/hooks/use-show-more';
import Attention from '../components/Attention';
import FirstTime from '../components/FirstTime';
import FrailtyScale from '../components/FrailtyScale';
import ShowMore from '../components/ShowMore';
import Tags, { Group } from '../components/Tags';
import { dayLabel, hourText, todayOf } from '../data/familyCare';
import {
  HEALTH,
  HISTORY_KIND,
  NOTED_ONLY,
  RECORD_PARTS,
  alertsOf,
  entryLine,
  partRows,
  recordHistory,
} from '../data/record';
import { t, tn } from '../i18n';

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
// The page is read, not edited (11. 10.): there is no pencil on a part, no "+"
// on a list and nothing to press on an entry. Whatever is to be different, a
// change in her state, a correction of what was written wrong, a medicine, a
// move, is told to the assistant through "Prijavi promenu", the page's one
// action: it asks what it needs, proposes what follows and, once agreed,
// writes it here; the plan is built again from the same answers.

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

// a part read from the answers: its lines, and how many are not written yet
function PartCard({ part, answers }) {
  const { rows, missing } = partRows(part, answers);
  if (!rows.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(part.title)}</CardTitle>
        {missing > 0 && (
          <CardAction>
            <Badge>{t('Nije upisano: {count}', { count: missing })}</Badge>
          </CardAction>
        )}
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

// a list of entries, as rows: read here, changed through the assistant
function HealthCard({ list, items }) {
  return (
    <Card className="[&>[data-slot=item-group]]:mt-2">
      <CardHeader>
        <CardTitle>{t(list.title)}</CardTitle>
      </CardHeader>
      {items.length > 0 ? (
        <ItemGroup>
          {items.map((e) => (
            <Item key={e.id}>
              <ItemContent>
                <ItemTitle className={entryLine(e) ? 'mb-1' : undefined}>
                  {t(e.name)}
                </ItemTitle>
                {entryLine(e) && <ItemDescription>{entryLine(e)}</ItemDescription>}
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      ) : (
        <CardDescription>{t(list.empty)}</CardDescription>
      )}
    </Card>
  );
}

// who wrote it and when, as the line under an entry says
const byText = (e) =>
  e.by === 'you' ? (e.via === 'assistant' ? t('vi, preko asistenta') : t('vi')) : e.by === 'minna' ? 'Minna' : e.who || t('negovateljica');
const whenText = (e, today) => (e.day ? e.day.toLowerCase() : t('{day} u {time}', { day: dayLabel(Math.floor(e.at / 24), today).toLowerCase(), time: hourText(e.at) }));

function History({ entries, today }) {
  const list = useShowMore(entries);
  return (
    <Card className="[&>[data-slot=item-group]]:mt-2">
      <CardHeader>
        <CardTitle>{t('Istorija kartona')}</CardTitle>
      </CardHeader>
      <CardDescription>
        {tn(entries.length, 'stavka', 'stavke', 'stavki')} ·{' '}
        {t('najnovije prvo. Ništa se odavde ne briše: izmena se upisuje pored onoga što je bilo.')}
      </CardDescription>
      <ItemGroup>
        {list.visible.map((e) => (
          <Item key={e.id}>
            <ItemContent>
              <ItemTitle className="mb-1 flex-wrap">
                <span className="min-w-0">{t(e.title)}</span>
                <Badge variant={e.kind === 'state' ? 'default' : 'secondary'} className={overLine}>
                  {t(HISTORY_KIND[e.kind])}
                </Badge>
              </ItemTitle>
              <ItemDescription>
                {byText(e)} · {whenText(e, today)}
              </ItemDescription>
              {e.lines.map((line, i) => (
                <ItemDescription key={i}>{t(line)}</ItemDescription>
              ))}
              {e.next?.map((line, i) => (
                <ItemDescription key={i}>{t('Šta dalje: {step}', { step: line })}</ItemDescription>
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
  plan,
  care,
  record,
  planChange,
  onGoToChat,
  onOpenPlan,
  onReportChange,
}) {
  const [side, setSide] = useState('now');
  const person = answers['about-person']?.values || {};
  if (!person.name) {
    return (
      <Page>
        <PageHeader>
          <PageHeaderText>
            <PageTitle>{t('Medicinski karton')}</PageTitle>
            <PageDescription>{t('Sve o osobi o kojoj brinete, na jednom mestu.')}</PageDescription>
          </PageHeaderText>
        </PageHeader>
        {/* empty, the next step as on Moja nega (docs/patterns.md §5) */}
        <Attention title={t('Kartona još nema')}>
          <Card>
            <CardDescription>
              {t('Karton se otvara iz upoznavanja sa Minnom. Čim odgovorite na njena pitanja, ovde je sve o osobi o kojoj brinete.')}
            </CardDescription>
            <CardFooter>
              <Button onClick={onGoToChat}>{t('Idi na razgovor')}</Button>
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
              {[t('Medicinski karton'), age ? tn(age, 'godina', 'godine', 'godina') : person.age, person.city].filter(Boolean).join(' · ')}
            </PageDescription>
          </PageHeaderText>
        </PagePerson>
        {/* The page's one action, and the one way anything here is changed
            or put right: the assistant opens already asking what. Anything
            else can be asked in the same conversation, so there is no second
            button. */}
        <PageActions>
          <Button onClick={onReportChange}>{t('Prijavi promenu')}</Button>
        </PageActions>
      </PageHeader>

      {/* Why there is nothing to edit here, until the family has reported a
          first change and so knows (docs/patterns.md §4b). */}
      <FirstTime show={!record.log.some((e) => e.via === 'assistant')}>
        {t('Karton se ne menja ručno: sve promene i ispravke idu preko „Prijavi promenu".')}
      </FirstTime>

      {/* a change here rewrote the plan: where to see it, and take it back.
          Not when it left the plan as it was (a corrected age, a phone number):
          the history says so, and the banner would say the opposite. */}
      {planChange && plan && planChange.touched.length > 0 && (
        <Attention title={t('Plan nege je izmenjen')}>
          <Card>
            <CardDescription>
              {t('Promenilo se: {parts}.', { parts: planChange.touched.map((x) => t(x)).join(', ') })}{' '}
              {t('Na Mojoj nezi vidite šta je drugačije i možete da poništite izmenu.')}
            </CardDescription>
            {/* what to do next, from the last thing written here */}
            {planChange.fromRecord && record.log[0]?.next?.length > 0 && (
              <Group label={t('Šta dalje')}>
                <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-body text-foreground">
                  {record.log[0].next.map((line, i) => (
                    <li key={i}>{t(line)}</li>
                  ))}
                </ul>
              </Group>
            )}
            <CardFooter>
              <Button onClick={onOpenPlan}>{t('Pogledaj izmenu')}</Button>
            </CardFooter>
          </Card>
        </Attention>
      )}

      {/* the chart as it stands, and everything written into it: two views of one thing */}
      <Tabs value={side} onValueChange={setSide}>
        <TabsList aria-label={t('Šta prikazati')}>
          <TabsTrigger value="now">{t('Stanje sada')}</TabsTrigger>
          <TabsTrigger value="history">{t('Istorija')}</TabsTrigger>
        </TabsList>

        <TabsContent value="now" className="flex flex-col gap-8">
          <PageSection title={t('Ukratko')}>
            {alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('Na šta paziti')}</CardTitle>
                </CardHeader>
                <Tags items={alerts} />
              </Card>
            )}
            <FrailtyScale answers={answers} />
          </PageSection>

          <PageSection title={t('Svakodnevica')}>
            <PartCard part={RECORD_PARTS.daily} answers={answers} />
            <PartCard part={RECORD_PARTS.support} answers={answers} />
          </PageSection>

          <PageSection title={t('Zdravlje')}>
            {HEALTH.map((list) => (
              <HealthCard key={list.id} list={list} items={record.health[list.id]} />
            ))}
            {/* what these lists are, said once under them, where the cards' text starts */}
            <p className="px-4 text-small text-disabled">{t(NOTED_ONLY)}</p>
          </PageSection>

          <PageSection title={t('Osnovno')}>
            <PartCard part={RECORD_PARTS.person} answers={answers} />
            {/* her address is a card of its own: a new one is a move, not a detail */}
            <Card>
              <CardHeader>
                <CardTitle>{t('Gde živi')}</CardTitle>
              </CardHeader>
              <Facts>
                <Fact label={t('Mesto')}>{person.city?.trim() || '-'}</Fact>
              </Facts>
            </Card>
            <PartCard part={RECORD_PARTS.contact} answers={answers} />
          </PageSection>
        </TabsContent>

        <TabsContent value="history">
          <History entries={history} today={today} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
