import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsPhone } from '@/hooks/use-phone';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

// A form in parts on one page (docs/patterns.md §10), as the chat kit's
// QuestionGroup until the kit's card takes a host's own fields
// (docs/kit-issues.md). The parts are on a grey tray, as in `Tray`: the one
// open is a white card with its fields and "Dalje", a part done is a row with
// what was given in it and opens again on a press, a part still to come is a
// dim row.

export function StepCards({ className, children }) {
  return <div data-slot="step-cards" className={cn('flex flex-col gap-2 rounded-4xl bg-muted p-2', className)}>{children}</div>;
}

const EASE = [0.23, 1, 0.32, 1];

// the number: the primary on the part open, grey on a white card, white and
// dim on the tray for a part still to come
function Num({ on, upcoming, children }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-lg text-small font-medium',
        on ? 'bg-primary text-primary-foreground' : upcoming ? 'bg-card text-muted-foreground' : 'bg-muted text-foreground'
      )}
    >
      {children}
    </span>
  );
}

// two answers at most (one on a phone), then how many more: a row that wraps
// is no summary
function Summary({ items }) {
  const phone = useIsPhone();
  const shown = items.filter(Boolean);
  const fit = phone ? 1 : 2;
  const rest = shown.length - fit;
  return (
    <span className="flex min-w-0 flex-1 justify-end gap-1 overflow-hidden">
      {shown.slice(0, fit).map((x, i) => (
        <Badge key={i} variant="tag" className="min-w-0 shrink">
          <span className="truncate">{x}</span>
        </Badge>
      ))}
      {rest > 0 && <Badge variant="tag">+{rest}</Badge>}
    </span>
  );
}

// state: 'active' (open), 'done' (a row that opens it again), 'upcoming'
export function StepCard({ n, title, sub, state, summary = [], onOpen, onNext, nextLabel, children }) {
  const still = useReducedMotion();
  const inner = useRef(null);
  const fields = useRef(null);
  // opened after the page came (by "Dalje" or its row), so its first field
  // takes the focus once it has grown; the part open from the start does not
  const focusOnOpen = useRef(false);
  const was = useRef(state);
  const [height, setHeight] = useState('auto');
  const [moving, setMoving] = useState(false);
  const open = state === 'active';

  useEffect(() => {
    if (open && was.current !== 'active') focusOnOpen.current = true;
    was.current = state;
  }, [state, open]);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const watch = new ResizeObserver(() => setHeight(el.offsetHeight));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  const settle = () => {
    setMoving(false);
    if (open && focusOnOpen.current) {
      focusOnOpen.current = false;
      fields.current?.querySelector('input:not([type=hidden]), textarea, button')?.focus({ preventScroll: true });
      inner.current?.scrollIntoView?.({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    }
  };
  const fade = still
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15, delay: 0.1 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      };

  return (
    <motion.section
      data-slot="step-card"
      data-state={state}
      initial={false}
      animate={{ height }}
      transition={still ? { duration: 0 } : { duration: 0.25, ease: EASE }}
      onAnimationStart={() => setMoving(true)}
      onAnimationComplete={settle}
      className={cn(
        'rounded-3xl transition-[background-color,box-shadow] duration-200',
        state !== 'upcoming' && 'bg-card shadow-card',
        // a part done opens again from anywhere on it: ringed on hover, as a card that opens something (§7)
        state === 'done' && 'hover:shadow-[0_0_0_1px_var(--color-primary-300),var(--shadow-card)]'
      )}
      style={{ overflow: moving ? 'hidden' : 'visible' }}
    >
      <div ref={inner}>
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div key="open" {...fade} className="flex flex-col gap-4 p-4">
              <div className="flex items-start gap-3">
                <Num on>{n}</Num>
                <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
                  <h2 className="text-sm font-medium text-foreground">{title}</h2>
                  {sub && <p className="text-xs leading-body text-muted-foreground">{sub}</p>}
                </div>
              </div>
              <div ref={fields} className="flex flex-col gap-4">
                {children}
              </div>
              <div className="flex justify-end phone:*:flex-1">
                <Button onClick={onNext}>{nextLabel || t('Dalje')}</Button>
              </div>
            </motion.div>
          ) : state === 'done' ? (
            <motion.button
              key="done"
              {...fade}
              type="button"
              onClick={onOpen}
              aria-label={t('Izmenite: {title}', { title })}
              className="group/step flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-3xl px-4 py-2 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Num>{n}</Num>
              <span className="shrink-0 text-sm text-foreground">{title}</span>
              <Summary items={summary} />
              <Pencil aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-colors duration-150 group-hover/step:text-foreground" />
            </motion.button>
          ) : (
            <motion.div key="upcoming" {...fade} className="flex min-h-14 items-center gap-3 px-4 py-2">
              <Num upcoming>{n}</Num>
              <span className="text-sm text-muted-foreground">{title}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
