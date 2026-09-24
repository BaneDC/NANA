import { Lock } from 'lucide-react';
import { caregivers, caregiversFor, coordinator } from '../data/carePlan';
import CoordinatorMessage from './CoordinatorMessage';
import RecommendationCard from './RecommendationCard';
import { CoordinatorContact, PlanAsk } from './PlanFooterBlocks';
import CaregiverRow from './CaregiverRow';
import Button from './Button';

// The body of a care plan, in the order the client's document lays it out: the
// coordinator's letter, then the recommendations — each saying why it is being
// recommended for this person — then the full caregiver list, then the two ways the
// family can push back on the plan. Shared by the side panel and the full page so
// they never drift apart.
export default function PlanContents({ plan, unlocked, onSelectCaregiver, onUnlock, archived, change }) {
  const open = (plan.recommendations || []).filter((r) => !r.locked);
  const locked = (plan.recommendations || []).filter((r) => r.locked);

  return (
    <>
      {plan.letter && <CoordinatorMessage letter={plan.letter} changed={Boolean(change?.letter)} changeKey={change?.at} />}

      <p className="doc-section-title">Šta preporučujemo</p>

      {open.map((rec) => (
        <RecommendationCard
          key={rec.id}
          rec={rec}
          unlocked={unlocked}
          changed={Boolean(change?.recs.includes(rec.id))}
          changeKey={change?.at}
          onSelectCaregiver={onSelectCaregiver}
        />
      ))}

      {/* Everything else in the plan is written and ready; the subscription is what
          opens it, along with the caregivers' numbers. The heading stays readable so
          it is obvious what is being withheld. */}
      {unlocked ? (
        locked.map((rec) => (
          <RecommendationCard
            key={rec.id}
            rec={rec}
            unlocked
            changed={Boolean(change?.recs.includes(rec.id))}
            changeKey={change?.at}
            onSelectCaregiver={onSelectCaregiver}
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
              blizini{archived ? '.' : ', i direktan broj svake negovateljice.'}
            </p>
            <Button variant="primary" size="lg" onClick={onUnlock}>
              <Lock size={12} strokeWidth={2} /> Pretplatite se za ceo plan
            </Button>
          </div>
        </div>
      )}

      <p className="doc-section-title">
        Sve negovateljice koje odgovaraju{' '}
        <span className="doc-count">{plan.caregiverCount ?? caregivers.length}</span>
      </p>

      {archived ? (
        <p className="doc-p">
          Ovom planu je odgovaralo {plan.caregiverCount} negovateljica. Kontakti se čuvaju samo za
          aktivan plan.
        </p>
      ) : (
        <>
          <p className="doc-p">
            Poređane po tome koliko odgovaraju rasporedu, zadacima i lokaciji.
            {!unlocked && ' Kliknite na negovateljicu da dobijete njen broj.'}
          </p>
          {caregiversFor(unlocked).map((c) => (
            <CaregiverRow key={c.id} caregiver={c} onSelect={onSelectCaregiver} detailed />
          ))}
        </>
      )}

      {!archived && (
        <>
          <PlanAsk />
          <CoordinatorContact coordinator={plan.coordinator || coordinator} />
        </>
      )}
    </>
  );
}
