import { ArrowRight, ChevronRight, Clock, Search, Send } from 'lucide-react';
import { caregivers } from '../data/carePlan';
import ShowMore from '../components/ShowMore';
import { useShowMore } from '@/hooks/use-show-more';
import {
  activeVersion,
  allVisits,
  chargedFor,
  dayOf,
  firstName,
  lastVersion,
  lastVisit,
  money,
  pendingVersion,
  pl,
  services,
  todayOf,
  visitCharge,
  waitingOnYou,
} from '../data/familyCare';
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
import { Item, ItemAction, ItemContent, ItemGroup, ItemLink } from '@/components/ui/item';
import { Page, PageActions, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { cn } from '@/lib/utils';
import AskAssistant from '../components/AskAssistant';
import Attention from '../components/Attention';
import Tags from '../components/Tags';
import { groupServices } from '../data/serviceCatalog';
import VisitReport from '../components/family/VisitReport';

// The family's home: what is waiting on them, what is coming, how the last visit
// went, and everyone who has cared for their mother. Each of those opens the
// thing it is about — a drawer for a decision, her page for a caregiver.
//
// Only two things are ever asked of a family, and they work in opposite
// directions: terms stop everything until they are agreed, while a work order
// goes through on its own unless someone says it was wrong. The note under
// "Waiting for you" says which, so neither reads like the other.

// A card with a title, an action beside it (a "see all"), a sentence and rows.
// Rows under a head that has a button start 8 lower (docs/patterns.md §7).
function Section({ title, sub, action, children }) {
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


// "everything of this" from a card's head: our button, as every other in a card
function SeeAll({ label, onClick }) {
  return (
    <Button variant="secondary" onClick={onClick}>
      {label}
      <ArrowRight size={14} strokeWidth={1.75} />
    </Button>
  );
}

// A row in a card (docs/patterns.md §6): the avatar as tall as the title and the
// sentence under it, 8 apart (42, 48 under a finger), the text beside it, and on the
// right whatever the row has. Everything starts on the first line.
function Row({ initials, ended, className, children }) {
  return (
    <Item
      className={cn(
        'items-start gap-3 [--avatar:calc(var(--text-xs-leading)+var(--spacing-2)+var(--text-body-leading))] phone:flex-wrap',
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

// 8 over the line under it: 4 of the column's gap and 4 of its own, so a
// badge in it does not sit on that line
const rowTitle = 'mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground';
const rowBody = 'text-xs leading-body text-muted-foreground';
const rowInline = 'flex flex-wrap items-center gap-x-2 gap-y-1';
// a badge in a row's title crosses its 16px line rather than heightening it
const titleBadge = 'my-[calc((var(--text-xs-leading)-20px)/2)]';

// A row that opens something: the title is the link and stretches over the
// row, and the button says the same thing on a wide screen; on a phone the row
// opens on a tap (docs/patterns.md §7).
function OpenRow({ initials, title, body, action, variant = 'secondary', onOpen }) {
  return (
    <Row initials={initials}>
      <ItemContent>
        <p className={rowTitle}>
          <ItemLink onClick={onOpen}>{title}</ItemLink>
        </p>
        {body}
      </ItemContent>
      <ItemAction>
        <Button variant={variant} onClick={onOpen}>
          {action}
        </Button>
      </ItemAction>
    </Row>
  );
}

// The same, as a card of its own in the tinted tray of what waits on the
// family: white like every card, its title a card's title, its avatar as tall
// as that title and the sentence under it, 8 apart (46, 52 under a finger).
function OpenCard({ initials, title, body, action, variant = 'secondary', onOpen }) {
  return (
    <Card className="flex-row items-start gap-3 [--avatar:calc(var(--text-sm-leading)+var(--spacing-2)+var(--text-body-leading))]">
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <ItemContent>
        <p className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
          <CardLink onClick={onOpen}>{title}</CardLink>
        </p>
        {body}
      </ItemContent>
      <ItemAction>
        <Button variant={variant} onClick={onOpen}>
          {action}
        </Button>
      </ItemAction>
    </Card>
  );
}

export default function Dashboard({ care, user, plan, onDrawer, onCaregiver, onView, onAskAssistant, onFindCaregiver }) {
  const elder = care.elder.name ? firstName(care.elder.name) : null;
  const waiting = waitingOnYou(care);
  // soonest first
  const coming = allVisits(care)
    .filter((v) => v.status === 'planned')
    .sort((a, b) => dayOf(a.date, todayOf(care)) - dayOf(b.date, todayOf(care)));
  // the next three, then ten more in place (docs/patterns.md §8a)
  const shownComing = useShowMore(coming, { first: 3 });
  const last = lastVisit(care);
  const quiet = care.arrangements.length > 0 && !waiting.length && !coming.length;
  // nobody asked yet: the one thing to do is ask
  const fresh = !care.arrangements.length && !care.requests.length;
  // Asked, and nobody has come yet: the requests live on "Vaši upiti", so
  // this page only says where things stand and takes them there. Once someone
  // comes, the page is about her and the requests are not repeated here.
  const asked = !care.arrangements.length && care.requests.length > 0;
  const latest = care.requests.filter((r, i, all) => all.findIndex((x) => x.caregiverId === r.caregiverId) === i);
  const pendingNames = latest
    .filter((r) => r.status === 'pending')
    .map((r) => caregivers.find((c) => c.id === r.caregiverId)?.name)
    .filter(Boolean);

  const hasTerms = waiting.some((w) => w.kind === 'terms');
  const hasOrder = waiting.some((w) => w.kind === 'work-order' || w.kind === 'extra');
  const waitNote =
    hasTerms && hasOrder
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

      {fresh && (
        <Attention title="Sledeći korak">
          <Card>
            <CardDescription>
              {plan
                ? 'Plan nege je spreman. Pošaljite upit negovateljicama koje mu odgovaraju: upit šalje plan i ništa ne košta, a možete da pitate više njih.'
                : 'Kad završite razgovor sa Minnom, ovde će biti plan nege i negovateljice koje mu odgovaraju.'}
            </CardDescription>
            <CardFooter>
              <Button onClick={onFindCaregiver} disabled={!plan}>
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
                ? `${pendingNames[0]} još nije odgovorila na vaš upit. Javićemo vam čim odgovori, a upit i odgovor su na stranici „Vaši upiti".`
                : pendingNames.length > 1
                  ? `Čeka se odgovor od ${pl(pendingNames.length, 'negovateljice', 'negovateljice', 'negovateljica')}. Javićemo vam čim stigne, a svi upiti i odgovori su na stranici „Vaši upiti".`
                  : latest.length === 1
                    ? `${caregivers.find((c) => c.id === latest[0].caregiverId)?.name || 'Negovateljica'} ne može da preuzme. Na stranici „Vaši upiti" piše zašto.`
                    : 'Negovateljice kojima ste pisali ne mogu da preuzmu. Na stranici „Vaši upiti" piše zašto.'}
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

      {/* the same notice as on her page when nothing waits and nothing is booked */}
      {quiet && (
        <Attention title="Ništa ne čeka">
          <Card>
            <p className="text-sm text-foreground">Sve je sređeno - ništa ne čeka vaš odgovor i ništa nije zakazano.</p>
          </Card>
        </Attention>
      )}

      {waiting.length > 0 && (
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
        </Attention>
      )}

      {coming.length > 0 && (
        <Section
          title="Predstoji"
          sub="Zakazane posete. Novac se unapred rezerviše, a naplaćuje tek posle posete."
        >
          <ItemGroup>
            {shownComing.visible.map((v) => (
              <OpenRow
                key={v.id}
                initials={v.caregiver.initials}
                title={`${v.date} · ${v.time}`}
                body={
                  <p className={cn(rowBody, rowInline)}>
                    {v.caregiver.name} · {v.hours} h po {money(v.rate)}/h
                    <Badge variant="tag">{money(chargedFor(v.hours, v.rate))} rezervisano</Badge>
                  </p>
                }
                action="Pogledaj plan posete"
                onOpen={() => onDrawer({ kind: 'plan', visitId: v.id })}
              />
            ))}
          </ItemGroup>
          {/* right under the rows, 16 from the last one's text, as on her page */}
          <ShowMore list={shownComing} />
        </Section>
      )}

      {last && (
        <Section
          title="Kako je prošla poslednja poseta"
          action={<SeeAll label="Sve posete" onClick={() => onView('visits')} />}
        >
          <ItemGroup>
            <Row initials={last.caregiver.initials}>
              <ItemContent>
                <p className={rowTitle}>
                  <ItemLink onClick={() => onDrawer({ kind: 'work-order', visitId: last.id })}>
                    {last.date} · {last.time}
                  </ItemLink>
                </p>
                <p className={cn(rowBody, rowInline)}>
                  {last.caregiver.name} · {last.hours} h po {money(last.rate)}/h
                  <Badge variant="tag">{money(visitCharge(last))} naplaćeno</Badge>
                </p>
                <VisitReport report={last.report} first={firstName(last.caregiver.name)} done className="mt-2" />
              </ItemContent>
              <ChevronRight size={16} strokeWidth={1.75} className="shrink-0 text-disabled phone:hidden" aria-hidden="true" />
            </Row>
          </ItemGroup>
        </Section>
      )}

      {care.arrangements.length > 0 && (
      <Section title={care.arrangements.length === 1 ? 'Vaša negovateljica' : 'Vaše negovateljice'}>
        <ItemGroup>
          {care.arrangements.map((a) => {
            const act = activeVersion(a);
            const pen = pendingVersion(a);
            const paid = a.visits.filter((v) => v.status === 'paid').length;
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
                  {/* a row says which kinds of help, not every service: the
                      agreement itself lists those on her page */}
                  {act && !ended && (
                    <Tags label="Usluge" items={groupServices(act.services).map((g) => g.title)} className="mt-2" />
                  )}
                </ItemContent>
                <span className="shrink-0 text-small text-disabled phone:hidden">Plaćenih poseta: {paid}</span>
                <ChevronRight size={16} strokeWidth={1.75} className="shrink-0 text-disabled phone:hidden" aria-hidden="true" />
              </Row>
            );
          })}
        </ItemGroup>
      </Section>
      )}
    </Page>
  );
}
