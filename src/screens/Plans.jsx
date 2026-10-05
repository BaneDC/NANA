import { ArrowUpRight, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardLink } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty';
import { Page, PageActions, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import AskAssistant from '../components/AskAssistant';

export default function Plans({ entries, change, onOpenPlan, onGoToChat, onNewPlan, onAskAssistant }) {
  const hasLive = entries.some((e) => !e.archived);

  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Planovi nege</PageTitle>
          <PageDescription>Svaki plan koji smo napravili, od najnovijeg.</PageDescription>
        </PageHeaderText>
        <PageActions>
          <AskAssistant iconOnly onClick={onAskAssistant} />
          {/* One plan is one person. A second parent, a partner's mother: that is
              a new plan, not an edit of this one. */}
          {onNewPlan && (
            <Button onClick={onNewPlan}>
              <Plus size={14} strokeWidth={2} />
              Novi plan
            </Button>
          )}
        </PageActions>
      </PageHeader>

      {!hasLive && (
        <Empty>
          <EmptyTitle>Nema aktivnog plana</EmptyTitle>
          <EmptyDescription>Odgovorite na pitanja u razgovoru i novi plan će se pojaviti ovde.</EmptyDescription>
          <Button onClick={onGoToChat}>Idi na razgovor</Button>
        </Empty>
      )}

      <div className="flex flex-col gap-3">
        {/* The whole card opens the plan, as every card that opens something
            does (docs/patterns.md §7): its title is the link and stretches over
            it, and on hover the card takes the same pale ring as the rest. The
            arrow on hover is the only other affordance it needs. */}
        {entries.map((e) => (
          <Card key={e.id} data-plan-row="" className="flex-row items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CardLink onClick={() => onOpenPlan(e.id)} className="min-w-0 truncate text-sm font-medium">
                  {e.title}
                </CardLink>
                {/* A change made in the chat is applied to the plan but not yet
                    seen here; the row says so until it is opened and confirmed. */}
                {!e.archived && change && <Badge className="ml-auto">Izmenjeno</Badge>}
                <Badge variant={e.archived ? 'secondary' : 'success'} className="ml-auto">
                  {e.status}
                </Badge>
                <ArrowUpRight
                  size={14}
                  strokeWidth={2}
                  className="shrink-0 text-disabled opacity-0 transition-opacity duration-150 group-hover/card:text-primary-600 group-hover/card:opacity-100 group-has-[[data-slot=card-link]:focus-visible]/card:opacity-100"
                  aria-hidden="true"
                />
              </div>
              <p className="text-[11px] leading-4 text-disabled">
                {e.date} · {e.caregiverCount} negovateljica
              </p>
              <p className="mt-2 line-clamp-2 text-xs leading-body text-muted-foreground">{e.summary}</p>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}
