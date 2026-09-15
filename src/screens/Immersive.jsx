import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  LayoutList,
  Pencil,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { applicableQuestions, flowContext, steps } from '../data/flow';
import { frailtyOf } from '../data/frailty';
import { answerSummary, dependentsOf, isLoadBearing, reconcile } from '../data/dependencies';
import { FIELD_HINTS, FIELD_PLACEHOLDERS, FIELD_PROMPTS } from '../data/prompts';
import { buildPlan, caregivers } from '../data/carePlan';
import CloudBackground from '../components/immersive/CloudBackground';
import { AMBIENT_AUDIO, createZenAudio } from '../lib/zenAudio';
import Button from '../components/Button';

const letterFor = (i) => String.fromCharCode(97 + i);

const EASE_OUT = [0.22, 0.61, 0.36, 1];
const EASE_IN = [0.55, 0.06, 0.68, 0.19];

// The screen orchestrates: its pieces arrive one after another, and on the way out
// they leave in reverse — the last thing you looked at is the first to go.
const screen = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.065, delayChildren: 0.05 } },
  exit: { opacity: 0, transition: { staggerChildren: 0.035, staggerDirection: -1 } },
};

const piece = {
  initial: { opacity: 0, y: 20, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE_OUT } },
  exit: { opacity: 0, y: -12, scale: 1.01, transition: { duration: 0.3, ease: EASE_IN } },
};

// a list is a piece that in turn staggers its own children
const list = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.055 } },
  exit: { opacity: 0, transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

// The footer row of an asking screen. Back sits opposite the forward control, and
// single-select screens get one too even though they auto-advance and have no
// Continue — otherwise the only question type you cannot reverse out of is the
// most common one.
function ImmActions({ onBack, children }) {
  return (
    <motion.div className={`imm-actions${onBack ? ' has-back' : ''}`} variants={piece}>
      {onBack && (
        <Button variant="secondary" size="lg" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={1.75} />
          Back
        </Button>
      )}
      {children}
    </motion.div>
  );
}

const isAskable = (s) => s.type === 'question' || s.type === 'field';
const answeredIn = (answers) => (s) => !!answers[s.type === 'field' ? s.questionId : s.id];

// The screens, in order, for a given set of answers. Branching means this depends on
// the answers themselves, so it is a plain function rather than fixed state: a commit
// can build the *next* sequence and decide where to go before React re-renders.
function buildSequence(answers) {
  const level = frailtyOf(answers)?.level;
  const ctx = flowContext(answers, level);
  const seq = [];

  steps.forEach((step) => {
    const qs = applicableQuestions(step, ctx);
    if (!qs.length) return;
    seq.push({ type: 'intro', id: `intro-${step.id}`, text: step.intro });
    qs.forEach((q) => {
      if (q.type === 'inputs') {
        // each field becomes its own screen; the answer is only committed once the
        // last one is filled, so a half-finished question never counts as answered
        q.fields.forEach((field, fi) => {
          seq.push({
            type: 'field',
            id: `${q.id}:${field.id}`,
            questionId: q.id,
            question: q,
            field,
            isLast: fi === q.fields.length - 1,
          });
        });
      } else {
        seq.push({ type: 'question', id: q.id, question: q });
      }
    });
    // the pivot of the client's flow: state the level before branching on it
    if (step.id === 'daily-life' && ctx.level) {
      seq.push({ type: 'frailty', id: 'frailty-reveal' });
    }
  });

  return seq;
}

function SingleQ({ question, initial, onBack, onCommit }) {
  const [picked, setPicked] = useState(null);
  // `picked` doubles as the commit-in-flight lock, so the previously given answer
  // is shown separately — otherwise coming back to a question you have already
  // answered would either look blank or refuse to accept a different option.
  const shown = picked ?? initial ?? null;
  return (
    <>
      <motion.div className="imm-options" variants={list}>
        {question.options.map((opt, i) => (
          <motion.button
            key={opt.id}
            type="button"
            variants={piece}
            whileHover={{ y: -1 }}
            className={`imm-option${shown === opt.id ? ' is-selected' : ''}`}
            onClick={() => {
              if (picked) return;
              setPicked(opt.id);
              setTimeout(() => onCommit({ optionId: opt.id }), 500);
            }}
          >
            <span className="imm-letter">{letterFor(i)}</span>
            <span className="imm-option-text">
              <span className="imm-option-title">{opt.title}</span>
              {opt.description && <span className="imm-option-desc">{opt.description}</span>}
            </span>
          </motion.button>
        ))}
      </motion.div>
      {onBack && <ImmActions onBack={onBack} />}
    </>
  );
}

function MultiQ({ question, initial, initialOther, onBack, onCommit }) {
  const [ids, setIds] = useState(() => [...(initial || [])]);
  const [otherText, setOtherText] = useState(() => initialOther || '');
  const toggle = (id) =>
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const other = otherText.trim();
  const empty = ids.length === 0 && !other;
  const commit = () =>
    !(!question.allowEmpty && empty) && onCommit({ optionIds: ids, ...(other ? { other } : {}) });

  return (
    <>
      <motion.div className="imm-options" variants={list}>
        {question.options.map((opt, i) => (
          <motion.button
            key={opt.id}
            type="button"
            variants={piece}
            whileHover={{ y: -1 }}
            className={`imm-option${ids.includes(opt.id) ? ' is-selected' : ''}`}
            onClick={() => toggle(opt.id)}
          >
            <span className="imm-letter">{letterFor(i)}</span>
            <span className="imm-option-text">
              <span className="imm-option-title">{opt.title}</span>
              {opt.description && <span className="imm-option-desc">{opt.description}</span>}
            </span>
          </motion.button>
        ))}

        {/* Reads as one more card, but it is a text field — for when the list
            simply does not contain what this family needs. */}
        {question.allowOther && (
          <motion.label
            variants={piece}
            className={`imm-option is-other${other ? ' is-selected' : ''}`}
          >
            <span className="imm-letter">{letterFor(question.options.length)}</span>
            <span className="imm-option-text">
              <input
                type="text"
                className="imm-option-input"
                value={otherText}
                placeholder={question.otherPlaceholder || 'Something else'}
                onChange={(e) => setOtherText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                }}
              />
            </span>
          </motion.label>
        )}
      </motion.div>
      <ImmActions onBack={onBack}>
        <Button variant="primary" size="lg" disabled={!question.allowEmpty && empty} onClick={commit}>
          {question.allowEmpty && empty ? 'None of these' : 'Continue'}
        </Button>
      </ImmActions>
    </>
  );
}

// One field on its own screen — the reason the immersive variant reads as a
// conversation rather than a form.
function FieldQ({ item, initial, onBack, onCommit }) {
  const [value, setValue] = useState(initial || '');
  const ref = useRef(null);
  const optional = !!item.field.optional;
  const ready = optional || value.trim().length > 0;

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus({ preventScroll: true }), 700);
    return () => clearTimeout(t);
  }, [item.id]);

  const commit = () => ready && onCommit(value.trim());

  return (
    <>
      <motion.label className="imm-single-field" variants={piece}>
        <input
          ref={ref}
          type="text"
          placeholder={FIELD_PLACEHOLDERS[item.field.id] || item.field.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
          }}
        />
      </motion.label>
      <ImmActions onBack={onBack}>
        <Button variant="primary" size="lg" disabled={!ready} onClick={commit}>
          {optional && !value.trim() ? 'Skip' : 'Continue'}
        </Button>
      </ImmActions>
    </>
  );
}

// The immersive questionnaire: one question at a time over slowly drifting clouds,
// with generative ambient audio, ending on the care plan without leaving the calm.
export default function Immersive({ user, answers, onAnswer, onPlan, onExit, onFinish }) {
  const frailty = frailtyOf(answers);
  const sequence = useMemo(() => buildSequence(answers), [answers]);

  const isAnswered = answeredIn(answers);
  const askable = useMemo(() => sequence.filter(isAskable), [sequence]);

  // Position is tracked by screen id, not index: branching rebuilds the sequence
  // underneath us and an index would silently point at a different question.
  const [currentId, setCurrentId] = useState(() => {
    const firstOpen = sequence.findIndex((s) => isAskable(s) && !isAnswered(s));
    if (firstOpen === -1) return null;
    const prev = sequence[firstOpen - 1];
    return (prev?.type === 'intro' ? prev : sequence[firstOpen]).id;
  });
  const [stage, setStage] = useState(currentId ? 'asking' : 'review');
  const [returning, setReturning] = useState(false); // came here from the review
  const [flowChange, setFlowChange] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [confirmChange, setConfirmChange] = useState(null); // question awaiting confirmation
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!AMBIENT_AUDIO) return undefined;
    const audio = createZenAudio();
    audio.start(); // mounting is the result of a click, so autoplay is allowed
    audioRef.current = audio;
    return () => audio.stop();
  }, []);

  // a beat to breathe, then the plan — we stay inside the experience for it
  useEffect(() => {
    if (stage !== 'breath') return;
    const t = setTimeout(() => setStage('plan'), 2600);
    return () => clearTimeout(t);
  }, [stage]);

  const plan = useMemo(() => (stage === 'plan' ? buildPlan(answers) : null), [stage, answers]);

  // make sure the app has the plan before the user can be redirected to it
  useEffect(() => {
    if (plan) onPlan(plan);
  }, [plan, onPlan]);

  const current =
    sequence.find((s) => s.id === currentId) ??
    sequence.find((s) => isAskable(s) && !isAnswered(s)) ??
    sequence[sequence.length - 1];

  // Where to go once an answer has landed, decided against the answers that answer
  // produced rather than the ones on screen.
  const settle = (nextAnswers, fromId) => {
    const seq = buildSequence(nextAnswers);
    const done = answeredIn(nextAnswers);

    if (returning) {
      // an edit may have opened questions that were never asked; clear those first,
      // then go back to the review the user came from
      const open = seq.find((s) => isAskable(s) && !done(s));
      if (!open) {
        setReturning(false);
        setStage('review');
        return;
      }
      setCurrentId(open.id);
      setStage('asking');
      return;
    }

    let i = seq.findIndex((s) => s.id === fromId) + 1;
    while (i < seq.length && isAskable(seq[i]) && done(seq[i])) i += 1;
    if (i >= seq.length) setStage('review');
    else setCurrentId(seq[i].id);
  };

  // One screen back. If the user got here by editing from the review, back means
  // the review — that is where they came from, not the previous question.
  const seqIndex = sequence.findIndex((s) => s.id === current?.id);
  const canGoBack = stage === 'asking' && (returning || seqIndex > 0);
  const goBack = () => {
    if (returning) {
      setReturning(false);
      setStage('review');
      return;
    }
    if (seqIndex > 0) setCurrentId(sequence[seqIndex - 1].id);
  };

  const commitQuestion = (questionId, answer) => {
    const result = reconcile(answers, { ...answers, [questionId]: answer });
    onAnswer(questionId, answer);
    // Only an edit is news. Running forward, the estimate moves with every answer
    // and the branch questions simply appear — nothing the user gave is lost.
    if (result.dropped.length) {
      setFlowChange(result);
      setStage('notice');
      return;
    }
    settle(result.answers, current.id);
  };

  const commitField = (item, value) => {
    const draft = { ...(drafts[item.questionId] || {}), [item.field.id]: value };
    setDrafts((d) => ({ ...d, [item.questionId]: draft }));
    const next = item.isLast ? { ...answers, [item.questionId]: { values: draft } } : answers;
    if (item.isLast) onAnswer(item.questionId, { values: draft });
    settle(next, item.id);
  };

  // From the review back into a single answer. Load-bearing answers ask first.
  const editAnswer = (question) => {
    const target = sequence.find(
      (s) => s.id === question.id || (s.type === 'field' && s.questionId === question.id)
    );
    if (!target) return;
    setConfirmChange(null);
    setFlowChange(null);
    setReturning(true);
    setCurrentId(target.id);
    setStage('asking');
  };

  const requestEdit = (question) => {
    if (!isLoadBearing(question.id) || !dependentsOf(question.id, answers).length) {
      return editAnswer(question);
    }
    setConfirmChange(question);
  };

  const reviewGroups = steps
    .map((step) => ({
      id: step.id,
      questions: applicableQuestions(step, flowContext(answers, frailty?.level)).filter(
        (q) => answers[q.id]
      ),
    }))
    .filter((g) => g.questions.length);

  // Counted by position in the flow, not by committed answers: a four-field question
  // commits once, so counting answers left the number frozen for four screens then
  // jumping by four.
  const position = current ? askable.findIndex((s) => s.id === current.id) : -1;
  const total = askable.length;
  const progress = stage === 'asking' ? Math.max(0, position) / total : 1;

  const firstName = user.name.split(' ')[0];
  const planName = answers['about-person']?.values?.name?.trim().split(' ')[0] || 'them';
  const preview = caregivers.slice(0, 2);

  return (
    <motion.div
      className="immersive"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.9, ease: 'easeOut' } }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeIn' } }}
    >
      <CloudBackground />

      <div className="imm-chrome">
        <div
          className="imm-progress"
          role="progressbar"
          aria-valuenow={Math.max(0, position)}
          aria-valuemax={total}
        >
          <div className="imm-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="imm-ctls">
          {AMBIENT_AUDIO && (
            <button
              type="button"
              className="imm-ctl"
              onClick={() => {
                const next = !muted;
                setMuted(next);
                audioRef.current?.setMuted(next);
              }}
              aria-label={muted ? 'Unmute music' : 'Mute music'}
            >
              {muted ? <VolumeX size={15} strokeWidth={1.75} /> : <Volume2 size={15} strokeWidth={1.75} />}
            </button>
          )}
          <button type="button" className="imm-ctl" onClick={onExit} aria-label="Switch to classic view">
            <LayoutList size={15} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="imm-stage">
        <AnimatePresence mode="wait">
          {/* Everything they told us, before anything is built from it. */}
          {stage === 'review' && (
            <motion.div key="review" className="imm-screen is-wide" variants={screen} initial="initial" animate="animate" exit="exit">
              <motion.p className="imm-count" variants={piece}>
                One last look
              </motion.p>
              <motion.h1 className="imm-title" variants={piece}>
                Have I got this right?
              </motion.h1>
              <motion.p className="imm-subtitle" variants={piece}>
                Everything you’ve told me about {planName}. Anything can still be changed.
              </motion.p>

              <motion.div className="imm-review" variants={list}>
                {reviewGroups.flatMap((g) =>
                  g.questions.map((q) => (
                    <motion.button
                      key={q.id}
                      type="button"
                      variants={piece}
                      className="imm-review-row"
                      onClick={() => requestEdit(q)}
                    >
                      <span className="imm-review-label">{q.shortTitle}</span>
                      <span className="imm-review-value">
                        {answerSummary(q, answers[q.id]).join(' · ')}
                      </span>
                      <Pencil size={13} strokeWidth={1.75} className="imm-review-pencil" />
                    </motion.button>
                  ))
                )}
              </motion.div>

              <AnimatePresence>
                {confirmChange && (
                  <motion.div
                    className="imm-warning"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    <AlertTriangle size={15} strokeWidth={2} />
                    <div>
                      <p className="imm-warning-title">
                        “{confirmChange.shortTitle}” decides what I ask afterwards
                      </p>
                      <p className="imm-warning-note">
                        Changing it can move {planName}’s frailty level, and{' '}
                        {dependentsOf(confirmChange.id, answers).length} answer
                        {dependentsOf(confirmChange.id, answers).length === 1 ? '' : 's'} you
                        already gave would be replaced with different questions.
                      </p>
                      <div className="imm-warning-actions">
                        <Button variant="primary" onClick={() => editAnswer(confirmChange)}>
                          Change it anyway
                        </Button>
                        <Button variant="secondary" onClick={() => setConfirmChange(null)}>
                          Leave it
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div className="imm-actions" variants={piece}>
                <Button variant="primary" size="lg" onClick={() => setStage('breath')}>
                  That’s all correct
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* An edit moved the level: say what changed before asking anything new. */}
          {stage === 'notice' && flowChange && (
            <motion.div key="notice" className="imm-screen" variants={screen} initial="initial" animate="animate" exit="exit">
              <motion.p className="imm-count" variants={piece}>
                That changed things
              </motion.p>
              <motion.h1 className="imm-title" variants={piece}>
                {planName} now looks like level {flowChange.level}, not {flowChange.previousLevel}
              </motion.h1>
              <motion.p className="imm-subtitle" variants={piece}>
                {flowChange.dropped.length > 0 &&
                  `I've set aside what you told me about ${flowChange.dropped
                    .map((q) => q.shortTitle.toLowerCase())
                    .join(', ')}. `}
                {flowChange.added.length > 0 &&
                  `There ${flowChange.added.length === 1 ? 'is' : 'are'} ${
                    flowChange.added.length
                  } thing${flowChange.added.length === 1 ? '' : 's'} I need to ask instead.`}
              </motion.p>
              <motion.div className="imm-actions" variants={piece}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setFlowChange(null);
                    settle(answers, current?.id);
                  }}
                >
                  Continue
                </Button>
              </motion.div>
            </motion.div>
          )}

          {stage === 'breath' && (
            <motion.div key="breath" className="imm-screen" variants={screen} initial="initial" animate="animate" exit="exit">
              <motion.p className="imm-intro-text" variants={piece}>
                That’s everything, {firstName}. Take a breath — I’m putting the plan together.
              </motion.p>
            </motion.div>
          )}

          {stage === 'plan' && plan && (
            <motion.div key="plan" className="imm-screen is-wide" variants={screen} initial="initial" animate="animate" exit="exit">
              <motion.p className="imm-count" variants={piece}>
                Your care plan
              </motion.p>
              <motion.h1 className="imm-title" variants={piece}>
                Here’s the plan for {plan.firstName}
              </motion.h1>

              {plan.narrative.map((p, i) => (
                <motion.p className="imm-plan-summary" variants={piece} key={i}>
                  {p}
                </motion.p>
              ))}

              {/* the coordinator's message, the part the client cared most about */}
              <motion.div className="imm-note" variants={piece}>
                <p className="imm-note-greeting">{plan.letter.greeting}</p>
                <p className="imm-note-body">
                  {plan.letter.paragraphs[plan.letter.paragraphs.length - 1]}
                </p>
                <p className="imm-note-sign">
                  — {plan.coordinator.name}, {plan.coordinator.role.toLowerCase()}
                </p>
              </motion.div>

              <motion.p className="imm-plan-note" variants={piece}>
                {caregivers.length} caregivers matched — here are the two closest fits.
              </motion.p>
              <motion.div className="imm-options" variants={list}>
                {preview.map((c) => (
                  <motion.div className="imm-option is-static" key={c.id} variants={piece}>
                    <span className="imm-letter">{c.initials}</span>
                    <span className="imm-option-text">
                      <span className="imm-option-title">{c.name}</span>
                      <span className="imm-option-desc">
                        {c.match}% match · {c.years} yrs · {c.rate} · {c.area}
                      </span>
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div className="imm-actions" variants={piece}>
                <Button variant="primary" size="lg" onClick={onFinish}>
                  See the full plan <ArrowUpRight size={14} strokeWidth={2} />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {stage === 'asking' && current?.type === 'frailty' && frailty && (
            <motion.div key="frailty" className="imm-screen" variants={screen} initial="initial" animate="animate" exit="exit">
              <motion.p className="imm-count" variants={piece}>
                Frailty assessment
              </motion.p>
              <motion.h1 className="imm-title" variants={piece}>
                Level {frailty.level} — {frailty.label}
              </motion.h1>
              <motion.p className="imm-subtitle" variants={piece}>
                {frailty.blurb}
              </motion.p>
              <motion.div className="imm-cfs" variants={list}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => (
                  <motion.span
                    key={l}
                    variants={piece}
                    className={`imm-cfs-step${l === frailty.level ? ' is-current' : ''}${
                      l < frailty.level ? ' is-passed' : ''
                    }`}
                  >
                    {l}
                  </motion.span>
                ))}
              </motion.div>
              <ImmActions onBack={canGoBack ? goBack : null}>
                <Button variant="primary" size="lg" onClick={() => settle(answers, current.id)}>
                  Continue
                </Button>
              </ImmActions>
            </motion.div>
          )}

          {stage === 'asking' && current?.type === 'intro' && (
            <motion.div key={current.id} className="imm-screen" variants={screen} initial="initial" animate="animate" exit="exit">
              <motion.p className="imm-intro-text" variants={piece}>
                {current.text}
              </motion.p>
              <ImmActions onBack={canGoBack ? goBack : null}>
                <Button variant="primary" size="lg" onClick={() => settle(answers, current.id)}>
                  Continue
                </Button>
              </ImmActions>
            </motion.div>
          )}

          {stage === 'asking' && current?.type === 'field' && (
            <motion.div key={current.id} className="imm-screen" variants={screen} initial="initial" animate="animate" exit="exit">
              <motion.p className="imm-count" variants={piece}>
                {position + 1} of {total}
              </motion.p>
              <motion.h1 className="imm-title" variants={piece}>
                {FIELD_PROMPTS[current.field.id] || current.field.label}
              </motion.h1>
              <motion.p className="imm-subtitle" variants={piece}>
                {FIELD_HINTS[current.field.id] || ''}
              </motion.p>
              <FieldQ
                item={current}
                initial={
                  drafts[current.questionId]?.[current.field.id] ??
                  answers[current.questionId]?.values?.[current.field.id]
                }
                onBack={canGoBack ? goBack : null}
                onCommit={(v) => commitField(current, v)}
              />
            </motion.div>
          )}

          {stage === 'asking' && current?.type === 'question' && (
            <motion.div key={current.id} className="imm-screen" variants={screen} initial="initial" animate="animate" exit="exit">
              <motion.p className="imm-count" variants={piece}>
                {position + 1} of {total}
              </motion.p>
              <motion.h1 className="imm-title" variants={piece}>
                {current.question.title}
              </motion.h1>
              <motion.p className="imm-subtitle" variants={piece}>
                {current.question.subtitle}
              </motion.p>
              {current.question.type === 'single' && (
                <SingleQ
                  question={current.question}
                  initial={answers[current.id]?.optionId}
                  onBack={canGoBack ? goBack : null}
                  onCommit={(a) => commitQuestion(current.id, a)}
                />
              )}
              {current.question.type === 'multi' && (
                <MultiQ
                  question={current.question}
                  initial={answers[current.id]?.optionIds}
                  initialOther={answers[current.id]?.other}
                  onBack={canGoBack ? goBack : null}
                  onCommit={(a) => commitQuestion(current.id, a)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
