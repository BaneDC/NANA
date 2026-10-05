import { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import QuestionItem from './QuestionItem';
import Button from './Button';

// Fold from three rows up, so every section behaves the same way.
export const FOLDABLE_FROM = 3;

const contentMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, delay: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

// One step of the questionnaire — the grey card holding its questions. Once the
// conversation has moved past it, it folds down to a single summary row.
export default function QuestionSection({
  step,
  questions,
  answers,
  activeIndex,
  collapsible,
  onCommit,
  onEdit,
  readOnly,
}) {
  const [expanded, setExpanded] = useState(false);
  const folded = collapsible && !expanded;

  // the caller filters by frailty band, so a section only ever shows what applies
  const items = questions ?? step.questions;
  const summary = items.map((q) => q.shortTitle).join(' · ');

  return (
    <LayoutGroup id={step.id}>
      <motion.div layout className="workflow-card" style={{ borderRadius: 32 }}>
        {/* A folded section is one row, not a peek at the list: the peek cost more
            height than the answers it showed. layout="position" keeps the content
            from stretching while the card resizes around it. */}
        <AnimatePresence mode="popLayout" initial={false}>
          {folded ? (
            <motion.button
              key="summary"
              type="button"
              layout="position"
              className="answers-summary"
              onClick={() => setExpanded(true)}
              {...contentMotion}
            >
              <span className="answers-summary-count">{items.length} answers</span>
              <span className="answers-summary-list">{summary}</span>
              <ChevronDown size={14} strokeWidth={1.75} className="answers-summary-chevron" />
            </motion.button>
          ) : (
            <motion.div key="list" layout="position" className="answers" {...contentMotion}>
              {items.map((q, i) => (
                <QuestionItem
                  key={q.id}
                  question={q}
                  number={i + 1}
                  state={i === activeIndex ? 'active' : answers[q.id] ? 'collapsed' : 'upcoming'}
                  isActive={i === activeIndex}
                  answer={answers[q.id]}
                  readOnly={readOnly}
                  onCommit={(a) => onCommit(q.id, a)}
                  onEdit={() => onEdit(i)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {collapsible && expanded && (
          <div className="answers-toggle">
            <Button variant="secondary" onClick={() => setExpanded(false)} aria-expanded>
              Hide answers
              <ChevronDown size={14} strokeWidth={1.75} className="toggle-chevron is-up" />
            </Button>
          </div>
        )}
      </motion.div>
    </LayoutGroup>
  );
}
