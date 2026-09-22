import { Lock, Star } from 'lucide-react';
import { MASKED_PHONE } from '../data/carePlan';

// One caregiver in the care plan. `caregiver.phone` only exists once the plan is
// paid for — while it is missing the whole row is the paywall trigger.
export default function CaregiverRow({ caregiver, onSelect, detailed }) {
  const locked = !caregiver.phone;

  const open = (e) => {
    e.stopPropagation();
    onSelect?.(caregiver);
  };

  return (
    <div
      className={`caregiver${locked && onSelect ? ' is-clickable' : ''}`}
      onClick={locked && onSelect ? open : undefined}
      role={locked && onSelect ? 'button' : undefined}
      tabIndex={locked && onSelect ? 0 : undefined}
      onKeyDown={
        locked && onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(e);
              }
            }
          : undefined
      }
    >
      <div className="cg-avatar">{caregiver.initials}</div>
      <div className="cg-main">
        <div className="cg-top">
          <span className="cg-name">{caregiver.name}</span>
          <span className="cg-match">{caregiver.match}% poklapanje</span>
        </div>
        <div className="cg-meta">
          <Star size={11} strokeWidth={2} className="cg-star" />
          {caregiver.rating} ({caregiver.reviews}) · {caregiver.years} god. iskustva · {caregiver.rate} ·{' '}
          {caregiver.area}, {caregiver.distance}
        </div>
        {detailed && <p className="cg-bio">{caregiver.bio}</p>}
        {detailed && (
          <div className="cg-tags">
            {caregiver.tags.map((t) => (
              <span className="cg-tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        )}
        {caregiver.phone ? (
          <a className="cg-phone is-open" href={`tel:${caregiver.phone.replace(/\s/g, '')}`}>
            {caregiver.phone}
          </a>
        ) : (
          <span className="cg-phone">
            <span className="cg-phone-mask">{MASKED_PHONE}</span>
            <Lock size={12} strokeWidth={2} />
            <span className="cg-phone-cta">Dobij broj</span>
          </span>
        )}
      </div>
    </div>
  );
}
