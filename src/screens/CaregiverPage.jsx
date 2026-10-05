import { CreditCard, History, IdCard, Phone } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemGroup } from '@/components/ui/item';
import { DataList } from '@/components/data-list';
import {
  Page,
  PageActions,
  PageDescription,
  PageHeader,
  PageHeaderText,
  PagePerson,
  PageTitle,
} from '@/components/page';
import { cn } from '@/lib/utils';
import { statusVariant } from '../components/Standing';
import Attention from '../components/Attention';
import BackButton from '../components/BackButton';
import VisitRow from '../components/family/VisitRow';
import { Line, ServiceChips } from '../components/family/FamilyDrawer';
import { Group, Groups } from '../components/Tags';
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
    <Page>
      <BackButton label="Moja nega" onClick={onBack} />

      <PageHeader>
        <PagePerson>
          <Avatar>
            <AvatarFallback className={cn(ended && 'bg-muted text-muted-foreground')}>{cg.initials}</AvatarFallback>
          </Avatar>
          <PageHeaderText>
            <PageTitle>{cg.name}</PageTitle>
            <PageDescription>
              {cg.area} · dolazi kod: {care.elder.name} · {ended ? `završeno ${a.endedOn}` : a.since ? `od ${a.since}` : 'ugovor još nije prihvaćen'}
            </PageDescription>
          </PageHeaderText>
        </PagePerson>
        {/* Everything about her, and everything that has happened with her,
            each a drawer: icons beside her number, as the plan's own actions
            are, so the head keeps its width for her name. */}
        <PageActions>
          {!ended && (
            <Button variant="secondary" asChild>
              <a href={`tel:${cg.phone.replace(/\s/g, '')}`} className="no-underline">
                <Phone size={14} strokeWidth={1.75} />
                {cg.phone}
              </a>
            </Button>
          )}
          <Button variant="secondary" size="icon" aria-label="Pregled" title="Pregled" onClick={() => onDrawer({ kind: 'overview', caregiverId: cg.id })}>
            <IdCard size={14} strokeWidth={1.75} />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Šta se desilo" title="Šta se desilo" onClick={() => onDrawer({ kind: 'activity', caregiverId: cg.id })}>
            <History size={14} strokeWidth={1.75} />
          </Button>
        </PageActions>
      </PageHeader>

      {/* something to do about her is the page's tinted place; a plain state
          of things is a card like the rest */}
      {/* Where things stand with her is a notice, so it is the page's tinted
          place whether or not there is something to press (docs/patterns.md
          §5): its words in a white card, and its button under them if any. */}
      <Attention title={next.eyebrow}>
        <Card>
          <p className="text-sm text-foreground">{next.copy}</p>
          {next.label && (
            <CardFooter>
              <Button onClick={() => (next.contact ? onContact?.(a.caregiver) : onDrawer(next.drawer))}>{next.label}</Button>
            </CardFooter>
          )}
        </Card>
      </Attention>

      <Card>
        <CardHeader>
          <CardTitle>{pen ? 'Novi uslovi čekaju na vas' : 'Ugovor o nezi'}</CardTitle>
          {termsBadge && (
            <CardAction>
              <Badge variant={statusVariant(termsBadge.pill)}>{termsBadge.text}</Badge>
            </CardAction>
          )}
        </CardHeader>
        {terms ? (
          <>
            {pen && act && (
              <CardDescription>
                Dok ne odgovorite, važi verzija {act.version}: {money(act.rate)}/h za{' '}
                {services(act.services.length)}.
              </CardDescription>
            )}
            <ServiceChips ids={terms.services} grouped />
            <DataList className="mt-2">
              <Line label={terms.status === 'sent' ? 'Poslato' : terms.agreedOn ? 'Prihvaćeno' : 'Poslato'} value={terms.status === 'sent' || !terms.agreedOn ? terms.sentOn : terms.agreedOn} />
              <Line label="Cena po satu" value={`${money(terms.rate)} / h`} />
              <Line label="Dogovoreni sati" value={`${terms.hours} h nedeljno`} />
              <Line label="Raspored" value={terms.schedule} />
            </DataList>
            {terms.terms && (
              <Groups>
                <Group label="Dodatni uslovi" text={terms.terms} />
              </Groups>
            )}
            {a.versions.length > 1 && (
              <CardFooter>
                <Button variant="secondary" onClick={() => onDrawer({ kind: 'versions', caregiverId: cg.id })}>
                  Sve verzije ({a.versions.length})
                </Button>
              </CardFooter>
            )}
          </>
        ) : (
          <CardDescription>{first} još nije poslala uslove.</CardDescription>
        )}
      </Card>

      <Card>
        <CardTitle>Ukratko</CardTitle>
        <DataList className="mt-2">
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
        </DataList>
        {!care.payment.connected && (
          <CardFooter>
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
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posete</CardTitle>
          <CardAction>
            <Badge variant="secondary">{a.visits.length}</Badge>
          </CardAction>
        </CardHeader>
        <CardDescription>
          {pen && act
            ? 'Nove posete su pauzirane dok ne odgovorite na nove uslove. Zakazane ostaju.'
            : act || ended
              ? 'Svaka se unapred rezerviše, a naplaćuje kad potvrdi šta je uradila.'
              : 'Posete počinju kad se uslovi prihvate.'}
        </CardDescription>
        {visits.length > 0 && (
          <ItemGroup>
            {visits.slice(0, SHOWN).map((v) => (
              <VisitRow key={v.id} visit={v} onDrawer={onDrawer} />
            ))}
          </ItemGroup>
        )}
        {visits.length > SHOWN && (
          // right under the rows, 16 from the last one's text (docs/patterns.md §6)
          <CardFooter className="mt-0">
            <Button variant="secondary" onClick={() => onDrawer({ kind: 'visits', caregiverId: cg.id })}>
              Pogledaj sve ({visits.length})
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Ending is quiet: a sentence and a red ghost button under the cards,
          not a card of its own. */}
      {act && !ended && (
        <div className="flex items-center gap-3 px-4 py-3 text-xs leading-body text-disabled phone:flex-col phone:items-start phone:gap-1">
          <p className="flex-1">Kad završite saradnju, nove posete prestaju. Sve što je već izmireno ostaje u vašoj evidenciji.</p>
          <Button variant="ghost" className="text-destructive phone:-ml-3" onClick={() => onDrawer({ kind: 'end', caregiverId: cg.id })}>
            Završi saradnju
          </Button>
        </div>
      )}
    </Page>
  );
}
