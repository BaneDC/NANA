import { AnimatePresence, motion } from 'framer-motion';

// How well Jovana understands the family's situation, as a plain scale docked at
// the top centre of the screen — out of the way of the question, and centred
// like everything else on it.
//
// It used to be a portrait coming into focus, with lists beside it of what she
// knew and what she was missing. That part is said in her thinking now, so all
// this has to answer is "how far along are we", at a glance: five named steps,
// filling as she learns.
//
// The number can fall, and the scale shows it: when something she is told opens
// a question she did not know existed, the fill goes back and says so, rather
// than holding still to look like progress.

// Named steps rather than a percentage. A percent invites arithmetic on a
// judgement — "why 64 and not 70" has no answer worth giving.
const STEPS = [
  { from: 0, to: 25, word: 'Tek počinjemo' },
  { from: 25, to: 50, word: 'Upoznajemo se' },
  { from: 50, to: 75, word: 'Slika se sklapa' },
  { from: 75, to: 92, word: 'Skoro je jasno' },
  { from: 92, to: 100, word: 'Znam dovoljno' },
];

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export default function UnderstandingPanel({ level = 0, dropped }) {
  const word = STEPS.filter((s) => level >= s.from).pop().word;

  return (
    // The dock does the centring, so the pill's own transform is free for its
    // entrance — a translateX(-50%) on it would be overwritten by the animation.
    <div className="imm-know-dock">
      <motion.div
        className={`imm-know${dropped ? ' is-dropped' : ''}`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut', delay: 0.4 } }}
        role="meter"
        aria-label="Koliko vas razumem"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={level}
        aria-valuetext={word}
      >
        <span className="imm-know-label">Koliko vas razumem</span>
        <span className="imm-know-scale" aria-hidden="true">
          {STEPS.map((s) => (
            <span className="imm-know-step" key={s.from}>
              <motion.span
                className="imm-know-fill"
                initial={false}
                animate={{ scaleX: clamp01((level - s.from) / (s.to - s.from)) }}
                transition={{ type: 'spring', stiffness: 55, damping: 18 }}
              />
            </span>
          ))}
        </span>
        <span className="imm-know-word">{word}</span>
        <AnimatePresence>
          {dropped && (
            <motion.span
              className="imm-know-drop"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              otvorilo se novo pitanje
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
