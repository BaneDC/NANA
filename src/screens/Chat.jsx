import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { applicableQuestions, flowContext, steps } from '../data/flow';
import { frailtyOf } from '../data/frailty';
import { reconcile } from '../data/dependencies';
import { buildPlan } from '../data/carePlan';
import QuestionSection, { FOLDABLE_FROM } from '../components/QuestionSection';
import CarePlanCard from '../components/CarePlanCard';
import FrailtyCard from '../components/FrailtyCard';
import ReviewCard from '../components/ReviewCard';
import FlowChangeNotice from '../components/FlowChangeNotice';
import ChatInput from '../components/ChatInput';

const STEP_TITLES = {
  'getting-to-know': 'Upoznavanje',
  'daily-life': 'Svakodnevica',
  support: 'Podrška',
  reason: 'Zašto ste se javili',
};

const REPLIES = {
  locked: [
    'Vesna i Snežana su obe već radile baš ovu kombinaciju poslova, i slobodne su u dane koje ste izabrali. Kliknite na bilo koju da dobijete njen broj.',
    'Zabeleženo — ažurirala sam plan nege iznad. I preporuke prate izmenu.',
    'Svaku negovateljicu sa liste naš tim proveri i intervjuiše. Cene su po satu i plaćaju se preko NANA Prime, nikad u gotovini.',
  ],
  unlocked: [
    'Vesna i Snežana su obe već radile baš ovu kombinaciju poslova, i slobodne su u dane koje ste izabrali. Vesna obično brže odgovori.',
    'Zabeleženo — ažurirala sam plan nege iznad. I preporuke prate izmenu.',
    'Svaku negovateljicu sa liste naš tim proveri i intervjuiše. Cene su po satu i plaćaju se preko NANA Prime, nikad u gotovini.',
  ],
};

const messageMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

function Typing() {
  return (
    <motion.div
      className="typing"
      {...messageMotion}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <span />
      <span />
      <span />
    </motion.div>
  );
}

export default function Chat({
  user,
  answers,
  onAnswer,
  plan,
  onPlan,
  unlocked,
  onOpenPlan,
  onSelectCaregiver,
}) {
  const [editing, setEditing] = useState(null); // { stepId, index }
  const [revealed, setRevealed] = useState(1);
  const [confirmed, setConfirmed] = useState(false); // the review was signed off
  const [planReady, setPlanReady] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [flowChange, setFlowChange] = useState(null); // an edit moved the frailty level
  const [chatLog, setChatLog] = useState([]);
  const scrollRef = useRef(null);
  const replyIndex = useRef(0);

  // The frailty level decides which questions the next section even asks, so it is
  // recomputed from the answers rather than stored.
  const frailty = frailtyOf(answers);
  const ctx = flowContext(answers, frailty?.level);
  const questionsFor = (step) => applicableQuestions(step, ctx);
  const planName =
    answers['about-person']?.values?.name?.trim().split(' ')[0] || 'Ona';

  const currentStep = steps[revealed - 1];
  const currentDone = currentStep ? questionsFor(currentStep).every((q) => answers[q.id]) : false;

  // Everything asked and answered — which an edit can undo, because a changed
  // frailty level opens questions that were never asked before.
  const allDone =
    revealed >= steps.length && steps.every((s) => questionsFor(s).every((q) => answers[q.id]));
  const reviewing = allDone && !confirmed;

  // The notice belongs above the questions it reopened, not at the end of the
  // thread — the user has to walk back up to them otherwise.
  const noticeStepId = flowChange
    ? steps.find((s) => questionsFor(s).some((q) => !answers[q.id]))?.id
    : null;

  const reviewGroups = steps
    .map((s) => ({
      id: s.id,
      title: STEP_TITLES[s.id] || s.id,
      questions: questionsFor(s).filter((q) => answers[q.id]),
    }))
    .filter((g) => g.questions.length);

  // Only one question is ever active. An explicit edit wins; otherwise it is the
  // first unanswered question, which can only be in the step still in progress.
  const activeIndexFor = (step) => {
    if (editing) return editing.stepId === step.id ? editing.index : null;
    const i = questionsFor(step).findIndex((q) => !answers[q.id]);
    return i === -1 ? null : i;
  };

  const commit = (questionId, answer) => {
    // App prunes the answers; the same pure function tells us what it pruned so the
    // thread can say so out loud instead of silently dropping work the user did.
    // Only an edit is news. While the questionnaire is still running forward the
    // estimate moves with every answer and the branch questions simply appear —
    // there is nothing to warn about until something the user gave gets dropped.
    const result = reconcile(answers, { ...answers, [questionId]: answer });
    setFlowChange(result.dropped.length ? result : null);
    onAnswer(questionId, answer);
    setEditing(null);
  };

  // Finishing a step makes the assistant "think", then introduce the next one.
  useEffect(() => {
    if (!currentDone || editing || revealed >= steps.length) return;
    setThinking(true);
    const t = setTimeout(() => {
      setThinking(false);
      setRevealed((r) => r + 1);
    }, 1100);
    return () => clearTimeout(t);
  }, [currentDone, editing, revealed]);

  // Signing off on the review is what produces the plan.
  useEffect(() => {
    if (!confirmed || planReady) return;
    setThinking(true);
    const t = setTimeout(() => {
      setThinking(false);
      setPlanReady(true);
    }, 1600);
    return () => clearTimeout(t);
  }, [confirmed, planReady]);

  // An edit that reopened questions takes the sign-off with it — there is now
  // something the user has not seen, so the plan cannot stand.
  useEffect(() => {
    if (!allDone && confirmed) {
      setConfirmed(false);
      setPlanReady(false);
    }
  }, [allDone, confirmed]);

  // Keep the plan in sync so editing an earlier answer updates the artifact.
  useEffect(() => {
    if (planReady) onPlan(buildPlan(answers));
  }, [planReady, answers, onPlan]);

  useEffect(() => {
    const t = setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 120);
    return () => clearTimeout(t);
  }, [revealed, thinking, planReady, reviewing, chatLog.length]);

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current
        ?.querySelector('[data-active="true"]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 420);
    return () => clearTimeout(t);
  }, [editing, revealed]);

  // The review lists questions, not positions, so it has to find its way back into
  // whichever section the question ended up in after branching.
  const editFromReview = (question) => {
    const step = steps.find((s) => questionsFor(s).some((q) => q.id === question.id));
    if (!step) return;
    setFlowChange(null);
    setEditing({
      stepId: step.id,
      index: questionsFor(step).findIndex((q) => q.id === question.id),
    });
  };

  const send = (text) => {
    const id = Date.now();
    setChatLog((log) => [...log, { id, role: 'user', text }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      const pool = REPLIES[unlocked ? 'unlocked' : 'locked'];
      setChatLog((log) => [
        ...log,
        { id: id + 1, role: 'assistant', text: pool[replyIndex.current++ % pool.length] },
      ]);
    }, 1100);
  };

  return (
    <div className="chat">
      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-column">
          <motion.p className="assistant-text" {...messageMotion}>
            Zdravo, {user.name.split(' ')[0]}. Pitaću vas nekoliko stvari o osobi o kojoj brinete, pa
            napraviti plan nege sa negovateljicama koje mu odgovaraju.
          </motion.p>

          {steps.slice(0, revealed).map((step, si) => {
            const activeIndex = activeIndexFor(step);
            const stepQuestions = questionsFor(step);
            const complete = stepQuestions.length > 0 && stepQuestions.every((q) => answers[q.id]);
            // a section folds away once the conversation has moved past it, but only
            // when it is long enough for folding to actually save room
            const collapsible =
              complete &&
              activeIndex === null &&
              (si < revealed - 1 || reviewing || planReady) &&
              stepQuestions.length >= FOLDABLE_FROM;
            return (
              <motion.div className="chat-message" key={step.id} {...messageMotion}>
                {flowChange && noticeStepId === step.id && (
                  <FlowChangeNotice change={flowChange} name={planName} />
                )}
                <p className="assistant-text">{step.intro}</p>
                <QuestionSection
                  step={step}
                  questions={stepQuestions}
                  answers={answers}
                  activeIndex={activeIndex}
                  collapsible={collapsible}
                  onCommit={commit}
                  onEdit={(index) => setEditing({ stepId: step.id, index })}
                />

                {/* the pivot of the client's flow: state the level, then branch on it */}
                {step.id === 'daily-life' && complete && frailty && (
                  <>
                    <p className="assistant-text">
                      Iz svega što ste mi rekli, evo gde je danas {planName}.
                    </p>
                    <FrailtyCard frailty={frailty} name={planName} />
                  </>
                )}
              </motion.div>
            );
          })}

          {/* an edit that dropped answers without reopening any question has no
              section to sit above, so it lands at the end of the thread */}
          {flowChange && !noticeStepId && (
            <motion.div className="chat-message" {...messageMotion}>
              <FlowChangeNotice change={flowChange} name={planName} />
            </motion.div>
          )}

          {/* Nothing is built until the user has seen everything they told us and
              said it is right. */}
          {reviewing && !thinking && !editing && (
            <motion.div className="chat-message" {...messageMotion}>
              <p className="assistant-text">
                To su sva moja pitanja. Pre nego što napravim plan, da proverimo da li sam sve dobro
                razumela.
              </p>
              <ReviewCard
                groups={reviewGroups}
                answers={answers}
                name={planName}
                onEdit={editFromReview}
                onConfirm={() => {
                  setFlowChange(null);
                  setConfirmed(true);
                }}
              />
            </motion.div>
          )}

          {planReady && plan && (
            <motion.div className="chat-message" {...messageMotion}>
              <p className="assistant-text">
                That’s everything — here’s the plan for {plan.firstName}, and the caregivers who
                fit it best.
              </p>
              <CarePlanCard
                plan={plan}
                unlocked={unlocked}
                onOpen={onOpenPlan}
                onSelectCaregiver={onSelectCaregiver}
              />
            </motion.div>
          )}

          {chatLog.map((m) =>
            m.role === 'user' ? (
              <motion.div className="bubble-row" key={m.id} {...messageMotion}>
                <div className="bubble">{m.text}</div>
              </motion.div>
            ) : (
              <motion.p className="assistant-text" key={m.id} {...messageMotion}>
                {m.text}
              </motion.p>
            )
          )}

          <AnimatePresence>{thinking && <Typing key="typing" />}</AnimatePresence>
        </div>
      </div>

      <div className="chat-footer">
        <div className="chat-column">
          <ChatInput
            disabled={!planReady}
            placeholder={
              planReady
                ? 'Pitajte o planu nege, negovateljicama ili bilo čemu drugom…'
                : 'Odgovorite na pitanja iznad i napraviću vaš plan nege…'
            }
            onSend={send}
          />
          <p className="footer-note">NANA Prime može da pogreši. Proverite odgovore.</p>
        </div>
      </div>
    </div>
  );
}
