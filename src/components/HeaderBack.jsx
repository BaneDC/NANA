import { createContext, useContext, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// A way back that leaves the page or the process lives in the page's head, top
// left: the arrow and where it goes (docs/patterns.md §4, decided 12. 11.). A
// step back inside the same process stays a button by the main one.

// On the form's sky and in the personality test: the onboarding's glass
// control, as "Uputstvo" across from it in the test. `short`: on a phone the
// arrow alone, its name in aria-label (the test, whose right side is full).
export function SkyBack({ label, onClick, short, className }) {
  return (
    <button type="button" className={cn('imm-ctl is-text is-back', short && 'is-short', className)} aria-label={label} onClick={onClick}>
      <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
      <span className="imm-ctl-label">{label}</span>
    </button>
  );
}

// In the sign-in's frame (Register.jsx), over the logo: a page under it says
// where it goes back to, and the frame draws it at the top.
const Slot = createContext(null);
export const HeaderBackSlot = Slot.Provider;

export function useHeaderBack(label, onClick) {
  const set = useContext(Slot);
  const go = useRef(onClick);
  go.current = onClick;
  useEffect(() => {
    if (!set) return undefined;
    set({ label, onClick: () => go.current() });
    return () => set(null);
  }, [set, label]);
}

// 16 from the top and the left edge of the screen; the frame's own 48 and 24
// taken back, and 24 to the logo under it
export function FrameBack({ back }) {
  return (
    <div data-slot="header-back" className="-mx-2 -mt-8 self-stretch">
      <Button variant="ghost" onClick={back.onClick}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        {back.label}
      </Button>
    </div>
  );
}
