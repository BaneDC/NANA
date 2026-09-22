import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
      className="board-empty"
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
    <section className="board-col">
      <header className="board-col-head">
        <p className="board-col-title">
          {stage.title}
          <span className="board-col-count">{cards.length}</span>
        </p>
        <p className="board-col-note">{stage.note}</p>
      </header>
      <div className="board-col-body">
        <AnimatePresence mode="popLayout" initial={false}>
          {cards.length === 0 ? <Empty key="empty" stage={stage.id} /> : children}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Stat({ value, label, note, tone }) {
  return (
    <div className={`stat${tone ? ` is-${tone}` : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {note && <span className="stat-note">{note}</span>}
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
    <div className="view is-board">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Vaša tabla</h1>
          <p className="view-sub">
            {user.name ? `${user.name.split(' ')[0]}, sve` : 'Sve'} što čeka na vas, sleva nadesno, redom
            kojim se dešava.
          </p>
        </div>
      </div>

      <div className="stat-row is-four">
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

      <motion.div className="board" layout>
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
    </div>
  );
}
