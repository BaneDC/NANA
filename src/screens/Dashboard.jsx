import { ArrowRight, CalendarClock, ChevronRight, Clock, Search } from 'lucide-react';
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
import { CareSignals, ServiceChips } from '../components/family/FamilyDrawer';

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

function SeeAll({ label, onClick }) {
  return (
    <button type="button" className="fam-link" onClick={onClick}>
      {label}
      <ArrowRight size={13} strokeWidth={1.75} />
    </button>
  );
}

export default function Dashboard({ care, user, onDrawer, onCaregiver, onView, onAskAssistant, onFindCaregiver }) {
  const elder = firstName(care.elder.name);
  const waiting = waitingOnYou(care);
  const coming = allVisits(care).filter((v) => v.status === 'planned');
  const last = lastVisit(care);
  const count = (s) => care.requests.filter((r) => r.status === s).length;
  const quiet = !waiting.length && !coming.length;

  const hasTerms = waiting.some((w) => w.kind === 'terms');
  const hasOrder = waiting.some((w) => w.kind === 'work-order');
  const waitNote =
    hasTerms && hasOrder
      ? 'Uslovi moraju biti prihvaćeni pre nego što išta novo počne. Radni nalog je obrnuto — prolazi sam, osim ako vi nešto ne kažete.'
      : hasTerms
        ? 'Ništa novo ne počinje i ništa se ne naplaćuje dok ne odgovorite.'
        : 'Naplaćuje se automatski, osim ako kažete da nešto nije u redu.';

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">Zdravo, {firstName(user?.name || care.family.name)}</h1>
          <p className="view-sub">
            Nega · {care.elder.name}, {care.elder.area} ·{' '}
            {care.payment.connected ? 'kartica je sačuvana' : 'kartica još nije dodata'}
          </p>
        </div>
        <div className="view-head-actions">
          <AskAssistant onClick={onAskAssistant} />
          <Button variant="primary" onClick={onFindCaregiver}>
            <Search size={14} strokeWidth={1.75} />
            Pronađi negovateljicu
          </Button>
        </div>
      </div>

      {quiet && (
        <div className="panel-card fam-quiet">
          <p>Sve je sređeno — ništa ne čeka vaš odgovor i ništa nije zakazano.</p>
        </div>
      )}

      {waiting.length > 0 && (
        <Section title="Čeka na vas" sub={waitNote} className="needs-you">
          <div className="fam-rows">
            {waiting.map((w) =>
              w.kind === 'terms' ? (
                <div key={`terms-${w.arrangement.caregiver.id}`} className="fam-row is-action">
                  <span className="cg-avatar">{w.arrangement.caregiver.initials}</span>
                  <div className="fam-row-main">
                    <p className="fam-row-title">
                      {firstName(w.arrangement.caregiver.name)} je poslala{' '}
                      {activeVersion(w.arrangement) ? 'nove uslove' : 'ugovor o nezi'}
                    </p>
                    <p className="fam-row-body">
                      {services(w.version.services.length)} po {money(w.version.rate)} na sat.{' '}
                      {activeVersion(w.arrangement)
                        ? `Verzija ${activeVersion(w.arrangement).version} važi dok ne odgovorite.`
                        : 'Ništa ne može da se zakaže dok ne prihvatite, a prihvatanje ništa ne naplaćuje.'}
                    </p>
                  </div>
                  <Button variant="primary" onClick={() => onDrawer({ kind: 'terms', caregiverId: w.arrangement.caregiver.id })}>
                    Pogledaj uslove
                  </Button>
                </div>
              ) : (
                <div key={`wo-${w.visit.id}`} className="fam-row is-action">
                  <span className="cg-avatar">{w.visit.caregiver.initials}</span>
                  <div className="fam-row-main">
                    <p className="fam-row-title">
                      {firstName(w.visit.caregiver.name)} je poslala radni nalog za {w.visit.date}
                    </p>
                    <p className="fam-row-body">
                      Ako je sve bilo kako je dogovoreno, ne morate ništa — prolazi samo.
                    </p>
                    <p className="fam-row-meta">
                      <Clock size={12} strokeWidth={2} />
                      {money(visitCharge(w.visit))} se naplaćuje za {w.visit.chargesInHours} h
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => onDrawer({ kind: 'work-order', visitId: w.visit.id })}>
                    Pogledaj radni nalog
                  </Button>
                </div>
              )
            )}
          </div>
        </Section>
      )}

      {coming.length > 0 && (
        <Section
          title="Predstoji"
          sub="Zakazane posete. Novac se unapred rezerviše, a naplaćuje tek posle posete."
        >
          <div className="fam-rows">
            {coming.map((v) => (
              <div key={v.id} className="fam-row">
                <span className="cg-avatar">{v.caregiver.initials}</span>
                <div className="fam-row-main">
                  <p className="fam-row-title">
                    {v.date} · {v.time}
                  </p>
                  <p className="fam-row-body">
                    {v.caregiver.name} · {v.hours} h po {money(v.rate)}/h
                  </p>
                </div>
                <span className="status-pill is-muted">
                  <CalendarClock size={12} strokeWidth={2} />
                  {money(chargedFor(v.hours, v.rate))} rezervisano
                </span>
                <div className="fam-row-actions">
                  <Button variant="secondary" onClick={() => onDrawer({ kind: 'plan', visitId: v.id })}>
                    Pogledaj plan posete
                  </Button>
                  <Button variant="ghost" onClick={() => onCaregiver(v.caregiver.id)}>
                    Njena stranica
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {last && (
        <Section
          title="Kako je prošla poslednja poseta"
          action={<SeeAll label="Sve posete" onClick={() => onView('visits')} />}
        >
          <button type="button" className="fam-report" onClick={() => onDrawer({ kind: 'work-order', visitId: last.id })}>
            <span className="fam-report-top">
              <span className="fam-row-title">
                {last.date} · {last.caregiver.name}
              </span>
              <span className="fam-report-meta">
                {last.hours} h · naplaćeno {money(visitCharge(last))}
              </span>
            </span>
            <ServiceChips ids={last.report.done} />
            <CareSignals report={last.report} />
            <span className="fam-quote is-inline">„{last.report.note}“</span>
          </button>
        </Section>
      )}

      <Section title={care.arrangements.length === 1 ? 'Vaša negovateljica' : 'Vaše negovateljice'}>
        <div className="fam-rows">
          {care.arrangements.map((a) => {
            const act = activeVersion(a);
            const pen = pendingVersion(a);
            const paid = a.visits.filter((v) => v.status === 'paid').length;
            const ended = Boolean(a.endedOn);
            return (
              <button
                key={a.caregiver.id}
                type="button"
                className={`fam-row is-link${ended ? ' is-ended' : ''}`}
                onClick={() => onCaregiver(a.caregiver.id)}
              >
                <span className="cg-avatar">{a.caregiver.initials}</span>
                <span className="fam-row-main">
                  <span className="fam-row-title">
                    {a.caregiver.name}
                    {pen && <span className="status-pill is-pending">Novi uslovi</span>}
                  </span>
                  <span className="fam-row-body">
                    {ended
                      ? `Završeno ${a.endedOn}`
                      : `${a.caregiver.area} · od ${a.since}${act ? ` · ${money(act.rate)}/h` : ''}`}
                  </span>
                  {act && !ended && <ServiceChips ids={act.services} />}
                </span>
                <span className="fam-row-side">
                  Plaćenih poseta: {paid}
                </span>
                <ChevronRight size={16} strokeWidth={1.75} className="fam-row-chevron" />
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="Vaši upiti"
        action={<SeeAll label="Svi upiti" onClick={() => onView('requests')} />}
      >
        <p className="fam-sub is-flush">
          Čeka odgovor: {count('pending')} · prihvaćeno: {count('accepted')} · odbijeno: {count('declined')}.
          Upit ništa ne košta, i možete da pitate više negovateljica.
        </p>
      </Section>
    </div>
  );
}
