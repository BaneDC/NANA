import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { useIsPhone } from '@/hooks/use-phone';

// One line after a decision, saying what it did — "Paid. 152 € is on its way
// to Sanna." The drawer that took the decision has already closed, and the page
// behind it changes quietly; without this the only sign anything happened is a
// row that is no longer there.
//
// shadcn's Sonner, drawn as ours (docs/patterns.md §12): dark, white text, 16
// corners. With a mouse at the bottom, as wide as its text up to 520, in the
// middle; on a phone at the top, the width of the screen less 16 a side, and
// it comes down from above.
export default function Toast({ flash, onDone }) {
  const phone = useIsPhone();
  // held in a ref so a parent re-rendering does not restart the clock
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!flash) return;
    toast.custom(
      () => (
        <div
          role="status"
          className="mx-auto flex w-fit max-w-[520px] items-center font-sans gap-2 rounded-2xl bg-foreground px-4 py-3 text-xs leading-body text-white shadow-container phone:w-full phone:max-w-none"
        >
          <Check size={14} strokeWidth={2.25} className="shrink-0" />
          {flash.text}
        </div>
      ),
      { id: 'flash', duration: 3600, onAutoClose: () => done.current(), onDismiss: () => done.current() }
    );
  }, [flash]);

  return (
    <Toaster
      position={phone ? 'top-center' : 'bottom-center'}
      offset={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', top: 'calc(16px + env(safe-area-inset-top, 0px))' }}
      mobileOffset={{ top: 'calc(16px + env(safe-area-inset-top, 0px))', left: '16px', right: '16px' }}
      style={{ '--width': phone ? '100%' : '520px' }}
    />
  );
}
