import { ArrowRight, Check } from 'lucide-react';
import { caregiversFor } from '../data/carePlan';
import CaregiverRow from './CaregiverRow';
import Button from './Button';

// One recommendation, in the shape the client's document sketched: what we suggest,
// *why we suggest it for this person*, and who would do it. No "book now" — the
// client's note on that was unambiguous — and no soft actions either: "Neka Jovana
// ovo organizuje" promised a hand-off the app does not have yet.
export default function RecommendationCard({
  rec,
  unlocked,
  changed,
  changeKey,
  onSelectCaregiver,
  onFindCaregivers,
}) {
  return (
    // keyed by the change, so the highlight plays again for a second change
    <div className={`rec-card${changed ? ' is-changed' : ''}`} key={changed ? changeKey : 'rec'}>
      <div className="rec-title-row">
        <p className="rec-title">{rec.title}</p>
        {changed && <span className="status-pill is-attention">Izmenjeno</span>}
      </div>

      <p className="rec-why-label">Zašto ovo preporučujemo</p>
      <p className="rec-why">{rec.why}</p>

      {rec.kind === 'caregivers' && (
        <div className="rec-providers">
          {caregiversFor(unlocked)
            .slice(0, 5)
            .map((c) => (
              <CaregiverRow key={c.id} caregiver={c} onSelect={onSelectCaregiver} />
            ))}
          {onFindCaregivers && (
            <Button variant="secondary" full onClick={onFindCaregivers}>
              Pogledajte još negovateljica
              <ArrowRight size={14} strokeWidth={1.75} />
            </Button>
          )}
        </div>
      )}

      {rec.kind === 'list' && (
        <ul className="rec-list">
          {rec.items.map((item) => (
            <li key={item}>
              <Check size={13} strokeWidth={2} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
