import { ArrowRight, Check, ChevronRight, Clock, Search } from 'lucide-react';
import { caregivers } from '../data/carePlan';
import {
  activeVersion,
  allVisits,
  chargedFor,
  firstName,
  lastVisit,
  money,
  pendingVersion,
  services,
  visitCharge,
  waitingOnYou,
} from '../data/familyCare';
import Button from '../components/Button';
import AskAssistant from '../components/AskAssistant';
import Attention from '../components/Attention';
import { ServiceChips } from '../components/family/FamilyDrawer';
import VisitReport from '../components/family/VisitReport';

// The family's home: what is waiting on them, what is coming, how the last visit
// went, and everyone who has cared for their mother. Each of those opens the
// thing it is about — a drawer for a decision, her page for a caregiver.
//
// Only two things are ever asked of a family, and they work in opposite
// directions: terms stop everything until they are agreed, while a work order
// goes through on its own unless someone says it was wrong. The note under
// "Waiting for you" says which, so neither reads like the other.

function Section({ title, sub, action, className = '', children }) {
  return (
    <section className={`panel-card ${className}`}>
      <div className="panel-card-head">
        <p className="doc-section-title">{title}</p>
        {action}
      </div>
      {sub && <p className="fam-sub">{sub}</p>}
      {children}
    </section>
  );
}

// "everything of this" from a card's head: our button, as every other in a card
function SeeAll({ label, onClick }) {
  return (
    <Button variant="secondary" onClick={onClick}>
      {label}
      <ArrowRight size={14} strokeWidth={1.75} />
    </Button>
  );
}

const REQUEST_PILL = {
  pending: { className: 'is-pending', label: 'Čeka odgovor' },
  accepted: { className: 'is-accepted', label: 'Prihvatila' },
  declined: { className: 'is-declined', label: 'Ne može' },
};

// A row that opens something: the title is the link and stretches over the
// row, the button says the same thing on a wide screen, and on a phone a chevron
// takes the button's place (docs/patterns.md §7).
function OpenRow({ initials, title, body, action, variant = 'secondary', onOpen }) {
  return (
    <div className="fam-row is-clickable">
      <span className="cg-avatar">{initials}</span>
      <div className="fam-row-main">
        <button type="button" className="fam-row-title card-link" onClick={onOpen}>
          {title}
        </button>
        {body}
      </div>
      <Button variant={variant} className="card-action" onClick={onOpen}>
        {action}
      </Button>
      <ChevronRight size={16} strokeWidth={1.75} className="card-go" aria-hidden="true" />
    </div>
  );
}

// The same, as a card of its own in the tinted tray of what waits on the
// family: white like every card, its title a card's title.
function OpenCard({ initials, title, body, action, variant = 'secondary', onOpen }) {
  return (
    <div className="panel-card is-row is-clickable">
      <span className="cg-avatar">{initials}</span>
      <div className="fam-row-main">
        <button type="button" className="doc-section-title card-link" onClick={onOpen}>
          {title}
        </button>
        {body}
      </div>
      <Button variant={variant} className="card-action" onClick={onOpen}>
        {action}
      </Button>
      <ChevronRight size={16} strokeWidth={1.75} className="card-go" aria-hidden="true" />
    </div>
  );
}

export default function Dashboard({ care, user, plan, onDrawer, onCaregiver, onView, onAskAssistant, onFindCaregiver }) {
  const elder = care.elder.name ? firstName(care.elder.name) : null;
  const waiting = waitingOnYou(care);
  const coming = allVisits(care).filter((v) => v.status === 'planned');
  const last = lastVisit(care);
  const quiet = care.arrangements.length > 0 && !waiting.length && !coming.length;
  // nobody asked yet: the one thing to do is ask
  const fresh = !care.arrangements.length && !care.requests.length;

  const hasTerms = waiting.some((w) => w.kind === 'terms');
  const hasOrder = waiting.some((w) => w.kind === 'work-order');
  const waitNote =
    hasTerms && hasOrder
      ? 'Uslovi moraju biti prihvaćeni pre nego što išta novo počne. Radni nalog je obrnuto - prolazi sam, osim ako vi nešto ne kažete.'
      : hasTerms
        ? 'Ništa novo ne počinje i ništa se ne naplaćuje dok ne odgovorite.'
        : 'Naplaćuje se automatski, osim ako kažete da nešto nije u redu.';

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Zdravo, {firstName(user?.name || care.family.name)}</h1>
          <p className="view-sub">
            {[care.elder.name && `Nega · ${care.elder.name}`, care.elder.area, care.payment.connected ? 'kartica je sačuvana' : 'kartica još nije dodata']
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {/* Finding a caregiver is in the side menu, so the head does not say
            it again. Only a family that has asked nobody yet gets it, as the
            one step in the card below. */}
        <div className="view-head-actions">
          <AskAssistant onClick={onAskAssistant} />
        </div>
      </div>

      {fresh && (
        <Attention title="Sledeći korak">
          <div className="panel-card">
            <p className="tip-body">
              {plan
                ? 'Plan nege je spreman. Pošaljite upit negovateljicama koje mu odgovaraju: upit šalje plan i ništa ne košta, a možete da pitate više njih.'
                : 'Kad završite razgovor sa Minnom, ovde će biti plan nege i negovateljice koje mu odgovaraju.'}
            </p>
            <div className="panel-card-actions">
              <Button variant="primary" onClick={onFindCaregiver} disabled={!plan}>
                <Search size={14} strokeWidth={1.75} />
                Pronađi negovateljicu
              </Button>
            </div>
          </div>
        </Attention>
      )}

      {quiet && (
        <div className="panel-card fam-quiet">
          <p>Sve je sređeno - ništa ne čeka vaš odgovor i ništa nije zakazano.</p>
        </div>
      )}

      {waiting.length > 0 && (
        <Attention title="Čeka na vas" sub={waitNote}>
          {waiting.map((w) =>
            w.kind === 'terms' ? (
              <OpenCard
                key={`terms-${w.arrangement.caregiver.id}`}
                initials={w.arrangement.caregiver.initials}
                title={`${firstName(w.arrangement.caregiver.name)} je poslala ${activeVersion(w.arrangement) ? 'nove uslove' : 'ugovor o nezi'}`}
                body={
                  <p className="fam-row-body">
                    {services(w.version.services.length)} po {money(w.version.rate)} na sat.{' '}
                    {activeVersion(w.arrangement)
                      ? `Verzija ${activeVersion(w.arrangement).version} važi dok ne odgovorite.`
                      : 'Ništa ne može da se zakaže dok ne prihvatite, a prihvatanje ništa ne naplaćuje.'}
                  </p>
                }
                action="Pogledaj uslove"
                variant="primary"
                onOpen={() => onDrawer({ kind: 'terms', caregiverId: w.arrangement.caregiver.id })}
              />
            ) : (
              <OpenCard
                key={`wo-${w.visit.id}`}
                initials={w.visit.caregiver.initials}
                title={`${firstName(w.visit.caregiver.name)} je poslala radni nalog za ${w.visit.date}`}
                body={
                  <>
                    <p className="fam-row-body">Ako je sve bilo kako je dogovoreno, ne morate ništa - prolazi samo.</p>
                    <p className="fam-row-meta">
                      <Clock size={12} strokeWidth={2} />
                      {money(visitCharge(w.visit))} se naplaćuje za {w.visit.chargesInHours} h
                    </p>
                  </>
                }
                action="Pogledaj radni nalog"
                onOpen={() => onDrawer({ kind: 'work-order', visitId: w.visit.id })}
              />
            )
          )}
        </Attention>
      )}

      {coming.length > 0 && (
        <Section
          title="Predstoji"
          sub="Zakazane posete. Novac se unapred rezerviše, a naplaćuje tek posle posete."
        >
          <div className="fam-rows">
            {coming.map((v) => (
              <OpenRow
                key={v.id}
                initials={v.caregiver.initials}
                title={`${v.date} · ${v.time}`}
                body={
                  <p className="fam-row-body is-inline">
                    {v.caregiver.name} · {v.hours} h po {money(v.rate)}/h
                    <span className="cg-tag">{money(chargedFor(v.hours, v.rate))} rezervisano</span>
                  </p>
                }
                action="Pogledaj plan posete"
                onOpen={() => onDrawer({ kind: 'plan', visitId: v.id })}
              />
            ))}
          </div>
        </Section>
      )}

      {last && (
        <Section
          title="Kako je prošla poslednja poseta"
          action={<SeeAll label="Sve posete" onClick={() => onView('visits')} />}
        >
          <div className="fam-rows">
            <div className="fam-row is-clickable">
              <span className="cg-avatar">{last.caregiver.initials}</span>
              <div className="fam-row-main">
                <p className="fam-row-title">
                  <button type="button" className="card-link" onClick={() => onDrawer({ kind: 'work-order', visitId: last.id })}>
                    {last.date} · {last.time}
                  </button>
                </p>
                <p className="fam-row-body is-inline">
                  {last.caregiver.name} · {last.hours} h po {money(last.rate)}/h
                  <span className="cg-tag">{money(visitCharge(last))} naplaćeno</span>
                </p>
                <VisitReport report={last.report} first={firstName(last.caregiver.name)} done />
              </div>
              <ChevronRight size={16} strokeWidth={1.75} className="fam-row-chevron" aria-hidden="true" />
            </div>
          </div>
        </Section>
      )}

      {care.arrangements.length > 0 && (
      <Section title={care.arrangements.length === 1 ? 'Vaša negovateljica' : 'Vaše negovateljice'}>
        <div className="fam-rows">
          {care.arrangements.map((a) => {
            const act = activeVersion(a);
            const pen = pendingVersion(a);
            const paid = a.visits.filter((v) => v.status === 'paid').length;
            const ended = Boolean(a.endedOn);
            return (
              <div key={a.caregiver.id} className={`fam-row is-clickable${ended ? ' is-ended' : ''}`}>
                <span className="cg-avatar">{a.caregiver.initials}</span>
                <div className="fam-row-main">
                  <p className="fam-row-title">
                    <button type="button" className="card-link" onClick={() => onCaregiver(a.caregiver.id)}>
                      {a.caregiver.name}
                    </button>
                    {pen && <span className="status-pill is-pending">{act ? 'Novi uslovi' : 'Ugovor čeka'}</span>}
                  </p>
                  <p className="fam-row-body">
                    {ended
                      ? `Završeno ${a.endedOn}`
                      : a.since
                        ? `${a.caregiver.area} · od ${a.since}${act ? ` · ${money(act.rate)}/h` : ''}`
                        : `${a.caregiver.area} · čeka da prihvatite ugovor`}
                  </p>
                  {act && !ended && <ServiceChips label="Usluge" ids={act.services} />}
                </div>
                <span className="fam-row-side">Plaćenih poseta: {paid}</span>
                <ChevronRight size={16} strokeWidth={1.75} className="fam-row-chevron" aria-hidden="true" />
              </div>
            );
          })}
        </div>
      </Section>

      )}

      {care.requests.length > 0 && (
        <Section
          title="Vaši upiti"
          action={<SeeAll label="Svi upiti" onClick={() => onView('requests')} />}
        >
          <div className="fam-rows">
            {care.requests.map((r) => {
              const c = caregivers.find((x) => x.id === r.caregiverId);
              const pill = REQUEST_PILL[r.status];
              return (
                <div key={r.caregiverId} className="fam-row">
                  <span className="cg-avatar">{c?.initials}</span>
                  <div className="fam-row-main">
                    <p className="fam-row-title">{c?.name}</p>
                    <p className="fam-row-body">
                      {r.status === 'pending' ? `Poslato ${r.requested}. ${r.detail}` : r.detail}
                    </p>
                  </div>
                  <span className={`status-pill ${pill.className}`}>
                    {r.status !== 'declined' && <Check size={12} strokeWidth={2} />}
                    {pill.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
