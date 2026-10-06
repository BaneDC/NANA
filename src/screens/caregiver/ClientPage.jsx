import { useState } from 'react';

import {
  AlertTriangle,
  CalendarCheck,
  CalendarPlus,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  FileCheck2,
  FilePen,
  FileText,
  Inbox,
  Meh,
  MessageSquare,
  Phone,
  Send,
  Smile,
  StickyNote,
  Frown,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Item, ItemGroup } from '@/components/ui/item';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataList, DataRow } from '@/components/data-list';
import { Concern, PaneHint, PaneLabel } from '@/components/pane';
import { Page, PageDescription, PageHeader, PageHeaderText, PagePerson, PageTitle } from '@/components/page';
import { useKept } from '@/hooks/use-kept';
import { useShowMore } from '@/hooks/use-show-more';
import { cn } from '@/lib/utils';
import Dialog from '../../components/Dialog';
import BackButton from '../../components/BackButton';
import ShowMore from '../../components/ShowMore';
import Tags from '../../components/Tags';
import AgreementForm from '../../components/caregiver/AgreementForm';
import VisitPlanForm from '../../components/caregiver/VisitPlanForm';
import WorkOrderForm from '../../components/caregiver/WorkOrderForm';
import {
  agreementState,
  awaitingFor,
  dueVisit,
  heldFor,
  frailtyLabel,
  money,
  serviceShort,
  serviceTitle,
  totalsFor,
} from '../../data/caregiverBoard';

// Everything the caregiver knows about one family, on one page: the terms she
// works under, the visits those terms have produced, and the story of the
// relationship around both. The three answer different questions — what is
// agreed, what was done and what was paid, and what has passed between us —
// which is why they are three sections and not one feed.
//
// The page reads; it does not ask. Setting the agreement and filling in a work
// order are forms, and forms live in a dialog — left open on the page they made
// it look like something was unfinished every time it was opened, and buried
// the overview under an empty form.

const MOOD = {
  low: { icon: Frown, label: 'Loše' },
  usual: { icon: Meh, label: 'Kao i obično' },
  good: { icon: Smile, label: 'Dobro' },
};

const ACTIVITY_ICON = {
  request: Inbox,
  accepted: Check,
  'agreement-sent': FileText,
  'agreement-signed': FileCheck2,
  'agreement-changed': FilePen,
  'visit-planned': CalendarPlus,
  visit: CalendarCheck,
  'work-order': Send,
  note: StickyNote,
  message: MessageSquare,
};

// a card's buttons, right (as in a dialog), and on a phone too
function CardActionsEnd({ children }) {
  return <CardFooter className="justify-end phone:flex-nowrap phone:*:flex-none">{children}</CardFooter>;
}

function Section({ title, badge, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {badge && <CardAction>{badge}</CardAction>}
      </CardHeader>
      {children}
    </Card>
  );
}

function AgreedTerms({ client }) {
  return (
    <>
      <PaneLabel>Usluge iz ovog ugovora</PaneLabel>
      <Tags items={client.services.map(serviceTitle)} />
      <DataList className="mt-2">
        <DataRow label="Cena po satu">{money(client.rate)} / h</DataRow>
        <DataRow label="Dogovoreni sati">{client.hours} h nedeljno</DataRow>
        <DataRow label="Raspored">{client.schedule}</DataRow>
      </DataList>
    </>
  );
}

const AMOUNT_WORD = { less: 'manje nego obično', usual: 'kao i obično', more: 'više nego obično' };

function Visits({ client }) {
  // The visit still waiting on its work order is not in here — it is the form
  // above, and listing it twice would say a visit is both done and outstanding.
  const visits = (client.visits || []).filter((v) => v.status !== 'due');
  const settled = visits.filter((v) => v.status === 'paid');
  // a section of the page, so ten at a time (docs/patterns.md §8a)
  const list = useShowMore(visits, 10);
  if (!visits.length) {
    return (
      <p className="rounded-2xl border border-dashed px-3 py-4 text-center text-xs leading-body text-disabled">
        Još nema izmirenih poseta. Počinju kad porodica potpiše ugovor.
      </p>
    );
  }

  const hours = settled.reduce((n, v) => n + v.hours, 0);
  const earned = settled.reduce((n, v) => n + totalsFor(v.hours, client.rate).net, 0);
  const pending = awaitingFor(client);

  return (
    <>
      <PaneHint>
        Plaćeno: {settled.length} · {hours} h · {money(earned)} vama
        {pending > 0 && ` · ${money(pending)} u obradi`}
      </PaneHint>
      {/* each visit a row (docs/patterns.md §6): what she wrote, and what it paid */}
      <ItemGroup>
        {list.visible.map((v, i) => {
          const Mood = MOOD[v.mood]?.icon;
          const totals = totalsFor(v.hours, client.rate);
          return (
            <Item key={`${v.date}-${i}`} role="listitem" className="flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 text-xs font-medium text-foreground">
                  {v.date} · {v.time}
                </p>
                {v.status === 'awaiting' ? (
                  <Badge variant="warning">
                    <Clock size={12} strokeWidth={2} />
                    Naplata za {v.confirmsInHours} h
                  </Badge>
                ) : (
                  <Badge variant="success">Plaćeno</Badge>
                )}
              </div>
              <p className="text-xs leading-body text-muted-foreground">{v.note}</p>
              {v.services?.length > 0 && (
                <p className="text-[11px] leading-4 text-disabled">{v.services.map(serviceShort).join(' · ')}</p>
              )}
              {v.concern && (
                <Concern>
                  <AlertTriangle size={12} strokeWidth={2} />
                  {v.concern}
                </Concern>
              )}
              <div className="flex items-center gap-3 text-[11px] leading-4 text-disabled">
                {Mood && (
                  <span className="inline-flex items-center gap-1">
                    <Mood size={13} strokeWidth={1.75} />
                    {MOOD[v.mood].label}
                  </span>
                )}
                {v.eating && <span className="inline-flex items-center gap-1">ishrana: {AMOUNT_WORD[v.eating]}</span>}
                {v.moving && <span className="inline-flex items-center gap-1">kretanje: {AMOUNT_WORD[v.moving]}</span>}
                <span className="ml-auto">
                  {v.hours} h · {money(totals.net)}
                </span>
              </div>
            </Item>
          );
        })}
      </ItemGroup>
      <ShowMore list={list} />
    </>
  );
}

function Activity({ client }) {
  // Newest first: the last thing that happened is the thing she is trying to
  // remember when she opens this.
  const entries = [...(client.activity || [])].reverse();
  const list = useShowMore(entries, 10);
  return (
    <>
      {/* a line down the left joins the dots, and stops at the last one */}
      <ol className="flex list-none flex-col">
        {list.visible.map((e, i) => {
          const Icon = ACTIVITY_ICON[e.kind] || StickyNote;
          return (
            <li
              key={i}
              className="relative flex gap-3 pb-3 before:absolute before:top-7 before:bottom-0 before:left-3 before:w-px before:bg-border last:pb-0 last:before:hidden"
            >
              <span className="relative z-1 flex size-[25px] shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon size={13} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-xs leading-body text-foreground">{e.text}</p>
                <p className="text-[11px] leading-4 text-disabled">{e.when}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <ShowMore list={list} className="mt-2" />
    </>
  );
}

export default function ClientPage({
  client,
  onBack,
  onSendAgreement,
  onRemind,
  onPlanVisit,
  onVisitDone,
  onSendWorkOrder,
}) {
  const state = agreementState(client);
  const due = dueVisit(client);
  const [modal, setModal] = useState(null); // null | 'agreement' | 'plan' | 'work-order'
  // kept while the dialog closes, so it closes on the form it showed
  const shownModal = useKept(modal);
  const [termsOpen, setTermsOpen] = useState(false);

  // What the row says without being opened. Enough to know the terms are the
  // ones you remember; the pills and the pattern are behind the chevron.
  //
  // A switch, not a lookup object: every branch of an object literal is built
  // before one is picked, so the two that read `client.services` ran for a
  // family that has no agreement yet and took the page down with them.
  const summary = (() => {
    switch (state) {
      case 'none':
        return `Traženo: ${client.hours} h nedeljno · ${client.schedule}`;
      case 'draft':
        return `Još nije postavljen - traženo ${client.hours} h nedeljno`;
      case 'sent':
        return `Usluga: ${client.services.length} · ${money(client.rate)}/h · poslato ${client.sentOn}`;
      default:
        return `Usluga: ${client.services.length} · ${money(client.rate)}/h · ${client.hours} h nedeljno`;
    }
  })();

  const badge = {
    none: <Badge variant="secondary">Nije prihvaćeno</Badge>,
    draft: <Badge variant="warning">Nacrt</Badge>,
    sent: (
      <Badge variant="warning">
        <Clock size={12} strokeWidth={2} />
        Čeka potpis
      </Badge>
    ),
    active: (
      <Badge variant="success">
        <Check size={12} strokeWidth={2} />
        Aktivno od {client.since}
      </Badge>
    ),
  }[state];

  return (
    // the page comes up from a little below
    <Page className="animate-in fade-in-0 slide-in-from-bottom-2 duration-250 ease-out">
      <BackButton label="Tabla" onClick={onBack} />

      <PageHeader className="mb-0">
        <PagePerson className="flex-initial">
          <Avatar>
            <AvatarFallback>{client.initials}</AvatarFallback>
          </Avatar>
          <PageHeaderText className="flex-initial">
            <PageTitle>{client.elder}</PageTitle>
            <PageDescription>
              {client.age} · {client.area} · {client.distance} · krhkost {client.frailty},{' '}
              {frailtyLabel(client.frailty)}
            </PageDescription>
          </PageHeaderText>
        </PagePerson>
      </PageHeader>

      <DataList className="rounded-2xl bg-muted px-4 py-3">
        <DataRow label="Kontakt porodice">
          {client.family} · {client.relation}
        </DataRow>
        <DataRow
          label={
            <span className="inline-flex items-center gap-1">
              <Phone size={12} strokeWidth={1.75} /> Telefon
            </span>
          }
        >
          {client.phone}
        </DataRow>
      </DataList>

      {/* An outstanding work order goes first: it is the only thing on this
          page with a deadline. The agreement below it changes once. */}
      {due && (
        <Section
          title="Radni nalog čeka"
          badge={
            <Badge variant="warning">
              <AlertTriangle size={12} strokeWidth={2} />
              Nije poslato
            </Badge>
          }
        >
          <CardDescription>
            {due.date} · {due.time} - {due.hours} h po dogovorenih {money(client.rate)}/h, završeno{' '}
            {client.sinceVisit}. Slanjem počinje 24 sata za porodicu: ili potvrde, ili se naplata izvrši
            sama kad rok istekne.
          </CardDescription>
          <DataList className="mt-2">
            <DataRow label="Ako se pošalje kako je rađeno">{money(totalsFor(due.hours, client.rate).net)} vama</DataRow>
          </DataList>
          <CardActionsEnd>
            <Button onClick={() => setModal('work-order')}>
              <FileText size={14} strokeWidth={1.75} />
              Popuni radni nalog
            </Button>
          </CardActionsEnd>
        </Section>
      )}

      {/* The visit order: written before going, and the thing the work order is
          later filled in against. Only an active arrangement can have one. */}
      {state === 'active' && !due && (
        <Section
          title="Sledeća poseta"
          badge={
            client.plan ? (
              <Badge variant="success">
                <Check size={12} strokeWidth={2} />
                {money(heldFor(client))} rezervisano
              </Badge>
            ) : null
          }
        >
          {client.plan ? (
            <>
              <CardDescription>
                {client.plan.date} · {client.plan.time} - {client.plan.hours} h po{' '}
                {money(client.rate)}/h. Poslato porodici {client.plan.sentOn};{' '}
                {money(heldFor(client))} je rezervisano na njihovoj kartici, a{' '}
                {money(totalsFor(client.plan.hours, client.rate).net)} od toga stiže vama ako poseta
                prođe po planu.
              </CardDescription>
              <PaneLabel>Planirano</PaneLabel>
              <Tags items={client.plan.services.map(serviceTitle)} />
              {client.plan.notes && <p className="text-xs leading-body text-muted-foreground">{client.plan.notes}</p>}
              <CardActionsEnd>
                <Button variant="secondary" onClick={() => setModal('plan')}>
                  Promeni plan
                </Button>
                <Button onClick={() => onVisitDone(client.id)}>
                  <CheckCheck size={14} strokeWidth={1.75} />
                  Poseta obavljena
                </Button>
              </CardActionsEnd>
            </>
          ) : (
            <>
              <CardDescription>
                Još ništa nije planirano. Plan posete kaže zašto dolazite, a kad ga pošaljete porodici,
                novac se rezerviše pre nego što krenete - pa radni nalog posle samo potvrđuje ono što je
                već pokriveno.
              </CardDescription>
              <CardActionsEnd>
                <Button onClick={() => setModal('plan')}>
                  <CalendarPlus size={14} strokeWidth={1.75} />
                  Isplaniraj posetu
                </Button>
              </CardActionsEnd>
            </>
          )}
        </Section>
      )}

      {/* Terms that are set once and then read occasionally. A row, with the
          detail a click away — as a full panel it pushed the visits and the
          history, the things that actually change, below the fold. A compact
          card: 12 by 16 inside. */}
      <Collapsible open={termsOpen} onOpenChange={setTermsOpen} asChild>
        <Card className="gap-0 px-4 py-3">
          <div className="flex items-center gap-3">
            <CollapsibleTrigger className="group/terms flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 text-left [font:inherit]">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground group-hover/terms:text-primary-600">
                Ugovor o nezi
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className={cn('transition-transform duration-200', !termsOpen && 'rotate-180')}
                />
              </span>
              <span className="text-[11px] leading-4 text-disabled">{summary}</span>
            </CollapsibleTrigger>
            {badge}
            {state === 'draft' && (
              <Button onClick={() => setModal('agreement')}>
                <FileText size={14} strokeWidth={1.75} />
                Postavi ugovor
              </Button>
            )}
            {state === 'sent' && (
              <Button variant="secondary" onClick={() => onRemind(client.id)}>
                <Send size={14} strokeWidth={1.75} />
                Pošalji podsetnik
              </Button>
            )}
          </div>

          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="flex flex-col gap-2 pt-3">
              {state === 'none' || state === 'draft' ? (
                <>
                  <PaneLabel>Šta je porodica tražila</PaneLabel>
                  <Tags items={client.needs.map(serviceTitle)} />
                  <DataList className="mt-2">
                    <DataRow label="Sati">{client.hours} h nedeljno</DataRow>
                    <DataRow label="Raspored">{client.schedule}</DataRow>
                  </DataList>
                </>
              ) : (
                <AgreedTerms client={client} />
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Section title="Posete">
        <Visits client={client} />
      </Section>

      <Section title="Aktivnost">
        <Activity client={client} />
      </Section>

      {/* The forms, each in a dialog, kept while it closes (useKept). */}
      {shownModal === 'agreement' && (
        <Dialog eyebrow={client.elder} title="Ugovor o nezi" wide open={modal === 'agreement'} onClose={() => setModal(null)}>
          <AgreementForm
            client={client}
            onSend={(id, terms) => {
              setModal(null);
              onSendAgreement(id, terms);
            }}
            onCancel={() => setModal(null)}
          />
        </Dialog>
      )}

      {shownModal === 'plan' && (
        <Dialog
          eyebrow={client.elder}
          title={client.plan ? 'Promeni posetu' : 'Isplaniraj posetu'}
          wide
          open={modal === 'plan'}
          onClose={() => setModal(null)}
        >
          <VisitPlanForm
            client={client}
            plan={client.plan}
            onSave={(id, plan) => {
              setModal(null);
              onPlanVisit(id, plan);
            }}
            onCancel={() => setModal(null)}
          />
        </Dialog>
      )}

      {shownModal === 'work-order' && due && (
        <Dialog eyebrow={client.elder} title="Radni nalog" wide open={modal === 'work-order'} onClose={() => setModal(null)}>
          <WorkOrderForm
            client={client}
            visit={due}
            onSend={(id, report) => {
              setModal(null);
              onSendWorkOrder(id, report);
            }}
            onCancel={() => setModal(null)}
          />
        </Dialog>
      )}
    </Page>
  );
}
