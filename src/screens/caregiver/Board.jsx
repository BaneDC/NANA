import { useState } from 'react';
import { motion } from 'motion/react';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { Card, CardFooter, CardLink } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DataList, DataRow } from '@/components/data-list';
import { useIsPhone } from '@/hooks/use-phone';
import StatCard from '../../components/StatCard';
import { activeVersion, firstName, monthOfDay, money, pendingVersion, todayOf } from '../../data/familyCare';
import { cannotPlan } from '../../data/caregiverCare';
import { earnings, netOf } from '../../data/caregiverView';
import { scheduleText } from '../../data/familyStart';
import { msg, t } from '@/i18n';

// Her home: every family that needs her next, left to right in the order the
// work happens, each in the one column that names what she owes them
// (docs/superpowers/specs/2026-10-19-negovateljica-finska-design.md). Cards are
// not dragged: where a family sits follows from what has been done.
//
// A column is a grey tray around white cards, as the orange part is (r32, p8
// around r24, docs/patterns.md §5). On a phone there is no room for four
// trays side by side: the columns become one row of chips and the cards of the
// chosen one are under it (§12).

const STAGES = [
  { id: 'request', title: msg('Novi upiti'), note: msg('Prihvati ili odbij'), empty: msg('Trenutno nema novih upita.') },
  { id: 'agreement', title: msg('Ugovor o nezi'), note: msg('Koje usluge, i jedna cena po satu'), empty: msg('Nema ugovora koje treba postaviti.') },
  { id: 'active', title: msg('Aktivno'), note: msg('Saradnja je u toku'), empty: msg('Još nema saradnji u toku.') },
  { id: 'work-order', title: msg('Radni nalozi'), note: msg('Pošalji posle svake posete'), empty: msg('Nema šta da se fakturiše.') },
];

const initials = (name) =>
  (name || '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

function BoardCard({ client, caregiverId, onOpen, act }) {
  const { care, request: r, arrangement: a, stage } = client;
  const today = todayOf(care);
  const act0 = a && activeVersion(a);
  const pen = a && pendingVersion(a);
  const due = a?.visits.find((v) => v.status === 'awaiting');
  const next = a?.visits.find((v) => v.status === 'planned');
  const why = stage === 'active' && cannotPlan(care, caregiverId);
  const waited = r?.requestedDay != null ? today - r.requestedDay : null;

  const badge =
    stage === 'request' ? (
      <Badge variant="warning">{waited > 0 ? t('Čeka {n} d', { n: waited }) : t('Novo')}</Badge>
    ) : stage === 'agreement' && pen ? (
      <Badge variant="warning">{t('Čeka porodicu')}</Badge>
    ) : stage === 'work-order' ? (
      <Badge variant="destructive">{t('Nije poslato')}</Badge>
    ) : null;

  return (
    <motion.div layout transition={{ duration: 0.25 }}>
      <Card>
        <div className="flex items-start gap-3 [--avatar:calc(var(--text-xs-leading)+2px+var(--text-body-leading))]">
          <Avatar>
            <AvatarFallback>{initials(care.elder.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="-mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground">
              <CardLink onClick={() => onOpen(client.id)}>{care.elder.name}</CardLink>
              {badge && <span className="my-[calc((var(--text-xs-leading)-20px)/2)]">{badge}</span>}
            </p>
            <p className="text-xs leading-body text-muted-foreground">
              {[care.elder.area, care.family.name && firstName(care.family.name)].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <DataList className="mt-2">
          {stage === 'request' && care.need && <DataRow label={t('Kada')}>{scheduleText(care.need.schedule)}</DataRow>}
          {stage === 'request' && care.need && <DataRow label={t('Sati')}>{t('{hours} h nedeljno', { hours: care.need.hours })}</DataRow>}
          {(pen || act0) && <DataRow label={t('Cena')}>{t('{rate} / h', { rate: money((pen || act0).rate) })}</DataRow>}
          {stage === 'active' && <DataRow label={t('Sledeća poseta')}>{next ? `${next.date} · ${next.time}` : t('Još ništa nije planirano')}</DataRow>}
          {due && <DataRow label={t('Poseta')}>{`${due.date} · ${due.time}`}</DataRow>}
          {due && <DataRow label={t('Vi dobijate')}>{money(netOf(due))}</DataRow>}
        </DataList>
        {why && <p className="text-xs leading-body text-muted-foreground">{why}</p>}
        {(stage === 'request' || (stage === 'agreement' && !pen) || (stage === 'active' && !why) || stage === 'work-order') && (
          <CardFooter>
            {stage === 'request' && (
              <>
                <Button onClick={() => act('accept', client)}>{t('Prihvati')}</Button>
                <Button variant="secondary" onClick={() => act('decline', client)}>
                  {t('Odbij')}
                </Button>
              </>
            )}
            {stage === 'agreement' && <Button onClick={() => act('terms', client)}>{t('Pošalji ugovor')}</Button>}
            {stage === 'active' && <Button onClick={() => act('plan', client)}>{t('Pošalji plan posete')}</Button>}
            {stage === 'work-order' && <Button onClick={() => act('work-order', client, { visitId: due.id })}>{t('Pošalji radni nalog')}</Button>}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}

function Column({ stage, children, count }) {
  return (
    <section className="flex min-h-0 min-w-0 flex-col gap-2 rounded-4xl bg-muted p-2">
      <header className="flex flex-col gap-1 px-4 pt-2 pb-1">
        <h2 className="flex items-center gap-2 text-small font-medium text-muted-foreground">
          {t(stage.title)}
          <Badge variant="secondary">{count}</Badge>
        </h2>
        <p className="text-small text-muted-foreground">{t(stage.note)}</p>
      </header>
      {children}
    </section>
  );
}

export default function Board({ user, clients, caregiverId, onOpen, act }) {
  const phone = useIsPhone();
  const live = clients.filter((c) => STAGES.some((s) => s.id === c.stage));
  const of = (id) => live.filter((c) => c.stage === id);
  const [picked, setPicked] = useState(() => (STAGES.find((s) => of(s.id).length) || STAGES[0]).id);
  const e = earnings(clients, caregiverId);
  const requests = of('request');
  const oldest = Math.max(0, ...requests.map((c) => todayOf(c.care) - (c.request.requestedDay ?? todayOf(c.care))));
  const unbilled = of('work-order').reduce((n, c) => n + c.arrangement.visits.filter((v) => v.status === 'awaiting').reduce((m, v) => m + netOf(v), 0), 0);
  const month = clients[0] ? monthOfDay(todayOf(clients[0].care)) : '';

  const cards = (id) =>
    of(id).length ? (
      of(id).map((c) => <BoardCard key={c.id} client={c} caregiverId={caregiverId} onOpen={onOpen} act={act} />)
    ) : (
      <p className="px-4 pb-2 text-xs leading-body text-muted-foreground">{t(STAGES.find((s) => s.id === id).empty)}</p>
    );

  return (
    // the board takes the width it is given, as the designer had it
    <Page className="@container *:max-w-none">
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{t('Vaša tabla')}</PageTitle>
          <PageDescription>{t('{name}, sve što čeka na vas, sleva nadesno, redom kojim se dešava.', { name: firstName(user.name) })}</PageDescription>
        </PageHeaderText>
      </PageHeader>

      <div className="grid grid-cols-4 gap-3 @max-[672px]:grid-cols-2">
        <StatCard value={requests.length} label={t('Za odgovor')} note={requests.length ? t('Najstariji: {n} d', { n: oldest }) : t('Ništa ne čeka')} />
        <StatCard value={of('agreement').filter((c) => !pendingVersion(c.arrangement)).length} label={t('Ugovori za slanje')} note={of('agreement').filter((c) => !pendingVersion(c.arrangement)).length ? t('Blokira svaku posetu') : t('Sve poslato')} />
        <StatCard value={of('work-order').length} label={t('Neposlati radni nalozi')} note={of('work-order').length ? t('{amount} nefakturisano', { amount: money(unbilled) }) : t('Sve poslato')} />
        <StatCard value={money(e.paidThisMonth)} label={t('Isplaćeno vam u {month}', { month })} note={t('{amount} u obradi', { amount: money(e.processing) })} />
      </div>

      {phone ? (
        <>
          {/* one column at a time: a row of chips that scrolls sideways (§12) */}
          <ToggleGroup type="single" size="sm" scroll className="items-center" value={picked} onValueChange={(v) => v && setPicked(v)} aria-label={t('Kolone table')}>
            {STAGES.map((s) => (
              <ToggleGroupItem key={s.id} value={s.id}>
                {t(s.title)}
                <span className="text-small text-disabled in-data-[state=on]:text-inherit in-data-[state=on]:opacity-80">{of(s.id).length}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="flex flex-col gap-2">{cards(picked)}</div>
        </>
      ) : (
        <div className="grid grid-cols-4 items-start gap-3 @max-[1100px]:grid-cols-2">
          {STAGES.map((s) => (
            <Column key={s.id} stage={s} count={of(s.id).length}>
              {cards(s.id)}
            </Column>
          ))}
        </div>
      )}
    </Page>
  );
}
