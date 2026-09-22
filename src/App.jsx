import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Register from './screens/Register';
import ArchivedChat from './screens/ArchivedChat';
import Dashboard from './screens/Dashboard';
import Plans from './screens/Plans';
import FindCaregiver from './screens/FindCaregiver';
import Profile from './screens/Profile';
import Settings from './screens/Settings';
import AppNav from './components/AppNav';
import ChatTopBar from './components/ChatTopBar';
import CaregiverSidebar from './components/CaregiverSidebar';
import KitAssistant, { ChatSource } from './components/KitAssistant';
import { demoAnswers, demoNotes, demoUser, wantsDemo } from './data/demoCase';
import { loadProgress, saveProgress } from './lib/account';
import { FileText, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import PaywallModal from './components/PaywallModal';
import PlanDetail from './screens/PlanDetail';
import Immersive from './screens/Immersive';
import ImmersiveConversation from './screens/ImmersiveConversation';
import FamilyDrawer from './components/family/FamilyDrawer';
import CaregiverPage from './screens/CaregiverPage';
import VisitsPage from './screens/VisitsPage';
import RequestsPage from './screens/RequestsPage';
import Toast from './components/family/Toast';
import CaregiverApp from './screens/caregiver/CaregiverApp';
import ApiKeyPanel from './components/ApiKeyPanel';
import Button from './components/Button';
import { clearKey, loadKey, saveKey } from './lib/claudeChat';
import { reconcile } from './data/dependencies';
import { askCaregiver, firstName } from './data/familyCare';
import { REPLY_AFTER_MS, VISIT_AFTER_MS, answerRequest, planFirstVisit, requestMessage, startCare, withAnswers } from './data/familyStart';
import { buildPlan, caregivers } from './data/carePlan';
import { applyChanges, describeChanges, planDiff } from './data/planEdits';
import PlanEditor from './components/PlanEditor';
import { planEntries, seedThreads } from './data/threads';

const formatToday = () =>
  new Date().toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' });

// /?demo opens past the onboarding, on a finished plan — for trying the chat and
// everything after it without talking the conversation through each time.
const DEMO = wantsDemo();
const demoStart = DEMO ? reconcile({}, demoAnswers).answers : null;

// What registration already told us about the person writing, as the answer the
// onboarding would otherwise ask for, so Jovana does not ask it again.
const aboutYou = (u) => ({ values: { 'your-name': u.name, 'your-phone': u.phone } });

export default function App() {
  const [phase, setPhase] = useState(DEMO ? 'app' : 'register'); // register | app
  const [view, setView] = useState(DEMO ? 'dashboard' : 'chat');
  // `role` is chosen at registration and decides which of the two applications
  // this is: the family's, or the caregiver's. Switching means starting over,
  // which is what the restart button is for.
  const [user, setUser] = useState(DEMO ? demoUser : { name: '', email: '', role: 'family' });
  // answers live here so the profile can read them without a second source of truth
  const [answers, setAnswers] = useState(() => demoStart || {});
  const [plan, setPlan] = useState(() => (DEMO ? buildPlan(demoStart, demoNotes) : null));
  const [unlocked, setUnlocked] = useState(false);
  // one slot on the right: the care plan or the assistant, never both
  const [rightPanel, setRightPanel] = useState(null); // null | 'plan' | 'copilot'
  // null when closed, otherwise { caregiver } — a caregiver means the user tapped one
  // to request their number, no caregiver means they unlocked the recommendations.
  const [paywall, setPaywall] = useState(null);
  const [threads, setThreads] = useState(seedThreads);
  const [activeThread, setActiveThread] = useState('live');
  const [chatListOpen, setChatListOpen] = useState(true);
  const [planListOpen, setPlanListOpen] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('live');
  const [variant, setVariant] = useState('classic'); // classic | immersive | ai
  // the AI variant runs against the developer's own key, kept in this browser
  const [apiKey, setApiKey] = useState(loadKey);
  const [askingKey, setAskingKey] = useState(false);
  // set when Anthropic turned the key down, so the key screen can say why it is back
  const [keyRejected, setKeyRejected] = useState(false);
  // things the family said that no question covers — they reach the plan
  const [notes, setNotes] = useState(DEMO ? demoNotes : []);
  // The arrangement with the caregiver, shared: the dashboard reads it and the
  // card that pays for it is set up in Settings.
  const [care, setCare] = useState(() => startCare(DEMO ? demoUser : null));
  const [run, setRun] = useState(0); // remounts the flow on restart
  // The family's decisions open as a drawer from whichever page shows the thing
  // they concern, and a short line afterwards says what happened.
  const [drawer, setDrawer] = useState(null); // { kind, caregiverId?, visitId? }
  const [flash, setFlash] = useState(null);
  const [openCaregiver, setOpenCaregiver] = useState(null);
  const [editingPlan, setEditingPlan] = useState(false);
  // The last change to the plan, kept so the plan can say what changed and take
  // it back: what moved, which parts of the plan it rewrote, and the state from
  // before it, for "Poništi".
  const [planChange, setPlanChange] = useState(null);
  const showCaregiver = (id) => {
    setOpenCaregiver(id);
    setDrawer(null);
    setView('caregiver');
  };

  const onPlan = useCallback((p) => setPlan(p), []);
  const onNote = useCallback((t) => setNotes((n) => (n.includes(t) ? n : [...n, t])), []);
  // Answers are reconciled, not just merged: a changed frailty level retires the
  // branch questions it no longer asks, so the state can never hold an answer to a
  // question this user is not being asked. Both variants go through here.
  const onAnswer = useCallback(
    (questionId, answer) =>
      setAnswers((a) => reconcile(a, { ...a, [questionId]: answer }).answers),
    []
  );
  const selectCaregiver = useCallback((c) => setPaywall({ caregiver: c }), []);
  const say = (text) => setFlash({ text, at: Date.now() });

  // The care state follows the answers: who she is, where, and what the plan
  // says is needed, so a request always carries the plan as it is now.
  useEffect(() => {
    setCare((c) => withAnswers(c, answers, user));
  }, [answers, user]);

  // The caregivers' side of the story. A request gets an answer, and agreed
  // terms get a first visit, a few seconds later, the way they would from the
  // caregiver's board. Each is scheduled once.
  const careRef = useRef(care);
  careRef.current = care;
  const scheduled = useRef(new Set());
  const timers = useRef([]);
  useEffect(() => {
    const later = (key, ms, fn) => {
      if (scheduled.current.has(key)) return;
      scheduled.current.add(key);
      timers.current.push(setTimeout(fn, ms));
    };
    for (const r of care.requests) {
      if (r.status !== 'pending') continue;
      later(`answer-${r.caregiverId}`, REPLY_AFTER_MS, () => {
        const next = answerRequest(r.caregiverId)(careRef.current);
        const done = next.requests.find((x) => x.caregiverId === r.caregiverId);
        const name = caregivers.find((c) => c.id === r.caregiverId)?.name || '';
        setCare(answerRequest(r.caregiverId));
        say(
          done?.status === 'declined'
            ? `${firstName(name)} ne može da preuzme. ${done.detail}`
            : `${firstName(name)} je prihvatila upit i poslala ugovor o nezi.`
        );
      });
    }
    for (const a of care.arrangements) {
      if (a.endedOn || a.visits.length || !a.versions.some((v) => v.status === 'active')) continue;
      later(`visit-${a.caregiver.id}`, VISIT_AFTER_MS, () => {
        setCare(planFirstVisit(a.caregiver.id));
        say(`${firstName(a.caregiver.name)} je zakazala prvu posetu za sutra.`);
      });
    }
  }, [care]);

  // A change to the plan, by hand or from the assistant: new answers, reconciled
  // the way every answer is, and the plan built again from them. What changed
  // is said in one line, so the plan quietly redrawing is not the only sign.
  // Changes add up until the family says "U redu": the card at the top of the
  // plan lists everything since, measured against the plan as it was before the
  // first of them, and "Poništi" takes them all back.
  const changePlan = ({ nextAnswers, nextNotes, source }) => {
    const nextPlan = plan ? buildPlan(nextAnswers, nextNotes) : null;
    const prev = planChange?.prev || { answers, notes, plan };
    const desc = describeChanges(
      prev.answers,
      Object.keys({ ...prev.answers, ...nextAnswers })
        .filter((id) => JSON.stringify(prev.answers[id]) !== JSON.stringify(nextAnswers[id]) && nextAnswers[id])
        .map((id) => ({ questionId: id, answer: nextAnswers[id] }))
    );
    const diff = planDiff(prev.plan, nextPlan);
    setPlanChange({
      source: planChange && planChange.source !== source ? 'both' : source,
      rows: desc.rows,
      frailty: desc.frailty,
      saved: nextNotes.filter((n) => !prev.notes.includes(n)),
      recs: diff.recs,
      letter: diff.letter,
      touched: diff.touched,
      at: Date.now(),
      prev,
    });
    setAnswers(nextAnswers);
    setNotes(nextNotes);
    if (nextPlan) setPlan(nextPlan);
  };

  const editAnswers = (changes, { source = 'manual' } = {}) => {
    const { answers: next } = applyChanges(answers, changes);
    changePlan({ nextAnswers: next, nextNotes: notes, source });
    say(changes.length === 1 ? 'Plan je izmenjen.' : `Plan je izmenjen — ${changes.length} odgovora.`);
  };

  const addNotes = (added) => {
    const fresh = added.filter((t) => !notes.includes(t));
    if (!fresh.length) return;
    changePlan({ nextAnswers: answers, nextNotes: [...notes, ...fresh], source: 'assistant' });
  };

  const undoPlanChange = () => {
    if (!planChange) return;
    setAnswers(planChange.prev.answers);
    setNotes(planChange.prev.notes);
    setPlan(planChange.prev.plan);
    setPlanChange(null);
    say('Izmena je poništena.');
  };
  const goToChat = () => setView('chat');
  // In Razgovor the assistant is the page itself, so it is not opened again beside it.
  const askAssistant = () => (view === 'chat' ? null : setRightPanel('copilot'));
  // The assistant's conversation: one, wherever it is open. <ChatSource> holds
  // it and is remounted, under a new key, for a new conversation.
  const [conversation, setConversation] = useState(0);
  const chatCtx = useRef({});
  useEffect(() => {
    if (view === 'chat') setRightPanel((p) => (p === 'copilot' ? null : p));
  }, [view]);
  // Writing to a caregiver goes through the one modal: the message can be
  // written any time and is sent once the subscription is paid. Returns whether
  // it went out now, so the assistant's card can say so.
  const contactCaregiver = (c) => setPaywall({ caregiver: c });
  const assistantAsk = (id) => {
    const c = caregivers.find((x) => x.id === id);
    if (!unlocked) {
      contactCaregiver(c);
      return false;
    }
    setCare(askCaregiver(id, requestMessage(care)));
    say(`Poruka je poslata zajedno sa planom nege. ${firstName(c.name)} obično odgovori istog dana.`);
    return true;
  };
  const openPage = (page) => {
    if (page === 'plan') return openPlanPage('live');
    setView({ 'my-care': 'dashboard' }[page] || page);
  };

  chatCtx.current = {
    plan,
    answers,
    care,
    apiKey,
    onAddNotes: addNotes,
    onApplyChanges: (changes) => editAnswers(changes, { source: 'assistant' }),
    onAskCaregiver: assistantAsk,
    onOpenPage: openPage,
    // for what opens in the chat's pane
    unlocked,
    planChange,
    onContact: contactCaregiver,
    onUnlock: () => setPaywall({ caregiver: null }),
    onDrawer: setDrawer,
  };
  const chatActions = useMemo(
    () => [
      { id: 'plan', label: 'Plan nege', icon: <FileText size={16} strokeWidth={1.75} />, onClick: () => chatCtx.current.onOpenPage('plan') },
      { id: 'new', label: 'Novi razgovor', icon: <Plus size={16} strokeWidth={2} />, onClick: () => setConversation((n) => n + 1) },
    ],
    []
  );
  const panelActions = useMemo(
    () => [{ id: 'close', label: 'Zatvori panel', icon: <X size={16} strokeWidth={1.75} />, onClick: () => setRightPanel(null), pinned: true }],
    []
  );

  // The demo from the sign-in screen: the same finished case as /?demo.
  const openDemo = () => {
    const answersNow = reconcile({}, demoAnswers).answers;
    setUser(demoUser);
    setAnswers(answersNow);
    setNotes(demoNotes);
    setPlan(buildPlan(answersNow, demoNotes));
    setCare(startCare(demoUser));
    setView('dashboard');
    setPhase('app');
  };

  // What the account has got to, kept so signing in again resumes it.
  useEffect(() => {
    if (phase !== 'app' || !user.email || user.role === 'caregiver' || user === demoUser) return;
    saveProgress(user.email, { answers, notes, planDone: Boolean(plan) });
  }, [phase, user, answers, notes, plan]);

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    scheduled.current = new Set();
    setCare(startCare());
    setConversation((n) => n + 1);
    setPlanChange(null);
    setAnswers({});
    setNotes([]);
    setPlan(null);
    setUnlocked(false);
    setRightPanel(null);
    setPaywall(null);
    setThreads(seedThreads);
    setActiveThread('live');
    setView('chat');
    setVariant('classic');
    setRun((r) => r + 1);
    setPhase('register');
  };

  // A new conversation with the assistant; the plan and everything done stays.
  const newChat = () => {
    setConversation((n) => n + 1);
    setView('chat');
  };

  const selectThread = (id) => {
    setActiveThread(id);
    setView('chat');
    setRightPanel(null);
  };

  // From the Care plans side a plan opens as its own page; from the chat it stays
  // a side panel, because there it is an artifact of the conversation.
  const openPlanPage = (id) => {
    setSelectedPlan(id);
    setView('plan-detail');
    setPlanListOpen(true);
  };

  // The immersive variant stays open past the last question: it shows the finished
  // care plan itself, so the calm isn't broken just to reveal the result.
  const showImmersive = phase === 'app' && variant === 'immersive';

  // Both of those variants take the whole window, so while one is up the shell
  // under it is not painted at all. Covering it was not enough: they fade in over
  // most of a second, and registering straight into the AI variant showed the nav
  // and the empty chat through that fade before the conversation landed.
  const fullscreen = phase === 'app' && (variant === 'ai' || variant === 'immersive');

  const startVariant = (next) => {
    setVariant(next);
    if (next === 'ai' && !apiKey) setAskingKey(true);
    if (next !== 'classic') {
      setRightPanel(null);
      setActiveThread('live');
      setView('chat');
    }
  };

  const openThread = threads.find((t) => t.id === activeThread);

  const entries = planEntries({
    plan,
    threads,
    caregiverCount: caregivers.length,
    today: formatToday(),
  });
  const openEntry = entries.find((e) => e.id === selectedPlan) || entries[0];

  // The conversation in the nav: Jovana until the plan exists, the assistant after.
  const liveTitle = plan ? 'Asistent' : 'Upoznavanje sa Jovanom';

  // The caregiver's side shares the shell and the components and nothing else:
  // no questionnaire, no care plan, no sidebar built for a family.
  const isCaregiver = user.role === 'caregiver';

  if (phase === 'app' && isCaregiver) {
    return (
      <div className="app">
        <CaregiverApp user={user} onRestart={restart} />
      </div>
    );
  }

  return (
    <div className="app">
      {phase === 'app' && !fullscreen && (
        <AppNav
          view={view}
          onView={setView}
          user={user}
          badge={care.requests.filter((r) => r.status === 'pending').length}
          threads={threads}
          activeThread={activeThread}
          liveTitle={liveTitle}
          onSelectThread={selectThread}
          onNewChat={newChat}
          chatListOpen={chatListOpen}
          onToggleChatList={() => setChatListOpen((v) => !v)}
          planEntries={entries}
          selectedPlan={selectedPlan}
          onSelectPlan={openPlanPage}
          planListOpen={planListOpen}
          onTogglePlanList={() => setPlanListOpen((v) => !v)}
          onRestart={restart}
        />
      )}

      {phase === 'register' ? (
        <div className="chat-container">
          <AnimatePresence mode="wait">
            <Register
              key={`register-${run}`}
              onDemo={openDemo}
              onContinue={(u) => {
                setUser(u);
                setCare(startCare(u));
                setPhase('app');
                if (u.role === 'caregiver') return;
                // Signing back in picks up where the account left off: a
                // finished onboarding opens on Moja nega and is not run again.
                const saved = loadProgress(u.email);
                if (saved?.planDone) {
                  setAnswers(saved.answers);
                  setNotes(saved.notes || []);
                  setPlan(buildPlan(saved.answers, saved.notes || []));
                  setView('dashboard');
                  return;
                }
                setAnswers({ ...(saved?.answers || {}), 'about-you': aboutYou(u) });
                if (saved?.notes) setNotes(saved.notes);
                // A family starts with Jovana, not with the questionnaire: the AI
                // onboarding is the first thing after signing in, and the rest of
                // the app is what it hands over to once the plan exists.
                startVariant('ai');
              }}
            />
          </AnimatePresence>
        </div>
      ) : (
        <>
          {/* Razgovor: once the plan exists, the assistant, for anything; before
              it, the way back into the conversation with Jovana. */}
          {view === 'chat' && !openThread && !fullscreen && (
            <div className="chat-container">
              {plan ? (
                <KitAssistant
                  ctx={chatCtx}
                  title="Razgovor"
                  actions={chatActions}
                />
              ) : (
                <div className="view">
                  <section className="panel-card needs-you">
                    <p className="doc-section-title">Upoznavanje nije završeno</p>
                    <p className="fam-sub">
                      Jovana pamti sve što ste do sada rekli. Kad završite, pravi plan nege i predlaže negovateljice.
                    </p>
                    <div className="panel-card-actions">
                      <Button variant="primary" onClick={() => startVariant('ai')}>
                        Nastavite razgovor
                      </Button>
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {view === 'chat' && openThread && !fullscreen && (
            <div className="chat-container">
              <ChatTopBar
                title={openThread.title}
                subtitle={`Archived · ${openThread.date}`}
                artifactLabel="Care plan"
                onArtifacts={() => {
                  document
                    .getElementById('archived-artifact')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                onNewChat={newChat}
              />
              <ArchivedChat
                key={openThread.id}
                thread={openThread}
                user={user}
                onNewChat={newChat}
              />
            </div>
          )}

          {view !== 'chat' && !fullscreen && (
            <div className="chat-container">
              {view === 'dashboard' && (
                <Dashboard
                  care={care}
                  user={user}
                  plan={plan}
                  onOpenPlan={() => openPlanPage('live')}
                  onDrawer={setDrawer}
                  onCaregiver={showCaregiver}
                  onView={setView}
                  onAskAssistant={askAssistant}
                  onFindCaregiver={() => setView('find-caregiver')}
                />
              )}
              {view === 'caregiver' && (
                <CaregiverPage
                  key={openCaregiver}
                  care={care}
                  caregiverId={openCaregiver}
                  onCare={setCare}
                  onDrawer={setDrawer}
                  onFlash={(text) => setFlash({ text, at: Date.now() })}
                  onBack={() => setView('dashboard')}
                />
              )}
              {view === 'visits' && (
                <VisitsPage care={care} onDrawer={setDrawer} onBack={() => setView('dashboard')} />
              )}
              {view === 'requests' && (
                <RequestsPage
                  care={care}
                  onCaregiver={showCaregiver}
                  onFind={() => setView('find-caregiver')}
                  onBack={() => setView('dashboard')}
                />
              )}
              {view === 'find-caregiver' && (
                <FindCaregiver
                  care={care}
                  onContact={contactCaregiver}
                  onCare={setCare}
                  onDrawer={setDrawer}
                  onFlash={(text) => setFlash({ text, at: Date.now() })}
                  onAskAssistant={askAssistant}
                />
              )}
              {view === 'plans' && (
                <Plans
                  entries={entries}
                  onOpenPlan={openPlanPage}
                  onGoToChat={goToChat}
                  onAskAssistant={askAssistant}
                />
              )}
              {view === 'plan-detail' && openEntry && (
                <PlanDetail
                  entry={openEntry}
                  unlocked={unlocked}
                  onBack={() => setView('plans')}
                  onSelectCaregiver={selectCaregiver}
                  onUnlock={() => setPaywall({ caregiver: null })}
                  onAskAssistant={askAssistant}
                  onEdit={!openEntry.archived && plan ? () => setEditingPlan(true) : null}
                  change={planChange}
                  onUndoChange={undoPlanChange}
                  onDismissChange={() => setPlanChange(null)}
                />
              )}
              {view === 'profile' && (
                <Profile
                  user={user}
                  answers={answers}
                  onGoToChat={goToChat}
                  onAskAssistant={askAssistant}
                />
              )}
              {view === 'settings' && (
                <Settings
                  unlocked={unlocked}
                  care={care}
                  onCare={setCare}
                  onAskAssistant={askAssistant}
                />
              )}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {rightPanel === 'plan' && plan && (
          <CaregiverSidebar
            key="plan-panel"
            plan={plan}
            unlocked={unlocked}
            onSelectCaregiver={selectCaregiver}
            onUnlock={() => setPaywall({ caregiver: null })}
            onClose={() => setRightPanel(null)}
          />
        )}
        {rightPanel === 'copilot' && (
          <motion.div
            key="copilot-panel"
            className="sidebar-wrap"
            initial={{ width: 0 }}
            animate={{ width: 432 }}
            exit={{ width: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
          >
            <div className="sidebar is-chat">
              <KitAssistant ctx={chatCtx} title="Asistent" actions={panelActions} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The AI variant asks for a key first; it is fullscreen, so the gate is too. */}
      <AnimatePresence>
        {phase === 'app' && variant === 'ai' && (askingKey || !apiKey) && (
          <div className="chat-container key-overlay" key="key-gate">
            <ApiKeyPanel
              initial={apiKey}
              rejected={keyRejected}
              onSave={(k) => {
                saveKey(k);
                setApiKey(k);
                setKeyRejected(false);
                setAskingKey(false);
              }}
              onCancel={() => {
                setAskingKey(false);
                setVariant('classic');
              }}
            />
          </div>
        )}
        {phase === 'app' && variant === 'ai' && apiKey && !askingKey && (
          <ImmersiveConversation
            key={`ai-${run}`}
            user={user}
            answers={answers}
            onAnswer={onAnswer}
            notes={notes}
            onNote={onNote}
            apiKey={apiKey}
            onPlan={onPlan}
            onExit={() => setVariant('classic')}
            onFinish={() => {
              setVariant('classic');
              setSelectedPlan('live');
              setView('plan-detail');
            }}
            // the saved key goes, so a reload cannot bring the same one back
            onKeyRejected={() => {
              clearKey();
              setApiKey('');
              setKeyRejected(true);
              setAskingKey(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImmersive && (
          <Immersive
            key="immersive"
            user={user}
            answers={answers}
            onAnswer={onAnswer}
            onPlan={onPlan}
            onExit={() => setVariant('classic')}
            onFinish={() => {
              // the plan they just read is the natural place to land: the dashboard
              // is still empty until they actually request a caregiver
              setVariant('classic');
              setSelectedPlan('live');
              setView('plan-detail');
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawer && (
          <FamilyDrawer
            key={`${drawer.kind}-${drawer.caregiverId || drawer.visitId}`}
            drawer={drawer}
            care={care}
            onCare={setCare}
            onClose={() => setDrawer(null)}
            onOpen={setDrawer}
            onFlash={(text) => setFlash({ text, at: Date.now() })}
            onContact={(c) => {
              setDrawer(null);
              contactCaregiver(c);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingPlan && plan && (
          <PlanEditor
            key="plan-editor"
            answers={answers}
            name={plan.firstName}
            onApply={editAnswers}
            onClose={() => setEditingPlan(false)}
          />
        )}
      </AnimatePresence>

      <ChatSource key={`chat-${conversation}`} ctx={chatCtx} />
      <Toast flash={flash} onDone={() => setFlash(null)} />

      <AnimatePresence>
        {paywall && plan && (
          <PaywallModal
            key="paywall"
            caregiver={paywall.caregiver}
            plan={plan}
            unlocked={unlocked}
            draft={requestMessage(care)}
            alreadyAsked={Boolean(paywall.caregiver && care.requests.some((q) => q.caregiverId === paywall.caregiver.id))}
            onPay={() => {
              setUnlocked(true);
              say('Pretplata je aktivna.');
              // unlocking the plan has nothing left to do here; a message still has to be sent
              if (!paywall.caregiver) setPaywall(null);
            }}
            onSend={(message) => {
              setCare(askCaregiver(paywall.caregiver.id, message));
              say(`Poruka je poslata zajedno sa planom nege. ${firstName(paywall.caregiver.name)} obično odgovori istog dana.`);
              setPaywall(null);
            }}
            onClose={() => setPaywall(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
