import { Send, Star } from 'lucide-react';

// One caregiver in the care plan. The family reaches her with a message, written
// here and sent once the subscription is paid, so the whole row opens it.
export default function CaregiverRow({ caregiver, onSelect, detailed }) {
  const locked = true;

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
        {onSelect && (
          <span className="cg-phone">
            <Send size={12} strokeWidth={2} />
            <span className="cg-phone-cta">Pošalji poruku</span>
          </span>
        )}
      </div>
    </div>
  );
}
