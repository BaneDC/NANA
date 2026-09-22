import { useState } from 'react';
import { ArrowLeft, CreditCard, Phone } from 'lucide-react';
import Button from '../components/Button';
import VisitRow from '../components/family/VisitRow';
import { Line, ServiceChips } from '../components/family/FamilyDrawer';
import {
  activeVersion,
  arrangementOf,
  chargedFor,
  firstName,
  linkCard,
  money,
  pendingVersion,
  services,
  shownVersion,
} from '../data/familyCare';

// One caregiver, from the family's side: what is next with her, the terms she
// works under, how it has gone so far, and every visit she has made. Everything
// the family can do about her is on this page or one drawer away from it.

const PAGE = 5;

// the one thing to know about her right now, and the button for it if there is one
function nextStep(care, a) {
  const first = firstName(a.caregiver.name);
  const pen = pendingVersion(a);
  const order = a.visits.find((v) => v.status === 'charging');
  const queried = a.visits.find((v) => v.status === 'disputed');
  const booked = a.visits.find((v) => v.status === 'planned');

  if (pen && !care.payment.connected) {
    return {
      eyebrow: 'Čeka na vas',
      copy: `${first} je predložila uslove, a kartica mora biti sačuvana pre nego što se ijedna poseta rezerviše. Dodavanje kartice ništa ne naplaćuje.`,
      label: 'Pogledaj uslove',
      drawer: { kind: 'terms', caregiverId: a.caregiver.id },
    };
  }
  if (pen) {
    return {
      eyebrow: 'Čeka na vas',
      copy: `${first} je predložila ${money(pen.rate)} na sat za ${services(pen.services.length)}. ${activeVersion(a) ? `Verzija ${activeVersion(a).version} važi dok ne odgovorite.` : 'Ništa ne može da se zakaže dok ne odgovorite, a prihvatanje ništa ne naplaćuje.'}`,
      label: 'Pogledaj uslove',
      drawer: { kind: 'terms', caregiverId: a.caregiver.id },
    };
  }
  if (order) {
    return {
      eyebrow: 'Čeka na vas',
      copy: `${first} je poslala radni nalog za ${order.date}. Ako je sve bilo kako je dogovoreno, ne morate ništa — prolazi samo.`,
      label: 'Pogledaj radni nalog',
      drawer: { kind: 'work-order', visitId: order.id },
    };
  }
  if (queried) {
    return {
      eyebrow: 'Kod vaše koordinatorke',
      copy: 'Ono što ste prijavili se proverava. Ništa se ne naplaćuje dok je otvoreno, i neko će vas pozvati.',
    };
  }
  if (booked) {
    return {
      eyebrow: 'Predstoji',
      copy: `${first} dolazi ${booked.date.toLowerCase()} u ${booked.time.split('–')[0]}. ${money(chargedFor(booked.hours, booked.rate))} je rezervisano, nije naplaćeno.`,
      label: 'Pogledaj plan posete',
      drawer: { kind: 'plan', visitId: booked.id },
    };
  }
  if (a.endedOn) {
    return { eyebrow: 'Završeno', copy: `Ova saradnja je završena ${a.endedOn}. Ništa više ne može da se naplati.` };
  }
  return {
    eyebrow: 'Ništa ne čeka',
    copy: `Nijedna poseta nije zakazana i ništa ne čeka vaš odgovor. ${first} šalje sledeći plan kad dođe vreme.`,
  };
}

export default function CaregiverPage({ care, caregiverId, onCare, onDrawer, onBack, onFlash }) {
  const [shown, setShown] = useState(PAGE);
  const a = arrangementOf(care, caregiverId) || care.arrangements[0];
  const cg = a.caregiver;
  const first = firstName(cg.name);
  const pen = pendingVersion(a);
  const act = activeVersion(a);
  const terms = shownVersion(a);
  const next = nextStep(care, a);
  const ended = Boolean(a.endedOn);

  const paid = a.visits.filter((v) => v.status === 'paid');
  const hoursSoFar = paid.reduce((n, v) => n + v.hours, 0);
  const chargedSoFar = paid.reduce((n, v) => n + chargedFor(v.hours, v.rate), 0);
  // anything still moving first, then everything settled, newest first
  const open = a.visits.filter((v) => v.status !== 'paid' && v.status !== 'cancelled');
  const rest = a.visits.filter((v) => !open.includes(v));
  const visits = [...open, ...rest].map((v) => ({ ...v, caregiver: cg }));

  const termsBadge = !terms
    ? null
    : pen
      ? { text: `Verzija ${pen.version} · još nije prihvaćena`, pill: 'is-pending' }
      : ended
        ? { text: `Verzija ${terms.version} · završena`, pill: 'is-muted' }
        : { text: `Verzija ${terms.version} · važi`, pill: 'is-accepted' };

  return (
    <div className="view">
      <button type="button" className="fam-back" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Moja nega
      </button>

      <div className="view-head">
        <div className="fam-person">
          <span className={`cg-avatar is-lg${ended ? ' is-ended' : ''}`}>{cg.initials}</span>
          <div className="view-head-text">
            <h1 className="view-title">{cg.name}</h1>
            <p className="view-sub">
              {cg.area} · dolazi kod: {care.elder.name} · {ended ? `završeno ${a.endedOn}` : `od ${a.since}`}
            </p>
          </div>
        </div>
        {!ended && (
          <div className="view-head-actions">
            <a className="btn secondary" href={`tel:${cg.phone.replace(/\s/g, '')}`}>
              <Phone size={14} strokeWidth={1.75} />
              {cg.phone}
            </a>
          </div>
        )}
      </div>

      <section className={`panel-card${next.label ? ' needs-you' : ''}`}>
        <p className="doc-section-title">{next.eyebrow}</p>
        <p className="fam-next">{next.copy}</p>
        {next.label && (
          <div className="panel-card-actions">
            <Button variant="primary" onClick={() => onDrawer(next.drawer)}>
              {next.label}
            </Button>
          </div>
        )}
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <p className="doc-section-title">{pen ? 'Novi uslovi čekaju na vas' : 'Ugovor o nezi'}</p>
          {termsBadge && <span className={`status-pill ${termsBadge.pill}`}>{termsBadge.text}</span>}
        </div>
        {terms ? (
          <>
            {pen && act && (
              <p className="fam-sub">
                Dok ne odgovorite, važi verzija {act.version}: {money(act.rate)}/h za{' '}
                {services(act.services.length)}.
              </p>
            )}
            <ServiceChips ids={terms.services} />
            <div className="bc-lines ag-terms">
              <Line label={pen ? 'Poslato' : 'Prihvaćeno'} value={pen ? terms.sentOn : terms.agreedOn} />
              <Line label="Cena po satu" value={`${money(terms.rate)} / h`} />
              <Line label="Dogovoreni sati" value={`${terms.hours} h nedeljno`} />
              <Line label="Raspored" value={terms.schedule} />
            </div>
          </>
        ) : (
          <p className="fam-sub">{first} još nije poslala uslove.</p>
        )}
      </section>

      <section className="panel-card">
        <p className="doc-section-title">Ukratko</p>
        <div className="bc-lines ag-terms">
          <Line label="Zajedno" value={ended ? `${a.since} – ${a.endedOn}` : `od ${a.since}`} />
          <Line label="Posete do sada" value={paid.length ? `${paid.length} · ${hoursSoFar} h` : 'još nijedna'} />
          <Line label="Naplaćeno do sada" value={money(chargedSoFar)} />
          <Line label="Poslednja poseta" value={paid[0]?.date || '—'} />
          <Line
            label="Način plaćanja"
            value={care.payment.connected ? `${care.payment.brand} ···· ${care.payment.last4}` : 'Još nije dodat'}
          />
        </div>
        {/* how the next visit will go — nothing more will, once it has ended */}
        {!ended && (
          <ol className="fam-flow">
            <li>
              <span>Dan pre</span>
              {first} šalje plan i novac se rezerviše
            </li>
            <li>
              <span>Posle posete</span>
              zapiše šta je uradila
            </li>
            <li>
              <span>Dan kasnije</span>
              naplaćuje se, osim ako kažete da nešto nije u redu
            </li>
          </ol>
        )}
        {!care.payment.connected && (
          <div className="panel-card-actions">
            <Button
              variant="secondary"
              onClick={() => {
                onCare(linkCard);
                onFlash('Kartica je dodata. Posete sada mogu da se rezervišu.');
              }}
            >
              <CreditCard size={14} strokeWidth={1.75} />
              Dodaj karticu
            </Button>
          </div>
        )}
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <p className="doc-section-title">Posete</p>
          <span className="status-pill is-muted">{a.visits.length}</span>
        </div>
        <p className="fam-sub">
          {act || ended
            ? 'Svaka se unapred rezerviše, a naplaćuje kad potvrdi šta je uradila.'
            : 'Posete počinju kad se uslovi prihvate.'}
        </p>
        {visits.length > 0 && (
          <ul className="fam-visits">
            {visits.slice(0, shown).map((v) => (
              <VisitRow key={v.id} visit={v} onDrawer={onDrawer} />
            ))}
          </ul>
        )}
        {visits.length > shown && (
          <button type="button" className="visit-more" onClick={() => setShown((n) => n + PAGE)}>
            Prikaži još {Math.min(PAGE, visits.length - shown)}
          </button>
        )}
      </section>

      {act && !ended && (
        <div className="fam-end">
          <p>Kad završite saradnju, nove posete prestaju. Sve što je već izmireno ostaje u vašoj evidenciji.</p>
          <Button variant="ghost" className="fam-end-btn" onClick={() => onDrawer({ kind: 'end', caregiverId: cg.id })}>
            Završi saradnju
          </Button>
        </div>
      )}
    </div>
  );
}
