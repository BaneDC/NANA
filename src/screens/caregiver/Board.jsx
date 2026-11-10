import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { Page, PageActions, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { Card, CardFooter, CardLink } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem, useFade } from '@/components/ui/toggle-group';
import { DataList, DataRow } from '@/components/data-list';
import { useIsPhone } from '@/hooks/use-phone';
import { activeVersion, firstName, money, pendingVersion, todayOf } from '../../data/familyCare';
import { cannotPlan } from '../../data/caregiverCare';
import { earnings, herMove, netOf } from '../../data/caregiverView';
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
  { id: 'request', chip: msg('Upiti'), title: msg('Novi upiti'), note: msg('Prihvati ili odbij'), empty: msg('Trenutno nema novih upita.') },
  { id: 'agreement', chip: msg('Ugovor'), title: msg('Ugovor o nezi'), note: msg('Koje usluge, i jedna cena po satu'), empty: msg('Nema ugovora koje treba postaviti.') },
  { id: 'active', chip: msg('Posete'), title: msg('Aktivno'), note: msg('Saradnja je u toku'), empty: msg('Još nema saradnji u toku.') },
  { id: 'work-order', chip: msg('Nalozi'), title: msg('Radni nalozi'), note: msg('Pošalji posle svake posete'), empty: msg('Nema šta da se fakturiše.') },
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
              {/* the family's page; for a new request, the same page as in Serbia */}
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
        {herMove(client, caregiverId) && (
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

// a column's width beside a phone: at least 288, the rest shared. On a phone it is the screen less 32, so the next
// one shows at the edge
const cell = 'min-w-[288px] flex-1 basis-0';
const slide = 'w-[calc(100%-32px)] shrink-0 snap-start snap-always';

// a column: the whole height of the board; its cards scroll inside it when
// there are more than fit. `extra` is the one figure it has, right of its note
function Column({ stage, children, count, extra, className }) {
  return (
    <section className={cn('flex min-h-0 flex-col gap-2 rounded-4xl bg-muted p-2', className)}>
      <header className="flex flex-col gap-1 px-4 pt-2 pb-1">
        <h2 className="flex items-center gap-2 text-small font-medium text-muted-foreground">
          {t(stage.title)}
          <Badge variant="secondary">{count}</Badge>
        </h2>
        <p className="flex items-baseline justify-between gap-3 text-small text-muted-foreground">
          {t(stage.note)}
          {extra && <span className="shrink-0 font-medium text-foreground">{extra}</span>}
        </p>
      </header>
      <div className="-m-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">{children}</div>
    </section>
  );
}

// the four chips on a phone, four equal parts. Under 375 there is no room for
// the count beside the name (360 included), so only the name, at 12; one that still does not fit
// ends in "…", and nothing wraps or leaves its chip
const chipRow =
  'grid grid-cols-4 *:w-full *:min-w-0 *:px-1 [&_.inline-grid]:w-full [&_.inline-grid]:grid-cols-[minmax(0,1fr)] [&_.inline-flex]:min-w-0 [&_.inline-flex]:gap-1 ' +
  'max-[375px]:*:text-small max-[375px]:[&_[data-count]]:hidden';

// the side of the row that has more fades in its last 32 (docs/patterns.md §12)
const fadeEdges =
  'data-[fade=end]:[mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)] ' +
  'data-[fade=start]:[mask-image:linear-gradient(to_left,#000_calc(100%-32px),transparent)] ' +
  'data-[fade=both]:[mask-image:linear-gradient(to_right,transparent,#000_32px,#000_calc(100%-32px),transparent)]';

export default function Board({ user, clients, caregiverId, onOpen, act, onEarnings }) {
  const phone = useIsPhone();
  const live = clients.filter((c) => STAGES.some((s) => s.id === c.stage));
  const of = (id) => live.filter((c) => c.stage === id);
  const [picked, setPicked] = useState(() => (STAGES.find((s) => of(s.id).length) || STAGES[0]).id);
  const e = earnings(clients, caregiverId);
  const requests = of('request');
  const oldest = Math.max(0, ...requests.map((c) => todayOf(c.care) - (c.request.requestedDay ?? todayOf(c.care))));
  const unbilled = of('work-order').reduce((n, c) => n + c.arrangement.visits.filter((v) => v.status === 'awaiting').reduce((m, v) => m + netOf(v), 0), 0);

  const cards = (id) =>
    of(id).length ? (
      of(id).map((c) => <BoardCard key={c.id} client={c} caregiverId={caregiverId} onOpen={onOpen} act={act} />)
    ) : (
      <p className="px-4 pb-2 text-xs leading-body text-muted-foreground">{t(STAGES.find((s) => s.id === id).empty)}</p>
    );

  // the one figure a column has, as production shows it
  const extra = {
    request: oldest > 0 ? t('najstariji: {n} d', { n: oldest }) : null,
    active: e.reserved ? t('{amount} na putu', { amount: money(e.reserved) }) : null,
    'work-order': unbilled ? t('{amount} nefakturisano', { amount: money(unbilled) }) : null,
  };
  const column = (s, className) => (
    <Column key={s.id} stage={s} count={of(s.id).length} extra={extra[s.id]} className={className}>
      {cards(s.id)}
    </Column>
  );

  // the row of columns: beside a phone it scrolls sideways when they do not
  // fit; on a phone one column at a time, a swipe moving exactly one, and the
  // chips above follow it, a chip bringing its column
  const [setFadeRow, fade] = useFade(true);
  const row = useRef(null);
  const steering = useRef(0);
  const toRow = (el) => ((row.current = el), setFadeRow(el));
  const slideTo = (id, smooth = true) => {
    const el = row.current;
    const i = STAGES.findIndex((s) => s.id === id);
    if (!el || i < 0) return;
    steering.current = Date.now();
    el.scrollTo({ left: el.children[i].offsetLeft - el.children[0].offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
  };
  const follow = () => {
    const el = row.current;
    if (!phone || !el || Date.now() - steering.current < 600) return;
    const step = el.children[1].offsetLeft - el.children[0].offsetLeft;
    const id = STAGES[Math.round(el.scrollLeft / step)]?.id;
    if (id && id !== picked) setPicked(id);
  };
  // on a phone it opens on the first column with something in it
  useEffect(() => {
    if (phone) slideTo(picked, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  return (
    // the board takes the width it is given and fits the screen's height: the
    // page does not scroll, the columns do, and the row of them sideways
    // (docs/patterns.md §12c)
    <Page className="@container overflow-y-hidden *:max-w-none">
      {/* 24 in, where the text in the columns is (a column is 8 around its
          cards), not 16 as over a plain card (docs/patterns.md §12c) */}
      <PageHeader className="pl-6">
        <PageHeaderText>
          <PageTitle>{t('Vaša tabla')}</PageTitle>
          {/* on a phone the board's own names say it, and the lines go to the columns */}
          <PageDescription className="phone:hidden">{t('{name}, sve što čeka na vas, sleva nadesno, redom kojim se dešava.', { name: firstName(user.name) })}</PageDescription>
        </PageHeaderText>
        {/* what she has been paid so far, the way to her earnings */}
        <PageActions>
          <Button variant="secondary" onClick={onEarnings}>
            {/* on a phone it shares the title's line, so only the sum */}
            {phone ? t('{amount} isplaćeno', { amount: money(e.paidTotal) }) : t('{amount} isplaćeno do sada', { amount: money(e.paidTotal) })}
          </Button>
        </PageActions>
      </PageHeader>

      {phone && (
        // all four at once, as four equal parts: not a filter but the whole
        // board's way, each with its count (docs/patterns.md §12c); the short
        // name, the full one being the column's own title under it
        <ToggleGroup type="single" size="sm" className={chipRow} value={picked} onValueChange={(v) => v && (setPicked(v), slideTo(v))} aria-label={t('Kolone table')}>
          {STAGES.map((s) => (
            <ToggleGroupItem key={s.id} value={s.id}>
              <span className="min-w-0 truncate">{t(s.chip)}</span>
              <span data-count className="shrink-0 text-small text-disabled in-data-[state=on]:text-inherit in-data-[state=on]:opacity-80">{of(s.id).length}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {/* out to the pane's edges, so a column is cut there, fading, and not
          short of it */}
      <div
        ref={toRow}
        data-fade={fade}
        onScroll={follow}
        className={cn(
          'flex min-h-0 flex-1 gap-3 overflow-x-auto [scrollbar-width:thin]',
          phone ? '-mx-4! w-auto! min-w-0 snap-x snap-mandatory scroll-px-4 px-4 [scrollbar-width:none]' : '-mx-6! w-auto! min-w-0 scroll-px-6 px-6',
          fadeEdges
        )}
      >
        {STAGES.map((s) => column(s, phone ? slide : cell))}
      </div>
    </Page>
  );
}
