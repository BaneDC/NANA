import { CreditCard, History, IdCard, Phone } from 'lucide-react';
import Button from '../components/Button';
import Attention from '../components/Attention';
import BackButton from '../components/BackButton';
import VisitRow from '../components/family/VisitRow';
import { Line, ServiceChips } from '../components/family/FamilyDrawer';
import { Group } from '../components/Tags';
import {
  activeVersion,
  arrangementOf,
  canAsk,
  chargedFor,
  firstName,
  herVisits,
  lastVersion,
  latestRequest,
  linkCard,
  money,
  pendingVersion,
  services,
  shownVersion,
  workedHours,
} from '../data/familyCare';

// One caregiver, from the family's side: what is next with her, the terms she
// works under, how it has gone so far, and every visit she has made. Everything
// the family can do about her is on this page or one drawer away from it.

// Her page shows the latest ten; all of them open in a drawer.
const SHOWN = 10;

// the one thing to know about her right now, and the button for it if there is one
function nextStep(care, a) {
  const first = firstName(a.caregiver.name);
  const pen = pendingVersion(a);
  const order = a.visits.find((v) => v.status === 'charging');
  const extra = a.visits.find((v) => v.extra?.status === 'asked' && v.status !== 'charging');
  const queried = a.visits.find((v) => v.status === 'disputed');
  const booked = a.visits.find((v) => v.status === 'planned');
  const done = a.visits.find((v) => v.status === 'awaiting');
  const again = a.endedOn && latestRequest(care, a.caregiver.id)?.again ? latestRequest(care, a.caregiver.id) : null;

  // asked again after it ended: where that request is
  if (again && !pen) {
    return again.status === 'pending'
      ? { eyebrow: 'Upit je poslat', copy: `Pisali ste joj ponovo ${again.requested}. ${first} još nije odgovorila, javićemo vam u svakom slučaju.` }
      : again.status === 'accepted'
        ? { eyebrow: 'Prihvatila je', copy: `${first} je prihvatila da ponovo dolazi. Nove uslove šalje uskoro, a stari ugovor ne važi.` }
        : {
            eyebrow: 'Odbila je',
            copy: `${first} sada ne može: ${again.detail.toLowerCase()}. Možete da je pitate ponovo kasnije.`,
            label: 'Pitaj ponovo',
            contact: true,
          };
  }

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
      copy: `${first} je poslala radni nalog za ${order.date.toLowerCase()}. Ako je sve bilo kako je dogovoreno, ne morate ništa - prolazi samo.`,
      label: 'Pogledaj radni nalog',
      drawer: { kind: 'work-order', visitId: order.id },
    };
  }
  if (extra) {
    return {
      eyebrow: 'Čeka na vas',
      copy: `${first} je radila ${extra.extra.hours} h duže nego što je bilo rezervisano ${extra.date.toLowerCase()}. To se naplaćuje samo ako odobrite.`,
      label: 'Pogledaj radni nalog',
      drawer: { kind: 'work-order', visitId: extra.id },
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
  if (done) {
    return {
      eyebrow: 'Poseta je obavljena',
      copy: `${first} je bila kod vas ${done.date.toLowerCase()}. Ništa se ne naplaćuje dok ne pošalje radni nalog.`,
    };
  }
  if (a.endedOn) {
    return {
      eyebrow: 'Završeno',
      copy: `Ova saradnja je završena ${a.endedOn}. Ako vam je ponovo potrebna, pošaljite joj plan nege kakav je sada. Ona odgovara kao na svaki upit, a nove uslove postavljate zajedno.`,
      label: canAsk(care, a.caregiver.id) ? 'Ponovo sarađujte' : null,
      contact: true,
    };
  }
  if (!a.versions.length) {
    return { eyebrow: 'Prihvatila je', copy: `${first} je prihvatila upit. Ugovor o nezi šalje uskoro, a ništa ne važi dok ga ne prihvatite.` };
  }
  if (!activeVersion(a) && lastVersion(a)?.status === 'declined') {
    return {
      eyebrow: 'Uslovi su odbijeni',
      copy: `Odbili ste verziju ${lastVersion(a).version}. Koordinatorka će vas pozvati, a ${first} može da pošalje nove uslove.`,
    };
  }
  if (!activeVersion(a) && lastVersion(a)?.status === 'withdrawn') {
    return { eyebrow: 'Predlog je povučen', copy: `${first} je povukla uslove. Ništa ne važi dok ne pošalje nove.` };
  }
  return {
    eyebrow: 'Ništa ne čeka',
    copy: `Nijedna poseta nije zakazana i ništa ne čeka vaš odgovor. ${first} šalje sledeći plan kad dođe vreme.`,
  };
}

export default function CaregiverPage({ care, caregiverId, onCare, onDrawer, onBack, onFlash, onContact }) {
  const a = arrangementOf(care, caregiverId) || care.arrangements[0];
  const cg = a.caregiver;
  const first = firstName(cg.name);
  const pen = pendingVersion(a);
  const act = activeVersion(a);
  const terms = shownVersion(a);
  const next = nextStep(care, a);
  const ended = Boolean(a.endedOn);

  const paid = a.visits.filter((v) => v.status === 'paid');
  const hoursSoFar = paid.reduce((n, v) => n + workedHours(v) + (v.extra?.status === 'approved' ? v.extra.hours : 0), 0);
  const visits = herVisits(a);

  // the badge says what became of the version shown
  const TERMS_STATE = {
    sent: { text: 'još nije prihvaćena', pill: 'is-pending' },
    active: { text: 'važi', pill: 'is-accepted' },
    ended: { text: 'završena', pill: 'is-muted' },
    declined: { text: 'odbijena', pill: 'is-declined' },
    withdrawn: { text: 'povučena', pill: 'is-muted' },
    replaced: { text: 'zamenjena', pill: 'is-muted' },
  };
  const termsState = terms && (TERMS_STATE[terms.status] || TERMS_STATE.active);
  const termsBadge = termsState && { text: `Verzija ${terms.version} · ${termsState.text}`, pill: termsState.pill };

  return (
    <div className="view">
      <BackButton label="Moja nega" onClick={onBack} />

      <div className="view-head">
        <div className="fam-person">
          <span className={`cg-avatar is-lg${ended ? ' is-ended' : ''}`}>{cg.initials}</span>
          <div className="view-head-text">
            <h1 className="view-title">{cg.name}</h1>
            <p className="view-sub">
              {cg.area} · dolazi kod: {care.elder.name} · {ended ? `završeno ${a.endedOn}` : a.since ? `od ${a.since}` : 'ugovor još nije prihvaćen'}
            </p>
          </div>
        </div>
        {/* Everything about her, and everything that has happened with her,
            each a drawer: icons beside her number, as the plan's own actions
            are, so the head keeps its width for her name. */}
        <div className="view-head-actions">
          {!ended && (
            <a className="btn secondary" href={`tel:${cg.phone.replace(/\s/g, '')}`}>
              <Phone size={14} strokeWidth={1.75} />
              {cg.phone}
            </a>
          )}
          <Button variant="secondary" iconOnly aria-label="Pregled" title="Pregled" onClick={() => onDrawer({ kind: 'overview', caregiverId: cg.id })}>
            <IdCard size={14} strokeWidth={1.75} />
          </Button>
          <Button variant="secondary" iconOnly aria-label="Šta se desilo" title="Šta se desilo" onClick={() => onDrawer({ kind: 'activity', caregiverId: cg.id })}>
            <History size={14} strokeWidth={1.75} />
          </Button>
        </div>
      </div>

      {/* something to do about her is the page's tinted place; a plain state
          of things is a card like the rest */}
      {/* Where things stand with her is a notice, so it is the page's tinted
          place whether or not there is something to press (docs/patterns.md
          §5): its words in a white card, and its button under them if any. */}
      <Attention title={next.eyebrow}>
        <div className="panel-card">
          <p className="fam-next">{next.copy}</p>
          {next.label && (
            <div className="panel-card-actions">
              <Button
                variant="primary"
                onClick={() => (next.contact ? onContact?.(a.caregiver) : onDrawer(next.drawer))}
              >
                {next.label}
              </Button>
            </div>
          )}
        </div>
      </Attention>

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
            <ServiceChips ids={terms.services} grouped />
            <div className="bc-lines ag-terms">
              <Line label={terms.status === 'sent' ? 'Poslato' : terms.agreedOn ? 'Prihvaćeno' : 'Poslato'} value={terms.status === 'sent' || !terms.agreedOn ? terms.sentOn : terms.agreedOn} />
              <Line label="Cena po satu" value={`${money(terms.rate)} / h`} />
              <Line label="Dogovoreni sati" value={`${terms.hours} h nedeljno`} />
              <Line label="Raspored" value={terms.schedule} />
            </div>
            {terms.terms && (
              <div className="tag-rows">
                <Group label="Dodatni uslovi" text={terms.terms} />
              </div>
            )}
            {a.versions.length > 1 && (
              <div className="panel-card-actions">
                <Button variant="secondary" onClick={() => onDrawer({ kind: 'versions', caregiverId: cg.id })}>
                  Sve verzije ({a.versions.length})
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="fam-sub">{first} još nije poslala uslove.</p>
        )}
      </section>

      <section className="panel-card">
        <p className="doc-section-title">Ukratko</p>
        <div className="bc-lines ag-terms">
          <Line label="Zajedno" value={ended ? `${a.since || '-'} – ${a.endedOn}` : a.since ? `od ${a.since}` : 'još niste počeli'} />
          <Line label="Posete do sada" value={paid.length ? `${paid.length} · ${hoursSoFar} h` : 'još nijedna'} />
          {(a.periods || []).map((p) => (
            <Line key={p.since} label="Ranije" value={`${p.since || '-'} – ${p.endedOn}`} />
          ))}
          <Line label="Poslednja poseta" value={paid[0]?.date || '-'} />
          <Line
            label="Način plaćanja"
            value={care.payment.connected ? `${care.payment.brand} ···· ${care.payment.last4}` : 'Još nije dodat'}
          />
        </div>
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
          {pen && act
            ? 'Nove posete su pauzirane dok ne odgovorite na nove uslove. Zakazane ostaju.'
            : act || ended
              ? 'Svaka se unapred rezerviše, a naplaćuje kad potvrdi šta je uradila.'
              : 'Posete počinju kad se uslovi prihvate.'}
        </p>
        {visits.length > 0 && (
          <ul className="fam-visits">
            {visits.slice(0, SHOWN).map((v) => (
              <VisitRow key={v.id} visit={v} onDrawer={onDrawer} />
            ))}
          </ul>
        )}
        {visits.length > SHOWN && (
          <div className="panel-card-actions">
            <Button variant="secondary" onClick={() => onDrawer({ kind: 'visits', caregiverId: cg.id })}>
              Pogledaj sve ({visits.length})
            </Button>
          </div>
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
