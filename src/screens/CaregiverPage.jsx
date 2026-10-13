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
import ShowMore from '../components/ShowMore';
import { useShowMore } from '@/hooks/use-show-more';
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
  rateText,
  services,
  shownVersion,
  workedHours,
} from '../data/familyCare';
import { t } from '../i18n';

// One caregiver, from the family's side: what is next with her, the terms she
// works under, how it has gone so far, and every visit she has made. Everything
// the family can do about her is on this page or one drawer away from it.


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
      ? {
          eyebrow: t('Upit je poslat'),
          copy: t('Pisali ste joj ponovo {date}. {name} još nije odgovorila, javićemo vam u svakom slučaju.', { date: again.requested, name: first }),
        }
      : again.status === 'accepted'
        ? {
            eyebrow: t('Prihvatila je'),
            copy: t('{name} je prihvatila da ponovo dolazi. Nove uslove šalje uskoro, a stari ugovor ne važi.', { name: first }),
          }
        : {
            eyebrow: t('Odbila je'),
            copy: t('{name} sada ne može: {why}. Možete da je pitate ponovo kasnije.', { name: first, why: again.detail.toLowerCase() }),
            label: t('Pitaj ponovo'),
            contact: true,
          };
  }

  if (pen && !care.payment.connected) {
    return {
      eyebrow: t('Čeka na vas'),
      copy: t('{name} je predložila uslove, a kartica mora biti sačuvana pre nego što se ijedna poseta rezerviše. Dodavanje kartice ništa ne naplaćuje.', {
        name: first,
      }),
      label: t('Pogledaj uslove'),
      drawer: { kind: 'terms', caregiverId: a.caregiver.id },
    };
  }
  if (pen) {
    return {
      eyebrow: t('Čeka na vas'),
      copy: [
        t('{name} je predložila {rate} na sat za {services}.', { name: first, rate: money(pen.rate), services: services(pen.services.length) }),
        activeVersion(a)
          ? t('Verzija {version} važi dok ne odgovorite.', { version: activeVersion(a).version })
          : t('Ništa ne može da se zakaže dok ne odgovorite, a prihvatanje ništa ne naplaćuje.'),
      ].join(' '),
      label: t('Pogledaj uslove'),
      drawer: { kind: 'terms', caregiverId: a.caregiver.id },
    };
  }
  if (order) {
    return {
      eyebrow: t('Čeka na vas'),
      copy: t('{name} je poslala radni nalog za {day}. Ako je sve bilo kako je dogovoreno, ne morate ništa - prolazi samo.', {
        name: first,
        day: order.date.toLowerCase(),
      }),
      label: t('Pogledaj radni nalog'),
      drawer: { kind: 'work-order', visitId: order.id },
    };
  }
  if (extra) {
    return {
      eyebrow: t('Čeka na vas'),
      copy: t('{name} je radila {hours} h duže nego što je bilo rezervisano {day}. To se naplaćuje samo ako odobrite.', {
        name: first,
        hours: extra.extra.hours,
        day: extra.date.toLowerCase(),
      }),
      label: t('Pogledaj radni nalog'),
      drawer: { kind: 'work-order', visitId: extra.id },
    };
  }
  if (queried) {
    return {
      eyebrow: t('Kod vaše koordinatorke'),
      copy: t('Ono što ste prijavili se proverava. Ništa se ne naplaćuje dok je otvoreno, i neko će vas pozvati.'),
    };
  }
  if (booked) {
    return {
      eyebrow: t('Predstoji'),
      copy: t('{name} dolazi {day} u {time}. {amount} je rezervisano, nije naplaćeno.', {
        name: first,
        day: booked.date.toLowerCase(),
        time: booked.time.split('–')[0],
        amount: money(chargedFor(booked.hours, booked.rate)),
      }),
      label: t('Pogledaj plan posete'),
      drawer: { kind: 'plan', visitId: booked.id },
    };
  }
  if (done) {
    return {
      eyebrow: t('Poseta je obavljena'),
      copy: t('{name} je bila kod vas {day}. Ništa se ne naplaćuje dok ne pošalje radni nalog.', { name: first, day: done.date.toLowerCase() }),
    };
  }
  if (a.endedOn) {
    return {
      eyebrow: t('Završeno'),
      copy: t(
        'Ova saradnja je završena {date}. Ako vam je ponovo potrebna, pošaljite joj plan nege kakav je sada. Ona odgovara kao na svaki upit, a nove uslove postavljate zajedno.',
        { date: a.endedOn }
      ),
      label: canAsk(care, a.caregiver.id) ? t('Ponovo sarađujte') : null,
      contact: true,
    };
  }
  if (!a.versions.length) {
    return {
      eyebrow: t('Prihvatila je'),
      copy: t('{name} je prihvatila upit. Ugovor o nezi šalje uskoro, a ništa ne važi dok ga ne prihvatite.', { name: first }),
    };
  }
  if (!activeVersion(a) && lastVersion(a)?.status === 'declined') {
    return {
      eyebrow: t('Uslovi su odbijeni'),
      copy: t('Odbili ste verziju {version}. Koordinatorka će vas pozvati, a {name} može da pošalje nove uslove.', {
        version: lastVersion(a).version,
        name: first,
      }),
    };
  }
  if (!activeVersion(a) && lastVersion(a)?.status === 'withdrawn') {
    return { eyebrow: t('Predlog je povučen'), copy: t('{name} je povukla uslove. Ništa ne važi dok ne pošalje nove.', { name: first }) };
  }
  return {
    eyebrow: t('Ništa ne čeka'),
    copy: t('Nijedna poseta nije zakazana i ništa ne čeka vaš odgovor. {name} šalje sledeći plan kad dođe vreme.', { name: first }),
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
  // ten, then ten more in place, never a drawer (docs/patterns.md §8a)
  const shownVisits = useShowMore(visits, { reset: caregiverId });

  // the badge says what became of the version shown
  const TERMS_STATE = {
    sent: { text: t('još nije prihvaćena'), pill: 'is-pending' },
    active: { text: t('važi'), pill: 'is-accepted' },
    ended: { text: t('završena'), pill: 'is-muted' },
    declined: { text: t('odbijena'), pill: 'is-declined' },
    withdrawn: { text: t('povučena'), pill: 'is-muted' },
    replaced: { text: t('zamenjena'), pill: 'is-muted' },
  };
  const termsState = terms && (TERMS_STATE[terms.status] || TERMS_STATE.active);
  const termsBadge = termsState && { text: t('Verzija {version} · {state}', { version: terms.version, state: termsState.text }), pill: termsState.pill };

  return (
    <Page>
      <BackButton label={t('Moja nega')} onClick={onBack} />

      <PageHeader>
        <PagePerson>
          <Avatar>
            <AvatarFallback className={cn(ended && 'bg-muted text-muted-foreground')}>{cg.initials}</AvatarFallback>
          </Avatar>
          <PageHeaderText>
            <PageTitle>{cg.name}</PageTitle>
            <PageDescription>
              {cg.area} · {t('dolazi kod: {name}', { name: care.elder.name })} ·{' '}
              {ended ? t('završeno {date}', { date: a.endedOn }) : a.since ? t('od {date}', { date: a.since }) : t('ugovor još nije prihvaćen')}
            </PageDescription>
          </PageHeaderText>
        </PagePerson>
        {/* Everything about her, and everything that has happened with her,
            each a drawer: icons beside her number, as the plan's own actions
            are, so the head keeps its width for her name. */}
        <PageActions>
          {!ended && (
            <Button variant="secondary" asChild>
              <a href={'tel:' + cg.phone.replace(/\s/g, '')} className="no-underline">
                <Phone size={14} strokeWidth={1.75} />
                {cg.phone}
              </a>
            </Button>
          )}
          <Button variant="secondary" size="icon" aria-label={t('Pregled')} title={t('Pregled')} onClick={() => onDrawer({ kind: 'overview', caregiverId: cg.id })}>
            <IdCard size={14} strokeWidth={1.75} />
          </Button>
          <Button variant="secondary" size="icon" aria-label={t('Šta se desilo')} title={t('Šta se desilo')} onClick={() => onDrawer({ kind: 'activity', caregiverId: cg.id })}>
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
          <CardTitle>{pen ? t('Novi uslovi čekaju na vas') : t('Ugovor o nezi')}</CardTitle>
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
                {t('Dok ne odgovorite, važi verzija {version}: {rate}/h za {services}.', {
                  version: act.version,
                  rate: money(act.rate),
                  services: services(act.services.length),
                })}
              </CardDescription>
            )}
            <ServiceChips ids={terms.services} grouped />
            <DataList className="mt-2">
              <Line label={terms.status === 'sent' ? t('Poslato') : terms.agreedOn ? t('Prihvaćeno') : t('Poslato')} value={terms.status === 'sent' || !terms.agreedOn ? terms.sentOn : terms.agreedOn} />
              <Line label={t('Cena po satu')} value={rateText(terms.rate)} />
              <Line label={t('Dogovoreni sati')} value={t('{hours} h nedeljno', { hours: terms.hours })} />
              <Line label={t('Raspored')} value={terms.schedule} />
            </DataList>
            {terms.terms && (
              <Groups>
                <Group label={t('Dodatni uslovi')} text={terms.terms} />
              </Groups>
            )}
            {a.versions.length > 1 && (
              <CardFooter>
                <Button variant="secondary" onClick={() => onDrawer({ kind: 'versions', caregiverId: cg.id })}>
                  {t('Sve verzije ({count})', { count: a.versions.length })}
                </Button>
              </CardFooter>
            )}
          </>
        ) : (
          <CardDescription>{t('{name} još nije poslala uslove.', { name: first })}</CardDescription>
        )}
      </Card>

      <Card>
        <CardTitle>{t('Ukratko')}</CardTitle>
        <DataList className="mt-2">
          <Line label={t('Zajedno')} value={ended ? (a.since || '-') + ' – ' + a.endedOn : a.since ? t('od {date}', { date: a.since }) : t('još niste počeli')} />
          <Line label={t('Posete do sada')} value={paid.length ? paid.length + ' · ' + hoursSoFar + ' h' : t('još nijedna')} />
          {(a.periods || []).map((p) => (
            <Line key={p.since} label={t('Ranije')} value={(p.since || '-') + ' – ' + p.endedOn} />
          ))}
          <Line label={t('Poslednja poseta')} value={paid[0]?.date || '-'} />
          <Line
            label={t('Način plaćanja')}
            value={care.payment.connected ? `${care.payment.brand} ···· ${care.payment.last4}` : t('Još nije dodat')}
          />
        </DataList>
        {!care.payment.connected && (
          <CardFooter>
            <Button
              variant="secondary"
              onClick={() => {
                onCare(linkCard);
                onFlash(t('Kartica je dodata. Posete sada mogu da se rezervišu.'));
              }}
            >
              <CreditCard size={14} strokeWidth={1.75} />
              {t('Dodaj karticu')}
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Posete')}</CardTitle>
          <CardAction>
            <Badge variant="secondary">{a.visits.length}</Badge>
          </CardAction>
        </CardHeader>
        <CardDescription>
          {pen && act
            ? t('Nove posete su pauzirane dok ne odgovorite na nove uslove. Zakazane ostaju.')
            : act || ended
              ? t('Svaka se unapred rezerviše, a naplaćuje kad potvrdi šta je uradila.')
              : t('Posete počinju kad se uslovi prihvate.')}
        </CardDescription>
        {visits.length > 0 && (
          <ItemGroup>
            {shownVisits.visible.map((v) => (
              <VisitRow key={v.id} visit={v} onDrawer={onDrawer} />
            ))}
          </ItemGroup>
        )}
        {/* right under the rows, 16 from the last one's text (docs/patterns.md §6) */}
        <ShowMore list={shownVisits} />
      </Card>

      {/* Ending is quiet: a sentence and a red ghost button under the cards,
          not a card of its own. */}
      {act && !ended && (
        <div className="flex items-center gap-3 px-4 py-3 text-xs leading-body text-disabled phone:flex-col phone:items-start phone:gap-1">
          <p className="flex-1">{t('Kad završite saradnju, nove posete prestaju. Sve što je već izmireno ostaje u vašoj evidenciji.')}</p>
          <Button variant="ghost" className="text-destructive phone:-ml-3" onClick={() => onDrawer({ kind: 'end', caregiverId: cg.id })}>
            {t('Završi saradnju')}
          </Button>
        </div>
      )}
    </Page>
  );
}
