import { useState } from 'react';
import { Check, ChevronDown, Clock, Lock, Search, Send } from 'lucide-react';
import { caregivers } from '../data/carePlan';
import {
  activeVersion,
  allVisits,
  chargedFor,
  chargingVisit,
  confirmPlan,
  firstName,
  hasBeen,
  heldNow,
  lastVisit,
  lowerDate,
  money,
  plansToConfirm,
  services,
  visitCharge,
  waitingOnYou,
} from '../data/familyCare';
import { coordinator } from '../data/carePlan';
import { USUAL_ANSWER, waitingOnHer } from '../data/firstSteps';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardTitle,
} from '@/components/ui/card';
import { Item, ItemContent, ItemGroup, ItemLink } from '@/components/ui/item';
import { Page, PageActions, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { cn } from '@/lib/utils';
import AskAssistant from '../components/AskAssistant';
import Attention from '../components/Attention';
import {
  ArrangementRow,
  HOME_ROWS,
  OfferRow,
  comingVisits,
  currentFirst,
  partnerOffers,
  rowBody,
  rowTitle,
} from '../components/family/HomeRows';
import VisitReport from '../components/family/VisitReport';
import { amountOf } from '../components/family/VisitRow';
import PlanChangeBanner from '../components/PlanChangeBanner';
import RecommendationCard from '../components/RecommendationCard';
import { CoordinatorContact } from '../components/PlanFooterBlocks';
import { getLang, t, tn } from '../i18n';

// The family's home, and the one page they should rarely need to leave
// (docs/patterns.md §4a). What it shows follows where they are:
//
// - the plan has just been made and nobody has been asked: the care plan
//   itself is the page (Minna's letter, what we recommend, the caregivers who
//   fit), because that is all there is and the next step is in it;
// - asked and waiting: where the requests stand, and the plan under it;
// - someone comes: an overview, everything on the platform gathered and said
//   briefly, laid out as a grid. What waits on them, only when something
//   does; three numbers, each a card (visits so far, the next one, the money
//   held); then cards two to a line: what is booked and how the last visit
//   went, who cares for her and what our partners offer, and how to reach
//   the coordinator. Every card keeps its place whether or not it has
//   anything to show, so the page does not rearrange as care goes on. A card or a row opens the
//   thing it is about — a drawer, her page, the record, the plan — for whoever
//   wants the details; nothing here has a button of its own for that.
//
// Only two things are ever asked of a family, and they work in opposite
// directions: terms stop everything until they are agreed, while a work order
// goes through on its own unless someone says it was wrong. The note under
// "Waiting for you" says which, so neither reads like the other.

// A card of the overview: its title, what opens beside it (rows under a head
// with a button start 8 lower, docs/patterns.md §7), a sentence if it needs
// one, and rows.
function Section({ title, action, sub, children }) {
  return (
    <Card className={cn(action && '[&>[data-slot=item-group]]:mt-2')}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      {sub && <CardDescription>{sub}</CardDescription>}
      {children}
    </Card>
  );
}

// What the coordinator wrote with the plan (docs/patterns.md §4a). A card
// like the others here, not the tinted tray: the tint is for what asks for
// something. Its title says whose it is.
//
// Until someone has said yes (`accordion`), the home is the plan it
// introduces, so it opens and folds in place, starting open: "Sakrij" folds it
// to its first line, "Pročitaj" opens it again. Once someone comes it is folded,
// and the whole card and "Pročitaj" open it in a drawer.
function Letter({ letter, changed, changeKey, accordion = false, onOpen }) {
  const { greeting, paragraphs, from } = letter;
  const [open, setOpen] = useState(accordion);
  // "koordinatorke Minne": her first name in the genitive
  const first = from.name.split(' ')[0];
  const whose = first.endsWith('a') ? `${first.slice(0, -1)}e` : first;
  const title = t('Poruka koordinatorke {name}', { name: getLang() === 'sr' ? whose : first });
  const ring = cn(changed && 'animate-plan-changed shadow-[0_0_0_1px_var(--color-primary-300),var(--shadow-card)]');
  const firstLine = (
    <p className="mt-2 truncate text-xs leading-body text-muted-foreground">
      {greeting} {paragraphs[0]}
    </p>
  );

  if (!accordion) {
    return (
      <Card key={changed ? changeKey : 'letter'} className={ring}>
        <CardHeader>
          <CardTitle>
            <CardLink onClick={onOpen}>{title}</CardLink>
          </CardTitle>
          <CardAction>
            {changed && <Badge>{t('Izmenjeno')}</Badge>}
            <Button variant="secondary" onClick={onOpen}>
              {t('Pročitaj')}
            </Button>
          </CardAction>
        </CardHeader>
        {/* under a head with a button, 8 lower (§7) */}
        {firstLine}
      </Card>
    );
  }

  return (
    <Card key={changed ? changeKey : 'letter'} className={ring}>
      {/* `contents`, so what it holds is laid out by the card, as in every
          other card; the card itself stays a card (its `data-slot`) */}
      <Collapsible open={open} onOpenChange={setOpen} className="contents">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardAction>
            {changed && <Badge>{t('Izmenjeno')}</Badge>}
            <CollapsibleTrigger asChild>
              {/* on a phone the title takes the line, so the button is its
                  arrow alone; the word stays for a screen reader (§10: what
                  opens in place has an arrow that turns) */}
              <Button variant="secondary" className="phone:aspect-square phone:px-0">
                <span className="phone:sr-only">{open ? t('Sakrij') : t('Pročitaj')}</span>
                <ChevronDown size={14} strokeWidth={1.75} className={cn('transition-transform duration-200', open && 'rotate-180')} />
              </Button>
            </CollapsibleTrigger>
          </CardAction>
        </CardHeader>
        {open ? (
          <p className="mt-2 text-xs leading-body font-medium text-foreground">{greeting}</p>
        ) : (
          firstLine
        )}
        {/* the 8 over the letter is the letter's own, so it folds away with it
            and not in a step once the letter has */}
        <CollapsibleContent className="-mt-2 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="flex flex-col gap-2 pt-2">
            {paragraphs.map((p, i) => (
              <p className={rowBody} key={i}>
                {p}
              </p>
            ))}
            <p className="mt-1 text-small text-muted-foreground">- {first}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// One number of the overview, a card of its own: the number (24 / 32, as a
// price on a plan's card), what it counts and a note under it. One that has
// more behind it opens it from anywhere on the card.
function StatCard({ value, label, note, onOpen, className }) {
  return (
    <Card className={className}>
      <div>
        <p className="text-[24px] leading-8 font-medium text-foreground">{value}</p>
        <p className="text-small text-muted-foreground">{onOpen ? <CardLink onClick={onOpen}>{label}</CardLink> : label}</p>
        <p className="text-small text-muted-foreground">{note}</p>
      </div>
    </Card>
  );
}

// The same, as a card of its own in the tinted tray of what waits on the
// family: white like every card, its title the size of a row's title in the
// cards under it (14, not a card's 16: §4a), its avatar as tall as that title
// and the sentence under it, 2 apart (42).
// What waits needs doing, so its button stays on a phone too: under what the
// card says, in its column and as wide as it, 16 below (docs/patterns.md §7).
// `onAct`: what the button does when that is not opening the card. `aside`:
// a second, quieter button beside it (a visit plan can be put away from here
// without being opened).
function OpenCard({ initials, title, body, action, variant = 'secondary', onOpen, onAct = onOpen, aside }) {
  return (
    <Card className="flex-row items-start gap-3 [--avatar:calc(var(--text-xs-leading)+2px+var(--text-body-leading))] phone:flex-wrap">
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <ItemContent className="phone:basis-[calc(100%-var(--avatar)-var(--spacing-3))]">
        <p className="-mb-0.5 flex items-center gap-2 text-xs font-medium text-foreground">
          <CardLink onClick={onOpen}>{title}</CardLink>
        </p>
        {body}
      </ItemContent>
      <div className="flex shrink-0 gap-2 phone:mt-1 phone:ml-[calc(var(--avatar)+var(--spacing-3))] phone:w-[calc(100%-var(--avatar)-var(--spacing-3))] phone:*:flex-auto">
        {aside && (
          <Button variant="secondary" onClick={aside.onClick}>
            {aside.label}
          </Button>
        )}
        <Button variant={variant} onClick={onAct}>
          {action}
        </Button>
      </div>
    </Card>
  );
}

export default function Dashboard({
  care,
  user,
  plan,
  unlocked,
  askNote,
  planChange,
  onDrawer,
  onCaregiver,
  onView,
  onAskAssistant,
  onFindCaregiver,
  onCare,
  onSelectCaregiver,
  onOpenCaregiver,
  onUnlock,
  standingOf,
  onUndoChange,
  onDismissChange,
  onShare,
  onFlash,
}) {
  const waiting = waitingOnYou(care);
  // a plan just sent is booked, so it is one of the visits that are coming;
  // until it is seen it also waits at the top
  const toConfirm = plansToConfirm(care);
  // soonest first
  const coming = comingVisits(care);
  // who comes first, who no longer does last
  const carers = currentFirst(care.arrangements);
  const last = lastVisit(care);
  // nobody asked yet: the one thing to do is ask
  const fresh = !care.arrangements.length && !care.requests.length;
  // Asked, and nobody has come yet: the requests live on "Moji upiti", so
  // this page only says where things stand and takes them there. Once someone
  // comes, the page is about her and the requests are not repeated here.
  const asked = !care.arrangements.length && care.requests.length > 0;
  const latest = care.requests.filter((r, i, all) => all.findIndex((x) => x.caregiverId === r.caregiverId) === i);
  const pendingNames = latest
    .filter((r) => r.status === 'pending')
    .map((r) => caregivers.find((c) => c.id === r.caregiverId)?.name)
    .filter(Boolean);

  // the overview's own numbers: visits that have been, the next one, money moving
  const running = care.arrangements.length > 0;
  // The overview is for care that has terms: until the family has agreed to
  // a contract (one in force, or one that was), the home stays the plan,
  // with what they wait for over it (docs/patterns.md §4a).
  const agreed = care.arrangements.some((a) => a.versions.some((v) => v.status === 'active' || v.status === 'ended'));
  const done = allVisits(care).filter(hasBeen).length;
  const next = coming[0];
  const since = care.arrangements.map((a) => a.since).find(Boolean);
  const held = heldNow(care);
  const charging = chargingVisit(care);
  // what the plan offers through partners, beside the caregivers
  const offers = partnerOffers(plan);
  // A card shows three of what it lists; the rest is a drawer away, by a
  // button in the card's head named for what it opens, with how many there
  // are in all, so three rows never read as the whole list (docs/patterns.md §4a).
  const allOf = (list, kind, label) =>
    list.length > HOME_ROWS && (
      <Button variant="secondary" onClick={() => onDrawer({ kind })}>
        {label} ({list.length})
      </Button>
    );
  // What the plan recommends, as cards of the home (docs/patterns.md §4a):
  // the caregivers to write to, what our partners offer, and the advice of
  // what the family can do themselves. Without a subscription the last two are
  // one card that says what is in them and opens them.
  const recs = plan?.recommendations || [];
  const careRec = !agreed && recs.find((r) => r.kind === 'caregivers' && !r.locked);
  const advice = recs.filter((r) => r.kind === 'list');
  const locked = recs.filter((r) => r.locked);
  const offersCard = plan && offers.length > 0 && (
    <Section title={t('Ponude partnera')} action={allOf(offers, 'offers', t('Sve ponude'))}>
      <ItemGroup>
        {offers.slice(0, HOME_ROWS).map((rec) => (
          <OfferRow key={rec.id} rec={rec} onOpen={() => onDrawer({ kind: 'offer', recId: rec.id })} />
        ))}
      </ItemGroup>
      {/* what these are, last in the card and pushed to its foot */}
      <p className="mt-auto pt-2 text-small text-muted-foreground">
        {t('Pregledi i pomagala iz plana nege, jeftinije kad ih zakaže Minna.')}
      </p>
    </Section>
  );

  // What the family can do themselves, from the plan: each piece of advice a
  // row, its title, why, and what it is, ticked.
  const adviceCard = plan && advice.length > 0 && (
    <Section title={t('Saveti iz plana nege')}>
      <ItemGroup>
        {advice.map((rec) => (
          <Item key={rec.id}>
            <ItemContent className="gap-1">
              <p className={rowTitle}>{rec.title}</p>
              <p className={rowBody}>{rec.why}</p>
              <ul className="mt-1 flex list-none flex-col gap-1">
                {rec.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs leading-body text-muted-foreground">
                    <Check size={13} strokeWidth={2} className="h-[1lh] shrink-0 text-primary-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </Section>
  );

  // Before a subscription the partners and the advice are there, blurred and
  // faint, so it is plain that something is kept back and what kind, with
  // what opens them over them (the paywall's own look, as in the plan).
  const partsRow = (offersCard || adviceCard) && (
    <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2 @2xl:[&>:last-child:nth-child(odd)]:col-span-full">
      {offersCard}
      {adviceCard}
    </div>
  );
  const lockedRow = partsRow && (
    <div className="relative">
      <div className="pointer-events-none opacity-50 blur-[6px] select-none" aria-hidden="true" inert>
        {partsRow}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-[color-mix(in_srgb,var(--surface-elevated)_55%,transparent)] p-4 text-center">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
          <Lock size={14} strokeWidth={2} />
        </span>
        <p className="text-sm font-medium text-foreground">{t('Još {count} preporuke u punom planu', { count: locked.length })}</p>
        <p className="mb-2 max-w-[440px] text-xs leading-body text-muted-foreground">
          {t(
            'Pregledi kod lekara i pomagala kod naših partnera, jeftinije kad ih zakaže Minna, promene koje stan čine bezbednijim, i direktan broj svake negovateljice.'
          )}
        </p>
        <Button size="lg" onClick={onUnlock}>
          <Lock size={12} strokeWidth={2} /> {t('Otključajte ceo plan nege')}
        </Button>
      </div>
    </div>
  );

  const letterCard = plan?.letter && (
    <Letter
      accordion={!agreed}
      letter={plan.letter}
      changed={Boolean(planChange?.letter)}
      changeKey={planChange?.at}
      onOpen={() => onDrawer({ kind: 'letter' })}
    />
  );

  // While nobody comes yet, the home is the plan, laid out as the overview is
  // (docs/patterns.md §4a): the coordinator's letter first, the caregivers to
  // write to across the page, the partners and the advice two to a line
  // (blurred until there is a subscription), the coordinator.
  const thePlan = plan && !agreed && (
    <div className="@container flex flex-col gap-3">
      {letterCard}
      {careRec && (
        <RecommendationCard
          rec={careRec}
          unlocked={unlocked}
          askNote={askNote}
          bookable
          changed={Boolean(planChange?.recs.includes(careRec.id))}
          changeKey={planChange?.at}
          onSelectCaregiver={onSelectCaregiver}
          onOpenCaregiver={onOpenCaregiver}
          onFindCaregivers={onFindCaregiver}
          standingOf={standingOf}
        />
      )}
      {unlocked ? partsRow : lockedRow}
      <CoordinatorContact coordinator={plan.coordinator || coordinator} />
    </div>
  );

  // Down the page to the caregivers the plan recommends, not to any one of
  // them: choosing is the family's. A plan without them leads to the page that
  // has everyone.
  const toCaregivers = (e) => {
    const page = e.currentTarget.closest('[data-slot=page]');
    const list = page?.querySelector('[data-rec=caregivers]');
    if (!list) return onFindCaregiver();
    // with the group's title when they are the first thing under it, so the
    // title is never half off the top; and as far from the top as the page's
    // first thing is
    const group = list.closest('[data-slot=page-section]');
    const to = group?.querySelector('[data-rec]') === list ? group : list;
    const top =
      page.scrollTop +
      to.getBoundingClientRect().top -
      page.getBoundingClientRect().top -
      parseFloat(getComputedStyle(page).paddingTop);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    page.scrollTo({ top, behavior: still ? 'auto' : 'smooth' });
  };

  // on the way to the first visit, when nothing waits on the family: who is
  // on the move, and what comes next (docs/patterns.md §4a 1a)
  const ahead = running ? waitingOnHer(care) : null;

  const hasTerms = waiting.some((w) => w.kind === 'terms');
  const hasOrder = waiting.some((w) => w.kind === 'work-order' || w.kind === 'extra');
  const waitNote =
    !waiting.length
      ? toConfirm.length === 1
        ? t('{name} je zakazala posetu. Ako nešto ne odgovara, otvorite plan i javite.', { name: firstName(toConfirm[0].caregiver.name) })
        : t('Posete su zakazane. Ako nešto ne odgovara, otvorite plan i javite.')
      : hasTerms && hasOrder
      ? t('Uslovi moraju biti prihvaćeni pre nego što išta novo počne. Radni nalog je obrnuto - prolazi sam, osim ako vi nešto ne kažete.')
      : hasTerms
        ? t('Ništa novo ne počinje i ništa se ne naplaćuje dok ne odgovorite.')
        : t('Naplaćuje se automatski, osim ako kažete da nešto nije u redu.');

  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{t('Zdravo, {name}', { name: firstName(user?.name || care.family.name) })}</PageTitle>
          <PageDescription>
            {[care.elder.name && t('Nega · {name}', { name: care.elder.name }), care.elder.area, care.payment.connected ? t('kartica je sačuvana') : t('kartica još nije dodata')]
              .filter(Boolean)
              .join(' · ')}
          </PageDescription>
        </PageHeaderText>
        {/* Finding a caregiver is in the side menu, so the head does not say
            it again. Only a family that has asked nobody yet gets it, as the
            one step in the card below. */}
        {/* Sending the plan on (SharePlanModal) is here since the plan has no
            page of its own: the plan is this page (docs/patterns.md §4a). */}
        <PageActions>
          <AskAssistant onClick={onAskAssistant} />
          {plan && onShare && (
            <Button variant="secondary" size="icon" onClick={onShare} aria-label={t('Pošalji plan')} title={t('Pošalji plan')}>
              <Send size={14} strokeWidth={1.75} />
            </Button>
          )}
        </PageActions>
      </PageHeader>

      {/* before the plan exists there is only the way to it */}
      {fresh && !plan && (
        <Attention title={t('Sledeći korak')}>
          <Card>
            <CardDescription>
              {t('Kad završite razgovor sa Minnom, ovde će biti plan nege i negovateljice koje mu odgovaraju.')}
            </CardDescription>
            <CardFooter>
              <Button onClick={onFindCaregiver} disabled>
                <Search size={14} strokeWidth={1.75} />
                {t('Pronađi negovateljicu')}
              </Button>
            </CardFooter>
          </Card>
        </Attention>
      )}

      {/* The plan is there and nobody has been written to: the one step, said
          where every other state says who is on the move. It goes by the
          state, not by a first visit, so it stays until the first request is
          out, and "Čeka se odgovor" takes its place (docs/patterns.md §4a).
          The way down to the caregivers is a button only on a phone, where
          their rows have none and the first is two screens down; wider, they
          are right under the letter, each with its own "Pošalji poruku". */}
      {fresh && plan && (
        <Attention title={t('Sledeći korak')}>
          <Card>
            <CardDescription>
              {t('Kad budete spremni, pišite negovateljici koja vam odgovara. Upit nikoga ne obavezuje.')}
            </CardDescription>
            <CardFooter className="hidden phone:flex">
              <Button onClick={toCaregivers}>{t('Pogledaj negovateljice')}</Button>
            </CardFooter>
          </Card>
        </Attention>
      )}

      {asked && (
        <Attention title={pendingNames.length ? t('Čeka se odgovor') : t('Stigli su odgovori')}>
          <Card>
            <CardDescription>
              {pendingNames.length === 1
                ? t('{name} još nije odgovorila na vaš upit. {usual} Javićemo vam čim odgovori, a upit i odgovor su na stranici „Moji upiti".', { name: pendingNames[0], usual: t(USUAL_ANSWER) })
                : pendingNames.length > 1
                  ? t('Čeka se odgovor od {count}. {usual} Javićemo vam čim stigne, a svi upiti i odgovori su na stranici „Moji upiti".', { count: tn(pendingNames.length, 'negovateljice', 'negovateljice', 'negovateljica'), usual: t(USUAL_ANSWER) })
                  : latest.length === 1
                    ? t('{name} ne može da preuzme. Na stranici „Moji upiti" piše zašto.', { name: caregivers.find((c) => c.id === latest[0].caregiverId)?.name || t('Negovateljica') })
                    : t('Negovateljice kojima ste pisali ne mogu da preuzmu. Na stranici „Moji upiti" piše zašto.')}
            </CardDescription>
            <CardFooter>
              {/* once a request is out, finding someone is in the menu; the one
                  step here is where the requests are */}
              <Button onClick={() => onView('requests')}>
                <Send size={14} strokeWidth={1.75} />
                {t('Pogledaj upite')}
              </Button>
            </CardFooter>
          </Card>
        </Attention>
      )}

      {/* What the assistant just changed in the plan, and the way back. The
          plan has no page of its own, so this is where it is said: over the
          plan while the plan is the page, alone once someone comes
          (docs/patterns.md §4a). */}
      {plan && planChange && (
        <PlanChangeBanner
          key={planChange.at}
          change={planChange}
          marked={!agreed}
          onUndo={onUndoChange}
          onDismiss={onDismissChange}
        />
      )}


      {ahead && (
        <Attention title={ahead.title}>
          <Card>
            <CardDescription>{ahead.text}</CardDescription>
          </Card>
        </Attention>
      )}

      {(waiting.length > 0 || toConfirm.length > 0) && (
        <Attention title={t('Čeka na vas')} sub={waitNote}>
          {waiting.map((w) =>
            w.kind === 'terms' ? (
              <OpenCard
                key={`terms-${w.arrangement.caregiver.id}`}
                initials={w.arrangement.caregiver.initials}
                title={
                  activeVersion(w.arrangement)
                    ? t('{name} je poslala nove uslove', { name: firstName(w.arrangement.caregiver.name) })
                    : t('{name} je poslala ugovor o nezi', { name: firstName(w.arrangement.caregiver.name) })
                }
                body={
                  <p className={rowBody}>
                    {t('{services} po {rate} na sat.', { services: services(w.version.services.length), rate: money(w.version.rate) })}{' '}
                    {activeVersion(w.arrangement)
                      ? t('Verzija {version} važi dok ne odgovorite.', { version: activeVersion(w.arrangement).version })
                      : t('Ništa ne može da se zakaže dok ne prihvatite, a prihvatanje ništa ne naplaćuje.')}
                  </p>
                }
                action={t('Pogledaj uslove')}
                variant="default"
                onOpen={() => onDrawer({ kind: 'terms', caregiverId: w.arrangement.caregiver.id })}
              />
            ) : w.kind === 'extra' ? (
              <OpenCard
                key={`extra-${w.visit.id}`}
                initials={w.visit.caregiver.initials}
                title={t('{name} traži dodatne sate za {date}', { name: firstName(w.visit.caregiver.name), date: lowerDate(w.visit.date) })}
                body={
                  <p className={rowBody}>
                    {t('Radila je {hours} h duže nego što je rezervisano. Naplaćuje se samo ako odobrite.', { hours: w.visit.extra.hours })}
                  </p>
                }
                action={t('Pogledaj radni nalog')}
                onOpen={() => onDrawer({ kind: 'work-order', visitId: w.visit.id })}
              />
            ) : (
              <OpenCard
                key={`wo-${w.visit.id}`}
                initials={w.visit.caregiver.initials}
                title={t('{name} je poslala radni nalog za {date}', { name: firstName(w.visit.caregiver.name), date: lowerDate(w.visit.date) })}
                body={
                  <>
                    <p className={rowBody}>{t('Ako je sve bilo kako je dogovoreno, ne morate ništa - prolazi samo.')}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-small font-medium text-primary-700">
                      <Clock size={12} strokeWidth={2} />
                      {t('{amount} se naplaćuje za {hours} h', { amount: money(visitCharge(w.visit)), hours: w.visit.chargesInHours })}
                    </p>
                  </>
                }
                action={t('Pogledaj radni nalog')}
                onOpen={() => onDrawer({ kind: 'work-order', visitId: w.visit.id })}
              />
            )
          )}
          {/* A visit plan is here so that it is not missed, not to be approved:
              the visit is booked already. It is opened (which marks it seen),
              or put away with "U redu" without being opened. */}
          {toConfirm.map((v) => (
            <OpenCard
              key={`plan-${v.id}`}
              initials={v.caregiver.initials}
              title={t('{name} je poslala plan posete za {date}', { name: firstName(v.caregiver.name), date: lowerDate(v.date) })}
              body={
                <p className={rowBody}>
                  {v.time} · {v.hours} h. {t('{amount} je rezervisano, a naplaćuje se tek posle posete.', { amount: money(chargedFor(v.hours, v.rate)) })}
                </p>
              }
              action={t('Pogledaj plan')}
              variant="default"
              onOpen={() => onDrawer({ kind: 'plan', visitId: v.id })}
              aside={{
                label: t('U redu'),
                onClick: () => {
                  onCare(confirmPlan(v.id));
                  // the row leaves "Čeka na vas", so it says where the visit is now
                  onFlash?.(t('Plan posete je primljen. Poseta je u „Predstoji".'));
                },
              }}
            />
          ))}
        </Attention>
      )}

      {/* No contract agreed yet: the plan, as cards, under every banner of
          what is waited for (all banners are always at the top). */}
      {thePlan}

      {agreed && (
        // the grid follows the room the page has, not the window: with the
        // assistant open beside it the cards go one to a line
        <div className="@container flex flex-col gap-3">
          {/* three numbers, each a card: never a sum of what was paid (§8) */}
          <div className="grid grid-cols-2 gap-3 @lg:grid-cols-3">
            <StatCard
              value={done}
              label={t('{noun} do sada', { noun: tn(done, 'poseta', 'posete', 'poseta').replace(/^\d+ /, '') })}
              note={since ? t('od {date}', { date: since }) : t('još nije bilo posete')}
              onOpen={done ? () => onDrawer({ kind: 'visits' }) : null}
            />
            <StatCard
              value={next ? next.date : '-'}
              label={t('sledeća poseta')}
              note={next ? `${next.time} · ${firstName(next.caregiver.name)}` : t('nijedna nije zakazana')}
              onOpen={next ? () => onDrawer({ kind: 'plan', visitId: next.id }) : null}
            />
            <StatCard
              className="col-span-2 @lg:col-span-1"
              value={money(held)}
              label={t('rezervisano')}
              note={charging ? t('naplaćuje se sada: {amount}', { amount: money(visitCharge(charging)) }) : t('za zakazane posete')}
            />
          </div>

          {/* two to a line; a card left alone at the end takes the whole line */}
          <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2 @2xl:[&>:last-child:nth-child(odd)]:col-span-full">
            {/* The visits: what is booked, and how the last one went. A row
                is a visit, said by its day and hours, so it has no avatar;
                who came is in the line under it. */}
            <Section title={t('Predstoji')} action={allOf(coming, 'coming', t('Sve zakazane'))}>
              {coming.length > 0 ? (
                <ItemGroup>
                  {coming.slice(0, HOME_ROWS).map((v) => (
                    <Item key={v.id}>
                      <ItemContent>
                        <p className={rowTitle}>
                          <ItemLink onClick={() => onDrawer({ kind: 'plan', visitId: v.id })}>
                            {v.date} · {v.time}
                          </ItemLink>
                        </p>
                        <p className={rowBody}>
                          {v.caregiver.name} · {v.hours} h · {t('{amount} rezervisano', { amount: money(chargedFor(v.hours, v.rate)) })}
                        </p>
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>
              ) : (
                <CardDescription>{t('Nijedna poseta nije zakazana.')}</CardDescription>
              )}
            </Section>

            {/* every visit is a drawer away, so the family need not leave the home
                for them; only once one has been, like the number above: before
                that the list holds only what "Predstoji" already shows */}
            <Section
              title={t('Poslednja poseta')}
              action={
                done > 0 && (
                  <Button variant="secondary" onClick={() => onDrawer({ kind: 'visits' })}>
                    {t('Sve posete')}
                  </Button>
                )
              }
            >
              {last ? (
                <ItemGroup>
                  <Item>
                    <ItemContent>
                      <p className={rowTitle}>
                        {/* before her work order there is nothing to open */}
                        {last.report ? (
                          <ItemLink onClick={() => onDrawer({ kind: 'work-order', visitId: last.id })}>
                            {last.date} · {last.time}
                          </ItemLink>
                        ) : (
                          `${last.date} · ${last.time}`
                        )}
                      </p>
                      <p className={rowBody}>
                        {last.caregiver.name} · {last.hours} h · {amountOf(last).amount} {amountOf(last).note}
                      </p>
                      {/* how she was, and what was written; what was done is in the work order */}
                      {last.report && <VisitReport report={last.report} first={firstName(last.caregiver.name)} className="mt-2" />}
                    </ItemContent>
                  </Item>
                </ItemGroup>
              ) : (
                <CardDescription>{t('Još nije bilo posete.')}</CardDescription>
              )}
            </Section>

            {/* who cares for her: lower, as it is not what is looked at every day */}
            <Section
              title={care.arrangements.length === 1 ? t('Vaša negovateljica') : t('Vaše negovateljice')}
              action={allOf(carers, 'caregivers', t('Sve negovateljice'))}
            >
              <ItemGroup>
                {carers.slice(0, HOME_ROWS).map((a) => (
                  <ArrangementRow key={a.caregiver.id} arrangement={a} onOpen={onCaregiver} />
                ))}
              </ItemGroup>
            </Section>

            {/* what our partners offer, from the plan; a row opens the offer */}
            {plan && !unlocked ? (
              <Section title={t('Ponude partnera')}>
                <CardFooter>
                  <Button onClick={onUnlock}>{t('Otključajte ceo plan nege')}</Button>
                </CardFooter>
              </Section>
            ) : (
              offersCard
            )}
            {unlocked && adviceCard}
          </div>

          {/* What the coordinator wrote with the plan, kept now that the plan
              is no longer this page; then who to call when something is not
              right. Both the page's whole width (docs/patterns.md §4a). */}
          {letterCard}
          <CoordinatorContact coordinator={plan?.coordinator || coordinator} />
        </div>
      )}
    </Page>
  );
}
