import { motion } from 'framer-motion';
import { Archive, FileText } from 'lucide-react';
import { steps } from '../data/flow';
import { buildPlan } from '../data/carePlan';
import QuestionSection from '../components/QuestionSection';
import Button from '../components/Button';

const messageMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const noop = () => {};

// A past conversation replayed read only: the same messages and question cards
// the live chat renders, with editing taken away.
export default function ArchivedChat({ thread, user, onNewChat }) {
  const plan = buildPlan(thread.answers);

  return (
    <div className="chat">
      <div className="chat-scroll">
        <div className="chat-column">
          <motion.p className="assistant-text" {...messageMotion}>
            Zdravo, {user.name.split(' ')[0]}. Pitaću vas nekoliko stvari o osobi o kojoj brinete, pa
            napraviti plan nege sa negovateljicama koje mu odgovaraju.
          </motion.p>

          {steps.map((step) => (
            <motion.div className="chat-message" key={step.id} {...messageMotion}>
              <p className="assistant-text">{step.intro}</p>
              <QuestionSection
                step={step}
                answers={thread.answers}
                activeIndex={null}
                collapsible={step.questions.length >= 3}
                readOnly
                onCommit={noop}
                onEdit={noop}
              />
            </motion.div>
          ))}

          <motion.div className="chat-message" {...messageMotion}>
            <p className="assistant-text">
              To je sve — evo plana i negovateljica koje mu najbolje odgovaraju.
            </p>
            <div className="workflow-card care-plan" id="archived-artifact">
              <div className="doc is-static">
                <div className="doc-head">
                  <FileText size={14} strokeWidth={1.75} className="doc-icon" />
                  <div className="doc-head-text">
                    <p className="doc-eyebrow">
                      Plan nege <span className="doc-meta">· {thread.date}</span>
                    </p>
                    <p className="doc-title">Plan nege · {plan.name}</p>
                  </div>
                  <span className="status-pill is-muted">Arhiviran</span>
                </div>

                <p className="doc-p">{thread.summary}</p>

                <div className="facts">
                  {plan.facts.map((f) => (
                    <div className="fact" key={f.label}>
                      <span className="fact-label">{f.label}</span>
                      <span className="fact-value">{f.value}</span>
                    </div>
                  ))}
                </div>

                <p className="tip-body">Ovom planu je odgovaralo {thread.caregivers} negovateljica.</p>
              </div>
            </div>
          </motion.div>

          {thread.messages.map((m, i) =>
            m.role === 'user' ? (
              <motion.div className="bubble-row" key={i} {...messageMotion}>
                <div className="bubble">{m.text}</div>
              </motion.div>
            ) : (
              <motion.p className="assistant-text" key={i} {...messageMotion}>
                {m.text}
              </motion.p>
            )
          )}
        </div>
      </div>

      <div className="chat-footer">
        <div className="chat-column">
          <div className="archived-bar">
            <Archive size={14} strokeWidth={1.75} />
            <span>Ovaj razgovor je arhiviran.</span>
            <Button variant="secondary" onClick={onNewChat}>
              Počni novi razgovor
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
