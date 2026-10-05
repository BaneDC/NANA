import { ArrowUpRight, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
        {/* the whole card is the target — the arrow on hover is the only affordance
            it needs, so there is no button competing with it */}
        {entries.map((e) => (
          <Card
            key={e.id}
            data-plan-row=""
            role="button"
            tabIndex={0}
            className="group/plan cursor-pointer flex-row items-start gap-2 border border-transparent transition-[border-color,box-shadow] duration-150 outline-none hover:border-primary hover:shadow-[0_2px_10px_rgba(252,112,60,0.14)] focus-visible:border-primary focus-visible:shadow-[0_2px_10px_rgba(252,112,60,0.14)]"
            onClick={() => onOpenPlan(e.id)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                onOpenPlan(e.id);
              }
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{e.title}</span>
                {/* A change made in the chat is applied to the plan but not yet
                    seen here; the row says so until it is opened and confirmed. */}
                {!e.archived && change && <Badge className="ml-auto">Izmenjeno</Badge>}
                <Badge variant={e.archived ? 'secondary' : 'success'} className="ml-auto">
                  {e.status}
                </Badge>
                <ArrowUpRight
                  size={14}
                  strokeWidth={2}
                  className="shrink-0 text-disabled opacity-0 transition-opacity duration-150 group-hover/plan:text-primary-600 group-hover/plan:opacity-100 group-focus-visible/plan:text-primary-600 group-focus-visible/plan:opacity-100"
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
