import { useState } from 'react';
import { Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription } from '@/components/ui/card';
import { Page, PageActions, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import PlanContents from '../components/PlanContents';
import PlanOverview from '../components/PlanOverview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlanChangeBanner from '../components/PlanChangeBanner';
import AskAssistant from '../components/AskAssistant';
import BackButton from '../components/BackButton';

// A care plan as its own page, reached from the Care plans list or the nav.
//
// It opens on Minna's letter. The summary of the person that used to sit above
// it told the family what they had just told us; the letter is the first thing
// the plan has to say back. A switch at the top turns it to "Pregled": the
// overview the onboarding ended on, the frailty scale and every answer given,
// so the family can always come back and read what they said.
export default function PlanDetail({
  entry,
  version,
  unlocked,
  change,
  onBack,
  onSelectCaregiver,
  onOpenCaregiver,
  onUnlock,
  onAskAssistant,
  onShare,
  onUndoChange,
  onDismissChange,
  onFindCaregivers,
  standingOf,
}) {
  const { plan, title, date, status, archived } = entry;
  const shownChange = archived ? null : change;
  const [side, setSide] = useState('plan');

  return (
    <Page>
      <BackButton label="Planovi nege" onClick={onBack} />
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{title}</PageTitle>
          <PageDescription>
            {date}
            {/* the live plan says which version it is: a change to her record writes a new one */}
            {version ? ` · verzija ${version}` : ''} ·{' '}
            <Badge variant={archived ? 'secondary' : 'success'} className="align-middle">
              {status}
            </Badge>
          </PageDescription>
        </PageHeaderText>
        {/* Two ways to change the plan, side by side: by hand, or by telling the
            assistant what is different. Only the live plan can change. Icons
            alone here: three labelled buttons took the width the title needs,
            and on a phone they wrapped under it. */}
        <PageActions>
          <AskAssistant iconOnly onClick={onAskAssistant} />
          {onShare && (
            <Button variant="secondary" size="icon" onClick={onShare} aria-label="Pošalji plan" title="Pošalji plan">
              <Send size={14} strokeWidth={1.75} />
            </Button>
          )}
        </PageActions>
      </PageHeader>

      {/* the plan, and the overview it was built from: two views of one thing */}
      <Tabs value={side} onValueChange={setSide}>
        <TabsList aria-label="Šta prikazati">
          <TabsTrigger value="plan">Plan nege</TabsTrigger>
          <TabsTrigger value="overview">Pregled i odgovori</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="flex flex-col gap-3">
          {shownChange && (
            <PlanChangeBanner key={shownChange.at} change={shownChange} onUndo={onUndoChange} onDismiss={onDismissChange} />
          )}

          {archived && (
            <Card>
              <CardDescription>{entry.summary}</CardDescription>
            </Card>
          )}

          <PlanContents
            plan={{ ...plan, caregiverCount: entry.caregiverCount }}
            unlocked={unlocked}
            archived={archived}
            change={shownChange}
            onSelectCaregiver={onSelectCaregiver}
            onOpenCaregiver={onOpenCaregiver}
            onUnlock={onUnlock}
            onFindCaregivers={onFindCaregivers}
            standingOf={standingOf}
          />

          {archived && (
            <div className="mt-1 flex gap-2 phone:flex-wrap phone:*:flex-auto">
              <Button variant="secondary" onClick={onBack}>
                Nazad na sve planove
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="overview">
          <PlanOverview answers={entry.answers} notes={entry.notes} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
