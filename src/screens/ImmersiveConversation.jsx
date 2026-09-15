import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUp, ArrowUpRight, LayoutList, PenLine, Volume2, VolumeX } from 'lucide-react';
import { questionById } from '../data/flow';
import { frailtyOf } from '../data/frailty';
import { knownFacts, remainingQuestions, systemPrompt } from '../data/conversation';
import { Q, CFS_SR, STARTERS, SECTION } from '../data/flow.sr';
import { buildPlan, caregivers } from '../data/carePlan';
import { planOverview } from '../data/carePlan.sr';
import { createClient, runTurn } from '../lib/claudeChat';
import CloudBackground from '../components/immersive/CloudBackground';
import GradientBackground from '../components/immersive/GradientBackground';
import UnderstandingPanel from '../components/immersive/UnderstandingPanel';
import { createZenAudio } from '../lib/zenAudio';
import Button from '../components/Button';

const letterFor = (i) => String.fromCharCode(97 + i);

// What went wrong, in words someone watching the demo can read. The raw error
// still goes to the console for whoever is debugging it.
function errorText(e) {
  console.error(e);
  if (e?.status === 429) return 'Previše zahteva odjednom — sačekajte par sekundi i pošaljite ponovo.';
  if (e?.status === 529 || e?.status === 503) return 'Claude je trenutno preopterećen — pokušajte ponovo za minut.';
  if (e?.name === 'APIConnectionError') return 'Nema veze sa Anthropic-om — proverite internet i pošaljite ponovo.';
  if (e?.status) return `Poziv nije uspeo (${e.status}): ${e.error?.error?.message || e.message}`;
  return e?.message || String(e);
}

// The clouds are kept rather than deleted: `?bg=clouds` puts them back behind the
// conversation, so the two can be compared.
const Backdrop =
  new URLSearchParams(window.location.search).get('bg') === 'clouds' ? CloudBackground : GradientBackground;

const EASE_OUT = [0.22, 0.61, 0.36, 1];
const EASE_IN = [0.55, 0.06, 0.68, 0.19];

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
const SETTLE = { type: 'spring', stiffness: 280, damping: 32 };

const list = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.055 } },
  exit: { opacity: 0, transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

// Jovana's line is revealed one character at a time from a plain string. It is
// deliberately not a component per word: once a character is on screen it is
// just text, so there is nothing left that *can* re-animate. The reveal is also
// decoupled from the network — tokens arrive in lumps of several words, and
// pacing off them made the text land in visible chunks.
const CHAR_MS = 26;
// How many characters at the write head are still resolving. They carry a blur
// that clears as more arrive, so the line reads as coming into focus rather
// than being stamped out. Purely CSS on ~7 spans — nothing animates once a
// character has settled behind the head.
const TAIL = 7;
const HEAD_BLUR = 4.5;

function useTypewriter(full) {
  const [typed, setTyped] = useState('');
  const fullRef = useRef(full);
  fullRef.current = full;

  useEffect(() => {
    const id = setInterval(() => {
      setTyped((prev) => {
        const target = fullRef.current;
        // a new turn replaced the text rather than extending it
        if (!target.startsWith(prev)) return target.slice(0, 1);
        if (prev.length >= target.length) return prev; // caught up: no re-render
        return target.slice(0, prev.length + 1);
      });
    }, CHAR_MS);
    return () => clearInterval(id);
  }, []);

  return typed;
}

// The whole sentence is laid out from the start and revealed in place, rather
// than grown a character at a time. Growing it meant the line re-wrapped and
// re-centred on every character: words the reader had already read slid out
// from under them — 385px of sideways travel over one sentence, with single
// jumps of 28px. Nothing here moves; characters only fade up where they sit.
//
// The blur belongs on the *newest* characters, the pen tip. It sat on the trail
// behind it once, which read as a smudge crossing an otherwise crisp line.
//
// Words are the wrapping unit: a span per character would let a line break
// anywhere, mid-word included, so each word is one inline-block and the spaces
// between them stay ordinary text — which is also what keeps the break
// opportunities where the browser expects them.
function Line({ full, shown }) {
  const words = useMemo(() => {
    let at = 0;
    return full.split(/(\s+)/).map((part) => {
      const token = { part, start: at, space: /^\s+$/.test(part) };
      at += part.length;
      return token;
    });
  }, [full]);

  return words.map(({ part, start, space }) =>
    space ? (
      part
    ) : (
      <span className="imm-word" key={start}>
        {part.split('').map((ch, i) => {
          // Every character stays a span for the whole life of the line, even
          // once it has settled. Dropping back to plain text would hand the
          // word its kerning back and change its width mid-reveal, which is the
          // same reflow by another route.
          const age = shown - 1 - (start + i); // 0 on the character just written
          const t = age < 0 ? null : age >= TAIL - 1 ? 0 : 1 - age / (TAIL - 1);
          return (
            <span
              key={i}
              style={
                t === null
                  ? { opacity: 0 }
                  : t === 0
                    ? undefined
                    : { filter: `blur(${(t * HEAD_BLUR).toFixed(2)}px)`, opacity: 1 - t * 0.6 }
              }
            >
              {ch}
            </span>
          );
        })}
      </span>
    )
  );
}

// One composer for everything typed, instead of a field per question. It is
// always there, so the cards read as a shortcut rather than the only way through
// — and the questions that used to be three stacked input cards are now just
// answered in a sentence, which Jovana pulls the fields out of.
function Composer({ placeholder, autoFocus, suggestions = [], onSend }) {
  const [value, setValue] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (autoFocus) setTimeout(() => ref.current?.focus({ preventScroll: true }), 650);
  }, [autoFocus]);

  const send = () => {
    const t = value.trim();
    if (t) {
      setValue('');
      onSend(t);
    }
  };

  return (
    <div className="imm-composer-wrap">
      {suggestions.length > 0 && (
        <div className="imm-suggestions">
          {suggestions.slice(0, 4).map((sug) => (
            <motion.button
              key={sug}
              type="button"
              className="imm-suggestion"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSend(sug)}
            >
              {sug}
            </motion.button>
          ))}
        </div>
      )}
      {/* Styled as one more option card — same glass, same padding, same badge
          slot — so it reads as another row rather than a chat bar bolted on.
          The only difference is that clicking it puts a cursor in it. */}
      <label className={`imm-option is-composer${value.trim() ? ' is-selected' : ''}`}>
        <span className="imm-letter">
          <PenLine size={13} strokeWidth={1.75} />
        </span>
        <span className="imm-option-text">
          <input
            ref={ref}
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
        </span>
        {value.trim() && (
          <Button variant="primary" iconOnly className="imm-send" onClick={send} aria-label="Pošalji">
            <ArrowUp size={16} strokeWidth={2} />
          </Button>
        )}
      </label>
    </div>
  );
}

function Cards({ question, composer, onPick }) {
  const sr = Q[question.id] || {};
  const [ids, setIds] = useState([]);
  const [values, setValues] = useState({});

  // An `inputs` question has no cards at all — three stacked field cards were
  // the last piece of questionnaire left in here, and the person now answers in
  // a sentence that Jovana maps onto the fields. So the composer *is* the whole
  // answer here. Returning null instead left the screen with a question and no
  // way to reply, and since `about-person` is the first thing Jovana asks, the
  // conversation could not get past its own opening line.
  if (question.type === 'inputs') return composer;

  const label = (o) => sr.options?.[o.id] || o.title;

  if (question.type === 'single') {
    return (
      <motion.div className="imm-options" variants={list}>
        {question.options.map((o, i) => (
          <motion.button
            key={o.id}
            type="button"
            variants={piece}
            whileHover={{ y: -1 }}
            className="imm-option"
            onClick={() => onPick({ optionId: o.id }, label(o))}
          >
            <span className="imm-letter">{letterFor(i)}</span>
            <span className="imm-option-text">
              <span className="imm-option-title">{label(o)}</span>
            </span>
          </motion.button>
        ))}
        {composer}
      </motion.div>
    );
  }

  const empty = ids.length === 0;
  return (
    <>
      <motion.div className="imm-options" variants={list}>
        {question.options.map((o, i) => (
          <motion.button
            key={o.id}
            type="button"
            variants={piece}
            whileHover={{ y: -1 }}
            className={`imm-option${ids.includes(o.id) ? ' is-selected' : ''}`}
            onClick={() => setIds((p) => (p.includes(o.id) ? p.filter((x) => x !== o.id) : [...p, o.id]))}
          >
            <span className="imm-letter">{letterFor(i)}</span>
            <span className="imm-option-text">
              <span className="imm-option-title">{label(o)}</span>
            </span>
          </motion.button>
        ))}
        {composer}
      </motion.div>
      {/* the confirm sits below the composer: it commits the whole answer,
          typed row included, so it cannot come before it */}
      <motion.div className="imm-actions" variants={piece}>
        <Button
          variant="primary"
          size="lg"
          disabled={!question.allowEmpty && empty}
          onClick={() =>
            onPick(
              { optionIds: ids },
              question.options.filter((o) => ids.includes(o.id)).map(label).join(', ') ||
                sr.empty ||
                'Ništa od toga'
            )
          }
        >
          {question.allowEmpty && empty ? sr.empty || 'Ništa od toga' : 'Dalje'}
        </Button>
      </motion.div>
    </>
  );
}

// The AI conversation in the immersive form: one screen at a time over the
// clouds, but the question on each screen is written by Jovana rather than read
// off a list — and the first screen is a blank page, not a question.
export default function ImmersiveConversation({
  user,
  answers,
  onAnswer,
  notes,
  onNote,
  apiKey,
  onPlan,
  onExit,
  onFinish,
  onKeyRejected,
}) {
  const [stage, setStage] = useState('open'); // open | talking | plan
  const [said, setSaid] = useState('');
  const [draft, setDraft] = useState('');
  const [asked, setAsked] = useState(null);
  const [followUp, setFollowUp] = useState(null); // string[] of suggestions
  // Why the question on screen is being asked — only when Jovana judged it needs
  // saying, so most questions have none.
  const [why, setWhy] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [muted, setMuted] = useState(false);
  const [assessment, setAssessment] = useState({ level: 0, reason: '', unknowns: [] });
  const [dropped, setDropped] = useState(false);
  const history = useRef([]);
  // The question's height as last written. The answers under it take a moment
  // to leave once she starts thinking; holding the box at this height for that
  // moment keeps them from sliding up as they fade.
  const lineRef = useRef(null);
  const lineHeight = useRef(0);
  const audioRef = useRef(null);
  const levelRef = useRef(0);
  const dropTimer = useRef(null);

  const asking = asked ? questionById[asked] : null;
  // A turn is supposed to end by asking something. When it doesn't — the model
  // spent every hop recording and assessing, or hit the tool loop's ceiling —
  // the screen used to go blank and stay blank: no sentence, no cards, and no
  // composer either, because that renders on the sentence being finished. The
  // conversation was simply over, with no way back into it. So the screen keeps
  // its own floor, and the way back in is always to write.
  // Deliberately not conditioned on the sentence: a turn that writes something
  // and still asks nothing is the same dead end, just one with text in it.
  //
  // And it reads `asking`, not `asked`. An `ask` for a question id that does not
  // exist sets `asked` to something truthy that resolves to nothing — which is
  // how a blank screen got past this check the first time.
  const stalled = stage === 'talking' && !busy && !asking && !followUp;
  // A turn can call tools without writing a sentence, which left the screen
  // showing options with no question above them. The flow's own wording is the
  // floor: Jovana's phrasing is preferred, but something is always asked.
  //
  // Empty while she is still writing: the reveal only ever runs on a sentence
  // that is already complete, so its layout cannot change under it.
  const line = busy
    ? ''
    : said || (asking ? Q[asking.id]?.title || asking.title : stalled ? 'Recite mi još nešto o njoj.' : '');
  const typed = useTypewriter(line);
  // the gate everything below the line waits on
  const doneTyping = !busy && line.length > 0 && typed.length >= line.length;

  useLayoutEffect(() => {
    if (!busy && lineRef.current) lineHeight.current = lineRef.current.offsetHeight;
  });

  const client = useMemo(() => createClient(apiKey), [apiKey]);
  const system = useMemo(() => systemPrompt(user), [user]);

  const frailty = frailtyOf(answers);
  const remaining = remainingQuestions(answers);
  const firstName = answers['about-person']?.values?.name?.trim().split(' ')[0] || '';
  const planName = firstName || 'nju';
  const facts = useMemo(() => knownFacts(answers, notes), [answers, notes]);
  // Once the plan exists there is nothing left to understand, and a ring stuck
  // at 94 under a finished plan would contradict the screen it sits on.
  const level = stage === 'plan' ? 100 : assessment.level;

  useEffect(() => {
    const audio = createZenAudio();
    audio.start();
    audioRef.current = audio;
    return () => audio.stop();
  }, []);

  useEffect(() => () => clearTimeout(dropTimer.current), []);

  // A fall is the interesting event, so it gets said out loud for a moment. The
  // one-point deadband is for a model that re-reports 71 as 70 without having
  // learned anything — that is noise, not a step backwards.
  const assess = useCallback((next) => {
    if (next.level < levelRef.current - 1) {
      setDropped(true);
      clearTimeout(dropTimer.current);
      dropTimer.current = setTimeout(() => setDropped(false), 5000);
    }
    levelRef.current = next.level;
    setAssessment(next);
  }, []);

  const turn = useCallback(
    async (text, seed, seedNotes) => {
      history.current.push({ role: 'user', content: text });
      setAsked(null);
      setFollowUp(null);
      setWhy(null);
      setSaid('');
      setDraft('');
      setStage('talking');
      setBusy(true);
      setError(null);

      try {
        // Tokens are collected here rather than pushed to the screen as they
        // arrive. Revealing a sentence that is still growing means re-wrapping
        // and re-centring it under the reader for as long as the model keeps
        // writing — seconds, with a real stream. Nothing is shown until the
        // turn is finished, and then it is typed out at a fixed layout. The
        // wait is not empty: that is what the thinking indicator is for.
        let spoken = '';
        const result = await runTurn({
          client,
          system,
          messages: history.current,
          answers: seed,
          notes: seedNotes,
          onText: (delta) => {
            spoken += delta;
          },
          onAnswer,
          onNote,
          onAsk: (id, reason) => {
            setAsked(id);
            setWhy(reason);
          },
          onFollowUp: (suggestions, reason) => {
            setFollowUp(suggestions);
            setWhy(reason);
          },
          onAssess: assess,
        });
        setSaid(spoken.trim());
        history.current = result.messages;
        if (!result.messages.some((m) => m.role === 'assistant')) return;
        if (!remainingQuestions(result.answers).length) {
          onPlan(buildPlan(result.answers, result.notes));
          setStage('plan');
        }
      } catch (e) {
        // A key Anthropic refuses is refused on every turn after this one too.
        // Printed under the composer, the raw 401 just sat there turn after
        // turn with nowhere to put a key that works; the key screen is that place.
        if (e?.status === 401) {
          onKeyRejected?.();
          return;
        }
        setError(errorText(e));
      } finally {
        setBusy(false);
      }
    },
    [client, system, onAnswer, onNote, onPlan, assess, onKeyRejected]
  );

  const pick = (answer, label) => {
    if (!asked) return;
    onAnswer(asked, answer);
    turn(`(izabrano) ${label}`, { ...answers, [asked]: answer }, notes);
  };

  const question = asking;
  const srFrailty =
    frailty && CFS_SR[frailty.level]
      ? { ...frailty, label: CFS_SR[frailty.level].label, blurb: CFS_SR[frailty.level].blurb }
      : frailty;
  // The overview is read in the language the conversation was held in. The plan
  // handed to the rest of the app is still buildPlan's; this is its opening.
  const overview = stage === 'plan' ? planOverview(answers, notes) : null;

  return (
    <motion.div
      className="immersive"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.9, ease: 'easeOut' } }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeIn' } }}
    >
      <Backdrop />

      {/* Not in `imm-chrome`: the chrome is a strip across the top, and this is a
          column down the left margin — the one part of the screen the centred
          conversation never uses. */}
      <UnderstandingPanel
        level={level}
        reason={assessment.reason}
        unknowns={assessment.unknowns}
        facts={facts}
        name={firstName}
        dropped={dropped}
        done={stage === 'plan'}
      />

      <div className="imm-chrome">
        <div className="imm-ctls">
          <button
            type="button"
            className="imm-ctl"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              audioRef.current?.setMuted(next);
            }}
            aria-label={muted ? 'Uključi zvuk' : 'Isključi zvuk'}
          >
            {muted ? <VolumeX size={15} strokeWidth={1.75} /> : <Volume2 size={15} strokeWidth={1.75} />}
          </button>
          <button type="button" className="imm-ctl" onClick={onExit} aria-label="Klasični prikaz">
            <LayoutList size={15} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="imm-stage">
        <AnimatePresence mode="wait">
          {/* A blank page, not a question. One paragraph here can fill half the
              flow, and it is the only opening that lets someone say the thing the
              question list never thought to ask. */}
          {stage === 'open' && !busy && (
            <motion.div key="open" className="imm-screen" variants={screen} initial="initial" animate="animate" exit="exit">
              <motion.p className="imm-count" variants={piece}>
                NANA Prime
              </motion.p>
              <motion.h1 className="imm-title" variants={piece}>
                Recite mi svojim rečima šta se dešava.
              </motion.h1>
              <motion.p className="imm-subtitle" variants={piece}>
                O kome se radi, šta vas brine, šta ste već probali — kako god vam je lakše.
                Ostalo ću pitati usput.
              </motion.p>
              <motion.div className="imm-write" variants={piece}>
                <textarea
                  rows={5}
                  value={draft}
                  placeholder="Majka ima 84 godine i živi sama u Vračaru. Pala je dvaput ove godine…"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (draft.trim()) turn(draft.trim(), answers, notes);
                    }
                  }}
                />
                <div className="imm-write-actions">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={!draft.trim()}
                    onClick={() => turn(draft.trim(), answers, notes)}
                  >
                    Pošalji
                  </Button>
                </div>
              </motion.div>

              <motion.p className="imm-starters-label" variants={piece}>
                ili krenite od nekog od ovih
              </motion.p>
              <motion.div className="imm-starters" variants={list}>
                {STARTERS.map((s) => (
                  <motion.button
                    key={s.id}
                    type="button"
                    className="imm-starter"
                    variants={piece}
                    whileHover={{ y: -1 }}
                    onClick={() => turn(s.title, answers, notes)}
                  >
                    <span className="imm-starter-text">
                      <span className="imm-starter-title">{s.title}</span>
                      <span className="imm-starter-sub">{s.sub}</span>
                    </span>
                    <ArrowRight size={16} strokeWidth={1.75} className="imm-starter-arrow" />
                  </motion.button>
                ))}
              </motion.div>

              {/* A chat is the wrong channel for an emergency, and saying so is
                  cheap. Better here than discovered at the wrong moment. */}
              <motion.p className="imm-urgent" variants={piece}>
                Ako je hitno — pala je, ne može da diše, ne prepoznaje vas — nemojte pisati meni.
                Zovite <strong>194</strong>.
              </motion.p>
            </motion.div>
          )}

          {/* One screen, and it does not unmount between "Jovana is answering"
              and "here are the cards". Two screens were the bug: both rendered
              the line, so AnimatePresence threw away the sentence that had just
              finished typing and animated a fresh copy of it in. */}
          {stage === 'talking' && (
            <motion.div key="conversation" className="imm-screen is-conversation" variants={screen} initial="initial" animate="animate" exit="exit">
              <motion.p className="imm-count" variants={piece}>
                {SECTION[remaining[0]?.sekcija] || 'Skoro gotovo'}
              </motion.p>

              {/* The question sits right under the section label at its own
                  height. The thinking indicator takes its place while she is
                  answering, in the same box. */}
              <h1
                ref={lineRef}
                className="imm-title imm-line"
                style={busy && lineHeight.current ? { minHeight: lineHeight.current } : undefined}
              >
                {busy ? (
                  <span className="imm-thinking" role="status">
                    <span className="imm-dot" />
                    <span className="imm-dot" />
                    <span className="imm-dot" />
                    <span className="imm-thinking-text">Jovana razmišlja…</span>
                  </span>
                ) : (
                  /* No caret. It used to sit after the last revealed character;
                     the sentence is laid out in full from the start, so the end
                     of the element is the end of text nobody can see yet. The
                     blurred head is the write position, and a better one.
                     Once the reveal is finished `shown` runs past the end so
                     the head clears — without that the last few characters kept
                     their blur for as long as the question stayed up. */
                  <span>
                    <Line full={line} shown={doneTyping ? line.length + TAIL : typed.length} />
                  </span>
                )}
              </h1>

              {/* Nothing below appears until the sentence has finished. */}
              <AnimatePresence mode="wait">
                {doneTyping && (question || followUp || stalled) && (
                  <motion.div
                    key={asked || 'follow-up'}
                    className="imm-answer"
                    variants={screen}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {/* Why she is asking, as the question's subtitle — no label,
                        no icon, just the next thing she says. It arrives with
                        the answers, once the question has finished writing. */}
                    {why && (
                      <motion.p className="imm-why" variants={piece}>
                        {why}
                      </motion.p>
                    )}
                    {question ? (
                      <Cards
                        question={question}
                        onPick={pick}
                        composer={
                          <motion.div className="imm-composer-slot" variants={piece}>
                            <Composer
                              autoFocus={question.type === 'inputs'}
                              placeholder={
                                question.type !== 'inputs'
                                  ? 'ili odgovorite svojim rečima…'
                                  : 'Odgovorite svojim rečima…'
                              }
                              onSend={(t) => turn(t, answers, notes)}
                            />
                          </motion.div>
                        }
                      />
                    ) : (
                      <motion.div className="imm-composer-slot" variants={piece}>
                        <Composer
                          autoFocus
                          suggestions={followUp || []}
                          placeholder="Odgovorite svojim rečima…"
                          onSend={(t) => turn(t, answers, notes)}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="imm-error">{error}</p>}
            </motion.div>
          )}

          {stage === 'plan' && overview && (
            <motion.div key="plan" className="imm-screen is-wide is-plan" variants={screen} initial="initial" animate="animate" exit="exit">
              <motion.p className="imm-count" variants={piece}>
                Vaš plan podrške
              </motion.p>
              {/* Jovana's closing sentence, revealed in place like every other
                  line of hers; this was the last one still grown a character
                  at a time and re-centred on each. The fallback used to be
                  "Evo plana za" and the name, which Serbian has to decline
                  ("za Zorku") and a template cannot. */}
              <motion.h1 className="imm-title" variants={piece}>
                {line ? (
                  <span>
                    <Line full={line} shown={doneTyping ? line.length + TAIL : typed.length} />
                  </span>
                ) : (
                  'Plan podrške je spreman.'
                )}
              </motion.h1>

              {/* who she is, first and largest: everything below is about her */}
              <motion.p className="imm-plan-lead" variants={piece}>
                {overview.lead}
              </motion.p>

              {/* Nine numbered boxes with one of them lit meant nothing on
                  their own — no name for the scale, no reading of the level,
                  no direction. The other variant has always said all three;
                  this one showed the row bare. */}
              {srFrailty && (
                <motion.div className="imm-scale" variants={piece}>
                  <motion.p className="imm-scale-name" variants={piece}>
                    Klinička skala krhkosti — nivo {srFrailty.level} od 9:{' '}
                    <strong>{srFrailty.label}</strong>
                  </motion.p>
                  <motion.div className="imm-cfs" variants={list}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => (
                      <motion.span
                        key={l}
                        variants={piece}
                        className={`imm-cfs-step${l === srFrailty.level ? ' is-current' : ''}${
                          l < srFrailty.level ? ' is-passed' : ''
                        }`}
                      >
                        {l}
                      </motion.span>
                    ))}
                  </motion.div>
                  <motion.p className="imm-scale-ends" variants={piece}>
                    <span>1 — potpuno samostalna</span>
                    <span>9 — na kraju života</span>
                  </motion.p>
                  <motion.p className="imm-scale-blurb" variants={piece}>
                    {srFrailty.blurb}
                  </motion.p>
                  <motion.p className="imm-scale-note" variants={piece}>
                    Procena je iz vaših odgovora i služi da uskladimo podršku — nije
                    dijagnoza i ne zamenjuje lekara.
                  </motion.p>
                </motion.div>
              )}

              {overview.story.length > 0 && (
                <motion.section className="imm-plan-section" variants={piece}>
                  <h2 className="imm-plan-label">Šta se dešava</h2>
                  {overview.story.map((p) => (
                    <p className="imm-plan-text" key={p}>
                      {p}
                    </p>
                  ))}
                </motion.section>
              )}

              {overview.risks.length > 0 && (
                <motion.section className="imm-plan-section" variants={piece}>
                  <h2 className="imm-plan-label">Na šta najviše treba paziti</h2>
                  <ul className="imm-plan-risks">
                    {overview.risks.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </motion.section>
              )}

              {/* their own words, set as quotes so they read as theirs */}
              {overview.goal && (
                <motion.section className="imm-plan-section imm-plan-quotes" variants={piece}>
                  <figure className="imm-plan-quote">
                    <figcaption className="imm-plan-label">Najvažnije vam je</figcaption>
                    <blockquote>„{overview.goal}“</blockquote>
                  </figure>
                  {overview.worry && (
                    <figure className="imm-plan-quote is-worry">
                      <figcaption className="imm-plan-label">Najviše vas brine</figcaption>
                      <blockquote>„{overview.worry}“</blockquote>
                    </figure>
                  )}
                </motion.section>
              )}

              {overview.notes.length > 0 && (
                <motion.section className="imm-plan-section" variants={piece}>
                  <h2 className="imm-plan-label">Usput ste rekli</h2>
                  <ul className="imm-plan-notes">
                    {overview.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </motion.section>
              )}

              {/* what all of the above adds up to, set apart as the one thing
                  to act on — which is why the button lives inside it */}
              <motion.div className="imm-plan-reco" variants={piece}>
                <p className="imm-plan-label">Naša preporuka</p>
                <p className="imm-plan-reco-title">{overview.role}</p>
                <p className="imm-plan-text">{overview.recommendation}</p>
                <div className="imm-plan-reco-foot">
                  <span className="imm-plan-count">{caregivers.length} negovateljica odgovara ovoj slici</span>
                  <Button variant="primary" size="lg" onClick={onFinish}>
                    Pogledaj ceo plan <ArrowUpRight size={14} strokeWidth={2} />
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
