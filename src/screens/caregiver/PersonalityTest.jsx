import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import Dialog from '../../components/Dialog';
import GradientBackground from '../../components/immersive/GradientBackground';
import { PAIRS, TRAITS, traitOf } from '../../data/personalityTest';
import { SkyBack } from '../../components/HeaderBack';
import { t } from '@/i18n';

// The personality test of the Serbian sign-up (docs/patterns.md §12d): one pair
// a screen, in the onboarding's language and over the whole page. A choice goes
// on by itself: "Dalje" on each of 62 pairs would be 124 touches. "Nazad" takes
// back a wrong one, and the last pair waits for "Pošalji test". `onExit`: out
// of the sign-up, from the head's top left (docs/patterns.md §4).

// how long a chosen card stays lit before the next pair comes
const HOLD_MS = 250;
const HINT_MS = 8000;

// The steps lead on only the first time; opened again from the corner, each is
// read and closed.
function Guide({ step, first, onStep, onClose }) {
  return (
    <Dialog wide eyebrow={t('Test ličnosti')} title={step === 'guide' ? t('Uputstvo za rad') : t('Definicije osobina')} onClose={onClose}>
      {step === 'guide' ? (
        <>
          <div className="flex flex-col gap-2 text-xs leading-body text-foreground">
            <p>{t('U svakom paru osobina izaberite onu koja vam, kao osobi, više odgovara. Pre nego što izaberete, obavezno pročitajte definicije osobina.')}</p>
            <p className="font-medium">{t('Najvažnije je da u svakom paru osobina (kojih ima ukupno {n}) izaberete samo jednu.', { n: PAIRS.length })}</p>
            <p>{t('Svaki par osobina posmatrajte odvojeno, nezavisno od svih ostalih (koje ste već birali ili tek treba da birate). Dakle, normalno je da ne morate uvek da odaberete jednu te istu osobinu kada na nju naiđete.')}</p>
          </div>
          {first && (
            <DialogFooter>
              <Button onClick={() => onStep('traits')}>{t('Dalje')}</Button>
            </DialogFooter>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {TRAITS.map((x) => (
              <div key={x.id} className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">{t(x.name)}</p>
                <p className="text-xs leading-body text-muted-foreground">{t(x.text)}</p>
              </div>
            ))}
          </div>
          {first && (
            <DialogFooter>
              <Button variant="secondary" onClick={() => onStep('guide')}>
                {t('Nazad')}
              </Button>
              <Button onClick={onClose}>{t('Započni test')}</Button>
            </DialogFooter>
          )}
        </>
      )}
    </Dialog>
  );
}

export default function PersonalityTest({ f, set, onBack, onExit, onSend }) {
  const answered = Object.keys(f.test).length;
  const [at, setAt] = useState(Math.min(answered, PAIRS.length - 1));
  // the first time is read from what is there (§4b): no pair chosen yet, and
  // the guide not read through before (gone back to the review and come again,
  // it does not lead in a second time, nor point at the corner; decided
  // 13. 11., Branislav). Kept with her form, so a reload knows it too.
  const first = useRef(!answered && !f.guideSeen);
  const [guide, setGuide] = useState(first.current ? 'guide' : null);
  const [hint, setHint] = useState(false);
  const pending = useRef(null);
  const moved = useRef(false);
  const still = useReducedMotion();

  useEffect(() => () => clearTimeout(pending.current), []);
  useEffect(() => {
    if (!hint) return undefined;
    const id = setTimeout(() => setHint(false), HINT_MS);
    return () => clearTimeout(id);
  }, [hint]);

  const openGuide = (step) => {
    setHint(false);
    setGuide(step);
  };
  const closeGuide = () => {
    setGuide(null);
    if (first.current) {
      setHint(true);
      set({ guideSeen: true });
    }
    first.current = false;
  };
  const go = (to) => {
    moved.current = true;
    setAt(to);
  };
  const pick = (choice) => {
    if (pending.current) return;
    setHint(false);
    set({ test: { ...f.test, [at]: choice } });
    if (at === PAIRS.length - 1) return;
    pending.current = setTimeout(() => {
      pending.current = null;
      go(at + 1);
    }, HOLD_MS);
  };
  const back = () => {
    clearTimeout(pending.current);
    pending.current = null;
    if (at === 0) onBack();
    else go(at - 1);
  };

  return (
    <motion.div className="immersive is-test" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }}>
      <GradientBackground />

      <div className="imm-chrome">
        {onExit && (
          <div className="imm-ctls is-start">
            <SkyBack short label={t('Nazad na početak')} onClick={onExit} />
          </div>
        )}
        <div className="imm-ctls">
          <button type="button" className="imm-ctl is-text" onClick={() => openGuide('guide')}>
            {t('Uputstvo')}
          </button>
          <button type="button" className="imm-ctl is-text" onClick={() => openGuide('traits')}>
            {t('Definicije osobina')}
          </button>
          <AnimatePresence>
            {hint && (
              <motion.button
                type="button"
                className="imm-nudge"
                onClick={() => setHint(false)}
                initial={{ opacity: 0, y: still ? 0 : -12 }}
                animate={still ? { opacity: 1 } : { opacity: 1, y: [-12, 0, -4, 0, -4, 0] }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{
                  opacity: { delay: 0.3, duration: 0.2 },
                  y: { delay: 0.3, duration: 1.6, times: [0, 0.2, 0.4, 0.6, 0.8, 1], ease: 'easeInOut' },
                }}
              >
                {t('Uputstvo i definicije možete da otvorite kad god vam zatrebaju.')}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="imm-stage">
        <div className="imm-screen is-wide">
          <p className="imm-count" aria-live="polite">
            {t('{n} od {m}', { n: at + 1, m: PAIRS.length })}
          </p>
          <div className="imm-test-bar" aria-hidden="true">
            <span style={{ width: `${((at + 1) / PAIRS.length) * 100}%` }} />
          </div>
          <h1 className="imm-title">{t('Koja vam osobina više odgovara?')}</h1>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={at}
              // the next pair takes the focus the chosen card had
              ref={(el) => {
                if (el && moved.current) {
                  moved.current = false;
                  el.querySelector('button')?.focus({ preventScroll: true });
                }
              }}
              className="imm-options is-pair"
              initial={{ opacity: 0, y: still ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
            >
              {PAIRS[at].map((id, i) => {
                const trait = traitOf(id);
                const on = f.test[at] === i;
                return (
                  <motion.button
                    key={id}
                    type="button"
                    whileHover={{ y: -1 }}
                    className={`imm-option is-trait${on ? ' is-selected' : ''}`}
                    aria-pressed={on}
                    onClick={() => pick(i)}
                  >
                    <span className="imm-letter">{i + 1}</span>
                    <span className="imm-option-text">
                      <span className="imm-option-title">{t(trait.name)}</span>
                      <span className="imm-option-sub">{t(trait.text)}</span>
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
          <div className="imm-actions gap-2">
            <Button variant="secondary" size="lg" onClick={back}>
              {t('Nazad')}
            </Button>
            {at === PAIRS.length - 1 && f.test[at] != null && (
              <Button size="lg" onClick={onSend}>
                {t('Pošalji test')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {guide && <Guide step={guide} first={first.current} onStep={setGuide} onClose={closeGuide} />}
    </motion.div>
  );
}
