import { Star } from 'lucide-react';

// Her rating as the platform says it: the number, then the star, then how many
// rated her - "4,9 ★ (64)". One who has not been rated yet is "Nova", with no
// star. The same everywhere a caregiver is shown (docs/patterns.md §8).
export default function Rating({ caregiver: c }) {
  if (!c.reviews) return <span className="cg-rating">Nova</span>;
  return (
    <span className="cg-rating">
      {c.rating.toLocaleString('sr-RS', { minimumFractionDigits: 1 })}
      <Star size={11} strokeWidth={2} className="cg-star" aria-label="ocena" />
      ({c.reviews})
    </span>
  );
}
