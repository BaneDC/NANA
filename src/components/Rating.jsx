import { Star } from 'lucide-react';
import { locale, t } from '../i18n';

// Her rating as the platform says it: the number, then the star, then how many
// rated her - "4,9 ★ (64)". One who has not been rated yet is "Nova", with no
// star. The same everywhere a caregiver is shown (docs/patterns.md §8).
export default function Rating({ caregiver: c }) {
  if (!c.reviews) return <span>{t('Nova')}</span>;
  return (
    <span>
      {c.rating.toLocaleString(locale(), { minimumFractionDigits: 1 })}
      <Star size={11} strokeWidth={2} className="mr-1 ml-0.5 inline-block align-[-1px] text-primary" aria-label={t('ocena')} />
      ({c.reviews})
    </span>
  );
}
