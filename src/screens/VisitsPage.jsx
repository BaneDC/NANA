import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import VisitRow from '../components/family/VisitRow';
import { allVisits, dayOf, firstName, monthOf, pl } from '../data/familyCare';

// Every visit, newest first, across everyone who has come: who came, how long
// they stayed, how the day went and what it cost. Grouped by month, because
// that is how a family looks something up ("what happened in April").

const PAGE = 8;

export default function VisitsPage({ care, onDrawer, onBack }) {
  const [who, setWho] = useState('all');
  const [shown, setShown] = useState(PAGE);
  const elder = firstName(care.elder.name);

  const all = allVisits(care)
    .filter((v) => v.status !== 'cancelled' || v.cancelledBy)
    .sort((a, b) => dayOf(b.date) - dayOf(a.date));
  const picked = who === 'all' ? all : all.filter((v) => v.caregiver.id === who);
  const visible = picked.slice(0, shown);

  const groups = [];
  for (const v of visible) {
    const month = monthOf(v.date);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.visits.push(v);
    else groups.push({ month, visits: [v] });
  }

  const people = care.arrangements.map((a) => ({ id: a.caregiver.id, name: a.caregiver.name, ended: Boolean(a.endedOn) }));

  return (
    <div className="view">
      <button type="button" className="fam-back" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Moja nega
      </button>

      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Posete</h1>
          <p className="view-sub">
            Sve posete, od najnovije. Ko je dolazio, koliko je ostao i kako je prošao dan.
          </p>
        </div>
      </div>

      <div className="fam-filter" role="group" aria-label="Čije posete">
        {[{ id: 'all', name: 'Sve' }, ...people].map((p) => (
          <button
            key={p.id}
            type="button"
            className={`svc is-sm${who === p.id ? ' is-on' : ''}`}
            aria-pressed={who === p.id}
            onClick={() => {
              setWho(p.id);
              setShown(PAGE);
            }}
          >
            {p.name}
            {p.ended && <span className="fam-filter-note">ranije</span>}
          </button>
        ))}
        <span className="fam-filter-count">
          {picked.length === all.length ? pl(all.length, 'poseta', 'posete', 'poseta') : `${picked.length} od ${all.length}`}
        </span>
      </div>

      {groups.map((g) => (
        <section key={g.month} className="panel-card">
          <div className="panel-card-head">
            <p className="doc-section-title">{g.month}</p>
            <span className="status-pill is-muted">
              {pl(g.visits.length, 'poseta', 'posete', 'poseta')}
            </span>
          </div>
          <ul className="fam-visits">
            {g.visits.map((v) => (
              <VisitRow key={v.id} visit={v} showWho onDrawer={onDrawer} />
            ))}
          </ul>
        </section>
      ))}

      {!picked.length && (
        <div className="panel-card fam-quiet">
          <p>Još nema poseta.</p>
        </div>
      )}

      {picked.length > shown && (
        <button type="button" className="visit-more" onClick={() => setShown((n) => n + PAGE)}>
          Prikaži još {Math.min(PAGE, picked.length - shown)}
        </button>
      )}
    </div>
  );
}
