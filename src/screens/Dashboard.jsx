import { Clock, Search, Send } from 'lucide-react';
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
  money,
  pl,
  plansToConfirm,
  services,
  visitCharge,
  waitingOnYou,
} from '../data/familyCare';
import { coordinator } from '../data/carePlan';
import { USUAL_ANSWER, waitingOnHer } from '../data/firstSteps';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import PlanContents from '../components/PlanContents';
import { CoordinatorContact } from '../components/PlanFooterBlocks';

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
  onOpenPlan,
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
  const more = (plan?.recommendations || []).filter((r) => r.locked).length;
  // the plan as the page's content, while nobody comes yet
  const thePlan = plan && !running && (
    <PlanContents
      plan={plan}
      unlocked={unlocked}
      askNote={askNote}
      change={planChange}
      onSelectCaregiver={onSelectCaregiver}
      onOpenCaregiver={onOpenCaregiver}
      onUnlock={onUnlock}
      onFindCaregivers={onFindCaregiver}
      standingOf={standingOf}
    />
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
        ? `${firstName(toConfirm[0].caregiver.name)} je zakazala posetu. Ako nešto ne odgovara, otvorite plan i javite.`
        : 'Posete su zakazane. Ako nešto ne odgovara, otvorite plan i javite.'
      : hasTerms && hasOrder
      ? 'Uslovi moraju biti prihvaćeni pre nego što išta novo počne. Radni nalog je obrnuto - prolazi sam, osim ako vi nešto ne kažete.'
      : hasTerms
        ? 'Ništa novo ne počinje i ništa se ne naplaćuje dok ne odgovorite.'
        : 'Naplaćuje se automatski, osim ako kažete da nešto nije u redu.';

  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Zdravo, {firstName(user?.name || care.family.name)}</PageTitle>
          <PageDescription>
            {[care.elder.name && `Nega · ${care.elder.name}`, care.elder.area, care.payment.connected ? 'kartica je sačuvana' : 'kartica još nije dodata']
              .filter(Boolean)
              .join(' · ')}
          </PageDescription>
        </PageHeaderText>
        {/* Finding a caregiver is in the side menu, so the head does not say
            it again. Only a family that has asked nobody yet gets it, as the
            one step in the card below. */}
        <PageActions>
          <AskAssistant onClick={onAskAssistant} />
        </PageActions>
      </PageHeader>

      {/* before the plan exists there is only the way to it */}
      {fresh && !plan && (
        <Attention title="Sledeći korak">
          <Card>
            <CardDescription>
              Kad završite razgovor sa Minnom, ovde će biti plan nege i negovateljice koje mu odgovaraju.
            </CardDescription>
            <CardFooter>
              <Button onClick={onFindCaregiver} disabled>
                <Search size={14} strokeWidth={1.75} />
                Pronađi negovateljicu
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
        <Attention title="Sledeći korak">
          <Card>
            <CardDescription>
              Kad budete spremni, pišite negovateljici koja vam odgovara. Upit nikoga ne obavezuje.
            </CardDescription>
            <CardFooter className="hidden phone:flex">
              <Button onClick={toCaregivers}>Pogledaj negovateljice</Button>
            </CardFooter>
          </Card>
        </Attention>
      )}

      {asked && (
        <Attention title={pendingNames.length ? 'Čeka se odgovor' : 'Stigli su odgovori'}>
          <Card>
            <CardDescription>
              {pendingNames.length === 1
                ? `${pendingNames[0]} još nije odgovorila na vaš upit. ${USUAL_ANSWER} Javićemo vam čim odgovori, a upit i odgovor su na stranici „Moji upiti".`
                : pendingNames.length > 1
                  ? `Čeka se odgovor od ${pl(pendingNames.length, 'negovateljice', 'negovateljice', 'negovateljica')}. ${USUAL_ANSWER} Javićemo vam čim stigne, a svi upiti i odgovori su na stranici „Moji upiti".`
                  : latest.length === 1
                    ? `${caregivers.find((c) => c.id === latest[0].caregiverId)?.name || 'Negovateljica'} ne može da preuzme. Na stranici „Moji upiti" piše zašto.`
                    : 'Negovateljice kojima ste pisali ne mogu da preuzmu. Na stranici „Moji upiti" piše zašto.'}
            </CardDescription>
            <CardFooter>
              {/* once a request is out, finding someone is in the menu; the one
                  step here is where the requests are */}
              <Button onClick={() => onView('requests')}>
                <Send size={14} strokeWidth={1.75} />
                Pogledaj upite
              </Button>
            </CardFooter>
          </Card>
        </Attention>
      )}

      {/* nobody comes yet: the plan itself, with its next step in it */}
      {thePlan}

      {ahead && (
        <Attention title={ahead.title}>
          <Card>
            <CardDescription>{ahead.text}</CardDescription>
          </Card>
        </Attention>
      )}

      {(waiting.length > 0 || toConfirm.length > 0) && (
        <Attention title="Čeka na vas" sub={waitNote}>
          {waiting.map((w) =>
            w.kind === 'terms' ? (
              <OpenCard
                key={`terms-${w.arrangement.caregiver.id}`}
                initials={w.arrangement.caregiver.initials}
                title={`${firstName(w.arrangement.caregiver.name)} je poslala ${activeVersion(w.arrangement) ? 'nove uslove' : 'ugovor o nezi'}`}
                body={
                  <p className={rowBody}>
                    {services(w.version.services.length)} po {money(w.version.rate)} na sat.{' '}
                    {activeVersion(w.arrangement)
                      ? `Verzija ${activeVersion(w.arrangement).version} važi dok ne odgovorite.`
                      : 'Ništa ne može da se zakaže dok ne prihvatite, a prihvatanje ništa ne naplaćuje.'}
                  </p>
                }
                action="Pogledaj uslove"
                variant="default"
                onOpen={() => onDrawer({ kind: 'terms', caregiverId: w.arrangement.caregiver.id })}
              />
            ) : w.kind === 'extra' ? (
              <OpenCard
                key={`extra-${w.visit.id}`}
                initials={w.visit.caregiver.initials}
                title={`${firstName(w.visit.caregiver.name)} traži dodatne sate za ${w.visit.date.toLowerCase()}`}
                body={
                  <p className={rowBody}>
                    Radila je {w.visit.extra.hours} h duže nego što je rezervisano. Naplaćuje se samo ako odobrite.
                  </p>
                }
                action="Pogledaj radni nalog"
                onOpen={() => onDrawer({ kind: 'work-order', visitId: w.visit.id })}
              />
            ) : (
              <OpenCard
                key={`wo-${w.visit.id}`}
                initials={w.visit.caregiver.initials}
                title={`${firstName(w.visit.caregiver.name)} je poslala radni nalog za ${w.visit.date.toLowerCase()}`}
                body={
                  <>
                    <p className={rowBody}>Ako je sve bilo kako je dogovoreno, ne morate ništa - prolazi samo.</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-small font-medium text-primary-700">
                      <Clock size={12} strokeWidth={2} />
                      {money(visitCharge(w.visit))} se naplaćuje za {w.visit.chargesInHours} h
                    </p>
                  </>
                }
                action="Pogledaj radni nalog"
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
              title={`${firstName(v.caregiver.name)} je poslala plan posete za ${v.date.toLowerCase()}`}
              body={
                <p className={rowBody}>
                  {v.time} · {v.hours} h. {money(chargedFor(v.hours, v.rate))} je rezervisano, a naplaćuje se tek posle posete.
                </p>
              }
              action="Pogledaj plan"
              variant="default"
              onOpen={() => onDrawer({ kind: 'plan', visitId: v.id })}
              aside={{ label: 'U redu', onClick: () => onCare(confirmPlan(v.id)) }}
            />
          ))}
        </Attention>
      )}

      {running && (
        // the grid follows the room the page has, not the window: with the
        // assistant open beside it the cards go one to a line
        <div className="@container flex flex-col gap-3">
          {/* three numbers, each a card: never a sum of what was paid (§8) */}
          <div className="grid grid-cols-2 gap-3 @lg:grid-cols-3">
            <StatCard
              value={done}
              label={`${pl(done, 'poseta', 'posete', 'poseta').replace(/^\d+ /, '')} do sada`}
              note={since ? `od ${since}` : 'još nije bilo posete'}
              onOpen={done ? () => onDrawer({ kind: 'visits' }) : null}
            />
            <StatCard
              value={next ? next.date : '-'}
              label="sledeća poseta"
              note={next ? `${next.time} · ${firstName(next.caregiver.name)}` : 'nijedna nije zakazana'}
              onOpen={next ? () => onDrawer({ kind: 'plan', visitId: next.id }) : null}
            />
            <StatCard
              className="col-span-2 @lg:col-span-1"
              value={money(held)}
              label="rezervisano"
              note={charging ? `naplaćuje se sada: ${money(visitCharge(charging))}` : 'za zakazane posete'}
            />
          </div>

          {/* two to a line; a card left alone at the end takes the whole line */}
          <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2 @2xl:[&>:last-child:nth-child(odd)]:col-span-full">
            {/* The visits: what is booked, and how the last one went. A row
                is a visit, said by its day and hours, so it has no avatar;
                who came is in the line under it. */}
            <Section title="Predstoji" action={allOf(coming, 'coming', 'Sve zakazane')}>
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
                          {v.caregiver.name} · {v.hours} h · {money(chargedFor(v.hours, v.rate))} rezervisano
                        </p>
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>
              ) : (
                <CardDescription>Nijedna poseta nije zakazana.</CardDescription>
              )}
            </Section>

            {/* every visit is a drawer away, so the family need not leave the home
                for them; only once one has been, like the number above: before
                that the list holds only what "Predstoji" already shows */}
            <Section
              title="Poslednja poseta"
              action={
                done > 0 && (
                  <Button variant="secondary" onClick={() => onDrawer({ kind: 'visits' })}>
                    Sve posete
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
                <CardDescription>Još nije bilo posete.</CardDescription>
              )}
            </Section>

            {/* who cares for her: lower, as it is not what is looked at every day */}
            <Section
              title={care.arrangements.length === 1 ? 'Vaša negovateljica' : 'Vaše negovateljice'}
              action={allOf(carers, 'caregivers', 'Sve negovateljice')}
            >
              <ItemGroup>
                {carers.slice(0, HOME_ROWS).map((a) => (
                  <ArrangementRow key={a.caregiver.id} arrangement={a} onOpen={onCaregiver} />
                ))}
              </ItemGroup>
            </Section>

            {/* what our partners offer, from the plan; a row opens the plan */}
            {plan && (
              <Section title="Ponude partnera" action={unlocked && allOf(offers, 'offers', 'Sve ponude')}>
                {unlocked ? (
                  <ItemGroup>
                    {offers.slice(0, HOME_ROWS).map((rec) => (
                      <OfferRow key={rec.id} rec={rec} onOpen={onOpenPlan} />
                    ))}
                  </ItemGroup>
                ) : (
                  <CardFooter>
                    <Button onClick={onUnlock}>Otključajte ceo plan nege</Button>
                  </CardFooter>
                )}
                {/* what these are, last in the card and pushed to its foot */}
                <p className="mt-auto pt-2 text-small text-muted-foreground">
                  Pregledi i pomagala iz plana nege, jeftinije kad ih zakaže Minna.
                </p>
              </Section>
            )}

            {/* who to call when something is not right */}
            <CoordinatorContact coordinator={plan?.coordinator || coordinator} />
          </div>
        </div>
      )}
    </Page>
  );
}
