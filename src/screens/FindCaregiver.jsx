import { useMemo, useState } from 'react';
import { Check, Phone, Search, Star } from 'lucide-react';
import { caregivers } from '../data/carePlan';
import { arrangementOf } from '../data/familyCare';
import Button from '../components/Button';
import AskAssistant from '../components/AskAssistant';

// Browsing for someone, as its own page rather than a button on one screen.
// The header shortcut on the dashboard opens this; wanting a second pair of
// hands, or a different one, is a thing a family can do at any time, and a
// capability that exists on only one screen is not a capability.

const AREAS = [...new Set(caregivers.map((c) => c.area))];

// where an earlier request to her stands, said on her card
const REQUEST_PILL = {
  pending: { className: 'is-pending', label: (r) => `Upit poslat ${r.requested}` },
  accepted: { className: 'is-accepted', label: () => 'Prihvatila' },
  declined: { className: 'is-declined', label: () => 'Odbila' },
};
const SKILLS = [...new Set(caregivers.flatMap((c) => c.tags))];

export default function FindCaregiver({ care, onContact, onDrawer, onFlash, onAskAssistant }) {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState(null);
  const [skill, setSkill] = useState(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = caregivers.filter((c) => {
      if (area && c.area !== area) return false;
      if (skill && !c.tags.includes(skill)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
    // best match first, as the recommendation it is
    return found.sort((a, b) => b.match - a.match);
  }, [query, area, skill]);

  // the message is written in the modal and sent once the subscription is paid
  const ask = (c) => onContact(c);

  const clear = () => {
    setQuery('');
    setArea(null);
    setSkill(null);
  };

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Pronađi negovateljicu</h1>
          <p className="view-sub">
            Na osnovu onoga što ste nam rekli, ovo su negovateljice koje najbolje odgovaraju. Upit im
            šalje plan nege i ništa ne košta — možete da pitate više njih, a ništa nije dogovoreno dok
            zajedno ne postavite uslove.
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
            placeholder="Ime, ili šta vam treba — demencija, obroci, noćne smene…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <p className="ag-label">Deo grada</p>
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

        <p className="ag-label">Čime se bave</p>
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
          {results.length} od {caregivers.length} negovateljica
        </span>
        {(query || area || skill) && (
          <button type="button" className="visit-raise" onClick={clear}>
            Poništi filtere
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="board-empty">
          Niko ne odgovara. Proširite deo grada ili uklonite neki filter.
        </p>
      ) : (
        <div className="view-list">
          {results.map((c) => {
            const request = care.requests.find((r) => r.caregiverId === c.id);
            const coming = arrangementOf(care, c.id);
            return (
              <div className="caregiver is-wide" key={c.id}>
                <div className="cg-avatar">{c.initials}</div>
                <div className="cg-main">
                  <div className="cg-top">
                    <button
                      type="button"
                      className="cg-name fam-name-link"
                      onClick={() => onDrawer({ kind: 'profile', caregiverId: c.id })}
                    >
                      {c.name}
                    </button>
                    <span className="status-pill is-attention">Poklapanje · {c.match}%</span>
                  </div>
                  <div className="cg-meta">
                    <Star size={11} strokeWidth={2} className="cg-star" />
                    {c.rating} ({c.reviews}) · {c.years} god. iskustva · {c.rate} · {c.area}, {c.distance}
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
                {/* Asking is not hiring. It sends the plan and waits — the terms
                    are set afterwards, by both of them. */}
                <div className="fam-find-actions">
                  <Button variant="ghost" onClick={() => onDrawer({ kind: 'profile', caregiverId: c.id })}>
                    Profil
                  </Button>
                  {coming ? (
                    <span className="status-pill is-accepted">
                      <Check size={12} strokeWidth={2} />
                      {coming.endedOn ? 'Dolazila ranije' : 'Već dolazi'}
                    </span>
                  ) : request ? (
                    <span className={`status-pill ${REQUEST_PILL[request.status].className}`}>
                      {request.status !== 'declined' && <Check size={12} strokeWidth={2} />}
                      {REQUEST_PILL[request.status].label(request)}
                    </span>
                  ) : (
                    <Button variant="primary" onClick={() => ask(c)}>
                      Pošalji poruku
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* The way out for someone who does not want to choose from a list. */}
      <div className="panel-card fam-coordinator">
        <Phone size={16} strokeWidth={1.75} />
        <p>
          Niste sigurni koju da izaberete? Koordinatorka poznaje svaku od njih i može da vas pozove danas.
        </p>
        <Button variant="secondary" onClick={() => onFlash('Koordinatorka će vas pozvati danas.')}>
          Pozovite me
        </Button>
      </div>
    </div>
  );
}
