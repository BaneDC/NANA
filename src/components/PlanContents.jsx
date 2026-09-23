import { Lock } from 'lucide-react';
import { coordinator } from '../data/carePlan';
import CoordinatorMessage from './CoordinatorMessage';
import RecommendationCard from './RecommendationCard';
import { CoordinatorContact, PlanAsk } from './PlanFooterBlocks';
import Button from './Button';

// The body of a care plan, in the order the client's document lays it out: the
// coordinator's letter, then what we recommend — each saying why it is being
// recommended for this person — then the two ways the family can push back on
// the plan. Shared by the side panel and the full page so they never drift apart.
//
// Three groups, and the spacing says so: 8px inside a card's list, 12px from a
// heading to what it heads, 32px between one group and the next. The caregivers
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

      <section className="plan-sec">
        <p className="doc-section-title">Šta preporučujemo</p>

        <div className="plan-sec-body">
          {open.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              unlocked={unlocked}
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
                  Koje preglede kod lekara zakazati, promene koje stan čine bezbednijim i šta postoji u
                  blizini{archived ? '.' : ' — i direktan broj svake negovateljice.'}
                </p>
                <Button variant="primary" size="lg" onClick={onUnlock}>
                  <Lock size={12} strokeWidth={2} /> Pretplatite se za ceo plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {!archived && (
        <section className="plan-sec-body">
          <PlanAsk />
          <CoordinatorContact coordinator={plan.coordinator || coordinator} />
        </section>
      )}
    </div>
  );
}
