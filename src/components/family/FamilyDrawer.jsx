import { Fragment, useState } from 'react';
import { AlertTriangle, Check, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Item, ItemContent, ItemGroup } from '@/components/ui/item';
import { SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DataList, DataRow } from '@/components/data-list';
import { Callout, Concern, PaneHint, PaneLabel, ReportRow, ReportRows, Stat, Stats, Total } from '@/components/pane';
import { statusVariant } from '../Standing';
import { MASKED_EMAIL, MASKED_PHONE, caregivers, daysText, SLOTS } from '../../data/carePlan';
import Modal from '../Modal';
import Dialog from '../Dialog';
import Tags, { Group, Groups } from '../Tags';
import { groupServices } from '../../data/serviceCatalog';
import CaregiverHead from '../CaregiverHead';
import Rating from '../Rating';
import VisitRow from './VisitRow';
import { careSignals } from './VisitReport';
import { ActivityRows } from './Activity';
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
  dayOf,
  findVisit,
  firstName,
  nameOf,
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
      <Groups>
        {groups.map((g) => (
          <Tags
            key={g.id}
            label={g.title}
            items={g.items.filter((id) => ids.includes(id)).map(serviceTitle)}
            off={g.items.filter((id) => missing.includes(id)).map((id) => `${serviceTitle(id)} - ovog puta ne`)}
          />
        ))}
      </Groups>
    );
  }
  return (
    <Tags label={label} items={ids.map(serviceTitle)} off={missing.map((id) => `${serviceTitle(id)} - ovog puta ne`)} />
  );
}

// a short value right of its label (docs/patterns.md §8)
export function Line({ label, value }) {
  return <DataRow label={label}>{value}</DataRow>;
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

function Terms({ open = true, care, caregiverId, onCare, onClose, onFlash }) {
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
    <Modal eyebrow={`${a.caregiver.name} · ${care.elder.name}`} title={`Ugovor o nezi, verzija ${pen.version}`} wide open={open} onClose={onClose}>
      <SheetDescription>
        {first} je {pen.sentOn.toLowerCase()} poslala {act ? 'nove uslove' : 'svoje uslove'}.{' '}
        {act
          ? `Verzija ${act.version} važi dok ne odgovorite.`
          : 'Ništa ne može da se zakaže dok ne prihvatite, a prihvatanje ništa ne naplaćuje.'}
      </SheetDescription>

      {pen.note && (
        <>
          <PaneLabel>{act ? 'Zašto menja uslove' : `${first} je napisala`}</PaneLabel>
          <SheetDescription>{pen.note}</SheetDescription>
        </>
      )}

      {act && (
        <>
          <PaneLabel>Šta se menja</PaneLabel>
          <DataList className="mt-2">
            {changesBetween(act, pen).map((r) => (
              <Line key={r.label} label={r.label} value={r.value} />
            ))}
          </DataList>
        </>
      )}

      <PaneLabel>{act ? `Verzija ${pen.version} obuhvata` : 'Usluge'}</PaneLabel>
      <ServiceChips ids={pen.services} grouped />
      <DataList className="mt-2">
        <Line label="Cena po satu" value={`${money(pen.rate)} / h`} />
        <Line label="Dogovoreni sati" value={`${pen.hours} h nedeljno`} />
        <Line label="Raspored" value={pen.schedule} />
      </DataList>
      {pen.terms && (
        <>
          <PaneLabel>Dodatni uslovi</PaneLabel>
          <SheetDescription>{pen.terms}</SheetDescription>
        </>
      )}

      <PaneHint>
        Prihvatanjem uslova {first} može da zakazuje posete. Svaka se unapred rezerviše na vašoj
        kartici, a naplaćuje tek kad se obavi.
      </PaneHint>

      {!hasCard && (
        <Callout>
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
        </Callout>
      )}

      <SheetFooter>
        <Button variant="secondary" onClick={() => setDeclining(true)}>
          Odbij
        </Button>
        <Button disabled={!hasCard} onClick={agree}>
          <Check size={14} strokeWidth={2} />
          Prihvati uslove
        </Button>
      </SheetFooter>
    </Modal>

    {/* declining is an action, so it is asked in a dialog over the terms */}
    {declining && (
      <Dialog
        eyebrow={`${a.caregiver.name} · ${care.elder.name}`}
        title={`Odbiti verziju ${pen.version}?`}
        onClose={() => setDeclining(false)}
      >
        <DialogDescription>
          Ništa novo ne počinje i ništa se ne naplaćuje. {first} će biti obaveštena, a koordinatorka će vas
          pozvati da se dogovore uslovi koji vam odgovaraju.
          {act && ` Verzija ${act.version} i dalje važi.`}
        </DialogDescription>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDeclining(false)}>
            Nazad
          </Button>
          <Button variant="destructive" onClick={decline}>
            Odbij verziju {pen.version}
          </Button>
        </DialogFooter>
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

function WorkOrder({ open = true, care, visitId, onCare, onClose, onFlash }) {
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
    <Modal eyebrow={`${v.caregiver.name} · ${v.date}`} title="Radni nalog" wide open={open} onClose={onClose}>
      <SheetDescription>{lead}</SheetDescription>

      <ReportRows>
        <ReportRow label="Poseta">
          {v.date} · {v.time}
        </ReportRow>
        <ReportRow label="Sati">{hoursText}</ReportRow>
        <ReportRow label="Šta je uradila">{r.note}</ReportRow>
        {v.notes && <ReportRow label="Traženo je">{v.notes}</ReportRow>}
        <ReportRow label="Kako je bila">
          <Tags items={careSignals(r)} />
        </ReportRow>
      </ReportRows>

      <PaneLabel>Šta je urađeno</PaneLabel>
      <ServiceChips ids={r.done} missing={skipped} grouped />

      {r.concern && (
        <Concern>
          <AlertTriangle size={12} strokeWidth={2} />
          {first} je napomenula: {r.concern}
        </Concern>
      )}

      {/* Hours over the reserved ones are never taken on their own: the
          family says yes or no, here, whether or not the visit is charged yet. */}
      {extra && (
        <>
          <PaneLabel>Dodatni sati</PaneLabel>
          <SheetDescription>
            {extra.status === 'asked'
              ? `${first} je radila ${pl(extra.hours, 'sat', 'sata', 'sati')} duže nego što je rezervisano. To se ne naplaćuje samo od sebe: odobrite ${money(chargedFor(extra.hours, v.rate))} ili odbijte.`
              : extra.status === 'approved'
                ? `Odobrili ste ${pl(extra.hours, 'dodatni sat', 'dodatna sata', 'dodatnih sati')}, ${money(chargedFor(extra.hours, v.rate))}.`
                : `Odbili ste ${pl(extra.hours, 'dodatni sat', 'dodatna sata', 'dodatnih sati')}. Ništa više se ne naplaćuje.`}
          </SheetDescription>
          {extra.status === 'asked' && (
            <div className="mt-1 flex gap-2 phone:flex-wrap phone:*:flex-auto">
              <Button variant="secondary" onClick={() => answer(false)}>
                Odbij dodatne sate
              </Button>
              <Button onClick={() => answer(true)}>
                Odobri {money(chargedFor(extra.hours, v.rate))}
              </Button>
            </div>
          )}
        </>
      )}

      <Total>
        <Line label={`Rezervisano: ${v.hours} h po ${money(v.rate)}/h`} value={money(chargedFor(v.hours, v.rate))} />
        {back > 0 && <Line label={`Vraća se: ${v.hours - r.hours} h manje`} value={money(back)} />}
        {extra?.status === 'approved' && <Line label={`Dodatni sati: ${extra.hours} h`} value={money(chargedFor(extra.hours, v.rate))} />}
        <DataRow
          total
          label={
            v.status === 'charging' ? `Naplaćuje se za ${v.chargesInHours} h` : v.status === 'disputed' ? 'Zadržano dok se ne proveri' : v.status === 'cancelled' ? 'Ništa nije naplaćeno' : 'Naplaćeno'
          }
        >
          {v.status === 'cancelled' ? money(0) : money(charge)}
        </DataRow>
      </Total>

      {v.status === 'charging' && (
        <SheetFooter>
          <Button variant="secondary" onClick={() => setQuerying(true)}>
            Nešto nije u redu
          </Button>
          <Button onClick={confirm}>
            <Check size={14} strokeWidth={2} />
            Sve je u redu - plati sada
          </Button>
        </SheetFooter>
      )}
    </Modal>

    {v.status === 'charging' && querying && (
      <Dialog eyebrow={`Radni nalog · ${v.date}`} title="Šta nije u redu?" onClose={() => setQuerying(false)}>
        <ToggleGroup type="single" size="sm" value={reason} onValueChange={(id) => id && setReason(id)} aria-label="Šta nije u redu">
          {QUERY_REASONS.map((q) => (
            <ToggleGroupItem key={q.id} value={q.id}>
              {q.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {/* the one field in it: no label, the title and the placeholder say
            what goes in (docs/patterns.md §10) */}
        <Field>
          <TextArea
            rows={3}
            value={text}
            autoFocus
            placeholder="Šta ste primetili, i šta ste očekivali umesto toga."
            aria-label="Šta nije u redu, vašim rečima"
            onChange={setText}
          />
        </Field>
        <PaneHint>Ništa se ne naplaćuje dok je ovo otvoreno. Čita koordinatorka, ne negovateljica.</PaneHint>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setQuerying(false)}>
            Nazad
          </Button>
          <Button disabled={!text.trim()} onClick={query}>
            Pošalji koordinatorki
          </Button>
        </DialogFooter>
      </Dialog>
    )}
    </>
  );
}

// ── the plan, before a visit ────────────────────────────────────────────────

const OTHER = 'Drugo';
const CALL_OFF_REASONS = ['Nije nam potrebna', 'Hitan slučaj u porodici', OTHER];

function Plan({ open = true, care, visitId, onCare, onClose, onFlash }) {
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
    <Modal eyebrow={`${v.caregiver.name} · ${v.date} · ${v.time}`} title="Plan posete" wide open={open} onClose={onClose}>
      <SheetDescription>
        {first} planira da dođe na {v.hours} h. {money(held)} je rezervisano na vašoj kartici, nije
        naplaćeno - novac se uzima tek posle posete, kad pošalje radni nalog.
      </SheetDescription>

      <PaneLabel>Šta će raditi</PaneLabel>
      <ServiceChips ids={v.services} grouped />
      {v.notes && (
        <>
          <PaneLabel>Napomene za ovu posetu</PaneLabel>
          <SheetDescription>{v.notes}</SheetDescription>
        </>
      )}
      <DataList className="mt-2">
        <Line label="Poslato" value={v.sentOn} />
        <Line label="Rezervisano" value={`${money(held)} · ${v.hours} h po ${money(v.rate)}/h`} />
      </DataList>

      <SheetFooter>
        <Button variant="secondary" onClick={() => setMode('call-off')}>
          Otkaži posetu
        </Button>
        <Button variant="secondary" onClick={() => setMode('query')}>
          Nešto nije u redu
        </Button>
      </SheetFooter>
    </Modal>

    {mode === 'query' && (
      <Dialog eyebrow={`Plan posete · ${v.date}`} title="Šta nije u redu sa planom?" onClose={() => setMode('idle')}>
        <Field>
          <TextArea
            rows={3}
            value={text}
            autoFocus
            placeholder="Dan, sati, šta će raditi…"
            aria-label="Šta nije u redu sa planom"
            onChange={setText}
          />
        </Field>
        <PaneHint>
          Novac ostaje rezervisan dok je ovo otvoreno, a negovateljica je obaveštena da ne dolazi dok se ne
          reši. Čita koordinatorka, ne negovateljica.
        </PaneHint>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setMode('idle')}>
            Nazad
          </Button>
          <Button disabled={!text.trim()} onClick={query}>
            Pošalji koordinatorki
          </Button>
        </DialogFooter>
      </Dialog>
    )}

    {mode === 'call-off' && (
      <Dialog eyebrow={`Plan posete · ${v.date} · ${v.time}`} title="Otkazati posetu?" onClose={() => setMode('idle')}>
        <PaneLabel>Zašto se otkazuje</PaneLabel>
        <ToggleGroup type="single" size="sm" value={reason} onValueChange={(id) => id && setReason(id)} aria-label="Zašto se otkazuje">
          {CALL_OFF_REASONS.map((r) => (
            <ToggleGroupItem key={r} value={r}>
              {r}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
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
        <PaneHint>
          {late
            ? `Do dolaska je ostalo manje od sat vremena, pa se rezervisanih ${money(held)} naplaćuje u celosti umesto da se vrati. Negovateljica je čuvala to vreme i sada ne može da ga popuni.`
            : `Rezervisanih ${money(held)} se odmah vraća i ništa se ne naplaćuje. Negovateljica je obaveštena, a koordinatorka će pomoći da se dogovori drugi dan ako je potrebno. U poslednjem satu pre dolaska naplaćuje se u celosti.`}
        </PaneHint>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setMode('idle')}>
            Nazad
          </Button>
          <Button variant="destructive" disabled={!okReason} onClick={callOff}>
            {late ? `Otkaži i plati ${money(held)}` : 'Otkaži i vrati novac'}
          </Button>
        </DialogFooter>
      </Dialog>
    )}
    </>
  );
}

// ── ending it ───────────────────────────────────────────────────────────────

function End({ open = true, care, caregiverId, onCare, onClose, onFlash, onOpen }) {
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
    <Dialog eyebrow={`${a.caregiver.name} · samo ova saradnja`} title="Završiti saradnju?" open={open} onClose={onClose}>
      {blocked.length ? (
        <>
          <DialogDescription>
            {first} je obavila posao koji još nije izmiren. To prvo mora da se završi - da sada prekinete,
            ostala bi neplaćena za posetu koju je već obavila.
          </DialogDescription>
          <PaneHint>Prvo rešite otvoreni radni nalog, pa se vratite na ovo.</PaneHint>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>
              Ne sada
            </Button>
            {blocked[0].status === 'charging' && (
              <Button onClick={() => onOpen({ kind: 'work-order', visitId: blocked[0].id })}>
                Pogledaj radni nalog
              </Button>
            )}
          </DialogFooter>
        </>
      ) : (
        <>
          <DialogDescription>
            Posle ovoga {first} ne može da šalje nove posete i ništa više ne može da se naplati. Sve što je
            već izmireno ostaje u vašoj evidenciji.
            {booked &&
              ` Poseta zakazana za ${booked.date.toLowerCase()} se otkazuje, a ${money(chargedFor(booked.hours, booked.rate))} se vraća na vašu karticu.`}
          </DialogDescription>
          <PaneHint>
            Koordinatorka će biti obaveštena i pomoći će da se organizuje druga nega ako je potrebna.
          </PaneHint>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>
              Zadrži
            </Button>
            <Button variant="destructive" onClick={end}>
              Završi saradnju
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
}

// ── someone they might ask ──────────────────────────────────────────────────

function Profile({ open = true, care, caregiverId, unlocked, onContact, onCaregiver, onClose }) {
  const c = caregivers.find((x) => x.id === caregiverId);
  if (!c) return null;
  // where the family stands with her is said at the top, under who she is,
  // not in the footer where it read as a disabled button
  const standing = standingWith(care, c.id);

  // writing to her goes through the one modal, sent once the subscription is paid
  const ask = () => onContact(c);

  return (
    <Modal title="Informacije o negovateljici" wide open={open} onClose={onClose}>
      <CaregiverHead caregiver={c} standing={standing} />

      <PaneLabel>O sebi</PaneLabel>
      <SheetDescription>{c.bio}</SheetDescription>

      <PaneLabel>Klasifikacije</PaneLabel>
      <Tags items={c.classifications} />

      <PaneLabel>Kvalifikacije</PaneLabel>
      <DataList className="mt-2">
        <Line label="Obrazovanje" value={c.education} />
        <Line label="Jezici" value={c.languages.join(', ')} />
      </DataList>

      <PaneLabel>Kada može da dolazi</PaneLabel>
      <DataList className="mt-2">
        <Line label="Dani" value={daysText(c.days)} />
        <Line label="Doba dana" value={c.slots.map((s) => `${SLOTS[s].label.toLowerCase()} ${SLOTS[s].hours}`).join(', ')} />
        <Line label="Radijus" value={`do ${c.radius} km`} />
        <Line label="Cena" value={c.rate} />
      </DataList>

      {/* Her phone and e-mail open with the subscription, as on the platform. */}
      <PaneLabel>Kontakt</PaneLabel>
      <DataList className="mt-2">
        <Line label="Telefon" value={unlocked ? c.phone : MASKED_PHONE} />
        <Line label="E-mail" value={unlocked ? c.email : MASKED_EMAIL} />
      </DataList>
      {!unlocked && <PaneHint>Telefon i e-mail se otključavaju pretplatom.</PaneHint>}

      <PaneHint>
        Upit joj šalje plan nege. Ništa ne košta i nikoga ne obavezuje - ona odgovara, a ništa nije
        dogovoreno dok zajedno ne postavite uslove.
      </PaneHint>

      {/* Never asked: write to her. Asked before and free to ask again (a no,
          or a cooperation that ended): the same, said as again; and when she
          came before, her page with everything from then. */}
      {(!standing || canAsk(care, c.id) || arrangementOf(care, c.id)) && (
        <SheetFooter>
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
            <Button onClick={ask}>
              {!standing ? 'Pošalji poruku' : arrangementOf(care, c.id) ? 'Ponovo sarađujte' : 'Pitaj ponovo'}
            </Button>
          )}
        </SheetFooter>
      )}
    </Modal>
  );
}

// Every visit she has made, when her page shows only the latest ten. A visit's
// own button opens its plan or work order in this drawer's place.
function Visits({ open = true, care, caregiverId, onOpen, onClose }) {
  const a = arrangementOf(care, caregiverId);
  if (!a) return null;
  const visits = herVisits(a);
  return (
    <Modal eyebrow={`${a.caregiver.name} · ${pl(visits.length, 'poseta', 'posete', 'poseta')}`} title="Sve posete" wide open={open} onClose={onClose}>
      <ItemGroup>
        {visits.map((v) => (
          <VisitRow key={v.id} visit={v} onDrawer={onOpen} />
        ))}
      </ItemGroup>
    </Modal>
  );
}

// Everything that has happened, newest first, by day, with a filter by kind:
// one caregiver's from her page, everyone's from Moja nega.
function ActivityDrawer({ open = true, care, caregiverId, onClose }) {
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
    <Modal eyebrow={who} title="Šta se desilo" wide open={open} onClose={onClose}>
      <ToggleGroup type="single" size="sm" className="items-center" value={kind} onValueChange={(id) => id && setKind(id)} aria-label="Šta prikazati">
        {[{ id: 'all', label: 'Sve' }, ...kinds].map((k) => (
          <ToggleGroupItem key={k.id} value={k.id}>
            {k.label}
            <span className="text-small text-disabled in-data-[state=on]:text-inherit in-data-[state=on]:opacity-80">
              {k.id === 'all' ? all.length : all.filter((e) => e.kind === k.id).length}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <PaneHint>
        {picked.length === all.length
          ? `${pl(all.length, 'stavka', 'stavke', 'stavki')} · najnovije prvo`
          : `${picked.length} od ${all.length} · najnovije prvo`}
      </PaneHint>
      {days.map((d) => (
        <Fragment key={d.day}>
          <div className="flex items-center gap-2 phone:flex-wrap phone:gap-y-2">
            <PaneLabel>{d.day}</PaneLabel>
            <Badge variant="secondary" className="ml-auto phone:ml-0">
              {d.entries.length}
            </Badge>
          </div>
          <ActivityRows care={care} entries={d.entries} showWho={!caregiverId} />
        </Fragment>
      ))}
      {!picked.length && <PaneHint>Ovde još nema ničega.</PaneHint>}
    </Modal>
  );
}

// Everything about her in one place, in the prototype's order: two numbers
// (visits, how long together), how to reach her, the care agreed with her,
// what she is, what she says about herself, her reviews, and how paying works.
// Never a total of what has been paid: a running sum is not the family's to
// keep watching (docs/patterns.md §8).
// "Dogovorena nega" shows only while an agreement is in force and no new terms
// wait: while they do, her page says what changes, and this would be stale.

// How long they have worked together, said roughly.
function together(a, today) {
  if (!a.since) return { value: 'Još ne', sub: 'saradnja počinje kad prihvatite uslove' };
  const from = dayOf(a.since, today);
  const to = a.endedOn ? dayOf(a.endedOn, today) : dayOf('danas', today);
  const days = Math.max(0, Math.round((to - from) / 86400000));
  const months = Math.floor(days / 30);
  // a short number, as the visits beside it: in days for the first month
  const value = days < 1 ? 'Od danas' : months < 1 ? pl(days, 'dan', 'dana', 'dana') : pl(months, 'mesec', 'meseca', 'meseci');
  return { value, sub: a.endedOn ? `${a.since} – ${a.endedOn}` : `od ${a.since}` };
}

function Overview({ open = true, care, caregiverId, onClose }) {
  const a = arrangementOf(care, caregiverId);
  if (!a) return null;
  const c = caregivers.find((x) => x.id === caregiverId);
  const first = firstName(a.caregiver.name);
  const act = activeVersion(a);
  const agreed = act && !pendingVersion(a) && !a.endedOn;
  const done = a.visits.filter((v) => v.status === 'paid');
  const coming = a.visits.filter((v) => v.status === 'planned').length;
  const time = together(a, todayOf(care));
  return (
    <Modal eyebrow={`${a.caregiver.name} · ${a.caregiver.area}`} title="Pregled" wide open={open} onClose={onClose}>
      <Stats>
        <Stat
          value={done.length}
          label={`${pl(done.length, 'poseta', 'posete', 'poseta').replace(/^\d+ /, '')} do sada`}
          note={coming ? `${coming} zakazano` : 'nijedna nije zakazana'}
        />
        <Stat value={time.value} label="zajedno" note={time.sub} />
      </Stats>

      <PaneLabel>Kontakt</PaneLabel>
      <DataList className="mt-2">
        <Line label="Telefon" value={a.endedOn ? 'Skriven posle kraja saradnje' : a.caregiver.phone} />
        {c?.email && <Line label="E-mail" value={a.endedOn ? 'Skriven posle kraja saradnje' : c.email} />}
        <Line label="Opština" value={a.caregiver.area} />
        {c?.languages && <Line label="Jezici" value={c.languages.join(', ')} />}
      </DataList>
      <PaneHint>
        Ako nešto nije u redu tokom posete, prvo pozovite negovateljicu. Sve oko novca rešava koordinatorka.
      </PaneHint>

      {agreed && (
        <>
          <PaneLabel>Dogovorena nega</PaneLabel>
          <DataList className="mt-2">
            <Line label="Ugovor koji važi" value={`verzija ${act.version}`} />
            <Line label="Cena po satu" value={`${money(act.rate)} / h, PDV uključen`} />
          </DataList>
          <ServiceChips ids={act.services} grouped />
          {act.terms && (
            <Groups>
              <Group label="Dodatni uslovi" text={act.terms} />
            </Groups>
          )}
        </>
      )}

      <PaneLabel>Kvalifikacije</PaneLabel>
      <Tags items={a.caregiver.classifications || c?.classifications || []} />
      {c?.education && (
        <DataList className="mt-2">
          <Line label="Obrazovanje" value={c.education} />
        </DataList>
      )}

      {c?.bio && (
        <>
          <PaneLabel>O negovateljici</PaneLabel>
          <SheetDescription>{c.bio}</SheetDescription>
        </>
      )}

      <PaneLabel>Ocene</PaneLabel>
      {/* the platform's one way of saying it (docs/patterns.md §8) */}
      <SheetDescription>{c ? <Rating caregiver={c} /> : 'Nova'}</SheetDescription>

      <PaneLabel>Kako se plaća</PaneLabel>
      <DataList className="mt-2">
        <Line label="Način plaćanja" value={care.payment.connected ? `${care.payment.brand} ···· ${care.payment.last4}` : 'Još nije dodat'} />
        <Line label="Rezerviše se" value="kad stigne plan posete" />
        <Line label="Naplaćuje se" value="24 sata posle radnog naloga" />
      </DataList>
      <PaneHint>
        Naplaćuje se samo poseta koja se desila i za koju je {first} poslala radni nalog. Sati preko
        rezervisanih se naplaćuju samo ako ih odobrite.
      </PaneHint>
    </Modal>
  );
}

// Every version of her terms, newest first, and what each changed.
const VERSION_STATE = {
  sent: { text: 'Čeka vaš odgovor', pill: 'is-pending' },
  active: { text: 'Važi', pill: 'is-accepted' },
  replaced: { text: 'Zamenjena', pill: 'is-muted' },
  declined: { text: 'Odbijena', pill: 'is-declined' },
  withdrawn: { text: 'Povučena', pill: 'is-muted' },
  ended: { text: 'Završena', pill: 'is-muted' },
};

function Versions({ open = true, care, caregiverId, onClose }) {
  const a = arrangementOf(care, caregiverId);
  if (!a) return null;
  const list = [...a.versions].reverse();
  return (
    <Modal eyebrow={`${a.caregiver.name} · ${care.elder.name}`} title="Sve verzije ugovora" wide open={open} onClose={onClose}>
      {list.map((v) => {
        const prev = a.versions[v.version - 2];
        const st = VERSION_STATE[v.status] || VERSION_STATE.replaced;
        const changes = prev ? changesBetween(prev, v) : [];
        return (
          <div key={v.version}>
            <PaneLabel>
              Verzija {v.version} <Badge variant={statusVariant(st.pill)}>{st.text}</Badge>
            </PaneLabel>
            <DataList className="mt-2">
              <Line label="Poslato" value={v.sentOn} />
              <Line label="Cena po satu" value={`${money(v.rate)} / h`} />
              <Line label="Usluge" value={services(v.services.length)} />
              {changes.map((r) => (
                <Line key={r.label} label={r.label} value={r.value} />
              ))}
            </DataList>
            {/* what she wrote with it, under its name (docs/patterns.md §10) */}
            {v.note && prev && (
              <Groups className="mt-2">
                <Group label={`${firstName(a.caregiver.name)} je napisala`} text={v.note} />
              </Groups>
            )}
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
