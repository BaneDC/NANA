import { Fragment, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DataList, DataRow } from '@/components/data-list';
import { Callout, Concern, PaneHint, PaneLabel, ReportRow, ReportRows, Stat, Stats, Total } from '@/components/pane';
import { statusVariant } from '../Standing';
import { caregiverById, daysText, engagementText, maskedEmail, maskedPhone, SLOTS } from '../../data/carePlan';
import ShowMore from '../ShowMore';
import VisitsDrawer from './VisitsDrawer';
import { CaregiversDrawer, ComingDrawer, LetterDrawer, OfferDrawer, OffersDrawer } from './HomeDrawers';
import { useShowMore } from '@/hooks/use-show-more';
import Modal from '../Modal';
import Dialog from '../Dialog';
import Tags, { Group, Groups } from '../Tags';
import { groupServices } from '../../data/serviceCatalog';
import CaregiverHead from '../CaregiverHead';
import Rating from '../Rating';
import { careSignals } from './VisitReport';
import { ActivityRows } from './Activity';
import { Field, FieldError, TextArea, requiredError, useCheck } from '../TextField';
import {
  LATE_HOURS,
  activeVersion,
  agreeTerms,
  answerExtra,
  arrangementOf,
  callOffVisit,
  confirmPlan,
  canAsk,
  chargedFor,
  confirmVisit,
  declineTerms,
  endArrangement,
  LOG_KINDS,
  monthOfDay,
  dayOf,
  findVisit,
  firstName,
  nameOf,
  services,
  todayOf,
  linkCard,
  lowerDate,
  money,
  pendingVersion,
  queryVisit,
  returnedFor,
  serviceTitle,
  standingWith,
  unsettled,
  rateText,
  vatIn,
  latestRequest,
  vatText,
  visitCharge,
} from '../../data/familyCare';
import { scheduleText } from '../../data/familyStart';
import { msg, say, t, tn } from '@/i18n';

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
            label={t(g.title)}
            items={g.items.filter((id) => ids.includes(id)).map(serviceTitle)}
            off={g.items.filter((id) => missing.includes(id)).map((id) => t('{service} - ovog puta ne', { service: serviceTitle(id) }))}
          />
        ))}
      </Groups>
    );
  }
  return (
    <Tags label={label} items={ids.map(serviceTitle)} off={missing.map((id) => t('{service} - ovog puta ne', { service: serviceTitle(id) }))} />
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
      label: now.rate > was.rate ? t('Cena raste') : t('Cena pada'),
      value: t('{was} → {now} na sat', { was: money(was.rate), now: money(now.rate) }),
    });
  }
  const added = now.services.filter((s) => !was.services.includes(s));
  const dropped = was.services.filter((s) => !now.services.includes(s));
  if (added.length) rows.push({ label: added.length === 1 ? t('Nova usluga') : t('Nove usluge'), value: added.map(serviceTitle).join(', ') });
  if (dropped.length) rows.push({ label: dropped.length === 1 ? t('Usluga više ne') : t('Usluge više ne'), value: dropped.map(serviceTitle).join(', ') });
  if (now.hours !== was.hours) rows.push({ label: t('Sati'), value: t('{was} → {now} h nedeljno', { was: was.hours, now: now.hours }) });
  if (now.schedule !== was.schedule) rows.push({ label: t('Raspored'), value: scheduleText(now.schedule) });
  return rows;
}

function Terms({ open = true, care, caregiverId, onCare, onClose, onFlash }) {
  const [declining, setDeclining] = useState(false);
  const check = useCheck();
  const addCard = useRef(null);
  const a = arrangementOf(care, caregiverId);
  const pen = pendingVersion(a);
  const act = activeVersion(a);
  const first = firstName(a.caregiver.name);
  const hasCard = care.payment.connected;
  if (!pen) return null;

  const agree = () => {
    // with no card the press says so under "Dodaj karticu", which takes the focus
    if (!check.check([!hasCard])) return requestAnimationFrame(() => addCard.current?.focus());
    onCare(agreeTerms(caregiverId));
    onFlash(act ? t('Verzija {version} važi od danas.', { version: pen.version }) : t('Uslovi su prihvaćeni. Posete sada mogu da se zakažu.'));
    onClose();
  };
  const decline = () => {
    onCare(declineTerms(caregiverId));
    onFlash(act ? t('Odbijeno. Verzija {version} i dalje važi.', { version: act.version }) : t('Odbijeno. Ništa ne važi.'));
    onClose();
  };

  return (
    <>
    <Modal eyebrow={`${a.caregiver.name} · ${care.elder.name}`} title={t('Ugovor o nezi, verzija {version}', { version: pen.version })} wide open={open} onClose={onClose}>
      <SheetDescription>
        {act
          ? t('{name} je {when} poslala nove uslove.', { name: first, when: lowerDate(pen.sentOn) })
          : t('{name} je {when} poslala svoje uslove.', { name: first, when: lowerDate(pen.sentOn) })}{' '}
        {act
          ? t('Verzija {version} važi dok ne odgovorite.', { version: act.version })
          : t('Ništa ne može da se zakaže dok ne prihvatite, a prihvatanje ništa ne naplaćuje.')}
      </SheetDescription>

      {pen.note && (
        <>
          <PaneLabel>{act ? t('Zašto menja uslove') : t('{name} je napisala', { name: first })}</PaneLabel>
          <SheetDescription>{t(pen.note)}</SheetDescription>
        </>
      )}

      {act && (
        <>
          <PaneLabel>{t('Šta se menja')}</PaneLabel>
          <DataList className="mt-2">
            {changesBetween(act, pen).map((r) => (
              <Line key={r.label} label={r.label} value={r.value} />
            ))}
          </DataList>
        </>
      )}

      <PaneLabel>{act ? t('Verzija {version} obuhvata', { version: pen.version }) : t('Usluge')}</PaneLabel>
      <ServiceChips ids={pen.services} grouped />
      <DataList className="mt-2">
        <Line label={t('Cena po satu')} value={rateText(pen.rate)} />
        <Line label={t('Dogovoreni sati')} value={t('{hours} h nedeljno', { hours: pen.hours })} />
        <Line label={t('Raspored')} value={scheduleText(pen.schedule)} />
      </DataList>
      {pen.terms && (
        <>
          <PaneLabel>{t('Dodatni uslovi')}</PaneLabel>
          <SheetDescription>{t(pen.terms)}</SheetDescription>
        </>
      )}

      <PaneHint>
        {t('Prihvatanjem uslova {name} može da zakazuje posete. Svaka se unapred rezerviše na vašoj kartici, a naplaćuje tek kad se obavi.', { name: first })}
      </PaneHint>

      {!hasCard && (
        <Callout>
          <p>
            {t('Prvo dodajte način plaćanja. Prihvatanjem uslova {name} može da rezerviše posetu na vašoj kartici - sada se ništa ne naplaćuje, niti pre nego što se poseta obavi.', { name: first })}
          </p>
          <Button
            ref={addCard}
            variant="secondary"
            onClick={() => {
              onCare(linkCard);
              onFlash(t('Kartica je dodata. Posete sada mogu da se rezervišu.'));
            }}
          >
            <CreditCard size={14} strokeWidth={1.75} />
            {t('Dodaj karticu')}
          </Button>
          <FieldError className="px-0">{check.show(!hasCard && t('Prvo dodajte karticu.'))}</FieldError>
        </Callout>
      )}

      <SheetFooter>
        <Button variant="secondary" onClick={() => setDeclining(true)}>
          {t('Odbij')}
        </Button>
        <Button onClick={agree}>
          <Check size={14} strokeWidth={2} />
          {t('Prihvati uslove')}
        </Button>
      </SheetFooter>
    </Modal>

    {/* declining is an action, so it is asked in a dialog over the terms */}
    {declining && (
      <Dialog
        eyebrow={`${a.caregiver.name} · ${care.elder.name}`}
        title={t('Odbiti verziju {version}?', { version: pen.version })}
        onClose={() => setDeclining(false)}
      >
        <DialogDescription>
          {t('Ništa novo ne počinje i ništa se ne naplaćuje. {name} će biti obaveštena, a koordinatorka će vas pozvati da se dogovore uslovi koji vam odgovaraju.', { name: first })}
          {act && ` ${t('Verzija {version} i dalje važi.', { version: act.version })}`}
        </DialogDescription>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDeclining(false)}>
            {t('Nazad')}
          </Button>
          <Button variant="destructive" onClick={decline}>
            {t('Odbij verziju {version}', { version: pen.version })}
          </Button>
        </DialogFooter>
      </Dialog>
    )}
    </>
  );
}

// ── the work order ──────────────────────────────────────────────────────────

const QUERY_REASONS = [
  { id: 'hours', label: msg('Sati nisu tačni') },
  { id: 'not-done', label: msg('Nešto sa spiska nije urađeno') },
  { id: 'no-visit', label: msg('Poseta se nije desila') },
  { id: 'other', label: msg('Nešto drugo') },
];

function WorkOrder({ open = true, care, visitId, then, onCare, onClose, onFlash, onOpen }) {
  const [querying, setQuerying] = useState(false);
  const [reason, setReason] = useState('hours');
  const [text, setText] = useState('');
  const queryCheck = useCheck();
  // a dialog opened again starts with no errors
  const { reset } = queryCheck;
  useEffect(() => reset(), [querying]); // eslint-disable-line react-hooks/exhaustive-deps
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
      ? t('{hours} h, rezervisano {reserved} h', { hours: r.hours, reserved: v.hours })
      : r.hours > v.hours
        ? t('{hours} h, rezervisano {reserved} h', { hours: r.hours, reserved: v.hours })
        : t('{hours} h - kako je planirano', { hours: r.hours });

  const confirm = () => {
    onCare(confirmVisit(visitId));
    onFlash(t('Plaćeno. {amount} ide ka negovateljici.', { amount: money(charge) }));
    // opened on the way to something else (ending the arrangement): paid, it
    // goes back there rather than leaving the family to find it again
    if (then) onOpen(then);
    else onClose();
  };
  const query = () => {
    if (!queryCheck.check([!text.trim()])) return;
    // the reason picked is a key, what they wrote stays as they wrote it
    const label = QUERY_REASONS.find((q) => q.id === reason).label;
    onCare(queryVisit(visitId, say('{reason}. {text}', { reason: { $t: label }, text: text.trim() })));
    onFlash(t('Poslato koordinatorki. Ništa se ne naplaćuje dok je otvoreno.'));
    onClose();
  };
  const answer = (yes) => {
    onCare(answerExtra(visitId, yes));
    onFlash(yes ? t('Dodatni sati su odobreni. {amount} se naplaćuje sa posetom.', { amount: money(chargedFor(extra.hours, v.rate)) }) : t('Dodatni sati su odbijeni. Ništa više se ne naplaćuje.'));
  };

  const lead =
    v.status === 'charging'
      ? t('{name} je ovo poslala {when}. Ako je sve bilo kako je dogovoreno, ne morate ništa - {amount} se naplaćuje za {hours} h.', {
          name: first,
          when: v.reportSentOn || v.sentOn,
          amount: money(charge),
          hours: v.chargesInHours,
        })
      : v.status === 'disputed'
        ? t('Ovo ste prijavili koordinatorki. Ništa se ne naplaćuje dok ne proveri.')
        : v.resolution
          ? t(v.resolution.text)
          : v.confirmed === 'you'
            ? t('Naplaćeno {date} - vi ste potvrdili.', { date: v.chargedOn })
            : t('Naplaćeno {date} - potvrđeno automatski posle 24 sata.', { date: v.chargedOn });

  return (
    <>
    <Modal eyebrow={`${v.caregiver.name} · ${v.date}`} title={t('Radni nalog')} wide open={open} onClose={onClose}>
      <SheetDescription>{lead}</SheetDescription>

      <ReportRows>
        <ReportRow label={t('Poseta')}>
          {v.date} · {v.time}
        </ReportRow>
        <ReportRow label={t('Sati')}>{hoursText}</ReportRow>
        <ReportRow label={t('Šta je uradila')}>{t(r.note)}</ReportRow>
        {v.notes && <ReportRow label={t('Traženo je')}>{t(v.notes)}</ReportRow>}
        <ReportRow label={t('Kako je bila')}>
          <Tags items={careSignals(r)} />
        </ReportRow>
      </ReportRows>

      <PaneLabel>{t('Šta je urađeno')}</PaneLabel>
      <ServiceChips ids={r.done} missing={skipped} grouped />

      {r.concern && (
        <Concern>
          <AlertTriangle size={12} strokeWidth={2} />
          {t('{name} je napomenula: {concern}', { name: first, concern: t(r.concern) })}
        </Concern>
      )}

      {/* Hours over the reserved ones are never taken on their own: the
          family says yes or no, here, whether or not the visit is charged yet. */}
      {extra && (
        <>
          <PaneLabel>{t('Dodatni sati')}</PaneLabel>
          <SheetDescription>
            {extra.status === 'asked'
              ? t('{name} je radila {hours} duže nego što je rezervisano. To se ne naplaćuje samo od sebe: odobrite {amount} ili odbijte.', {
                  name: first,
                  hours: tn(extra.hours, 'sat', 'sata', 'sati'),
                  amount: money(chargedFor(extra.hours, v.rate)),
                })
              : extra.status === 'approved'
                ? t('Odobrili ste {hours}, {amount}.', { hours: tn(extra.hours, 'dodatni sat', 'dodatna sata', 'dodatnih sati'), amount: money(chargedFor(extra.hours, v.rate)) })
                : t('Odbili ste {hours}. Ništa više se ne naplaćuje.', { hours: tn(extra.hours, 'dodatni sat', 'dodatna sata', 'dodatnih sati') })}
          </SheetDescription>
          {extra.status === 'asked' && (
            <div className="mt-1 flex gap-2 phone:flex-wrap phone:*:flex-auto">
              <Button variant="secondary" onClick={() => answer(false)}>
                {t('Odbij dodatne sate')}
              </Button>
              <Button onClick={() => answer(true)}>
                {t('Odobri {amount}', { amount: money(chargedFor(extra.hours, v.rate)) })}
              </Button>
            </div>
          )}
        </>
      )}

      <Total>
        <Line label={t('Rezervisano: {hours} h po {rate}/h', { hours: v.hours, rate: money(v.rate) })} value={money(chargedFor(v.hours, v.rate))} />
        {back > 0 && <Line label={t('Vraća se: {hours} h manje', { hours: v.hours - r.hours })} value={money(back)} />}
        {extra?.status === 'approved' && <Line label={t('Dodatni sati: {hours} h', { hours: extra.hours })} value={money(chargedFor(extra.hours, v.rate))} />}
        <DataRow
          total
          label={
            v.status === 'charging'
              ? t('Naplaćuje se za {hours} h', { hours: v.chargesInHours })
              : v.status === 'disputed'
                ? t('Zadržano dok se ne proveri')
                : v.status === 'cancelled'
                  ? t('Ništa nije naplaćeno')
                  : t('Naplaćeno')
          }
        >
          {v.status === 'cancelled' ? money(0) : money(charge)}
        </DataRow>
        {/* the VAT inside that total, as on a receipt: it adds nothing */}
        {v.status !== 'cancelled' && charge > 0 && <Line label={t('Od toga PDV ({vat})', { vat: vatText() })} value={money(vatIn(charge))} />}
      </Total>

      {v.status === 'charging' && (
        <SheetFooter>
          <Button variant="secondary" onClick={() => setQuerying(true)}>
            {t('Nešto nije u redu')}
          </Button>
          <Button onClick={confirm}>
            <Check size={14} strokeWidth={2} />
            {t('Sve je u redu - plati sada')}
          </Button>
        </SheetFooter>
      )}
    </Modal>

    {v.status === 'charging' && querying && (
      <Dialog eyebrow={`${t('Radni nalog')} · ${v.date}`} title={t('Šta nije u redu?')} onClose={() => setQuerying(false)}>
        <ToggleGroup type="single" size="sm" value={reason} onValueChange={(id) => id && setReason(id)} aria-label={t('Šta nije u redu')}>
          {QUERY_REASONS.map((q) => (
            <ToggleGroupItem key={q.id} value={q.id}>
              {t(q.label)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {/* the one field in it: no label, the title and the placeholder say
            what goes in (docs/patterns.md §10) */}
        <Field error={queryCheck.show(!text.trim() && requiredError())}>
          <TextArea
            rows={3}
            value={text}
            autoFocus
            placeholder={t('Šta ste primetili, i šta ste očekivali umesto toga.')}
            aria-label={t('Šta nije u redu, vašim rečima')}
            onChange={setText}
          />
        </Field>
        <PaneHint>{t('Ništa se ne naplaćuje dok je ovo otvoreno. Čita koordinatorka, ne negovateljica.')}</PaneHint>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setQuerying(false)}>
            {t('Nazad')}
          </Button>
          <Button onClick={query}>
            {t('Pošalji koordinatorki')}
          </Button>
        </DialogFooter>
      </Dialog>
    )}
    </>
  );
}

// ── the plan, before a visit ────────────────────────────────────────────────

const OTHER = msg('Drugo');
const CALL_OFF_REASONS = [msg('Nije nam potrebna'), msg('Hitan slučaj u porodici'), OTHER];

function Plan({ open = true, care, visitId, onCare, onClose, onFlash }) {
  const [mode, setMode] = useState('idle'); // idle | query | call-off
  const [text, setText] = useState('');
  const [reason, setReason] = useState(CALL_OFF_REASONS[0]);
  const [other, setOther] = useState('');
  const queryCheck = useCheck();
  const offCheck = useCheck();
  // a dialog opened again starts with no errors
  useEffect(() => {
    queryCheck.reset();
    offCheck.reset();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const v = findVisit(care, visitId);
  // A plan that is opened has been seen: it leaves "Čeka na vas" on the home,
  // where it stood only so as not to be missed (docs/patterns.md §4a). There
  // is nothing to approve: the visit was booked when the plan came.
  const unseen = Boolean(v && v.status === 'planned' && !v.planOk);
  useEffect(() => {
    if (unseen) onCare(confirmPlan(visitId));
    // once, when the plan opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!v) return null;
  const first = firstName(v.caregiver.name);
  const held = chargedFor(v.hours, v.rate);
  const late = (v.dueInHours ?? Infinity) < LATE_HOURS;
  const otherError = reason === OTHER && !other.trim() && requiredError();

  const query = () => {
    if (!queryCheck.check([!text.trim()])) return;
    onCare(queryVisit(visitId, text.trim()));
    onFlash(t('Poslato koordinatorki. Negovateljica je obaveštena da ne dolazi dok se ne reši.'));
    onClose();
  };
  const callOff = () => {
    if (!offCheck.check([otherError])) return;
    onCare(callOffVisit(visitId, reason === OTHER ? other.trim() : reason));
    onFlash(
      late
        ? t('Otkazano. {amount} se naplaćuje - bilo je u poslednjem satu.', { amount: money(held) })
        : t('Otkazano. {amount} se vraća na vašu karticu.', { amount: money(held) })
    );
    onClose();
  };

  return (
    <>
    <Modal eyebrow={`${v.caregiver.name} · ${v.date} · ${v.time}`} title={t('Plan posete')} wide open={open} onClose={onClose}>
      <SheetDescription>
        {t('{name} planira da dođe na {hours} h. {amount} je rezervisano na vašoj kartici, nije naplaćeno - novac se uzima tek posle posete, kad pošalje radni nalog.', { name: first, hours: v.hours, amount: money(held) })}
      </SheetDescription>

      <PaneLabel>{t('Šta će raditi')}</PaneLabel>
      <ServiceChips ids={v.services} grouped />
      {v.notes && (
        <>
          <PaneLabel>{t('Napomene za ovu posetu')}</PaneLabel>
          <SheetDescription>{t(v.notes)}</SheetDescription>
        </>
      )}
      <DataList className="mt-2">
        <Line label={t('Poslato')} value={v.sentOn} />
        <Line label={t('Rezervisano')} value={`${money(held)} · ${t('{hours} h po {rate}/h', { hours: v.hours, rate: money(v.rate) })}`} />
        {/* the VAT inside it, as on the work order: it adds nothing */}
        {held > 0 && <Line label={t('Od toga PDV ({vat})', { vat: vatText() })} value={money(vatIn(held))} />}
      </DataList>
      {/* Until when calling it off costs nothing: said here, and not only in
          the dialog that calls it off, where it would be learnt too late.
          The hour is LATE_HOURS. */}
      <PaneHint>
        {t('Posetu možete da otkažete bez naplate do sat vremena pre dolaska. U poslednjem satu se naplaćuje u celosti.')}
      </PaneHint>

      <SheetFooter>
        <Button variant="secondary" onClick={() => setMode('call-off')}>
          {t('Otkaži posetu')}
        </Button>
        <Button variant="secondary" onClick={() => setMode('query')}>
          {t('Nešto nije u redu')}
        </Button>
      </SheetFooter>
    </Modal>

    {mode === 'query' && (
      <Dialog eyebrow={`${t('Plan posete')} · ${v.date}`} title={t('Šta nije u redu sa planom?')} onClose={() => setMode('idle')}>
        <Field error={queryCheck.show(!text.trim() && requiredError())}>
          <TextArea
            rows={3}
            value={text}
            autoFocus
            placeholder={t('Dan, sati, šta će raditi…')}
            aria-label={t('Šta nije u redu sa planom')}
            onChange={setText}
          />
        </Field>
        <PaneHint>
          {t('Novac ostaje rezervisan dok je ovo otvoreno, a negovateljica je obaveštena da ne dolazi dok se ne reši. Čita koordinatorka, ne negovateljica.')}
        </PaneHint>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setMode('idle')}>
            {t('Nazad')}
          </Button>
          <Button onClick={query}>
            {t('Pošalji koordinatorki')}
          </Button>
        </DialogFooter>
      </Dialog>
    )}

    {mode === 'call-off' && (
      <Dialog eyebrow={`${t('Plan posete')} · ${v.date} · ${v.time}`} title={t('Otkazati posetu?')} onClose={() => setMode('idle')}>
        <PaneLabel>{t('Zašto se otkazuje')}</PaneLabel>
        <ToggleGroup type="single" size="sm" value={reason} onValueChange={(id) => id && setReason(id)} aria-label={t('Zašto se otkazuje')}>
          {CALL_OFF_REASONS.map((r) => (
            <ToggleGroupItem key={r} value={r}>
              {t(r)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {reason === OTHER && (
          <Field error={offCheck.show(otherError)}>
            <TextArea
              rows={2}
              value={other}
              autoFocus
              placeholder={t('U par reči')}
              aria-label={t('Drugi razlog')}
              onChange={setOther}
            />
          </Field>
        )}
        <PaneHint>
          {late
            ? t('Do dolaska je ostalo manje od sat vremena, pa se rezervisanih {amount} naplaćuje u celosti umesto da se vrati. Negovateljica je čuvala to vreme i sada ne može da ga popuni.', { amount: money(held) })
            : t('Rezervisanih {amount} se odmah vraća i ništa se ne naplaćuje. Negovateljica je obaveštena, a koordinatorka će pomoći da se dogovori drugi dan ako je potrebno. U poslednjem satu pre dolaska naplaćuje se u celosti.', { amount: money(held) })}
        </PaneHint>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setMode('idle')}>
            {t('Nazad')}
          </Button>
          <Button variant="destructive" onClick={callOff}>
            {late ? t('Otkaži i plati {amount}', { amount: money(held) }) : t('Otkaži i vrati novac')}
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
    onFlash(t('Saradnja je završena.'));
    onClose();
  };

  return (
    <Dialog eyebrow={`${a.caregiver.name} · ${t('samo ova saradnja')}`} title={t('Završiti saradnju?')} open={open} onClose={onClose}>
      {blocked.length ? (
        <>
          <DialogDescription>
            {t('{name} je obavila posao koji još nije izmiren. To prvo mora da se završi - da sada prekinete, ostala bi neplaćena za posetu koju je već obavila.', { name: first })}
          </DialogDescription>
          <PaneHint>{t('Prvo rešite otvoreni radni nalog, pa se vratite na ovo.')}</PaneHint>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>
              {t('Ne sada')}
            </Button>
            {blocked[0].status === 'charging' && (
              <Button onClick={() => onOpen({ kind: 'work-order', visitId: blocked[0].id, then: { kind: 'end', caregiverId } })}>
                {t('Pogledaj radni nalog')}
              </Button>
            )}
          </DialogFooter>
        </>
      ) : (
        <>
          <DialogDescription>
            {t('Posle ovoga {name} ne može da šalje nove posete i ništa više ne može da se naplati. Sve što je već izmireno ostaje u vašoj evidenciji.', { name: first })}
            {booked &&
              ` ${t('Poseta zakazana za {date} se otkazuje, a {amount} se vraća na vašu karticu.', { date: lowerDate(booked.date), amount: money(chargedFor(booked.hours, booked.rate)) })}`}
          </DialogDescription>
          <PaneHint>
            {t('Koordinatorka će biti obaveštena i pomoći će da se organizuje druga nega ako je potrebna.')}
          </PaneHint>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>
              {t('Zadrži')}
            </Button>
            <Button variant="destructive" onClick={end}>
              {t('Završi saradnju')}
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
}

// ── someone they might ask ──────────────────────────────────────────────────

function Profile({ open = true, care, caregiverId, unlocked, askNote, onContact, onCaregiver, onClose }) {
  const c = caregiverById(caregiverId);
  if (!c) return null;
  // where the family stands with her is said at the top, under who she is,
  // not in the footer where it read as a disabled button
  const standing = standingWith(care, c.id);
  const contactOpen = unlocked && (c.market !== 'RS' || latestRequest(care, c.id)?.status === 'accepted');

  // writing to her goes through the one modal, sent once the subscription is paid
  const ask = () => onContact(c);

  return (
    <Modal title={t('Informacije o negovateljici')} wide open={open} onClose={onClose}>
      <CaregiverHead caregiver={c} standing={standing} />

      <PaneLabel>{t('O sebi')}</PaneLabel>
      <SheetDescription>{t(c.bio)}</SheetDescription>

      {/* Serbia has no classifications; a certificate and courses instead */}
      {c.classifications.length > 0 && (
        <>
          <PaneLabel>{t('Klasifikacije')}</PaneLabel>
          <Tags items={c.classifications} />
        </>
      )}

      <PaneLabel>{t('Kvalifikacije')}</PaneLabel>
      <DataList className="mt-2">
        <Line label={t('Obrazovanje')} value={t(c.education)} />
        {c.market === 'RS' && <Line label={t('Sertifikat negovateljice')} value={c.certificate ? t('Da') : t('Ne')} />}
        {c.market === 'RS' && c.courses && <Line label={t('Kursevi')} value={t(c.courses)} />}
        <Line label={t('Jezici')} value={c.languages.map((l) => t(l)).join(', ')} />
      </DataList>

      <PaneLabel>{t('Kada može da dolazi')}</PaneLabel>
      <DataList className="mt-2">
        <Line label={t('Dani')} value={daysText(c.days)} />
        <Line label={t('Doba dana')} value={c.slots.map((s) => `${t(SLOTS[s].label).toLowerCase()} ${SLOTS[s].hours}`).join(', ')} />
        <Line label={t('Radijus')} value={t('do {km} km', { km: c.radius })} />
        {c.engagement && <Line label={t('Angažman')} value={engagementText(c).join(', ')} />}
        {c.rate && <Line label={t('Cena')} value={c.rate} />}
      </DataList>

      {/* Her phone and e-mail open with the subscription, as on the platform.
          In Serbia they open once she has said yes to the family, while
          their package holds: that is how the two then agree everything. */}
      <PaneLabel>{t('Kontakt')}</PaneLabel>
      <DataList className="mt-2">
        <Line label={t('Telefon')} value={contactOpen ? c.phone : maskedPhone(c)} />
        <Line label={t('E-mail')} value={contactOpen ? c.email : maskedEmail(c)} />
      </DataList>
      {!contactOpen && (
        <PaneHint>
          {c.market !== 'RS'
            ? t('Telefon i e-mail se otključavaju pretplatom.')
            : unlocked
              ? t('Telefon i e-mail vidite kad prihvati vaš upit.')
              : t('Telefon i e-mail vidite kad prihvati vaš upit, dok vam paket važi.')}
        </PaneHint>
      )}

      {/* what asking her costs, as it is said everywhere (firstSteps.js) */}
      {askNote && <PaneHint>{askNote}</PaneHint>}

      {/* Never asked: write to her. Asked before and free to ask again (a no,
          or a cooperation that ended): the same, said as again; and when she
          came before, her page with everything from then. */}
      {(!standing || canAsk(care, c.id) || arrangementOf(care, c.id)) && (
        <SheetFooter>
          {arrangementOf(care, c.id) ? (
            <Button variant="secondary" onClick={() => onCaregiver(c.id)}>
              {t('Njena stranica')}
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              {t('Ne sada')}
            </Button>
          )}
          {canAsk(care, c.id) && (
            <Button onClick={ask}>
              {!standing ? t('Pošalji poruku') : arrangementOf(care, c.id) ? t('Ponovo sarađujte') : t('Pitaj ponovo')}
            </Button>
          )}
        </SheetFooter>
      )}
    </Modal>
  );
}

// Everything that has happened, newest first, by month, with a filter by kind:
// one caregiver's from her page, everyone's from Moja nega. A step at a time,
// "Prikaži još" adding the next (docs/patterns.md §8a).
// `side`: 'caregiver' when she reads it about a family (her page): she is "vi"
export function ActivityDrawer({ open = true, care, caregiverId, side = 'family', onClose }) {
  const [kind, setKind] = useState('all');
  const all = (care.log || []).filter((e) => !caregiverId || e.caregiverId === caregiverId);
  const kinds = LOG_KINDS.filter((k) => all.some((e) => e.kind === k.id));
  const picked = kind === 'all' ? all : all.filter((e) => e.kind === kind);
  const list = useShowMore(picked, { reset: kind });
  // by month, as every long list is (docs/patterns.md §8a): a day seldom
  // holds more than one or two, so by day nearly every row had its own title
  const days = [];
  for (const e of list.visible) {
    const day = monthOfDay(Math.floor(e.at / 24));
    const last = days[days.length - 1];
    if (last && last.day === day) last.entries.push(e);
    else days.push({ day, entries: [e] });
  }
  const who = side === 'caregiver' ? care.elder.name : caregiverId ? nameOf(care, caregiverId) : care.elder.name || t('Vaša nega');
  return (
    <Modal eyebrow={who} title={t('Šta se desilo')} wide open={open} onClose={onClose}>
      {/* a filter: on a phone one row that scrolls sideways (docs/patterns.md §12) */}
      <ToggleGroup type="single" size="sm" scroll className="items-center" value={kind} onValueChange={(id) => id && setKind(id)} aria-label={t('Šta prikazati')}>
        {[{ id: 'all', label: 'Sve' }, ...kinds].map((k) => (
          <ToggleGroupItem key={k.id} value={k.id}>
            {t(k.label)}
            <span className="text-small text-disabled in-data-[state=on]:text-inherit in-data-[state=on]:opacity-80">
              {k.id === 'all' ? all.length : all.filter((e) => e.kind === k.id).length}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <PaneHint>
        {picked.length === all.length
          ? t('{count} · najnovije prvo', { count: tn(all.length, 'stavka', 'stavke', 'stavki') })
          : t('{picked} od {all} · najnovije prvo', { picked: picked.length, all: all.length })}
      </PaneHint>
      {days.map((d) => (
        <Fragment key={d.day}>
          <div className="flex items-center gap-2 phone:flex-wrap phone:gap-y-2">
            <PaneLabel>{d.day}</PaneLabel>
            <Badge variant="secondary" className="ml-auto phone:ml-0">
              {d.entries.length}
            </Badge>
          </div>
          <ActivityRows care={care} entries={d.entries} showWho={!caregiverId} side={side} />
        </Fragment>
      ))}
      <ShowMore list={list} />
      {!picked.length && <PaneHint>{t('Ovde još nema ničega.')}</PaneHint>}
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
  if (!a.since) return { value: t('Još ne'), sub: t('saradnja počinje kad prihvatite uslove') };
  const from = dayOf(a.since, today);
  const to = a.endedOn ? dayOf(a.endedOn, today) : dayOf('danas', today);
  const days = Math.max(0, Math.round((to - from) / 86400000));
  const months = Math.floor(days / 30);
  // a short number, as the visits beside it: in days for the first month
  const value = days < 1 ? t('Od danas') : months < 1 ? tn(days, 'dan', 'dana', 'dana') : tn(months, 'mesec', 'meseca', 'meseci');
  return { value, sub: a.endedOn ? `${a.since} – ${a.endedOn}` : t('od {date}', { date: a.since }) };
}

function Overview({ open = true, care, caregiverId, onClose }) {
  const a = arrangementOf(care, caregiverId);
  if (!a) return null;
  const c = caregiverById(caregiverId);
  const first = firstName(a.caregiver.name);
  const act = activeVersion(a);
  const agreed = act && !pendingVersion(a) && !a.endedOn;
  const done = a.visits.filter((v) => v.status === 'paid');
  const coming = a.visits.filter((v) => v.status === 'planned').length;
  const time = together(a, todayOf(care));
  return (
    <Modal eyebrow={`${a.caregiver.name} · ${a.caregiver.area}`} title={t('Pregled')} wide open={open} onClose={onClose}>
      <Stats>
        <Stat
          value={done.length}
          label={t('{noun} do sada', { noun: tn(done.length, 'poseta', 'posete', 'poseta').replace(/^\d+ /, '') })}
          note={coming ? t('{count} zakazano', { count: coming }) : t('nijedna nije zakazana')}
        />
        <Stat value={time.value} label={t('zajedno')} note={time.sub} />
      </Stats>

      <PaneLabel>{t('Kontakt')}</PaneLabel>
      <DataList className="mt-2">
        <Line label={t('Telefon')} value={a.endedOn ? t('Skriven posle kraja saradnje') : a.caregiver.phone} />
        {c?.email && <Line label={t('E-mail')} value={a.endedOn ? t('Skriven posle kraja saradnje') : c.email} />}
        <Line label={t('Opština')} value={a.caregiver.area} />
        {c?.languages && <Line label={t('Jezici')} value={c.languages.map((l) => t(l)).join(', ')} />}
      </DataList>
      <PaneHint>
        {t('Ako nešto nije u redu tokom posete, prvo pozovite negovateljicu. Sve oko novca rešava koordinatorka.')}
      </PaneHint>

      {agreed && (
        <>
          <PaneLabel>{t('Dogovorena nega')}</PaneLabel>
          <DataList className="mt-2">
            <Line label={t('Ugovor koji važi')} value={t('verzija {version}', { version: act.version })} />
            <Line label={t('Cena po satu')} value={rateText(act.rate)} />
          </DataList>
          <ServiceChips ids={act.services} grouped />
          {act.terms && (
            <Groups>
              <Group label={t('Dodatni uslovi')} text={t(act.terms)} />
            </Groups>
          )}
        </>
      )}

      <PaneLabel>{t('Kvalifikacije')}</PaneLabel>
      <Tags items={a.caregiver.classifications || c?.classifications || []} />
      {c?.education && (
        <DataList className="mt-2">
          <Line label={t('Obrazovanje')} value={t(c.education)} />
        </DataList>
      )}

      {c?.bio && (
        <>
          <PaneLabel>{t('O negovateljici')}</PaneLabel>
          <SheetDescription>{t(c.bio)}</SheetDescription>
        </>
      )}

      <PaneLabel>{t('Ocene')}</PaneLabel>
      {/* the platform's one way of saying it (docs/patterns.md §8) */}
      <SheetDescription>{c ? <Rating caregiver={c} /> : t('Nova')}</SheetDescription>

      <PaneLabel>{t('Kako se plaća')}</PaneLabel>
      <DataList className="mt-2">
        <Line label={t('Način plaćanja')} value={care.payment.connected ? `${care.payment.brand} ···· ${care.payment.last4}` : t('Još nije dodat')} />
        <Line label={t('Rezerviše se')} value={t('kad stigne plan posete')} />
        <Line label={t('Naplaćuje se')} value={t('24 sata posle radnog naloga')} />
      </DataList>
      <PaneHint>
        {t('Naplaćuje se samo poseta koja se desila i za koju je {name} poslala radni nalog. Sati preko rezervisanih se naplaćuju samo ako ih odobrite.', { name: first })}
      </PaneHint>
    </Modal>
  );
}

// Every version of her terms, newest first, and what each changed.
const VERSION_STATE = {
  sent: { text: msg('Čeka vaš odgovor'), pill: 'is-pending' },
  active: { text: msg('Važi'), pill: 'is-accepted' },
  replaced: { text: msg('Zamenjena'), pill: 'is-muted' },
  declined: { text: msg('Odbijena'), pill: 'is-declined' },
  withdrawn: { text: msg('Povučena'), pill: 'is-muted' },
  ended: { text: msg('Završena'), pill: 'is-muted' },
};

function Versions({ open = true, care, caregiverId, onClose }) {
  const a = arrangementOf(care, caregiverId);
  if (!a) return null;
  const list = [...a.versions].reverse();
  return (
    <Modal eyebrow={`${a.caregiver.name} · ${care.elder.name}`} title={t('Sve verzije ugovora')} wide open={open} onClose={onClose}>
      {list.map((v) => {
        const prev = a.versions[v.version - 2];
        const st = VERSION_STATE[v.status] || VERSION_STATE.replaced;
        const changes = prev ? changesBetween(prev, v) : [];
        return (
          <div key={v.version}>
            <PaneLabel>
              {t('Verzija {version}', { version: v.version })} <Badge variant={statusVariant(st.pill)}>{t(st.text)}</Badge>
            </PaneLabel>
            <DataList className="mt-2">
              <Line label={t('Poslato')} value={v.sentOn} />
              <Line label={t('Cena po satu')} value={rateText(v.rate)} />
              <Line label={t('Usluge')} value={services(v.services.length)} />
              {changes.map((r) => (
                <Line key={r.label} label={r.label} value={r.value} />
              ))}
            </DataList>
            {/* what she wrote with it, under its name (docs/patterns.md §10) */}
            {v.note && prev && (
              <Groups className="mt-2">
                <Group label={t('{name} je napisala', { name: firstName(a.caregiver.name) })} text={t(v.note)} />
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
  if (drawer.kind === 'work-order') return <WorkOrder key={`wo-${drawer.visitId}`} visitId={drawer.visitId} then={drawer.then} {...rest} />;
  if (drawer.kind === 'plan') return <Plan key={`plan-${drawer.visitId}`} visitId={drawer.visitId} {...rest} />;
  if (drawer.kind === 'end') return <End key="end" caregiverId={drawer.caregiverId} {...rest} />;
  if (drawer.kind === 'profile') return <Profile key="profile" caregiverId={drawer.caregiverId} {...rest} />;
  if (drawer.kind === 'activity') return <ActivityDrawer key="activity" caregiverId={drawer.caregiverId} {...rest} />;
  if (drawer.kind === 'overview') return <Overview key="overview" caregiverId={drawer.caregiverId} {...rest} />;
  if (drawer.kind === 'versions') return <Versions key="versions" caregiverId={drawer.caregiverId} {...rest} />;
  if (drawer.kind === 'visits') return <VisitsDrawer key="visits" {...rest} />;
  // the whole of a list the home shows three of (docs/patterns.md §4a)
  if (drawer.kind === 'coming') return <ComingDrawer key="coming" {...rest} />;
  if (drawer.kind === 'caregivers') return <CaregiversDrawer key="caregivers" {...rest} />;
  if (drawer.kind === 'offers') return <OffersDrawer key="offers" {...rest} />;
  // what the plan's page held and the home has no room for (§4a)
  if (drawer.kind === 'offer') return <OfferDrawer key={`offer-${drawer.recId}`} recId={drawer.recId} {...rest} />;
  if (drawer.kind === 'letter') return <LetterDrawer key="letter" {...rest} />;
  return null;
}
