import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, Link2, Pencil } from 'lucide-react';
import { answerSummary, dependentsOf, isLoadBearing } from '../data/dependencies';
import Chip from './Chip';
import Button from './Button';

// The last stop before the plan: everything the user told us, in one place, with a
// way back into any answer. Rows whose answer decides which follow-up questions get
// asked ask for confirmation first — silently binning answers they already gave
// would be the worst possible moment to surprise them.
export default function ReviewCard({ groups, answers, onEdit, onConfirm, name }) {
  const [confirming, setConfirming] = useState(null); // questionId awaiting confirmation

  const request = (question) => {
    if (!isLoadBearing(question.id)) return onEdit(question);
    const dependents = dependentsOf(question.id, answers);
    if (!dependents.length) return onEdit(question);
    setConfirming(question.id);
  };

  return (
    <div className="workflow-card review-card">
      <div className="review-head">
        <p className="doc-section-title">Pre nego što napravim plan</p>
        <p className="doc-p">
          Evo svega što ste mi rekli. Pročitajte — sve još može da se promeni.
        </p>
      </div>

      {groups.map((group) => (
        <div className="review-group" key={group.id}>
          <p className="review-group-title">{group.title}</p>
          {group.questions.map((q) => {
            const dependents = confirming === q.id ? dependentsOf(q.id, answers) : [];
            return (
              <div className="review-row" key={q.id}>
                <div className="review-row-main">
                  <div className="review-row-text">
                    <span className="review-label">
                      {q.shortTitle}
                      {isLoadBearing(q.id) && (
                        <span className="review-linked" title="Later questions depend on this">
                          <Link2 size={11} strokeWidth={2} />
                        </span>
                      )}
                    </span>
                    <span className="review-chips">
                      {answerSummary(q, answers[q.id]).map((v, i) => (
                        <Chip key={`${v}-${i}`}>{v}</Chip>
                      ))}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    iconOnly
                    aria-label={`Izmeni: ${q.shortTitle}`}
                    onClick={() => request(q)}
                  >
                    <Pencil size={14} strokeWidth={1.75} />
                  </Button>
                </div>

                {/* The warning the user asked for: name the cost before they pay it. */}
                <AnimatePresence initial={false}>
                  {confirming === q.id && (
                    <motion.div
                      className="review-warning"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
                    >
                      <div className="review-warning-inner">
                        <AlertTriangle size={14} strokeWidth={2} className="review-warning-icon" />
                        <div className="review-warning-text">
                          <p className="review-warning-title">
                            Od ovog odgovora zavisi koja pitanja slede
                          </p>
                          <p className="review-warning-note">
                            Izmena može da pomeri nivo krhkosti. Ako se to desi, dopunska pitanja na
                            koja ste već odgovorili ({dependents.length}) više ne bi važila, i pitala
                            bih vas druga — {dependents.map((d) => d.shortTitle).join(', ')}.
                          </p>
                          <div className="review-warning-actions">
                            <Button
                              variant="primary"
                              onClick={() => {
                                setConfirming(null);
                                onEdit(q);
                              }}
                            >
                              Ipak promeni
                            </Button>
                            <Button variant="secondary" onClick={() => setConfirming(null)}>
                              Ostavi kako jeste
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ))}

      <div className="review-footer">
        <Button variant="primary" size="lg" onClick={onConfirm}>
          <Check size={14} strokeWidth={2} /> Sve je tačno — napravi plan
        </Button>
      </div>
    </div>
  );
}
