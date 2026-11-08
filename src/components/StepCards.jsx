import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsPhone } from '@/hooks/use-phone';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import GradientBackground from '@/components/immersive/GradientBackground';

// A form in parts on one page (docs/patterns.md §10), as the chat kit's
// QuestionGroup until the kit's card takes a host's own fields
// (docs/kit-issues.md), in the personality test's look (§12d): the page over
// the screen on the onboarding's sky, the parts glass cards as the test's
// choices. The one open has its fields and "Dalje", a part done is a row with
// what was given in it and opens again on a press, a part still to come is
// paler glass.

// The page: the sky, the test's title and its line, the parts 32 under them
// and the page's buttons 32 under the parts; it scrolls as one, and what is
// short sits in the middle.
export function StepPage({ title, sub, actions, children }) {
  return (
    <div data-slot="step-page" className="fixed inset-0 z-10 overflow-hidden">
      <GradientBackground />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 phone:px-4 phone:py-8">
          <div className="flex w-[560px] max-w-full flex-col gap-8">
            <header className="flex flex-col gap-2 text-center">
              <h1 className="imm-title">{title}</h1>
              {sub && <p className="imm-subtitle my-0">{sub}</p>}
            </header>
            {children}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepCards({ className, children }) {
  return <div data-slot="step-cards" className={cn('flex flex-col gap-2', className)}>{children}</div>;
}

const EASE = [0.23, 1, 0.32, 1];

// the number, the test's square: the primary on the part open, its brown
// otherwise, paler on a part still to come
function Num({ on, upcoming, children }) {
  return (
    <span aria-hidden="true" className={cn('imm-letter', on && 'is-on', upcoming && 'is-off')}>
      {children}
    </span>
  );
}

// two answers at most (one on a phone), then how many more: a row that wraps
// is no summary. White tags: the grey one is too faint on the glass
function Summary({ items }) {
  const phone = useIsPhone();
  const shown = items.filter(Boolean);
  const fit = phone ? 1 : 2;
  const rest = shown.length - fit;
  return (
    <span className="flex min-w-0 flex-1 justify-end gap-1 overflow-hidden">
      {shown.slice(0, fit).map((x, i) => (
        <Badge key={i} variant="tag" className="min-w-0 shrink bg-card">
          <span className="truncate">{x}</span>
        </Badge>
      ))}
      {rest > 0 && (
        <Badge variant="tag" className="bg-card">
          +{rest}
        </Badge>
      )}
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
      // a part done opens again from anywhere on it: whiter on hover, as a choice in the test
      className={cn('imm-step', open ? 'is-open' : state === 'done' ? 'is-done' : 'is-upcoming')}
      style={{ overflow: moving ? 'hidden' : 'visible' }}
    >
      <div ref={inner}>
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div key="open" {...fade} className="flex flex-col gap-4 p-4">
              <div className="flex items-start gap-3">
                <Num on>{n}</Num>
                <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                  <h2 className="imm-option-title">{title}</h2>
                  {sub && <p className="imm-option-sub">{sub}</p>}
                </div>
              </div>
              {/* the questions 24 apart, no line between them; a note goes
                  with its question, 12 under it, in one child */}
              <div ref={fields} className="flex flex-col gap-6">
                {children}
              </div>
              {/* 24 under the last question, as the questions are apart */}
              <div className="mt-2 flex justify-end phone:*:flex-1">
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
              <span className="imm-option-title shrink-0">{title}</span>
              <Summary items={summary} />
              <Pencil aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-colors duration-150 group-hover/step:text-foreground" />
            </motion.button>
          ) : (
            <motion.div key="upcoming" {...fade} className="flex min-h-14 items-center gap-3 px-4 py-2">
              <Num upcoming>{n}</Num>
              <span className="imm-option-title">{title}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
