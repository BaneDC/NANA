import { createContext, useContext, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// A way back that leaves the page or the process lives in the page's head, top
// left: the arrow and where it goes, a ghost button (docs/patterns.md §4,
// decided 12. 11.). A step back inside the same process stays a button by the
// main one.

// On the form's sky and in the personality test. `short`: on a phone the
// arrow alone, a square, its name in aria-label (the test, whose right side is
// full).
export function SkyBack({ label, onClick, short, className }) {
  return (
    <Button variant="ghost" aria-label={label} onClick={onClick} className={cn(short && 'phone:size-11 phone:px-0', className)}>
      <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
      <span className={cn(short && 'phone:sr-only')}>{label}</span>
    </Button>
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

// The page's head: the way back at the left, or `lead` where there is none
// (the logo, on signing in and up), and what is on the right (the language)
// across from it (decided 12. 11., dizajner). 16 from the top and the edges
// of the screen; in the sign-in's frame its own 48 and 24 taken back.
export function PageHead({ back, lead, className, children }) {
  return (
    <div data-slot="page-head" className={cn('flex shrink-0 items-center justify-between gap-2', className)}>
      {back ? <SkyBack label={back.label} onClick={back.onClick} /> : lead || <span />}
      {children}
    </div>
  );
}
