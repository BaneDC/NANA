import { ArrowRight } from 'lucide-react';

// A set of answer changes, one per line: the question, then what it was and what
// it becomes — or, for a list, what comes off it and what goes on. The same rows
// read the proposal in the assistant and the change at the top of the plan, so
// the family sees one change described one way.
export default function ChangeRows({ rows, notes = [], stacked }) {
  return (
    <ul className={`pc-rows${stacked ? ' is-stacked' : ''}`}>
      {rows.map((r) => (
        <li key={r.questionId} className="pc-row">
          <span className="pc-row-q">{r.title}</span>
          {r.added || r.removed ? (
            <span className="pc-row-list">
              {r.removed.length > 0 && (
                <span className="pc-chip is-removed">
                  Više ne: {r.removed.join(', ')}
                </span>
              )}
              {r.added.length > 0 && <span className="pc-chip is-added">Sada i: {r.added.join(', ')}</span>}
            </span>
          ) : (
            <span className="pc-row-change">
              <span className="pc-was">{r.before}</span>
              <ArrowRight size={12} strokeWidth={1.75} />
              <span className="pc-now">{r.after}</span>
            </span>
          )}
        </li>
      ))}
      {notes.map((t) => (
        <li key={t} className="pc-row">
          <span className="pc-row-q">Beleška</span>
          <span className="pc-row-change">
            <span className="pc-now">„{t.replace(/[.„“"]+$/g, '')}“</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
