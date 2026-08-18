import { useMemo, useState } from 'react';
import { Check, Search, Star } from 'lucide-react';
import { caregivers } from '../data/carePlan';
import Button from '../components/Button';
import AskAssistant from '../components/AskAssistant';

// Browsing for someone, as its own page rather than a button on one screen.
// The header shortcut on the dashboard opens this; wanting a second pair of
// hands, or a different one, is a thing a family can do at any time, and a
// capability that exists on only one screen is not a capability.

const AREAS = [...new Set(caregivers.map((c) => c.area))];
const SKILLS = [...new Set(caregivers.flatMap((c) => c.tags))];

export default function FindCaregiver({ onAskAssistant }) {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState(null);
  const [skill, setSkill] = useState(null);
  const [requested, setRequested] = useState([]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return caregivers.filter((c) => {
      if (area && c.area !== area) return false;
      if (skill && !c.tags.includes(skill)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, area, skill]);

  const clear = () => {
    setQuery('');
    setArea(null);
    setSkill(null);
  };

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Find a caregiver</h1>
          <p className="view-sub">
            Everyone available near you. Requesting sends them your care plan — they reply, and
            nothing is agreed until you both set the terms.
          </p>
        </div>
        <AskAssistant onClick={onAskAssistant} />
      </div>

      <div className="panel-card">
        <label className="find-search">
          <Search size={14} strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            placeholder="A name, or what you need — dementia, meals, overnight…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <p className="ag-label">Area</p>
        <div className="ag-services">
          {AREAS.map((a) => (
            <button
              key={a}
              type="button"
              className={`svc is-sm${area === a ? ' is-on' : ''}`}
              onClick={() => setArea(area === a ? null : a)}
              aria-pressed={area === a}
            >
              {a}
            </button>
          ))}
        </div>

        <p className="ag-label">What they do</p>
        <div className="ag-services">
          {SKILLS.map((t) => (
            <button
              key={t}
              type="button"
              className={`svc is-sm${skill === t ? ' is-on' : ''}`}
              onClick={() => setSkill(skill === t ? null : t)}
              aria-pressed={skill === t}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="find-count">
        <span>
          {results.length} of {caregivers.length} caregivers
        </span>
        {(query || area || skill) && (
          <button type="button" className="visit-raise" onClick={clear}>
            Clear the filters
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="board-empty">
          Nobody matches that. Widen the area, or drop one of the filters.
        </p>
      ) : (
        <div className="view-list">
          {results.map((c) => {
            const sent = requested.includes(c.id);
            return (
              <div className="caregiver is-wide" key={c.id}>
                <div className="cg-avatar">{c.initials}</div>
                <div className="cg-main">
                  <div className="cg-top">
                    <span className="cg-name">{c.name}</span>
                  </div>
                  <div className="cg-meta">
                    <Star size={11} strokeWidth={2} className="cg-star" />
                    {c.rating} ({c.reviews}) · {c.years} yrs · {c.rate} · {c.area}, {c.distance}
                  </div>
                  <p className="cg-bio">{c.bio}</p>
                  <div className="cg-tags">
                    {c.tags.map((t) => (
                      <span className="cg-tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Requesting is not hiring. It sends the plan and waits — the
                    terms are set afterwards, by both of them. */}
                {sent ? (
                  <span className="status-pill is-accepted">
                    <Check size={12} strokeWidth={2} />
                    Requested
                  </span>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => setRequested((r) => [...r, c.id])}
                  >
                    Request
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
