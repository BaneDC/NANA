import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { cn } from '@/lib/utils';
import BoardCard from '../../components/caregiver/BoardCard';
import { STAGES, boardSummary, money } from '../../data/caregiverBoard';

// The caregiver's home screen. Four columns, left to right in the order the
// work actually happens, and a card only ever sits in the column that names
// what she owes that family next.
//
// Cards are not dragged. Where a family sits is not her opinion, it is a
// consequence of what she has done — and the two things she does first, accept
// and decline, have no direction to drag in anyway.

const EMPTY_COPY = {
  request: 'Trenutno nema novih upita.',
  agreement: 'Nema ugovora koje treba postaviti.',
  active: 'Još nema saradnji u toku.',
  'work-order': 'Nema šta da se fakturiše. Sve posete su izmirene.',
};

// Forwards a ref for the same reason the cards do — it shares their
// `popLayout` presence, and takes their place when a column runs dry.
const Empty = forwardRef(function Empty({ stage }, ref) {
  return (
    <motion.p
      ref={ref}
      className="rounded-2xl border border-dashed px-3 py-4 text-center text-xs leading-body text-disabled"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
    >
      {EMPTY_COPY[stage]}
    </motion.p>
  );
});

function Column({ stage, cards, children }) {
  return (
    // a grey column, r24, its cards 8 apart and scrolling inside it
    <section className="flex min-h-0 min-w-[320px] flex-[1_1_0] flex-col rounded-3xl bg-muted p-3">
      <header className="shrink-0 px-1 pb-3">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          {stage.title}
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-elevated-4 px-2 text-[11px] leading-4 text-muted-foreground">
            {cards.length}
          </span>
        </p>
        <p className="mt-1 text-[11px] leading-4 text-disabled">{stage.note}</p>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-0 [&.is-scrolling::-webkit-scrollbar-thumb]:bg-black/20">
        <AnimatePresence mode="popLayout" initial={false}>
          {cards.length === 0 ? <Empty key="empty" stage={stage.id} /> : children}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Stat({ value, label, note, tone }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-card px-4 py-3 shadow-card">
      <span
        className={cn(
          'text-[22px] leading-7 font-medium text-foreground',
          tone === 'warn' && 'text-warning',
          tone === 'urgent' && 'text-destructive'
        )}
      >
        {value}
      </span>
      <span className="text-small text-muted-foreground">{label}</span>
      {note && <span className={cn('text-[11px] leading-4 text-disabled', tone === 'urgent' && 'text-destructive')}>{note}</span>}
    </div>
  );
}

export default function CaregiverBoard({ user, clients, paid, actions }) {
  const s = boardSummary(clients);

  const waitNote =
    s.requests === 0
      ? 'Ništa ne čeka'
      : s.oldestRequest >= 24
        ? `Najstariji: ${Math.floor(s.oldestRequest / 24)} d`
        : `Najstariji: ${s.oldestRequest} h`;

  return (
    // the board takes the whole width and does not scroll as a page: its
    // columns do
    <Page className="overflow-hidden pb-4 *:max-w-none phone:pb-4">
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Vaša tabla</PageTitle>
          <PageDescription>
            {user.name ? `${user.name.split(' ')[0]}, sve` : 'Sve'} što čeka na vas, sleva nadesno, redom
            kojim se dešava.
          </PageDescription>
        </PageHeaderText>
      </PageHeader>

      <div className="grid grid-cols-4 gap-2">
        <Stat
          value={s.requests}
          label="Za odgovor"
          note={waitNote}
          tone={s.oldestRequest >= 24 ? 'warn' : null}
        />
        <Stat
          value={s.toSend}
          label="Ugovori za slanje"
          note={s.toSend ? 'Blokira svaku posetu' : 'Sve poslato'}
          tone={s.toSend ? 'warn' : null}
        />
        {/* Not sent is money she has done the work for and not asked for; it is
            the only one of the three she can do anything about. */}
        <Stat
          value={s.workOrders}
          label="Neposlati radni nalozi"
          note={s.workOrders ? `${money(s.unbilled)} nefakturisano` : 'Sve poslato'}
          tone={s.workOrders ? 'urgent' : null}
        />
        <Stat
          value={money(paid)}
          label="Isplaćeno vam u avgustu"
          note={
            s.awaiting > 0
              ? `${money(s.awaiting)} u obradi`
              : `Saradnji u toku: ${s.active}`
          }
        />
      </div>

      <motion.div className="flex min-h-0 flex-1 items-stretch gap-3 overflow-x-auto pb-2" layout>
        {STAGES.map((stage) => {
          const cards = clients.filter((c) => c.stage === stage.id);
          return (
            <Column key={stage.id} stage={stage} cards={cards}>
              {cards.map((c) => (
                <BoardCard key={c.id} client={c} {...actions} />
              ))}
            </Column>
          );
        })}
      </motion.div>
    </Page>
  );
}
