import { ArrowUpRight, FileText } from 'lucide-react';
import { caregiversFor, caregivers } from '../data/carePlan';
import CaregiverRow from './CaregiverRow';
import Button from './Button';

const today = new Date().toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

// The care plan as it appears inside the chat: a grey container holding a white
// "document". It shows the summary and the top matches; the rest of the plan lives
// in the side panel, and the whole card reads as one open-me target.
export default function CarePlanCard({ plan, unlocked, onOpen, onSelectCaregiver }) {
  const preview = caregiversFor(unlocked).slice(0, 2);

  return (
    <div className="workflow-card care-plan">
      <div
        className="doc"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <div className="doc-head">
          <FileText size={14} strokeWidth={1.75} className="doc-icon" />
          <div className="doc-head-text">
            <p className="doc-eyebrow">
              Plan nege <span className="doc-meta">· {today}</span>
            </p>
            <p className="doc-title">Plan nege · {plan.name}</p>
          </div>
          <span className="doc-open">
            Otvori <ArrowUpRight size={12} strokeWidth={2} />
          </span>
        </div>

        {plan.narrative.map((p, i) => (
          <p className="doc-p" key={i}>
            {p}
          </p>
        ))}

        <div className="facts">
          {plan.facts.map((f) => (
            <div className="fact" key={f.label}>
              <span className="fact-label">{f.label}</span>
              <span className="fact-value">{f.value}</span>
            </div>
          ))}
        </div>

        <p className="doc-section-title">
          Najbolje se poklapaju <span className="doc-count">od {caregivers.length}</span>
        </p>
        {preview.map((c) => (
          <CaregiverRow key={c.id} caregiver={c} onSelect={onSelectCaregiver} />
        ))}

        <div className="doc-more-cta">
          <Button
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            Otvori ceo plan nege <ArrowUpRight size={12} strokeWidth={2} />
          </Button>
          <span className="doc-cta-note">
            Jovanina poruka · {plan.recommendations.length} preporuke ·{' '}
            {caregivers.length} negovateljica
          </span>
        </div>
      </div>
    </div>
  );
}
