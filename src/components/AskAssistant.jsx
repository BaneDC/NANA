import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Opens the co-pilot against the current page. Only Moja nega and a care plan
// carry one in their head (decided 8 October; the medical record opens the
// assistant through its own one action, "Prijavi promenu"); on a narrow screen it steps
// aside and the one in the top bar, beside the logo and the menu, is the one,
// and never squeezing a page's title (docs/patterns.md §4).
export default function AskAssistant({ onClick, label = 'Pitaj asistenta', iconOnly, className }) {
  return (
    <Button
      variant="secondary"
      size={iconOnly ? 'icon' : 'default'}
      className={cn(
        'narrow:in-data-[slot=page-header]:hidden',
        className
      )}
      onClick={onClick}
      aria-label={label}
      title={iconOnly ? label : undefined}
    >
      <Sparkles size={14} strokeWidth={1.75} />
      {!iconOnly && label}
    </Button>
  );
}
