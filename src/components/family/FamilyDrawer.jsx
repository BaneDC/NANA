import { useState } from 'react';
import { AlertTriangle, Check, CreditCard, Frown, Meh, Smile, Star } from 'lucide-react';
import { caregivers } from '../../data/carePlan';
import Modal from '../Modal';
import Button from '../Button';
import {
  AMOUNT_LABEL,
  LATE_HOURS,
  MOOD_LABEL,
  activeVersion,
  agreeTerms,
  arrangementOf,
  askCaregiver,
  callOffVisit,
  chargedFor,
  confirmVisit,
  declineTerms,
  endArrangement,
  findVisit,
  firstName,
  linkCard,
  money,
  pendingVersion,
  pl,
  queryVisit,
  serviceTitle,
  unsettled,
  visitCharge,
} from '../../data/familyCare';

// Everything a family is asked to decide, each in the side pane the rest of the
// app already uses: the terms a caregiver proposes, the work order after a
// visit, the plan before one, and ending a cooperation.
//
// Each one opens from wherever the thing it concerns is on screen — the home
// page, her page, the list of visits — and `drawer` says which: `{ kind,
// caregiverId?, visitId? }`.

const MOOD_ICON = { low: Frown, usual: Meh, good: Smile };

export function ServiceChips({ ids, missing = [] }) {
  return (
    <div className="ag-services">
      {ids.map((id) => (
        <span key={id} className="svc is-set">
          <Check size={13} strokeWidth={2.5} />
          {serviceTitle(id)}
        </span>
      ))}
      {missing.map((id) => (
        <span key={id} className="svc">
          {serviceTitle(id)} — ovog puta ne
        </span>
      ))}
    </div>
  );
}

export function Line({ label, value }) {
  return (
    <p className="bc-line">
      <span className="bc-line-label">{label}</span>
      <span className="bc-line-value">{value}</span>
    </p>
  );
}

// how she was, as the caregiver wrote it down
export function CareSignals({ report }) {
  const Mood = MOOD_ICON[report.mood];
  return (
    <span className="visit-foot is-inline">
      {Mood && (
        <span className="visit-mood">
          <Mood size={13} strokeWidth={1.75} />
          Raspoloženje — {MOOD_LABEL[report.mood].toLowerCase()}
        </span>
      )}
      {report.eating && <span className="visit-mood">Ishrana — {AMOUNT_LABEL[report.eating].toLowerCase()}</span>}
      {report.moving && <span className="visit-mood">Kretanje — {AMOUNT_LABEL[report.moving].toLowerCase()}</span>}
    </span>
  );
}

// ── the terms ───────────────────────────────────────────────────────────────

// What changes between the version in force and the one proposed, in a line
// each — the rest of the terms are the same and saying them twice hides this.
function changesBetween(was, now) {
  const rows = [];
  if (now.rate !== was.rate) {
    rows.push({
      label: now.rate > was.rate ? 'Cena raste' : 'Cena pada',
      value: `${money(was.rate)} → ${money(now.rate)} na sat`,
    });
  }
  const added = now.services.filter((s) => !was.services.includes(s));
  const dropped = was.services.filter((s) => !now.services.includes(s));
  if (added.length) rows.push({ label: added.length === 1 ? 'Nova usluga' : 'Nove usluge', value: added.map(serviceTitle).join(', ') });
  if (dropped.length) rows.push({ label: dropped.length === 1 ? 'Usluga više ne' : 'Usluge više ne', value: dropped.map(serviceTitle).join(', ') });
  if (now.hours !== was.hours) rows.push({ label: 'Sati', value: `${was.hours} → ${now.hours} h nedeljno` });
  if (now.schedule !== was.schedule) rows.push({ label: 'Raspored', value: now.schedule });
  return rows;
}

function Terms({ care, caregiverId, onCare, onClose, onFlash }) {
  const [declining, setDeclining] = useState(false);
  const a = arrangementOf(care, caregiverId);
  const pen = pendingVersion(a);
  const act = activeVersion(a);
  const first = firstName(a.caregiver.name);
  const elder = firstName(care.elder.name);
  const hasCard = care.payment.connected;
  if (!pen) return null;

  const agree = () => {
    onCare(agreeTerms(caregiverId));
    onFlash(act ? `Verzija ${pen.version} važi od danas.` : 'Uslovi su prihvaćeni. Posete sada mogu da se zakažu.');
    onClose();
  };
  const decline = () => {
    onCare(declineTerms(caregiverId));
    onFlash(act ? `Odbijeno. Verzija ${act.version} i dalje važi.` : 'Odbijeno. Ništa ne važi.');
    onClose();
  };

  return (
    <Modal eyebrow={`${a.caregiver.name} · ${care.elder.name}`} title={`Ugovor o nezi, verzija ${pen.version}`} wide onClose={onClose}>
      <p className="ag-lead">
        {first} je {pen.sentOn.toLowerCase()} poslala {act ? 'nove uslove' : 'svoje uslove'}.{' '}
        {act
          ? `Verzija ${act.version} važi dok ne odgovorite.`
          : 'Ništa ne može da se zakaže dok ne prihvatite, a prihvatanje ništa ne naplaćuje.'}
      </p>

      {pen.note && <p className="fam-quote">„{pen.note}“</p>}

      {act && (
        <>
          <p className="ag-label">Šta se menja</p>
          <div className="bc-lines ag-terms">
            {changesBetween(act, pen).map((r) => (
              <Line key={r.label} label={r.label} value={r.value} />
            ))}
          </div>
        </>
      )}

      <p className="ag-label">{act ? `Verzija ${pen.version} obuhvata` : 'Usluge'}</p>
      <ServiceChips ids={pen.services} />
      <div className="bc-lines ag-terms">
        <Line label="Cena po satu" value={`${money(pen.rate)} / h`} />
        <Line label="Dogovoreni sati" value={`${pen.hours} h nedeljno`} />
        <Line label="Raspored" value={pen.schedule} />
      </div>

      <p className="ag-hint">
        Prihvatanjem uslova {first} može da zakazuje posete. Svaka se unapred rezerviše na vašoj
        kartici, a naplaćuje tek kad se obavi.
      </p>

      {!hasCard && (
        <div className="fam-callout">
          <p>
            Prvo dodajte način plaćanja. Prihvatanjem uslova {first} može da rezerviše posetu na vašoj
            kartici — sada se ništa ne naplaćuje, niti pre nego što se poseta obavi.
          </p>
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

      {declining ? (
        <div className="panel-card-actions is-end fam-confirm">
          <p className="fam-confirm-text">
            Ništa novo ne počinje i ništa se ne naplaćuje. {first} će biti obaveštena, a koordinatorka će
            vas pozvati da se dogovore uslovi koji vam odgovaraju.
          </p>
          <Button variant="secondary" onClick={() => setDeclining(false)}>
            Nazad
          </Button>
          <Button variant="danger" onClick={decline}>
            Odbij verziju {pen.version}
          </Button>
        </div>
      ) : (
        <div className="panel-card-actions is-end">
          <Button variant="secondary" onClick={() => setDeclining(true)}>
            Odbij
          </Button>
          <Button variant="primary" disabled={!hasCard} onClick={agree}>
            <Check size={14} strokeWidth={2} />
            Prihvati uslove
          </Button>
        </div>
      )}
    </Modal>
  );
}

// ── the work order ──────────────────────────────────────────────────────────

const QUERY_REASONS = [
  { id: 'hours', label: 'Sati nisu tačni' },
  { id: 'not-done', label: 'Nešto sa spiska nije urađeno' },
  { id: 'no-visit', label: 'Poseta se nije desila' },
  { id: 'other', label: 'Nešto drugo' },
];

function WorkOrder({ care, visitId, onCare, onClose, onFlash }) {
  const [querying, setQuerying] = useState(false);
  const [reason, setReason] = useState('hours');
  const [text, setText] = useState('');
  const v = findVisit(care, visitId);
  if (!v || !v.report) return null;
  const first = firstName(v.caregiver.name);
  const r = v.report;
  const skipped = v.services.filter((s) => !r.done.includes(s));
  const charge = visitCharge(v);

  const confirm = () => {
    onCare(confirmVisit(visitId));
    onFlash(`Plaćeno. ${money(charge)} ide ka negovateljici.`);
    onClose();
  };
  const query = () => {
    const label = QUERY_REASONS.find((q) => q.id === reason).label;
    onCare(queryVisit(visitId, `${label}. ${text.trim()}`));
    onFlash('Poslato koordinatorki. Ništa se ne naplaćuje dok je otvoreno.');
    onClose();
  };

  return (
    <Modal eyebrow={`${v.caregiver.name} · ${v.date}`} title="Radni nalog" wide onClose={onClose}>
      {v.status === 'charging' ? (
        <p className="ag-lead">
          {first} je ovo poslala {v.sentOn}. Ako je sve bilo kako je dogovoreno, ne morate ništa —{' '}
          {money(charge)} se naplaćuje samo za {v.chargesInHours} h.
        </p>
      ) : (
        <p className="ag-lead">
          Naplaćeno {v.chargedOn} — {v.confirmed === 'you' ? 'vi ste potvrdili' : 'potvrđeno automatski posle 24 sata'}.
        </p>
      )}

      <dl className="report-rows">
        <div className="report-row">
          <dt>Poseta</dt>
          <dd>
            {v.date} · {v.time}
          </dd>
        </div>
        <div className="report-row">
          <dt>Sati</dt>
          <dd>{v.hours} h — kako je planirano</dd>
        </div>
        <div className="report-row">
          <dt>Šta je uradila</dt>
          <dd>{r.note}</dd>
        </div>
        {v.notes && (
          <div className="report-row">
            <dt>Traženo je</dt>
            <dd>{v.notes}</dd>
          </div>
        )}
        <div className="report-row">
          <dt>Kako je bila</dt>
          <dd>
            <CareSignals report={r} />
          </dd>
        </div>
      </dl>

      <p className="ag-label">Šta je urađeno</p>
      <ServiceChips ids={r.done} missing={skipped} />

      {r.concern && (
        <p className="visit-concern">
          <AlertTriangle size={12} strokeWidth={2} />
          {first} je napomenula: {r.concern}
        </p>
      )}

      <div className="bc-total">
        <Line label={`${v.hours} h po ${money(v.rate)}/h`} value={money(chargedFor(v.hours, v.rate))} />
        <p className="bc-line is-net">
          <span className="bc-line-label">{v.status === 'charging' ? `Naplaćuje se za ${v.chargesInHours} h` : 'Naplaćeno'}</span>
          <span className="bc-line-value">{money(charge)}</span>
        </p>
      </div>

      {v.status === 'charging' && querying && (
        <>
          <p className="ag-label">Šta nije u redu</p>
          <div className="wo-choice">
            {QUERY_REASONS.map((q) => (
              <button
                key={q.id}
                type="button"
                className={`svc is-sm${reason === q.id ? ' is-on' : ''}`}
                onClick={() => setReason(q.id)}
                aria-pressed={reason === q.id}
              >
                {q.label}
              </button>
            ))}
          </div>
          <label className="wo-field">
            <span className="ag-label">Vašim rečima</span>
            <textarea
              rows={3}
              className="wo-text"
              value={text}
              autoFocus
              placeholder="Šta ste primetili, i šta ste očekivali umesto toga."
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <p className="ag-hint">Ništa se ne naplaćuje dok je ovo otvoreno. Čita koordinatorka, ne negovateljica.</p>
        </>
      )}

      {v.status === 'charging' && (
        <div className="panel-card-actions is-end">
          {querying ? (
            <>
              <Button variant="secondary" onClick={() => setQuerying(false)}>
                Nazad
              </Button>
              <Button variant="primary" disabled={!text.trim()} onClick={query}>
                Pošalji koordinatorki
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setQuerying(true)}>
                Nešto nije u redu
              </Button>
              <Button variant="primary" onClick={confirm}>
                <Check size={14} strokeWidth={2} />
                Sve je u redu — plati sada
              </Button>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── the plan, before a visit ────────────────────────────────────────────────

const OTHER = 'Drugo';
const CALL_OFF_REASONS = ['Nije nam potrebna', 'Hitan slučaj u porodici', OTHER];

function Plan({ care, visitId, onCare, onClose, onFlash }) {
  const [mode, setMode] = useState('idle'); // idle | query | call-off
  const [text, setText] = useState('');
  const [reason, setReason] = useState(CALL_OFF_REASONS[0]);
  const [other, setOther] = useState('');
  const v = findVisit(care, visitId);
  if (!v) return null;
  const first = firstName(v.caregiver.name);
  const elder = firstName(care.elder.name);
  const held = chargedFor(v.hours, v.rate);
  const late = (v.dueInHours ?? Infinity) < LATE_HOURS;
  const okReason = reason !== OTHER || other.trim();

  const query = () => {
    onCare(queryVisit(visitId, text.trim()));
    onFlash('Poslato koordinatorki. Negovateljica je obaveštena da ne dolazi dok se ne reši.');
    onClose();
  };
  const callOff = () => {
    onCare(callOffVisit(visitId, reason === OTHER ? other.trim() : reason));
    onFlash(late ? `Otkazano. ${money(held)} se naplaćuje — bilo je u poslednjem satu.` : `Otkazano. ${money(held)} se vraća na vašu karticu.`);
    onClose();
  };

  return (
    <Modal eyebrow={`${v.caregiver.name} · ${v.date} · ${v.time}`} title="Plan posete" wide onClose={onClose}>
      <p className="ag-lead">
        {first} planira da dođe na {v.hours} h. {money(held)} je rezervisano na vašoj kartici, nije
        naplaćeno — novac se uzima tek posle posete, kad pošalje radni nalog.
      </p>

      <p className="ag-label">Šta će raditi</p>
      <ServiceChips ids={v.services} />
      {v.notes && (
        <>
          <p className="ag-label">Napomene za ovu posetu</p>
          <p className="visit-note">{v.notes}</p>
        </>
      )}
      <div className="bc-lines ag-terms">
        <Line label="Poslato" value={v.sentOn} />
        <Line label="Rezervisano" value={`${money(held)} · ${v.hours} h po ${money(v.rate)}/h`} />
      </div>

      {mode === 'query' && (
        <>
          <label className="wo-field">
            <span className="ag-label">Šta nije u redu sa planom</span>
            <textarea
              rows={3}
              className="wo-text"
              value={text}
              autoFocus
              placeholder="Dan, sati, šta će raditi…"
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <p className="ag-hint">
            Novac ostaje rezervisan dok je ovo otvoreno, a negovateljica je obaveštena da ne dolazi dok
            se ne reši. Čita koordinatorka, ne negovateljica.
          </p>
        </>
      )}

      {mode === 'call-off' && (
        <>
          <p className="ag-label">Zašto se otkazuje</p>
          <div className="wo-choice">
            {CALL_OFF_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`svc is-sm${reason === r ? ' is-on' : ''}`}
                onClick={() => setReason(r)}
                aria-pressed={reason === r}
              >
                {r}
              </button>
            ))}
          </div>
          {reason === OTHER && (
            <label className="wo-field">
              <textarea
                rows={2}
                className="wo-text"
                value={other}
                autoFocus
                placeholder="U par reči"
                onChange={(e) => setOther(e.target.value)}
              />
            </label>
          )}
          <p className="ag-hint">
            {late
              ? `Do dolaska je ostalo manje od sat vremena, pa se rezervisanih ${money(held)} naplaćuje u celosti umesto da se vrati. Negovateljica je čuvala to vreme i sada ne može da ga popuni.`
              : `Rezervisanih ${money(held)} se odmah vraća i ništa se ne naplaćuje. Negovateljica je obaveštena, a koordinatorka će pomoći da se dogovori drugi dan ako je potrebno. U poslednjem satu pre dolaska naplaćuje se u celosti.`}
          </p>
        </>
      )}

      <div className="panel-card-actions is-end">
        {mode === 'idle' && (
          <>
            <Button variant="secondary" onClick={() => setMode('call-off')}>
              Otkaži posetu
            </Button>
            <Button variant="secondary" onClick={() => setMode('query')}>
              Nešto nije u redu
            </Button>
          </>
        )}
        {mode === 'query' && (
          <>
            <Button variant="secondary" onClick={() => setMode('idle')}>
              Nazad
            </Button>
            <Button variant="primary" disabled={!text.trim()} onClick={query}>
              Pošalji koordinatorki
            </Button>
          </>
        )}
        {mode === 'call-off' && (
          <>
            <Button variant="secondary" onClick={() => setMode('idle')}>
              Nazad
            </Button>
            <Button variant="danger" disabled={!okReason} onClick={callOff}>
              {late ? `Otkaži i plati ${money(held)}` : 'Otkaži i vrati novac'}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── ending it ───────────────────────────────────────────────────────────────

function End({ care, caregiverId, onCare, onClose, onFlash, onOpen }) {
  const a = arrangementOf(care, caregiverId);
  const first = firstName(a.caregiver.name);
  const blocked = unsettled(a);
  const booked = a.visits.find((v) => v.status === 'planned');

  const end = () => {
    onCare(endArrangement(caregiverId));
    onFlash('Saradnja je završena.');
    onClose();
  };

  return (
    <Modal eyebrow={`${a.caregiver.name} · samo ova saradnja`} title="Završiti saradnju?" wide onClose={onClose}>
      {blocked.length ? (
        <>
          <p className="ag-lead">
            {first} je obavila posao koji još nije izmiren. To prvo mora da se završi — da sada prekinete,
            ostala bi neplaćena za posetu koju je već obavila.
          </p>
          <p className="ag-hint">Prvo rešite otvoreni radni nalog, pa se vratite na ovo.</p>
          <div className="panel-card-actions is-end">
            <Button variant="secondary" onClick={onClose}>
              Ne sada
            </Button>
            {blocked[0].status === 'charging' && (
              <Button variant="primary" onClick={() => onOpen({ kind: 'work-order', visitId: blocked[0].id })}>
                Pogledaj radni nalog
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="ag-lead">
            Posle ovoga {first} ne može da šalje nove posete i ništa više ne može da se naplati. Sve što je
            već izmireno ostaje u vašoj evidenciji.
            {booked &&
              ` Poseta zakazana za ${booked.date.toLowerCase()} se otkazuje, a ${money(chargedFor(booked.hours, booked.rate))} se vraća na vašu karticu.`}
          </p>
          <p className="ag-hint">
            Koordinatorka će biti obaveštena i pomoći će da se organizuje druga nega ako je potrebna.
          </p>
          <div className="panel-card-actions is-end">
            <Button variant="secondary" onClick={onClose}>
              Zadrži
            </Button>
            <Button variant="danger" onClick={end}>
              Završi saradnju
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ── someone they might ask ──────────────────────────────────────────────────

function Profile({ care, caregiverId, onCare, onClose, onFlash }) {
  const c = caregivers.find((x) => x.id === caregiverId);
  if (!c) return null;
  const first = firstName(c.name);
  const asked = care.requests.find((r) => r.caregiverId === c.id);
  const coming = arrangementOf(care, c.id);

  const ask = () => {
    onCare(askCaregiver(c.id));
    onFlash(`Upit je poslat. ${first} odgovara sa svoje table — upit ništa ne košta.`);
    onClose();
  };

  return (
    <Modal eyebrow={`${c.area} · ${c.distance}`} title={c.name} wide onClose={onClose}>
      <div className="fam-profile-head">
        <span className="cg-avatar is-lg">{c.initials}</span>
        <div className="fam-row-main">
          <p className="fam-row-title">
            <Star size={13} strokeWidth={2} className="cg-star" />
            {c.rating} · {pl(c.reviews, 'ocena', 'ocene', 'ocena')}
          </p>
          <p className="fam-row-body">
            {c.years} god. u kućnoj nezi · {c.rate}
          </p>
        </div>
        <span className="status-pill is-attention">Poklapanje · {c.match}%</span>
      </div>

      <p className="fam-quote">{c.bio}</p>

      <p className="ag-label">Čime se bavi</p>
      <div className="ag-services">
        {c.tags.map((t) => (
          <span key={t} className="svc is-set">
            <Check size={13} strokeWidth={2.5} />
            {t}
          </span>
        ))}
      </div>

      <p className="ag-label">Kvalifikacije</p>
      <div className="bc-lines ag-terms">
        <Line label="Zanimanje" value={c.qualification} />
        <Line label="Jezici" value={c.languages.join(', ')} />
        <Line label="Iskustvo" value={pl(c.years, 'godina', 'godine', 'godina')} />
      </div>

      <p className="ag-label">Kada može da dolazi</p>
      <div className="bc-lines ag-terms">
        <Line label="Dani" value={c.days} />
        <Line label="Doba dana" value={c.slot} />
        <Line label="Noćne smene" value={c.nightShift ? 'Da' : 'Ne'} />
        <Line label="Cena" value={c.rate} />
      </div>

      <p className="ag-hint">
        Upit joj šalje plan nege. Ništa ne košta i nikoga ne obavezuje — ona odgovara, a ništa nije
        dogovoreno dok zajedno ne postavite uslove.
      </p>

      <div className="panel-card-actions is-end">
        {coming || asked ? (
          <span className="status-pill is-accepted fam-asked">
            <Check size={12} strokeWidth={2} />
            {coming ? 'Već dolazi kod vas' : `Upit poslat ${asked.requested}`}
          </span>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Ne sada
            </Button>
            <Button variant="primary" onClick={ask}>
              Pošalji upit
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}

export default function FamilyDrawer({ drawer, ...rest }) {
  if (!drawer) return null;
  if (drawer.kind === 'terms') return <Terms key="terms" caregiverId={drawer.caregiverId} {...rest} />;
  if (drawer.kind === 'work-order') return <WorkOrder key={`wo-${drawer.visitId}`} visitId={drawer.visitId} {...rest} />;
  if (drawer.kind === 'plan') return <Plan key={`plan-${drawer.visitId}`} visitId={drawer.visitId} {...rest} />;
  if (drawer.kind === 'end') return <End key="end" caregiverId={drawer.caregiverId} {...rest} />;
  if (drawer.kind === 'profile') return <Profile key="profile" caregiverId={drawer.caregiverId} {...rest} />;
  return null;
}
