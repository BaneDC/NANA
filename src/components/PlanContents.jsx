import { Lock } from 'lucide-react';
import { coordinator } from '../data/carePlan';
import CoordinatorMessage from './CoordinatorMessage';
import RecommendationCard from './RecommendationCard';
import { CoordinatorContact } from './PlanFooterBlocks';
import Button from './Button';

// The body of a care plan, in the order the client's document lays it out: the
// coordinator's letter, then what we recommend — each saying why it is being
// recommended for this person — then the way to reach the coordinator. Shared by
// the side panel and the full page so they never drift apart.
//
// Three groups, and the spacing says so: 8px between the cards, 12px from the
// group's title to them, 32px between one group and the next (docs/patterns.md). The caregivers
// live inside the recommendation that proposes them — a second full list under
// the plan was the same names again, with nothing new to say.
export default function PlanContents({
  plan,
  unlocked,
  onSelectCaregiver,
  onUnlock,
  onFindCaregivers,
  archived,
  change,
}) {
  const open = (plan.recommendations || []).filter((r) => !r.locked);
  const locked = (plan.recommendations || []).filter((r) => r.locked);

  return (
    <div className="plan-doc">
      {plan.letter && (
        <CoordinatorMessage letter={plan.letter} changed={Boolean(change?.letter)} changeKey={change?.at} />
      )}

      <section className="section">
        <p className="section-title">Šta preporučujemo</p>

          {open.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              unlocked={unlocked}
              bookable={!archived}
              changed={Boolean(change?.recs.includes(rec.id))}
              changeKey={change?.at}
              onSelectCaregiver={onSelectCaregiver}
              onFindCaregivers={archived ? null : onFindCaregivers}
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
                bookable={!archived}
                changed={Boolean(change?.recs.includes(rec.id))}
                changeKey={change?.at}
                onSelectCaregiver={onSelectCaregiver}
                onFindCaregivers={archived ? null : onFindCaregivers}
              />
            ))
          ) : (
            <div className="locked-region">
              <div className="locked-content" aria-hidden="true">
                {locked.map((rec) => (
                  <RecommendationCard key={rec.id} rec={rec} unlocked={false} />
                ))}
              </div>
              <div className="locked-overlay">
                <span className="locked-badge">
                  <Lock size={14} strokeWidth={2} />
                </span>
                <p className="locked-title">Još {locked.length} preporuke u punom planu</p>
                <p className="locked-note">
                  Pregledi kod lekara i pomagala kod naših partnera, jeftinije kad ih zakaže Jovana, promene
                  koje stan čine bezbednijim{archived ? '.' : ', i direktan broj svake negovateljice.'}
                </p>
                <Button variant="primary" size="lg" onClick={onUnlock}>
                  <Lock size={12} strokeWidth={2} /> Pretplatite se za ceo plan
                </Button>
              </div>
            </div>
          )}
      </section>

      {!archived && <CoordinatorContact coordinator={plan.coordinator || coordinator} />}
    </div>
  );
}
