import { Clock, Search, Send } from 'lucide-react';
import { caregivers } from '../data/carePlan';
import ShowMore from '../components/ShowMore';
import { useShowMore } from '@/hooks/use-show-more';
import {
  activeVersion,
  allVisits,
  chargedFor,
  chargingVisit,
  confirmPlan,
  dayOf,
  firstName,
  heldNow,
  lastVersion,
  lastVisit,
  money,
  pendingVersion,
  pl,
  plansToConfirm,
  services,
  todayOf,
  visitCharge,
  waitingOnYou,
} from '../data/familyCare';
import { coordinator } from '../data/carePlan';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import VisitReport from '../components/family/VisitReport';
import PlanContents from '../components/PlanContents';
import { CoordinatorContact } from '../components/PlanFooterBlocks';
import { PARTNERS } from '../data/partners';

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

// A card of the overview: its title, a sentence if it needs one, and rows.
function Section({ title, sub, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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

// A row in a card of the overview (docs/patterns.md §4a): the avatar as tall
// as the title and the line under it, which sit 4 apart here, as a name and
// what goes with it do (§3); the text beside it. The row opens what it is
// about from anywhere on it and has nothing on its right: half a page wide,
// there is no room for a button, and the details have the action.
function Row({ initials, ended, className, children }) {
  return (
    <Item
      className={cn(
        'items-start gap-3 [--avatar:calc(var(--text-xs-leading)+var(--spacing-1)+var(--text-body-leading))]',
        className
      )}
    >
      <Avatar>
        <AvatarFallback className={cn(ended && 'bg-muted text-muted-foreground')}>{initials}</AvatarFallback>
      </Avatar>
      {children}
    </Item>
  );
}

const rowTitle = 'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground';
const rowBody = 'text-xs leading-body text-muted-foreground';
// a badge in a row's title crosses its 16px line rather than heightening it
const titleBadge = 'my-[calc((var(--text-xs-leading)-20px)/2)]';

// The same, as a card of its own in the tinted tray of what waits on the
// family: white like every card, its title a card's title, its avatar as tall
// as that title and the sentence under it, 8 apart (46, 52 under a finger).
// What waits needs doing, so its button stays on a phone too: under what the
// card says, in its column and as wide as it, 16 below (docs/patterns.md §7).
// `onAct`: what the button does when that is not opening the card (a plan is
// confirmed from here, and opened by its title).
function OpenCard({ initials, title, body, action, variant = 'secondary', onOpen, onAct = onOpen }) {
  return (
    <Card className="flex-row items-start gap-3 [--avatar:calc(var(--text-sm-leading)+var(--spacing-2)+var(--text-body-leading))] phone:flex-wrap">
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <ItemContent className="phone:basis-[calc(100%-var(--avatar)-var(--spacing-3))]">
        <p className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
          <CardLink onClick={onOpen}>{title}</CardLink>
        </p>
        {body}
      </ItemContent>
      <div className="flex shrink-0 phone:mt-1 phone:ml-[calc(var(--avatar)+var(--spacing-3))] phone:w-[calc(100%-var(--avatar)-var(--spacing-3))] phone:*:flex-auto">
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
  planChange,
  onDrawer,
  onCaregiver,
  onView,
  onAskAssistant,
  onFindCaregiver,
  onCare,
  onFlash,
  onSelectCaregiver,
  onOpenCaregiver,
  onUnlock,
  standingOf,
  onOpenPlan,
}) {
  const waiting = waitingOnYou(care);
  // a plan just sent waits at the top for a yes; confirmed, it is one of the
  // visits that are coming
  const toConfirm = plansToConfirm(care);
  // soonest first
  const coming = allVisits(care)
    .filter((v) => v.status === 'planned' && v.planOk)
    .sort((a, b) => dayOf(a.date, todayOf(care)) - dayOf(b.date, todayOf(care)));
  // the next three, then ten more in place (docs/patterns.md §8a)
  const shownComing = useShowMore(coming, { first: 3 });
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
  const done = allVisits(care).filter((v) => v.status === 'paid').length;
  const next = coming[0];
  const since = care.arrangements.map((a) => a.since).find(Boolean);
  const held = heldNow(care);
  const charging = chargingVisit(care);
  // what the plan offers through partners, beside the caregivers
  const offers = (plan?.recommendations || []).filter((r) => r.kind === 'offer');
  const more = (plan?.recommendations || []).filter((r) => r.locked).length;
  // the plan as the page's content, while nobody comes yet
  const thePlan = plan && !running && (
    <PlanContents
      plan={plan}
      unlocked={unlocked}
      change={planChange}
      onSelectCaregiver={onSelectCaregiver}
      onOpenCaregiver={onOpenCaregiver}
      onUnlock={onUnlock}
      onFindCaregivers={onFindCaregiver}
      standingOf={standingOf}
    />
  );

  const hasTerms = waiting.some((w) => w.kind === 'terms');
  const hasOrder = waiting.some((w) => w.kind === 'work-order' || w.kind === 'extra');
  const waitNote =
    !waiting.length
      ? 'Potvrdite plan posete ako vam termin odgovara. Ako ne, otvorite plan i javite šta nije u redu.'
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

      {asked && (
        <Attention title={pendingNames.length ? 'Čeka se odgovor' : 'Stigli su odgovori'}>
          <Card>
            <CardDescription>
              {pendingNames.length === 1
                ? `${pendingNames[0]} još nije odgovorila na vaš upit. Javićemo vam čim odgovori, a upit i odgovor su na stranici „Moji upiti".`
                : pendingNames.length > 1
                  ? `Čeka se odgovor od ${pl(pendingNames.length, 'negovateljice', 'negovateljice', 'negovateljica')}. Javićemo vam čim stigne, a svi upiti i odgovori su na stranici „Moji upiti".`
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
          {/* a visit plan: its title opens it, the button says yes to it */}
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
              action="Potvrdi plan"
              variant="default"
              onOpen={() => onDrawer({ kind: 'plan', visitId: v.id })}
              onAct={() => {
                onCare(confirmPlan(v.id));
                onFlash('Plan posete je potvrđen.');
              }}
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
              onOpen={done ? () => onView('visits') : null}
            />
            <StatCard
              value={next ? next.date : '-'}
              label="sledeća poseta"
              note={next ? `${next.time} · ${firstName(next.caregiver.name)}` : toConfirm.length ? 'plan čeka vašu potvrdu' : 'nijedna nije zakazana'}
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
            <Section title="Predstoji">
              {coming.length > 0 ? (
                <>
                  <ItemGroup>
                    {shownComing.visible.map((v) => (
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
                  <ShowMore list={shownComing} />
                </>
              ) : (
                <CardDescription>
                  {toConfirm.length ? 'Plan posete čeka vašu potvrdu, gore.' : 'Nijedna poseta nije zakazana.'}
                </CardDescription>
              )}
            </Section>

            <Section title="Poslednja poseta">
              {last ? (
                <ItemGroup>
                  <Item>
                    <ItemContent>
                      <p className={rowTitle}>
                        <ItemLink onClick={() => onDrawer({ kind: 'work-order', visitId: last.id })}>
                          {last.date} · {last.time}
                        </ItemLink>
                      </p>
                      <p className={rowBody}>
                        {last.caregiver.name} · {last.hours} h · {money(visitCharge(last))} naplaćeno
                      </p>
                      {/* how she was, and what was written; what was done is in the work order */}
                      <VisitReport report={last.report} first={firstName(last.caregiver.name)} className="mt-2" />
                    </ItemContent>
                  </Item>
                </ItemGroup>
              ) : (
                <CardDescription>Još nije bilo posete.</CardDescription>
              )}
            </Section>

            {/* who cares for her: lower, as it is not what is looked at every day */}
            <Section title={care.arrangements.length === 1 ? 'Vaša negovateljica' : 'Vaše negovateljice'}>
              <ItemGroup>
                {care.arrangements.map((a) => {
                  const act = activeVersion(a);
                  const pen = pendingVersion(a);
                  const ended = Boolean(a.endedOn);
                  return (
                    <Row key={a.caregiver.id} initials={a.caregiver.initials} ended={ended}>
                      <ItemContent>
                        <p className={cn(rowTitle, ended && 'text-muted-foreground')}>
                          <ItemLink onClick={() => onCaregiver(a.caregiver.id)}>{a.caregiver.name}</ItemLink>
                          {pen && (
                            <Badge variant="warning" className={titleBadge}>
                              {act ? 'Novi uslovi' : 'Ugovor čeka'}
                            </Badge>
                          )}
                          {!pen && !act && !ended && lastVersion(a)?.status === 'declined' && (
                            <Badge variant="destructive" className={titleBadge}>
                              Uslovi odbijeni
                            </Badge>
                          )}
                        </p>
                        <p className={rowBody}>
                          {ended
                            ? `Završeno ${a.endedOn}`
                            : a.since
                              ? `${a.caregiver.area} · od ${a.since}${act ? ` · ${money(act.rate)}/h` : ''}`
                              : pen
                                ? `${a.caregiver.area} · čeka da prihvatite ugovor`
                                : a.versions.length
                                  ? `${a.caregiver.area} · ništa još ne važi`
                                  : `${a.caregiver.area} · prihvatila, ugovor stiže uskoro`}
                        </p>
                      </ItemContent>
                    </Row>
                  );
                })}
              </ItemGroup>
            </Section>

            {/* What our partners offer, from the plan: the partner first (its
                logo, or its name where it has none) with what it costs less
                through Minna beside it, and under them what it is for. A row
                opens the plan, which has the prices and the way to book. */}
            {plan && (
              <Section title="Ponude partnera">
                {unlocked ? (
                  <ItemGroup>
                    {offers.map((rec) => {
                      const partner = PARTNERS[rec.partner];
                      return (
                        <Item key={rec.id}>
                          <ItemContent className="gap-2">
                            <div className="flex items-center justify-between gap-3">
                              {partner.logo ? (
                                <img className="block h-5 w-auto rounded-sm" src={partner.logo} alt={partner.name} />
                              ) : (
                                <span className="text-sm leading-5 font-medium text-foreground">{partner.name}</span>
                              )}
                              <Badge variant="success">−{partner.discount}% preko Minne</Badge>
                            </div>
                            <p className={rowTitle}>
                              <ItemLink onClick={onOpenPlan}>{rec.title}</ItemLink>
                            </p>
                          </ItemContent>
                        </Item>
                      );
                    })}
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
