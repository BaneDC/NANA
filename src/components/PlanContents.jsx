import { Lock } from 'lucide-react';
import { coordinator } from '../data/carePlan';
import CoordinatorMessage from './CoordinatorMessage';
import RecommendationCard from './RecommendationCard';
import { CoordinatorContact } from './PlanFooterBlocks';
import { Button } from '@/components/ui/button';
import { PageSection } from '@/components/page';

// The body of a care plan, in the order the client's document lays it out: the
// coordinator's letter, then what we recommend — each saying why it is being
// recommended for this person — then the way to reach the coordinator. Shared by
// the side panel and the full page so they never drift apart.
//
// Three groups, and the spacing says so: 12px between the cards and from the
// group's title to them, 32px between one group and the next (docs/patterns.md §3). The caregivers
// live inside the recommendation that proposes them — a second full list under
// the plan was the same names again, with nothing new to say.
export default function PlanContents({
  plan,
  unlocked,
  onSelectCaregiver,
  onOpenCaregiver,
  onUnlock,
  onFindCaregivers,
  standingOf,
  change,
}) {
  const open = (plan.recommendations || []).filter((r) => !r.locked);
  const locked = (plan.recommendations || []).filter((r) => r.locked);

  return (
    <div className="flex flex-col gap-8">
      {plan.letter && (
        <CoordinatorMessage letter={plan.letter} changed={Boolean(change?.letter)} changeKey={change?.at} />
      )}

      <PageSection title="Šta preporučujemo">

          {open.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              unlocked={unlocked}
              bookable
              changed={Boolean(change?.recs.includes(rec.id))}
              changeKey={change?.at}
              onSelectCaregiver={onSelectCaregiver}
              standingOf={standingOf}
              onOpenCaregiver={onOpenCaregiver}
              onFindCaregivers={onFindCaregivers}
            />
          ))}

          {/* Everything else in the plan is written and ready; the subscription is
              what opens it, along with the caregivers' numbers. The heading stays
              readable so it is obvious what is being withheld. */}
          {unlocked ? (
            locked.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                unlocked
                bookable
                changed={Boolean(change?.recs.includes(rec.id))}
                changeKey={change?.at}
                onSelectCaregiver={onSelectCaregiver}
                standingOf={standingOf}
                onOpenCaregiver={onOpenCaregiver}
                onFindCaregivers={onFindCaregivers}
              />
            ))
          ) : (
            // the rest, just showing through, under what opens it: blurred,
            // faint and fading out, the sentence and its button in the middle
            <div className="relative min-h-[300px] overflow-hidden">
              <div
                className="pointer-events-none -mx-4 flex max-h-[300px] flex-col gap-3 overflow-hidden px-4 opacity-50 blur-[6px] select-none [mask-image:linear-gradient(180deg,#000_0%,#000_45%,transparent_100%)]"
                aria-hidden="true"
              >
                {locked.map((rec) => (
                  <RecommendationCard key={rec.id} rec={rec} unlocked={false} />
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[color-mix(in_srgb,var(--surface-elevated)_55%,transparent)] p-4 text-center">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <Lock size={14} strokeWidth={2} />
                </span>
                <p className="text-sm font-medium text-foreground">Još {locked.length} preporuke u punom planu</p>
                <p className="mb-2 max-w-[440px] text-xs leading-body text-muted-foreground">
                  Pregledi kod lekara i pomagala kod naših partnera, jeftinije kad ih zakaže Minna, promene
                  koje stan čine bezbednijim, i direktan broj svake negovateljice.
                </p>
                <Button size="lg" onClick={onUnlock}>
                  <Lock size={12} strokeWidth={2} /> Otključajte ceo plan nege
                </Button>
              </div>
            </div>
          )}
      </PageSection>

      <CoordinatorContact coordinator={plan.coordinator || coordinator} />
    </div>
  );
}
