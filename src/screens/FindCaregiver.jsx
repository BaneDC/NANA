import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Phone, Search, Star } from 'lucide-react';
import { caregivers, matchReasons, ratingText } from '../data/carePlan';
import { arrangementOf } from '../data/familyCare';
import Button from '../components/Button';
import { Field, Input } from '../components/TextField';
import AskAssistant from '../components/AskAssistant';

// Browsing for someone, as its own page rather than a button on one screen.
// The header shortcut on the dashboard opens this; wanting a second pair of
// hands, or a different one, is a thing a family can do at any time, and a
// capability that exists on only one screen is not a capability.

// where an earlier request to her stands, said on her card
const REQUEST_PILL = {
  pending: { className: 'is-pending', label: (r) => `Upit poslat ${r.requested}` },
  accepted: { className: 'is-accepted', label: () => 'Prihvatila' },
  declined: { className: 'is-declined', label: () => 'Odbila' },
};

// How many fit on a page. The list is ordered by how well each one matches the
// plan, so a page is "the next few best", not an arbitrary slice.
const PER_PAGE = 10;

export default function FindCaregiver({ care, onContact, onDrawer, onFlash, onAskAssistant }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = caregivers.filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        [...c.classifications, ...c.languages].some((t) => t.toLowerCase().includes(q))
      );
    });
    // best match first, as the recommendation it is
    return found.sort((a, b) => b.match - a.match);
  }, [query]);

  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  // A search that shortens the list can leave you on a page that no longer
  // exists; the first page of the new results is where you meant to be.
  useEffect(() => {
    setPage(1);
  }, [query]);
  const shown = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // the message is written in the modal and sent once the subscription is paid
  const ask = (c) => onContact(c);

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

      {/* One field, on the page rather than in a card of its own: a card around
          a single field was a frame around a frame. The chips that used to sit
          under it filtered by area and by what she does, which is the plan's
          job — the list is already ordered by how well each one fits it. */}
      <Field>
        <Input
          icon={Search}
          type="search"
          value={query}
          placeholder="Ime, grad, jezik ili lähihoitaja"
          aria-label="Pretraga negovateljica"
          onChange={setQuery}
        />
      </Field>

      <div className="find-count">
        {/* what this page shows, out of everyone the search leaves */}
        <span>
          {shown.length} od {results.length} negovateljica
        </span>
        {query && (
          <button type="button" className="visit-raise" onClick={() => setQuery('')}>
            Poništi pretragu
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="board-empty">Niko ne odgovara pretrazi. Probajte drugu reč.</p>
      ) : (
        <div className="view-list">
          {shown.map((c) => {
            const request = care.requests.find((r) => r.caregiverId === c.id);
            const coming = arrangementOf(care, c.id);
            return (
              // The whole card opens her profile — the name is the link, and it
              // covers the card. The one action sits in the card's footer; on a
              // phone it goes, because the profile a tap opens has it too.
              <div className="caregiver is-wide is-clickable" key={c.id}>
                <div className="cg-avatar">{c.initials}</div>
                <div className="cg-main">
                  <div className="cg-top">
                    <button
                      type="button"
                      className="cg-name card-link"
                      onClick={() => onDrawer({ kind: 'profile', caregiverId: c.id })}
                    >
                      {c.name}
                    </button>
                    <span className="status-pill is-attention">Poklapanje · {c.match}%</span>
                    <ChevronRight className="card-go" size={16} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="cg-meta">
                    <Star size={11} strokeWidth={2} className="cg-star" />
                    {ratingText(c)} · {c.rate} · {c.area}, do {c.radius} km
                  </div>
                  {/* why she comes up, the way the platform says it */}
                  <p className="cg-bio">
                    {matchReasons(c).map((r, i) => (
                      <span key={r}>
                        {i > 0 && ' · '}
                        <Check size={12} strokeWidth={2.5} className="cg-star" />
                        {r}
                      </span>
                    ))}
                  </p>
                  <div className="cg-tags">
                    {c.classifications.map((t) => (
                      <span className="cg-tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                  {/* Asking is not hiring. It sends the plan and waits — the
                      terms are set afterwards, by both of them. */}
                  <div className="panel-card-actions">
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
                      <Button variant="primary" className="card-action" onClick={() => ask(c)}>
                        Pošalji poruku
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <nav className="pager" aria-label="Strane">
          <Button
            variant="secondary"
            iconOnly
            disabled={page === 1}
            aria-label="Prethodna strana"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} strokeWidth={2} />
          </Button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`pager-page${n === page ? ' is-on' : ''}`}
              aria-current={n === page ? 'page' : undefined}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <Button
            variant="secondary"
            iconOnly
            disabled={page === pages}
            aria-label="Sledeća strana"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
          >
            <ChevronRight size={14} strokeWidth={2} />
          </Button>
        </nav>
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
