import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { caregivers, matchReasons } from '../data/carePlan';
import { standingWith } from '../data/familyCare';
import Rating from '../components/Rating';
import Button from '../components/Button';
import Tags from '../components/Tags';
import Standing from '../components/Standing';
import AskAssistant from '../components/AskAssistant';

// Browsing for someone, as its own page rather than a button on one screen.
// The header shortcut on the dashboard opens this; wanting a second pair of
// hands, or a different one, is a thing a family can do at any time, and a
// capability that exists on only one screen is not a capability.


// How many fit on a page. The list is ordered by how well each one matches the
// plan, so a page is "the next few best", not an arbitrary slice.
const PER_PAGE = 10;

export default function FindCaregiver({ care, onContact, onDrawer, onFlash, onAskAssistant }) {
  const [page, setPage] = useState(1);

  // best match first, as the recommendation it is
  const results = useMemo(() => [...caregivers].sort((a, b) => b.match - a.match), []);

  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
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
            šalje plan nege i ništa ne košta - možete da pitate više njih, a ništa nije dogovoreno dok
            zajedno ne postavite uslove.
          </p>
        </div>
        <AskAssistant onClick={onAskAssistant} />
      </div>

      <div className="find-count">
        {/* what this page shows, out of everyone */}
        <span>
          {shown.length} od {results.length} negovateljica
        </span>
      </div>

      <div className="view-list">
        {shown.map((c) => {
          const standing = standingWith(care, c.id);
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
                  <Rating caregiver={c} /> · {c.rate} · {c.area}, do {c.radius} km
                </div>
                {/* Why she comes up (the platform's reasons) and what she is,
                    each a labelled group of tags, the labels in one column. */}
                <div className="tag-rows">
                  <Tags label="Poklapa se" items={matchReasons(c)} />
                  <Tags label="Klasifikacije" items={c.classifications} />
                </div>
              </div>
              {/* Asking is not hiring. It sends the plan and waits — the terms
                  are set afterwards, by both of them. Top right, level with
                  her name; on a phone the card opens her profile, which has it. */}
              {standing ? (
                <Standing standing={standing} className="status-pill" />
              ) : (
                <Button variant="primary" className="card-action" onClick={() => ask(c)}>
                  Pošalji poruku
                </Button>
              )}
            </div>
          );
        })}
      </div>

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
