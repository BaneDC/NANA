import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter } from '@/components/ui/card';
import Attention from '../components/Attention';
import { Page, PageActions, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import PlanContents from '../components/PlanContents';
import PlanOverview from '../components/PlanOverview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlanChangeBanner from '../components/PlanChangeBanner';
import AskAssistant from '../components/AskAssistant';
import { t } from '../i18n';

// The care plan as its own page, reached from the nav. A person has one plan,
// changed as she changes (docs/plan-nege.md), so there is no list of plans to
// come back to.
//
// It opens on Minna's letter. The summary of the person that used to sit above
// it told the family what they had just told us; the letter is the first thing
// the plan has to say back. A switch at the top turns it to "Pregled": the
// overview the onboarding ended on, the frailty scale and every answer given,
// so the family can always come back and read what they said.
export default function PlanDetail({
  entry,
  unlocked,
  askNote,
  change,
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
  const { plan, title, date } = entry;
  const shownChange = change;
  const [side, setSide] = useState('plan');

  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{title}</PageTitle>
          <PageDescription>{date}</PageDescription>
        </PageHeaderText>
        {/* Two ways to change the plan, side by side: by hand, or by telling the
            assistant what is different. Only the live plan can change. Icons
            alone here: three labelled buttons took the width the title needs,
            and on a phone they wrapped under it. */}
        <PageActions>
          <AskAssistant iconOnly onClick={onAskAssistant} />
          {onShare && (
            <Button variant="secondary" size="icon" onClick={onShare} aria-label={t('Pošalji plan')} title={t('Pošalji plan')}>
              <Send size={14} strokeWidth={1.75} />
            </Button>
          )}
        </PageActions>
      </PageHeader>

      {/* the plan, and the overview it was built from: two views of one thing */}
      <Tabs value={side} onValueChange={setSide}>
        <TabsList aria-label={t('Šta prikazati')}>
          <TabsTrigger value="plan">{t('Plan nege')}</TabsTrigger>
          <TabsTrigger value="overview">{t('Pregled i odgovori')}</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="flex flex-col gap-3">
          {shownChange && (
            <PlanChangeBanner key={shownChange.at} change={shownChange} onUndo={onUndoChange} onDismiss={onDismissChange} />
          )}

          <PlanContents
            plan={{ ...plan, caregiverCount: entry.caregiverCount }}
            unlocked={unlocked}
            askNote={askNote}
            change={shownChange}
            onSelectCaregiver={onSelectCaregiver}
            onOpenCaregiver={onOpenCaregiver}
            onUnlock={onUnlock}
            onFindCaregivers={onFindCaregivers}
            standingOf={standingOf}
          />

        </TabsContent>

        <TabsContent value="overview">
          <PlanOverview answers={entry.answers} notes={entry.notes} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

// "Plan nege" before the onboarding has made it: the next step, as every empty
// page (docs/patterns.md §5).
export function NoPlan({ onGoToChat }) {
  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{t('Plan nege')}</PageTitle>
        </PageHeaderText>
      </PageHeader>
      <Attention title={t('Nema aktivnog plana')}>
        <Card>
          <CardDescription>{t('Odgovorite na pitanja u razgovoru i plan će se pojaviti ovde.')}</CardDescription>
          <CardFooter>
            <Button onClick={onGoToChat}>{t('Idi na razgovor')}</Button>
          </CardFooter>
        </Card>
      </Attention>
    </Page>
  );
}
