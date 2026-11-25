import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react';
import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsPhone } from '@/hooks/use-phone';
import { cn } from '@/lib/utils';
import { pageFocus } from '@/components/TextField';
import { t, useLang } from '@/i18n';
import GradientBackground from '@/components/immersive/GradientBackground';
import MemoryStrip from '@/components/immersive/MemoryStrip';
import { PageHead } from '@/components/HeaderBack';
import LanguagePicker from '@/components/LanguagePicker';
import Logo from '@/components/Logo';

// A form in parts on one page (docs/patterns.md §10), as the chat kit's
// QuestionGroup until the kit's card takes a host's own fields
// (docs/kit-issues.md), in the personality test's look (§12d): the page over
// the screen on the onboarding's sky, the parts glass cards as the test's
// choices. The one open has its fields and "Dalje", a part done is a row with
// what was given in it and opens again on a press, a part still to come is
// paler glass.

// The page: the sky, the test's title and its line, the parts 32 under them
// and the page's buttons 32 under the parts; it scrolls as one, and what is
// short sits in the middle. The form and its review are the same page, so the
// sky goes on from one to the other; a new title starts at the top. `start`:
// the header at the left under a small line, as the family's plan after the
// onboarding. The buttons stay in reach: held at the bottom of the screen
// while the page runs past it (.imm-step-bar).
// `footer`: what belongs to the page and not to its step (the language, on
// the sign-up's first page), quiet at its foot, 32 under the buttons.
// `back` ({ label, onClick }): the way out of the process, in the page's head
// at the top left (docs/patterns.md §4); `language`: the language across from it,
// on a page before the account (§12b). The page's own column under them.
// `lead`: what the head has at its left when there is no way back (the logo)
// `memories`: the family's memories as a strip at the page's foot, under its
// column (MemoryStrip; the family's sign-in and "Ko ste?", docs/patterns.md
// §10); not on a phone
// `logo`: the logo over the title, 24 over it, in place of the head's (the
// sign-in, whose title names NANA Prime, decided 23. 11.); the title says it
// already, so it is not read out twice
export function StepPage({ eyebrow, title, sub, start, actions, footer, back, lead, language, memories, logo, children }) {
  const scroller = useRef(null);
  // the buttons' bar held at the bottom of the screen: its blur reaches
  // higher (onboarding.css, .imm-step-bar). Held while the line just after
  // it, where it would be, is under the screen's edge.
  const barEnd = useRef(null);
  const [stuck, setStuck] = useState(false);
  const hasBar = !!actions;
  useEffect(() => {
    const end = barEnd.current;
    if (!hasBar || !end) return undefined;
    const watch = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { root: scroller.current });
    watch.observe(end);
    return () => watch.disconnect();
  }, [hasBar]);
  // the memories are not on a phone: there they would only be under the fold
  const phone = useIsPhone();
  const strip = memories && !phone;
  // a new title is a new page, to the top; the same one in another language is not
  const lang = useLang();
  const wasLang = useRef(lang);
  useLayoutEffect(() => {
    if (wasLang.current !== lang) {
      wasLang.current = lang;
      return;
    }
    scroller.current?.scrollTo?.(0, 0);
  }, [title, lang]);
  return (
    <div data-slot="step-page" className="fixed inset-0 z-10 overflow-hidden">
      <GradientBackground />
          <div ref={scroller} data-slot="step-scroll" className="absolute inset-0 overflow-y-auto [overflow-anchor:none]">
        {/* with buttons the bar's own 16 is the page's foot: the page's
            padding under it let the buttons, held 16 over the screen's edge,
            ride up by that much more once the page's end was reached */}
        <div className="flex min-h-full flex-col">
          {(back || lead || language) && (
            <PageHead back={back} lead={lead} className="px-4 pt-3">
              {language && <LanguagePicker />}
            </PageHead>
          )}
          <div className={cn('flex flex-1 flex-col items-center justify-center px-6 py-12 phone:px-4 phone:py-8', actions && 'pb-0 phone:pb-0', strip && 'py-8')}>
            <div className="flex w-[560px] max-w-full flex-col gap-8">
              <header className={cn('flex flex-col gap-2', start ? 'text-left' : 'text-center')}>
                {logo && (
                  <span aria-hidden className={cn('mb-4 flex', start ? 'justify-start' : 'justify-center')}>
                    <Logo width={160} />
                  </span>
                )}
                {eyebrow && <p className="imm-count my-0">{eyebrow}</p>}
                <h1 className="imm-title">{title}</h1>
                {sub && <p className={cn('my-0', start ? 'imm-plan-text' : 'imm-subtitle')}>{sub}</p>}
              </header>
              {children}
            </div>
            {/* across the whole page, so its blur reaches both edges */}
            {actions && (
              <div className="imm-step-bar -mx-6 self-stretch px-6 phone:-mx-4 phone:px-4" data-stuck={stuck || undefined}>
                <div className="mx-auto w-[560px] max-w-full">{actions}</div>
              </div>
            )}
            {actions && <div ref={barEnd} aria-hidden className="-mt-px h-px self-stretch" />}
            {/* 32 under what is over it: the bar's own 16 and 16 more, or 32 */}
            {footer && <footer className={cn('flex w-[560px] max-w-full flex-wrap justify-center gap-1 pb-8 phone:pb-6', actions ? 'mt-4' : 'mt-8')}>{footer}</footer>}
          </div>
          {strip && <MemoryStrip />}
        </div>
      </div>
    </div>
  );
}

// One glass card with fields, as the part open in the form, for a page of the
// same flow that has one part only (documents, the talk, thanks): r24, p16,
// the questions 24 apart, so nothing changes from the form to the end.
export function StepPanel({ className, children }) {
  return (
    <section data-slot="step-panel" className={cn('imm-step is-open flex flex-col gap-6 p-4', className)}>
      {children}
    </section>
  );
}

// The fields on the sky, with no glass card around them (the sign-in and its
// steps, decided 23. 11.): each field is its own, narrower than the page's
// column, 24 apart as in a card.
export function StepFields({ className, children }) {
  return (
    <section data-slot="step-fields" className={cn('flex w-[400px] max-w-full flex-col gap-6 self-center', className)}>
      {children}
    </section>
  );
}

// the parts 8 apart (gap-2); an opened part stops as far under the screen's
// top. A part not open is a row this tall (min-h-14).
const STEP_GAP = 8;
const ROW = 56;
export function StepCards({ className, children }) {
  return (
    <div data-slot="step-cards" className={cn('flex flex-col gap-2', className)}>
      {children}
    </div>
  );
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

// A part as it was given, on the review after the form, as a part of the
// family's plan after the onboarding: on the sky, no card; its name, then each
// question and its answer as a row, the question left and the answer right (on
// a phone the question over the answer); a question left empty says so.
// `onEdit`: "Izmeni" at the right of the part's name opens that part in the
// form (decided 13. 11., Branislav)
export function StepReview({ title, rows, onEdit }) {
  return (
    <section data-slot="step-review" className="imm-review-part">
      <div className="imm-review-head">
        <h2 className="imm-review-title">{title}</h2>
        {onEdit && (
          <Button variant="ghost" size="sm" className="-my-0.5 shrink-0" onClick={onEdit} aria-label={t('Izmenite: {title}', { title })}>
            {t('Izmeni')}
          </Button>
        )}
      </div>
      <dl className="imm-review-rows">
        {rows.map(([label, value], i) => (
          <div key={i} className="contents">
            <dt>{label}</dt>
            <dd>{value || <span className="is-empty">{t('Nije navedeno')}</span>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// state: 'active' (open), 'done' (a row that opens it again), 'upcoming'
export function StepCard({ n, title, sub, state, summary = [], onOpen, onNext, nextLabel, children }) {
  const still = useReducedMotion();
  const inner = useRef(null);
  const fields = useRef(null);
  // opened after the page came (by "Dalje" or its row), so its first field
  // takes the focus once it has grown. The part open from the start takes it
  // only with a mouse and a keyboard, and only if it begins with a typed
  // field (§10, decided 16. 11.): never on a phone.
  const focusOnOpen = useRef(false);
  useEffect(() => {
    if (state !== 'active' || !pageFocus()) return;
    const first = fields.current?.querySelector('input:not([type=hidden]), textarea, button, [role=radio], [role=checkbox]');
    if (first && first.matches('input:not([type=checkbox]):not([type=radio]), textarea')) first.focus({ preventScroll: true });
    // only as the page comes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

  // its top 8 under the screen's top, as the parts are apart (decided 9. 11.,
  // Branislav; the 8 on 25. 11.), in one move with the heights (as long, the
  // same ease), not by the browser's own smooth scroll, which kept its own
  // pace. Where the top will be is asked again on every frame, from where
  // things are then: each part above as the row it is becoming (56, min-h-14),
  // and the page centred while it is short, so it moves as the heights do.
  const scrolling = useRef(null);
  const toTop = () => {
    const card = inner.current?.closest('[data-slot=step-card]');
    const page = card?.closest('[data-slot=step-scroll]');
    if (!page) return;
    const above = [...card.parentElement.children].filter((c) => c !== card && c.matches('[data-slot=step-card]') && c.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING);
    const goal = () => {
      const fold = above.reduce((sum, c) => sum + c.offsetHeight - ROW, 0);
      return Math.max(0, card.getBoundingClientRect().top - page.getBoundingClientRect().top + page.scrollTop - fold - STEP_GAP);
    };
    const from = page.scrollTop;
    scrolling.current?.stop();
    if (still) page.scrollTop = goal();
    else
      scrolling.current = animate(0, 1, {
        duration: 0.25,
        ease: EASE,
        onUpdate: (p) => (page.scrollTop = from + (goal() - from) * p),
        onComplete: () => (page.scrollTop = goal()),
      });
  };
  useEffect(() => () => scrolling.current?.stop(), []);
  const settle = () => {
    setMoving(false);
    if (open && focusOnOpen.current) {
      focusOnOpen.current = false;
      // never on a phone: the keyboard would cover the part just opened
      if (pageFocus()) fields.current?.querySelector('input:not([type=hidden]), textarea, button')?.focus({ preventScroll: true });
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
      onAnimationStart={() => {
        setMoving(true);
        if (open && focusOnOpen.current) toTop();
      }}
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
