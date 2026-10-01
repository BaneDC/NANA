import { useState } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import Button from '../components/Button';
import { Group } from '../components/Tags';
import { caregivers } from '../data/carePlan';
import { arrangementOf, firstName } from '../data/familyCare';

// Everyone the family has asked about care, and where each one stands. A "yes"
// that became an arrangement links to her page; a "no" always says why, so
// nobody is left guessing. A place of its own in the side menu, so no way back;
// and since finding someone to ask is in the menu too, the page only offers it
// while nobody has been asked yet.

const LABEL = { pending: 'Čeka odgovor', accepted: 'Prihvaćeno', declined: 'Odbijeno' };
const PILL = { pending: 'is-pending', accepted: 'is-accepted', declined: 'is-declined' };
const ICON = { pending: Clock, accepted: CheckCircle2, declined: XCircle };
const TABS = ['all', 'pending', 'accepted', 'declined'];

export default function RequestsPage({ care, onCaregiver, onFind }) {
  const [tab, setTab] = useState('all');
  const mine = care.requests;
  const picked = tab === 'all' ? mine : mine.filter((r) => r.status === tab);

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Vaši upiti</h1>
          <p className="view-sub">
            Sve negovateljice kojima ste poslali upit, i gde je svaki od njih.
          </p>
        </div>
      </div>

      {!mine.length && (
        <div className="empty">
          <p className="locked-title">Još niste poslali nijedan upit</p>
          <p className="locked-note">
            Upit šalje plan nege negovateljici i ništa ne košta. Možete da pitate više njih, a ništa nije dogovoreno dok
            zajedno ne postavite uslove.
          </p>
          <Button variant="primary" onClick={onFind}>
            Pronađi negovateljicu
          </Button>
        </div>
      )}

      {mine.length > 0 && (
        <>
          <div className="fam-filter" role="tablist" aria-label="Upiti po odgovoru">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`svc is-sm${tab === t ? ' is-on' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'all' ? 'Svi' : LABEL[t]}
                <span className="fam-filter-note">{t === 'all' ? mine.length : mine.filter((r) => r.status === t).length}</span>
              </button>
            ))}
          </div>

          <div className="fam-rows">
            {picked.map((r) => {
              const cg = caregivers.find((c) => c.id === r.caregiverId);
              if (!cg) return null;
              const Icon = ICON[r.status];
              const linked = r.status === 'accepted' && arrangementOf(care, r.caregiverId);
              return (
                <section key={r.caregiverId} className={`panel-card fam-request${linked ? ' is-linked' : ''}`}>
                  <div className="fam-request-head">
                    <span className="cg-avatar">{cg.initials}</span>
                    <div className="fam-row-main">
                      <p className="fam-row-title">{cg.name}</p>
                      <p className="fam-row-body">
                        {cg.area} · {cg.rate} · upit poslat {r.requested}
                      </p>
                    </div>
                    <span className={`status-pill ${PILL[r.status]}`}>
                      <Icon size={12} strokeWidth={2} />
                      {LABEL[r.status]}
                    </span>
                  </div>
                  <div className="tag-rows">
                    <Group label="Vaša poruka" text={r.message} />
                  </div>
                  <p className="fam-sub is-flush">
                    {r.status === 'declined' ? (
                      <>
                        <strong>Razlog: </strong>
                        {r.detail}
                      </>
                    ) : r.status === 'pending' ? (
                      `${firstName(cg.name)} još nije odgovorila. Javićemo vam u svakom slučaju.`
                    ) : linked ? (
                      `${firstName(cg.name)} je prihvatila. Ugovor i posete su na njenoj stranici.`
                    ) : (
                      `${firstName(cg.name)} je prihvatila. ${r.detail}`
                    )}
                  </p>
                  {linked && (
                    <div className="panel-card-actions">
                      <Button variant="secondary" onClick={() => onCaregiver(r.caregiverId)}>
                        Pogledaj saradnju
                      </Button>
                    </div>
                  )}
                </section>
              );
            })}
            {!picked.length && (
              <div className="panel-card fam-quiet">
                <p>Ovde nema ničega.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
