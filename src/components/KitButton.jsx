import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Our Button, handed to the chat kit (inline-chat-kit ≥ 0.61, `components`
// on ChatExperience and ComponentsProvider), so every button in the chat is
// the app's own and not the kit's dressed up in CSS (docs/kit-issues.md).
//
// The kit keeps the layout: the box the button sits in, its height from
// --ick-control-* (and its width when it is an icon alone), where it goes, how
// it comes and goes, and the 44 a finger gets. The button paints: the kit's
// primary, secondary and outline are our secondary (in the chat nothing is set
// up, so nothing is orange but the composer's send, which stays the kit's), its
// ghost is our ghost (copy, again, thumbs). What the kit names besides
// (`kitRole`, `variant`, `size`, `shape`, …) is taken out; the rest, the
// handlers, aria-*, data-ick-* and the ref, goes onto the <button>.
const LOOK = { ghost: 'ghost', glass: 'ghost' };

export default function KitButton({ kitRole, variant, size, shape, icon, iconRight, loading, pressed, children, className, ref, ...rest }) {
  const square = shape === 'square';
  return (
    <Button
      ref={ref}
      variant={LOOK[variant] || 'secondary'}
      size={square ? 'icon' : 'default'}
      // the kit sizes the box; the button fills it
      className={cn('h-full', square && 'w-full', className)}
      {...rest}
    >
      {loading ? <Loader2 className="animate-spin" size={14} strokeWidth={1.75} /> : icon}
      {children}
      {iconRight}
    </Button>
  );
}
