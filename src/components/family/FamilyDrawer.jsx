import { useState } from 'react';
import { AlertTriangle, Check, CreditCard, Star } from 'lucide-react';
import { MASKED_EMAIL, MASKED_PHONE, caregivers, daysText, SLOTS } from '../../data/carePlan';
import Modal from '../Modal';
import Dialog from '../Dialog';
import Tags from '../Tags';
import { groupServices } from '../../data/serviceCatalog';
import Standing from '../Standing';
import VisitRow from './VisitRow';
import { careSignals } from './VisitReport';
import { ActivityRows } from './Activity';
import Button from '../Button';
import { Field, TextArea } from '../TextField';
import {
  LATE_HOURS,
  activeVersion,
  agreeTerms,
  answerExtra,
  arrangementOf,
  callOffVisit,
  canAsk,
  chargedFor,
  confirmVisit,
  declineTerms,
  endArrangement,
  LOG_KINDS,
  dayLabel,
  findVisit,
  firstName,
  nameOf,
  paidTo,
  services,
  todayOf,
  workedHours,
  herVisits,
  linkCard,
  money,
  pendingVersion,
  pl,
  queryVisit,
  returnedFor,
  serviceTitle,
  standingWith,
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


// What an agreement, a plan or a work order covers. `grouped` lists them under
// the catalog's group names (Pomoć u svakodnevici, Lična nega i kuća, …), for
// where the whole of an agreement is read; a row keeps one plain group.
export function ServiceChips({ ids, missing = [], label, grouped }) {
  const groups = grouped ? groupServices([...ids, ...missing]) : [];
  if (groups.length) {
    return (
      <div className="tag-rows">
        {groups.map((g) => (
          <Tags
            key={g.id}
            label={g.title}
            items={g.items.filter((id) => ids.includes(id)).map(serviceTitle)}
            off={g.items.filter((id) => missing.includes(id)).map((id) => `${serviceTitle(id)} - ovog puta ne`)}
          />
        ))}
      </div>
    );
  }
  return (
    <Tags label={label} items={ids.map(serviceTitle)} off={missing.map((id) => `${serviceTitle(id)} - ovog puta ne`)} />
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
    <>
    <Modal eyebrow={`${a.caregiver.name} · ${care.elder.name}`} title={`Ugovor o nezi, verzija ${pen.version}`} wide onClose={onClose}>
      <p className="ag-lead">
        {first} je {pen.sentOn.toLowerCase()} poslala {act ? 'nove uslove' : 'svoje uslove'}.{' '}
        {act
          ? `Verzija ${act.version} važi dok ne odgovorite.`
          : 'Ništa ne može da se zakaže dok ne prihvatite, a prihvatanje ništa ne naplaćuje.'}
      </p>

      {pen.note && (
        <>
          <p className="ag-label">{act ? 'Zašto menja uslove' : `${first} je napisala`}</p>
          <p className="doc-p">{pen.note}</p>
        </>
      )}

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
      <ServiceChips ids={pen.services} grouped />
      <div className="bc-lines ag-terms">
        <Line label="Cena po satu" value={`${money(pen.rate)} / h`} />
        <Line label="Dogovoreni sati" value={`${pen.hours} h nedeljno`} />
        <Line label="Raspored" value={pen.schedule} />
      </div>
      {pen.terms && (
        <>
          <p className="ag-label">Dodatni uslovi</p>
          <p className="doc-p">{pen.terms}</p>
        </>
      )}

      <p className="ag-hint">
        Prihvatanjem uslova {first} može da zakazuje posete. Svaka se unapred rezerviše na vašoj
        kartici, a naplaćuje tek kad se obavi.
      </p>

      {!hasCard && (
        <div className="fam-callout">
          <p>
            Prvo dodajte način plaćanja. Prihvatanjem uslova {first} može da rezerviše posetu na vašoj
            kartici - sada se ništa ne naplaćuje, niti pre nego što se poseta obavi.
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

      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={() => setDeclining(true)}>
          Odbij
        </Button>
        <Button variant="primary" disabled={!hasCard} onClick={agree}>
          <Check size={14} strokeWidth={2} />
          Prihvati uslove
        </Button>
      </div>
    </Modal>

    {/* declining is an action, so it is asked in a dialog over the terms */}
    {declining && (
      <Dialog
        eyebrow={`${a.caregiver.name} · ${care.elder.name}`}
        title={`Odbiti verziju ${pen.version}?`}
        onClose={() => setDeclining(false)}
      >
        <p className="doc-p">
          Ništa novo ne počinje i ništa se ne naplaćuje. {first} će biti obaveštena, a koordinatorka će vas
          pozvati da se dogovore uslovi koji vam odgovaraju.
          {act && ` Verzija ${act.version} i dalje važi.`}
        </p>
        <div className="panel-card-actions is-end">
          <Button variant="secondary" onClick={() => setDeclining(false)}>
            Nazad
          </Button>
          <Button variant="danger" onClick={decline}>
            Odbij verziju {pen.version}
          </Button>
        </div>
      </Dialog>
    )}
    </>
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
  const back = returnedFor(v);
  const extra = v.extra;
  const hoursText =
    r.hours < v.hours
      ? `${r.hours} h, rezervisano ${v.hours} h`
      : r.hours > v.hours
        ? `${r.hours} h, rezervisano ${v.hours} h`
        : `${r.hours} h - kako je planirano`;

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
  const answer = (yes) => {
    onCare(answerExtra(visitId, yes));
    onFlash(yes ? `Dodatni sati su odobreni. ${money(chargedFor(extra.hours, v.rate))} se naplaćuje sa posetom.` : 'Dodatni sati su odbijeni. Ništa više se ne naplaćuje.');
  };

  const lead =
    v.status === 'charging'
      ? `${first} je ovo poslala ${v.reportSentOn || v.sentOn}. Ako je sve bilo kako je dogovoreno, ne morate ništa - ${money(charge)} se naplaćuje za ${v.chargesInHours} h.`
      : v.status === 'disputed'
        ? 'Ovo ste prijavili koordinatorki. Ništa se ne naplaćuje dok ne proveri.'
        : v.resolution
          ? v.resolution.text
          : `Naplaćeno ${v.chargedOn} - ${v.confirmed === 'you' ? 'vi ste potvrdili' : 'potvrđeno automatski posle 24 sata'}.`;

  return (
    <>
    <Modal eyebrow={`${v.caregiver.name} · ${v.date}`} title="Radni nalog" wide onClose={onClose}>
      <p className="ag-lead">{lead}</p>

      <dl className="report-rows">
        <div className="report-row">
          <dt>Poseta</dt>
          <dd>
            {v.date} · {v.time}
          </dd>
        </div>
        <div className="report-row">
          <dt>Sati</dt>
          <dd>{hoursText}</dd>
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
            <Tags items={careSignals(r)} />
          </dd>
        </div>
      </dl>

      <p className="ag-label">Šta je urađeno</p>
      <ServiceChips ids={r.done} missing={skipped} grouped />

      {r.concern && (
        <p className="visit-concern">
          <AlertTriangle size={12} strokeWidth={2} />
          {first} je napomenula: {r.concern}
        </p>
      )}

      {/* Hours over the reserved ones are never taken on their own: the
          family says yes or no, here, whether or not the visit is charged yet. */}
      {extra && (
        <>
          <p className="ag-label">Dodatni sati</p>
          <p className="doc-p">
            {extra.status === 'asked'
              ? `${first} je radila ${pl(extra.hours, 'sat', 'sata', 'sati')} duže nego što je rezervisano. To se ne naplaćuje samo od sebe: odobrite ${money(chargedFor(extra.hours, v.rate))} ili odbijte.`
              : extra.status === 'approved'
                ? `Odobrili ste ${pl(extra.hours, 'dodatni sat', 'dodatna sata', 'dodatnih sati')}, ${money(chargedFor(extra.hours, v.rate))}.`
                : `Odbili ste ${pl(extra.hours, 'dodatni sat', 'dodatna sata', 'dodatnih sati')}. Ništa više se ne naplaćuje.`}
          </p>
          {extra.status === 'asked' && (
            <div className="panel-card-actions">
              <Button variant="secondary" onClick={() => answer(false)}>
                Odbij dodatne sate
              </Button>
              <Button variant="primary" onClick={() => answer(true)}>
                Odobri {money(chargedFor(extra.hours, v.rate))}
              </Button>
            </div>
          )}
        </>
      )}

      <div className="bc-total">
        <Line label={`Rezervisano: ${v.hours} h po ${money(v.rate)}/h`} value={money(chargedFor(v.hours, v.rate))} />
        {back > 0 && <Line label={`Vraća se: ${v.hours - r.hours} h manje`} value={money(back)} />}
        {extra?.status === 'approved' && <Line label={`Dodatni sati: ${extra.hours} h`} value={money(chargedFor(extra.hours, v.rate))} />}
        <p className="bc-line is-net">
          <span className="bc-line-label">
            {v.status === 'charging' ? `Naplaćuje se za ${v.chargesInHours} h` : v.status === 'disputed' ? 'Zadržano dok se ne proveri' : v.status === 'cancelled' ? 'Ništa nije naplaćeno' : 'Naplaćeno'}
          </span>
          <span className="bc-line-value">{v.status === 'cancelled' ? money(0) : money(charge)}</span>
        </p>
      </div>

      {v.status === 'charging' && (
        <div className="panel-card-actions is-end">
          <Button variant="secondary" onClick={() => setQuerying(true)}>
            Nešto nije u redu
          </Button>
          <Button variant="primary" onClick={confirm}>
            <Check size={14} strokeWidth={2} />
            Sve je u redu - plati sada
          </Button>
        </div>
      )}
    </Modal>

    {v.status === 'charging' && querying && (
      <Dialog eyebrow={`Radni nalog · ${v.date}`} title="Šta nije u redu?" onClose={() => setQuerying(false)}>
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
        <Field label="Vašim rečima">
          <TextArea
            rows={3}
            value={text}
            autoFocus
            placeholder="Šta ste primetili, i šta ste očekivali umesto toga."
            onChange={setText}
          />
        </Field>
        <p className="ag-hint">Ništa se ne naplaćuje dok je ovo otvoreno. Čita koordinatorka, ne negovateljica.</p>
        <div className="panel-card-actions is-end">
          <Button variant="secondary" onClick={() => setQuerying(false)}>
            Nazad
          </Button>
          <Button variant="primary" disabled={!text.trim()} onClick={query}>
            Pošalji koordinatorki
          </Button>
        </div>
      </Dialog>
    )}
    </>
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
    onFlash(late ? `Otkazano. ${money(held)} se naplaćuje - bilo je u poslednjem satu.` : `Otkazano. ${money(held)} se vraća na vašu karticu.`);
    onClose();
  };

  return (
    <>
    <Modal eyebrow={`${v.caregiver.name} · ${v.date} · ${v.time}`} title="Plan posete" wide onClose={onClose}>
      <p className="ag-lead">
        {first} planira da dođe na {v.hours} h. {money(held)} je rezervisano na vašoj kartici, nije
        naplaćeno - novac se uzima tek posle posete, kad pošalje radni nalog.
      </p>

      <p className="ag-label">Šta će raditi</p>
      <ServiceChips ids={v.services} grouped />
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

      <div className="panel-card-actions is-end">
        <Button variant="secondary" onClick={() => setMode('call-off')}>
          Otkaži posetu
        </Button>
        <Button variant="secondary" onClick={() => setMode('query')}>
          Nešto nije u redu
        </Button>
      </div>
    </Modal>

    {mode === 'query' && (
      <Dialog eyebrow={`Plan posete · ${v.date}`} title="Šta nije u redu sa planom?" onClose={() => setMode('idle')}>
        <Field label="Vašim rečima">
          <TextArea rows={3} value={text} autoFocus placeholder="Dan, sati, šta će raditi…" onChange={setText} />
        </Field>
        <p className="ag-hint">
          Novac ostaje rezervisan dok je ovo otvoreno, a negovateljica je obaveštena da ne dolazi dok se ne
          reši. Čita koordinatorka, ne negovateljica.
        </p>
        <div className="panel-card-actions is-end">
          <Button variant="secondary" onClick={() => setMode('idle')}>
            Nazad
          </Button>
          <Button variant="primary" disabled={!text.trim()} onClick={query}>
            Pošalji koordinatorki
          </Button>
        </div>
      </Dialog>
    )}

    {mode === 'call-off' && (
      <Dialog eyebrow={`Plan posete · ${v.date} · ${v.time}`} title="Otkazati posetu?" onClose={() => setMode('idle')}>
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
          <Field>
            <TextArea
              rows={2}
              value={other}
              autoFocus
              placeholder="U par reči"
              aria-label="Drugi razlog"
              onChange={setOther}
            />
          </Field>
        )}
        <p className="ag-hint">
          {late
            ? `Do dolaska je ostalo manje od sat vremena, pa se rezervisanih ${money(held)} naplaćuje u celosti umesto da se vrati. Negovateljica je čuvala to vreme i sada ne može da ga popuni.`
            : `Rezervisanih ${money(held)} se odmah vraća i ništa se ne naplaćuje. Negovateljica je obaveštena, a koordinatorka će pomoći da se dogovori drugi dan ako je potrebno. U poslednjem satu pre dolaska naplaćuje se u celosti.`}
        </p>
        <div className="panel-card-actions is-end">
          <Button variant="secondary" onClick={() => setMode('idle')}>
            Nazad
          </Button>
          <Button variant="danger" disabled={!okReason} onClick={callOff}>
            {late ? `Otkaži i plati ${money(held)}` : 'Otkaži i vrati novac'}
          </Button>
        </div>
      </Dialog>
    )}
    </>
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
    <Dialog eyebrow={`${a.caregiver.name} · samo ova saradnja`} title="Završiti saradnju?" onClose={onClose}>
      {blocked.length ? (
        <>
          <p className="ag-lead">
            {first} je obavila posao koji još nije izmiren. To prvo mora da se završi - da sada prekinete,
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
    </Dialog>
  );
}

// ── someone they might ask ──────────────────────────────────────────────────

function Profile({ care, caregiverId, unlocked, onContact, onCaregiver, onClose }) {
  const c = caregivers.find((x) => x.id === caregiverId);
  if (!c) return null;
  // where the family stands with her is said at the top, under who she is,
  // not in the footer where it read as a disabled button
  const standing = standingWith(care, c.id);

  // writing to her goes through the one modal, sent once the subscription is paid
  const ask = () => onContact(c);

  return (
    <Modal eyebrow={`${c.area} · dolazi do ${c.radius} km`} title={c.name} wide onClose={onClose}>
      <div className="fam-profile-head">
        <span className="cg-avatar is-lg">{c.initials}</span>
        <div className="fam-row-main">
          <p className="fam-row-title">
            <Star size={13} strokeWidth={2} className="cg-star" />
            {c.reviews ? `${c.rating.toLocaleString('sr-RS', { minimumFractionDigits: 1 })} · ${pl(c.reviews, 'ocena', 'ocene', 'ocena')}` : 'Nova, još bez ocena'}
          </p>
          <p className="fam-row-body">{c.rate}</p>
          <Standing standing={standing} className="fam-asked" />
        </div>
        <span className="status-pill is-attention">Poklapanje · {c.match}%</span>
      </div>

      <p className="ag-label">O sebi</p>
      <p className="doc-p">{c.bio}</p>

      <p className="ag-label">Klasifikacije</p>
      <Tags items={c.classifications} />

      <p className="ag-label">Kvalifikacije</p>
      <div className="bc-lines ag-terms">
        <Line label="Obrazovanje" value={c.education} />
        <Line label="Jezici" value={c.languages.join(', ')} />
      </div>

      <p className="ag-label">Kada može da dolazi</p>
      <div className="bc-lines ag-terms">
        <Line label="Dani" value={daysText(c.days)} />
        <Line label="Doba dana" value={c.slots.map((s) => `${SLOTS[s].label.toLowerCase()} ${SLOTS[s].hours}`).join(', ')} />
        <Line label="Radijus" value={`do ${c.radius} km`} />
        <Line label="Cena" value={c.rate} />
      </div>

      {/* Her phone and e-mail open with the subscription, as on the platform. */}
      <p className="ag-label">Kontakt</p>
      <div className="bc-lines ag-terms">
        <Line label="Telefon" value={unlocked ? c.phone : MASKED_PHONE} />
        <Line label="E-mail" value={unlocked ? c.email : MASKED_EMAIL} />
      </div>
      {!unlocked && <p className="ag-hint">Telefon i e-mail se otključavaju pretplatom.</p>}

      <p className="ag-hint">
        Upit joj šalje plan nege. Ništa ne košta i nikoga ne obavezuje - ona odgovara, a ništa nije
        dogovoreno dok zajedno ne postavite uslove.
      </p>

      {/* Never asked: write to her. Asked before and free to ask again (a no,
          or a cooperation that ended): the same, said as again; and when she
          came before, her page with everything from then. */}
      {(!standing || canAsk(care, c.id) || arrangementOf(care, c.id)) && (
        <div className="panel-card-actions is-end">
          {arrangementOf(care, c.id) ? (
            <Button variant="secondary" onClick={() => onCaregiver(c.id)}>
              Njena stranica
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              Ne sada
            </Button>
          )}
          {canAsk(care, c.id) && (
            <Button variant="primary" onClick={ask}>
              {!standing ? 'Pošalji poruku' : arrangementOf(care, c.id) ? 'Ponovo sarađujte' : 'Pitaj ponovo'}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}

// Every visit she has made, when her page shows only the latest ten. A visit's
// own button opens its plan or work order in this drawer's place.
function Visits({ care, caregiverId, onOpen, onClose }) {
  const a = arrangementOf(care, caregiverId);
  if (!a) return null;
  const visits = herVisits(a);
  return (
    <Modal eyebrow={`${a.caregiver.name} · ${pl(visits.length, 'poseta', 'posete', 'poseta')}`} title="Sve posete" wide onClose={onClose}>
      <ul className="fam-visits">
        {visits.map((v) => (
          <VisitRow key={v.id} visit={v} onDrawer={onOpen} />
        ))}
      </ul>
    </Modal>
  );
}

// Everything that has happened, newest first, by day, with a filter by kind:
// one caregiver's from her page, everyone's from Moja nega.
function ActivityDrawer({ care, caregiverId, onClose }) {
  const [kind, setKind] = useState('all');
  const all = (care.log || []).filter((e) => !caregiverId || e.caregiverId === caregiverId);
  const kinds = LOG_KINDS.filter((k) => all.some((e) => e.kind === k.id));
  const picked = kind === 'all' ? all : all.filter((e) => e.kind === kind);
  const today = todayOf(care);
  const days = [];
  for (const e of picked) {
    const day = dayLabel(Math.floor(e.at / 24), today);
    const last = days[days.length - 1];
    if (last && last.day === day) last.entries.push(e);
    else days.push({ day, entries: [e] });
  }
  const who = caregiverId ? nameOf(care, caregiverId) : care.elder.name || 'Vaša nega';
  return (
    <Modal eyebrow={who} title="Šta se desilo" wide onClose={onClose}>
      <div className="fam-filter" role="group" aria-label="Šta prikazati">
        {[{ id: 'all', label: 'Sve' }, ...kinds].map((k) => (
          <button
            key={k.id}
            type="button"
            className={`svc is-sm${kind === k.id ? ' is-on' : ''}`}
            aria-pressed={kind === k.id}
            onClick={() => setKind(k.id)}
          >
            {k.label}
            <span className="fam-filter-note">{k.id === 'all' ? all.length : all.filter((e) => e.kind === k.id).length}</span>
          </button>
        ))}
      </div>
      {days.map((d) => (
        <div key={d.day}>
          <p className="ag-label">{d.day}</p>
          <ActivityRows care={care} entries={d.entries} showWho={!caregiverId} />
        </div>
      ))}
      {!picked.length && <p className="ag-hint">Ovde još nema ničega.</p>}
    </Modal>
  );
}

// Everything about her in one place: how to reach her, what she is, what her
// agreement covers, how paying works, and what has been paid so far.
function Overview({ care, caregiverId, onClose }) {
  const a = arrangementOf(care, caregiverId);
  if (!a) return null;
  const c = caregivers.find((x) => x.id === caregiverId);
  const first = firstName(a.caregiver.name);
  const act = activeVersion(a);
  const done = a.visits.filter((v) => v.status === 'paid');
  const hours = done.reduce((n, v) => n + workedHours(v) + (v.extra?.status === 'approved' ? v.extra.hours : 0), 0);
  return (
    <Modal eyebrow={`${a.caregiver.name} · ${a.caregiver.area}`} title="Pregled" wide onClose={onClose}>
      <div className="bc-lines ag-terms">
        <Line label="Posete do sada" value={done.length ? `${done.length} · ${hours} h` : 'još nijedna'} />
        <Line label="Plaćeno do sada" value={money(paidTo(a))} />
        <Line label="Cena po satu" value={act ? `${money(act.rate)} / h` : '-'} />
        <Line label="Ocena" value={c?.reviews ? `${c.rating.toLocaleString('sr-RS', { minimumFractionDigits: 1 })} · ${pl(c.reviews, 'ocena', 'ocene', 'ocena')}` : 'još bez ocena'} />
      </div>

      <p className="ag-label">Kontakt</p>
      <div className="bc-lines ag-terms">
        <Line label="Telefon" value={a.endedOn ? 'Skriven posle kraja saradnje' : a.caregiver.phone} />
        <Line label="Opština" value={a.caregiver.area} />
        {c?.languages && <Line label="Jezici" value={c.languages.join(', ')} />}
      </div>
      <p className="ag-hint">
        Ako nešto nije u redu tokom posete, prvo pozovite {first}. Sve oko novca rešava koordinatorka.
      </p>

      <p className="ag-label">Klasifikacije</p>
      <Tags items={a.caregiver.classifications || c?.classifications || []} />

      <p className="ag-label">Šta pokriva za vas</p>
      {act ? <ServiceChips ids={act.services} grouped /> : <p className="doc-p">Još ništa nije dogovoreno.</p>}
      {act && <p className="ag-hint">Iz ugovora koji važi. Sve van njega mora prvo da se dogovori kao nova verzija.</p>}

      <p className="ag-label">Kako se plaća</p>
      <div className="bc-lines ag-terms">
        <Line label="Način plaćanja" value={care.payment.connected ? `${care.payment.brand} ···· ${care.payment.last4}` : 'Još nije dodat'} />
        <Line label="Rezerviše se" value="kad stigne plan posete" />
        <Line label="Naplaćuje se" value="24 sata posle radnog naloga" />
      </div>
      <p className="ag-hint">
        Naplaćuje se samo poseta koja se desila i za koju je {first} poslala radni nalog. Sati preko
        rezervisanih se naplaćuju samo ako ih odobrite.
      </p>
    </Modal>
  );
}

// Every version of her terms, newest first, and what each changed.
const VERSION_STATE = {
  sent: { text: 'čeka vaš odgovor', pill: 'is-pending' },
  active: { text: 'važi', pill: 'is-accepted' },
  replaced: { text: 'zamenjena', pill: 'is-muted' },
  declined: { text: 'odbijena', pill: 'is-declined' },
  withdrawn: { text: 'povučena', pill: 'is-muted' },
  ended: { text: 'završena', pill: 'is-muted' },
};

function Versions({ care, caregiverId, onClose }) {
  const a = arrangementOf(care, caregiverId);
  if (!a) return null;
  const list = [...a.versions].reverse();
  return (
    <Modal eyebrow={`${a.caregiver.name} · ${care.elder.name}`} title="Sve verzije ugovora" wide onClose={onClose}>
      {list.map((v) => {
        const prev = a.versions[v.version - 2];
        const st = VERSION_STATE[v.status] || VERSION_STATE.replaced;
        const changes = prev ? changesBetween(prev, v) : [];
        return (
          <div key={v.version}>
            <p className="ag-label">
              Verzija {v.version} <span className={`status-pill ${st.pill}`}>{st.text}</span>
            </p>
            <div className="bc-lines ag-terms">
              <Line label="Poslato" value={v.sentOn} />
              <Line label="Cena po satu" value={`${money(v.rate)} / h`} />
              <Line label="Usluge" value={services(v.services.length)} />
              {changes.map((r) => (
                <Line key={r.label} label={r.label} value={r.value} />
              ))}
            </div>
            {v.note && prev && <p className="doc-p">{v.note}</p>}
          </div>
        );
      })}
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
  if (drawer.kind === 'visits') return <Visits key="visits" caregiverId={drawer.caregiverId} {...rest} />;
  if (drawer.kind === 'activity') return <ActivityDrawer key="activity" caregiverId={drawer.caregiverId} {...rest} />;
  if (drawer.kind === 'overview') return <Overview key="overview" caregiverId={drawer.caregiverId} {...rest} />;
  if (drawer.kind === 'versions') return <Versions key="versions" caregiverId={drawer.caregiverId} {...rest} />;
  return null;
}
