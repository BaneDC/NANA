import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Register from './screens/Register';
import Dashboard from './screens/Dashboard';
import FindCaregiver from './screens/FindCaregiver';
import Profile from './screens/Profile';
import Settings from './screens/Settings';
import AppNav from './components/AppNav';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Logo from './components/Logo';
import CaregiverSidebar from './components/CaregiverSidebar';
import KitAssistant, { ChatPane, ChatSource } from './components/KitAssistant';
import { demoAnswers, demoCountry, demoNotes, demoUser, wantsDemo } from './data/demoCase';
import { loadProgress, saveProgress, updateAccount } from './lib/account';
import { FileText, Plus, X } from 'lucide-react';
import PaywallModal from './components/PaywallModal';
import AskAssistant from './components/AskAssistant';
import SharePlanModal from './components/SharePlanModal';
import PlanDetail, { NoPlan } from './screens/PlanDetail';
import ImmersiveConversation from './screens/ImmersiveConversation';
import FamilyDrawer from './components/family/FamilyDrawer';
import CaregiverPage from './screens/CaregiverPage';
import VisitsPage from './screens/VisitsPage';
import RequestsPage from './screens/RequestsPage';
import Toast from './components/family/Toast';
import CaregiverApp from './screens/caregiver/CaregiverApp';
import ApiKeyPanel from './components/ApiKeyPanel';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter } from '@/components/ui/card';
import { AppPane, Page } from '@/components/page';
import { SidePanelFrame } from './components/SidePanel';
import Attention from './components/Attention';
import { clearKey, loadKey, saveKey } from './lib/claudeChat';
import { reconcile } from './data/dependencies';
import { askCaregiver, canAsk, firstName, standingWith, unseenAnswers, waitingOnYou } from './data/familyCare';
import { requestMessage, startCare, withAnswers } from './data/familyStart';
import SimPanel from './components/family/SimPanel';
import { useKept } from './hooks/use-kept';
import { buildPlan, caregivers } from './data/carePlan';
import { applyChanges, describeChanges, planDiff } from './data/planEdits';
import { planEntries } from './data/threads';
import { changeEntry } from './data/planLog';
import { demoPerson, newPerson, planOf, withPlan } from './data/person';

const formatDate = (at) => new Date(at).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' });
const formatToday = () => formatDate(Date.now());

// /?demo opens past the onboarding, on a finished plan — for trying the chat and
// everything after it without talking the conversation through each time.
const DEMO = wantsDemo();
const demoStart = DEMO ? reconcile({}, demoAnswers).answers : null;

// What registration already told us about the person writing, as the answer the
// onboarding would otherwise ask for, so Minna does not ask it again.
const aboutYou = (u) => ({ values: { 'your-name': u.name, 'your-phone': u.phone } });

// The screen: the menu and the pane beside it, 12 from the window's edges;
// on a narrow screen the top bar above the pane, edge to edge.
const shell = 'flex h-full overflow-hidden p-3 narrow:flex-col narrow:p-0';

export default function App() {
  const [phase, setPhase] = useState(DEMO ? 'app' : 'register'); // register | app
  const [view, setView] = useState(DEMO ? 'dashboard' : 'chat');
  // `role` is chosen at registration and decides which of the two applications
  // this is: the family's, or the caregiver's. Switching means starting over:
  // reloading the page goes back to sign-in.
  const [user, setUser] = useState(
    DEMO ? { ...demoUser, country: demoCountry() } : { name: '', email: '', role: 'family' }
  );
  // The one person this account cares for (src/data/person.js): her answers and
  // notes, the plan built from them, what changed in it, and the care around
  // her. Everything below reads her from here, so nothing has a second source.
  const [person, setPerson] = useState(() => (DEMO ? demoPerson(demoStart, demoNotes, demoUser) : newPerson()));
  // a part of her set on its own, as a value or from the one before
  const setPart = useCallback(
    (key) => (next) => setPerson((p) => ({ ...p, [key]: typeof next === 'function' ? next(p[key]) : next })),
    []
  );
  const setAnswers = useMemo(() => setPart('answers'), [setPart]);
  const setNotes = useMemo(() => setPart('notes'), [setPart]);
  const setCare = useMemo(() => setPart('care'), [setPart]);
  const { answers, notes, care, log: planLog } = person;
  // rebuilt when what it is built from changes, not on every change to her care
  const { planMade } = person;
  const plan = useMemo(() => planOf({ planMade, answers, notes }), [planMade, answers, notes]);
  const [unlocked, setUnlocked] = useState(false);
  // which plan they paid for and when, so settings can say what they are on
  const [subscription, setSubscription] = useState(null); // { planId, at }
  // one slot on the right: the care plan or the assistant, never both
  const [rightPanel, setRightPanel] = useState(null); // null | 'plan' | 'copilot'
  // null when closed, otherwise { caregiver } — a caregiver means the user tapped one
  // to request their number, no caregiver means they unlocked the recommendations.
  const [paywall, setPaywall] = useState(null);
  const shownPaywall = useKept(paywall);
  // the history of conversations opens when asked for
  const [chatListOpen, setChatListOpen] = useState(false);
  const [variant, setVariant] = useState('classic'); // classic | ai
  // the AI variant runs against the developer's own key, kept in this browser
  const [apiKey, setApiKey] = useState(loadKey);
  const [askingKey, setAskingKey] = useState(false);
  // set when Anthropic turned the key down, so the key screen can say why it is back
  const [keyRejected, setKeyRejected] = useState(false);
  // The family's decisions open as a drawer from whichever page shows the thing
  // they concern, and a short line afterwards says what happened.
  const [drawer, setDrawer] = useState(null); // { kind, caregiverId?, visitId? }
  const shownDrawer = useKept(drawer);
  const [flash, setFlash] = useState(null);
  const [openCaregiver, setOpenCaregiver] = useState(null);
  // The last change to the plan, kept so the plan can say what changed and take
  // it back: what moved, which parts of the plan it rewrote, and the state from
  // before it, for "Poništi".
  const [planChange, setPlanChange] = useState(null);
  // the nav, on a screen too narrow to keep it open beside the page
  const showCaregiver = (id) => {
    setOpenCaregiver(id);
    setDrawer(null);
    setView('caregiver');
  };

  // The onboarding has made the plan: from now on it is built from her answers,
  // and its history starts. The plan it hands over is the same buildPlan.
  const onPlan = useCallback(() => setPerson((p) => withPlan(p)), []);
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
  // her profile, from anywhere a caregiver is listed
  const showProfile = useCallback((c) => setDrawer({ kind: 'profile', caregiverId: c.id }), []);
  const say = (text) => setFlash({ text, at: Date.now() });

  // The account's own fields, changed from the profile or from settings. One
  // place, because both write the same record.
  const saveUser = (patch) => {
    const next = { ...user, ...patch, name: patch.name ?? user.name };
    setUser(next);
    updateAccount(next);
    say('Podaci su sačuvani.');
  };

  // The care state follows the answers: who she is, where, and what the plan
  // says is needed, so a request always carries the plan as it is now.
  useEffect(() => {
    setCare((c) => withAnswers(c, answers, user));
  }, [answers, user]);

  // The caregivers' side of the story is not timed: whatever a caregiver or the
  // coordinator would do is done by hand from the hidden simulation panel,
  // which Ctrl+H opens and closes.
  const [sim, setSim] = useState(false);
  const shownSim = useKept(sim && phase === 'app');
  useEffect(() => {
    const onKey = (e) => {
      if (!e.ctrlKey || e.altKey || e.metaKey || e.key.toLowerCase() !== 'h') return;
      e.preventDefault();
      setSim((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // A change to the plan, by hand or from the assistant: new answers, reconciled
  // the way every answer is, and the plan built again from them. What changed
  // is said in one line, so the plan quietly redrawing is not the only sign.
  // Changes add up until the family says "U redu": the card at the top of the
  // plan lists everything since, measured against the plan as it was before the
  // first of them, and "Poništi" takes them all back.
  const changePlan = ({ nextAnswers, nextNotes, source }) => {
    const nextPlan = plan ? buildPlan(nextAnswers, nextNotes) : null;
    const prev = planChange?.prev || { answers, notes, plan, log: planLog };
    // the history gets a line only when the plan reads differently afterwards
    const entry = nextPlan && changeEntry({ before: { answers, notes, plan }, after: { answers: nextAnswers, notes: nextNotes, plan: nextPlan }, source });
    const nextLog = entry ? [entry, ...planLog] : planLog;
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
    setPerson((p) => ({ ...p, answers: nextAnswers, notes: nextNotes, log: nextLog }));
  };

  const editAnswers = (changes, { source = 'manual' } = {}) => {
    const { answers: next } = applyChanges(answers, changes);
    changePlan({ nextAnswers: next, nextNotes: notes, source });
    say(changes.length === 1 ? 'Plan je izmenjen.' : `Plan je izmenjen - ${changes.length} odgovora.`);
  };

  const addNotes = (added) => {
    const fresh = added.filter((t) => !notes.includes(t));
    if (!fresh.length) return;
    changePlan({ nextAnswers: answers, nextNotes: [...notes, ...fresh], source: 'assistant' });
  };

  const undoPlanChange = () => {
    if (!planChange) return;
    const { answers: a, notes: n, log } = planChange.prev;
    setPerson((p) => ({ ...p, answers: a, notes: n, log }));
    setPlanChange(null);
    say('Izmena je poništena.');
  };
  const goToChat = () => setView('chat');
  // In Razgovor the assistant is the page itself, so it is not opened again beside it.
  const askAssistant = () => (view === 'chat' ? null : setRightPanel('copilot'));
  // The assistant's conversation: one, wherever it is open. <ChatSource> holds
  // it and is remounted, under a new key, for a new conversation.
  // Every conversation stays: each keeps its own live chat, and the nav lists
  // them so an earlier one can be opened again as it was left.
  const [conversations, setConversations] = useState(() => [{ id: 'c1', title: '', at: Date.now() }]);
  const [conversation, setConversation] = useState('c1');
  const convSeq = useRef(1);
  const titleConversation = useCallback(
    (id, title) => setConversations((list) => list.map((c) => (c.id === id && c.title !== title ? { ...c, title } : c))),
    []
  );
  const startConversation = () => {
    convSeq.current += 1;
    const id = `c${convSeq.current}`;
    setConversations((list) => [...list, { id, title: '', at: Date.now() }]);
    setConversation(id);
    return id;
  };
  // what the chat has open beside it, drawn by the app rather than inside the
  // conversation, so it is a pane of its own in the shell's right column
  const [openPane, setOpenPane] = useState(null);
  // the plan sent to someone outside the app, and who it has gone to so far
  const [sharing, setSharing] = useState(false);
  const shownSharing = useKept(sharing);
  const [sharedWith, setSharedWith] = useState([]);
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
    if (page === 'plan') return setView('plan-detail');
    setView({ 'my-care': 'dashboard' }[page] || page);
  };

  chatCtx.current = {
    plan,
    answers,
    care,
    user,
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
    onSharePlan: () => setSharing(true),
    // called, not read: `newChat` is defined further down
    onNewChat: () => newChat(),
  };
  const chatActions = useMemo(
    () => [
      { id: 'plan', label: 'Plan nege', icon: <FileText size={16} strokeWidth={1.75} />, onClick: () => chatCtx.current.onOpenPage('plan') },
      { id: 'new', label: 'Novi razgovor', icon: <Plus size={16} strokeWidth={2} />, onClick: () => chatCtx.current.onNewChat() },
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
    setUser({ ...demoUser, country: demoCountry() });
    setPerson(demoPerson(answersNow, demoNotes, demoUser));
    setView('dashboard');
    setPhase('app');
  };

  // What the account has got to, kept so signing in again resumes it.
  useEffect(() => {
    if (phase !== 'app' || !user.email || user.role === 'caregiver' || user === demoUser) return;
    saveProgress(user.email, { answers, notes, planDone: Boolean(plan), planLog });
  }, [phase, user, answers, notes, plan, planLog]);

  // A new conversation with the assistant; the plan and everything done stays.
  const newChat = () => {
    startConversation();
    setOpenPane(null);
    setView('chat');
  };

  // The AI variant takes the whole window, so while it is up the shell under it
  // is not painted at all. Covering it was not enough: it fades in over most of
  // a second, and registering straight into it showed the nav and the empty
  // chat through that fade before the conversation landed.
  const fullscreen = phase === 'app' && variant === 'ai';

  const startVariant = (next) => {
    setVariant(next);
    if (next === 'ai' && !apiKey) setAskingKey(true);
    if (next !== 'classic') {
      setRightPanel(null);
      setView('chat');
    }
  };


  const madeAt = planLog.find((e) => e.kind === 'created')?.at;
  const entries = planEntries({
    plan,
    caregiverCount: caregivers.length,
    // the day it was made, from its history (a plan saved before there was one reads today)
    today: madeAt ? formatDate(madeAt) : formatToday(),
    answers,
    notes,
  });
  const openEntry = entries[0];

  // The conversation in the nav: Minna until the plan exists, the assistant after.
  // the conversations, as the nav lists them: what was asked first in each
  // A conversation is listed once something has been said in it: an empty one
  // is the page the family is looking at, and naming it in the nav says there
  // is something to come back to when there is not.
  const conversationEntries = conversations
    .filter((c) => c.title)
    .map((c) => ({
      id: c.id,
      title: c.title,
      date:
        c.id === conversation
          ? 'Trenutni'
          : new Date(c.at).toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit' }),
    }));
  const openConversation = (id) => {
    setConversation(id);
    setOpenPane(null);
    setView('chat');
  };

  // The caregiver's side shares the shell and the components and nothing else:
  // no questionnaire, no care plan, no sidebar built for a family.
  const isCaregiver = user.role === 'caregiver';

  if (phase === 'app' && isCaregiver) {
    return (
      <div className={shell}>
        <CaregiverApp user={user} />
      </div>
    );
  }

  return (
    <SidebarProvider className={shell}>
      {/* On a phone there is no room for a nav beside the page, so it becomes a
          drawer and this bar is what opens it. Above 900px the bar is not
          drawn at all and the nav is a column again. */}
      {phase === 'app' && !fullscreen && (
        <div className="hidden shrink-0 items-center gap-2 px-3 py-2 narrow:flex">
          <SidebarTrigger />
          <Logo width={96} />
          {/* only where the pages carry one: Moja nega and a care plan
              (docs/patterns.md §4); the chat is the assistant itself */}
          {(view === 'dashboard' || view === 'plan-detail') && <AskAssistant className="ml-auto" onClick={askAssistant} />}
        </div>
      )}

      {phase === 'app' && !fullscreen && (
        <AppNav
          view={view}
          onView={setView}
          user={user}
          careBadge={waitingOnYou(care).length}
          requestsBadge={unseenAnswers(care)}
          threads={conversationEntries}
          activeThread={conversation}
          onSelectThread={openConversation}
          onNewChat={newChat}
          chatListOpen={chatListOpen}
          onToggleChatList={() => setChatListOpen((v) => !v)}
        />
      )}

      {phase === 'register' ? (
        <AppPane>
          <AnimatePresence mode="wait">
            <Register
              key="register"
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
                  setPerson((p) => ({ ...p, answers: saved.answers, notes: saved.notes || [], planMade: true, log: saved.planLog || [] }));
                  setView('dashboard');
                  return;
                }
                setAnswers({ ...(saved?.answers || {}), 'about-you': aboutYou(u) });
                if (saved?.notes) setNotes(saved.notes);
                // A family starts with Minna, not with the questionnaire: the AI
                // onboarding is the first thing after signing in, and the rest of
                // the app is what it hands over to once the plan exists.
                startVariant('ai');
              }}
            />
          </AnimatePresence>
        </AppPane>
      ) : (
        <>
          {/* Razgovor: once the plan exists, the assistant, for anything; before
              it, the way back into the conversation with Minna. */}
          {view === 'chat' && !fullscreen && (
            <AppPane>
              {plan ? (
                <KitAssistant
                  id={conversation}
                  ctx={chatCtx}
                  title="Razgovor"
                  actions={chatActions}
                  openPane={openPane}
                  onOpenPane={setOpenPane}
                />
              ) : (
                <Page>
                  <Attention title="Upoznavanje nije završeno">
                    <Card>
                      <CardDescription>
                        Minna pamti sve što ste do sada rekli. Kad završite, pravi plan nege i predlaže negovateljice.
                      </CardDescription>
                      <CardFooter>
                        <Button onClick={() => startVariant('ai')}>Nastavite razgovor</Button>
                      </CardFooter>
                    </Card>
                  </Attention>
                </Page>
              )}
            </AppPane>
          )}

          {view !== 'chat' && !fullscreen && (
            <AppPane>
              {view === 'dashboard' && (
                <Dashboard
                  care={care}
                  user={user}
                  plan={plan}
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
                  onContact={contactCaregiver}
                />
              )}
              {view === 'visits' && (
                <VisitsPage care={care} onDrawer={setDrawer} onBack={() => setView('dashboard')} />
              )}
              {view === 'requests' && (
                <RequestsPage
                  care={care}
                  onCare={setCare}
                  onContact={contactCaregiver}
                  onCaregiver={showCaregiver}
                  onProfile={showProfile}
                  onFind={() => setView('find-caregiver')}
                />
              )}
              {view === 'find-caregiver' && (
                <FindCaregiver
                  care={care}
                  onContact={contactCaregiver}
                  onCare={setCare}
                  onDrawer={setDrawer}
                  onFlash={(text) => setFlash({ text, at: Date.now() })}
                />
              )}
              {view === 'plan-detail' && !openEntry && <NoPlan onGoToChat={goToChat} />}
              {view === 'plan-detail' && openEntry && (
                <PlanDetail
                  entry={openEntry}
                  unlocked={unlocked}
                  onSelectCaregiver={selectCaregiver}
            onOpenCaregiver={showProfile}
                  onUnlock={() => setPaywall({ caregiver: null })}
                  onAskAssistant={askAssistant}
                  onShare={plan ? () => setSharing(true) : null}
                  change={planChange}
                  onUndoChange={undoPlanChange}
                  onDismissChange={() => setPlanChange(null)}
                  onFindCaregivers={() => setView('find-caregiver')}
                  standingOf={(id) => standingWith(care, id)}
                />
              )}
              {view === 'profile' && (
                <Profile
                  user={user}
                  answers={answers}
                  care={care}
                  onFlash={say}
                  onSaveUser={saveUser}
                  onEditAnswers={editAnswers}
                  onGoToChat={goToChat}
                />
              )}
              {view === 'settings' && (
                <Settings
                  unlocked={unlocked}
                  subscription={subscription}
                  care={care}
                  user={user}
                  onCare={setCare}
                  onSaveUser={saveUser}
                  // starting one opens the same dialog the care plan uses, so
                  // the plans and the price are decided in one place
                  onSubscribe={(on = true) =>
                    on === 'resume'
                      ? setSubscription((x) => ({ ...x, cancelled: false }))
                      : on
                        ? setPaywall({ caregiver: null })
                        : // it runs to the end of the period already paid
                          setSubscription((x) => ({ ...x, cancelled: true }))
                  }
                />
              )}
            </AppPane>
          )}
        </>
      )}

      <AnimatePresence>
        {view === 'chat' && openPane && (
          <ChatPane key="chat-pane" openId={openPane} ctx={chatCtx} onClose={() => setOpenPane(null)} />
        )}
        {rightPanel === 'plan' && plan && (
          <CaregiverSidebar
            key="plan-panel"
            plan={plan}
            unlocked={unlocked}
            onSelectCaregiver={selectCaregiver}
            onOpenCaregiver={showProfile}
            onUnlock={() => setPaywall({ caregiver: null })}
            onClose={() => setRightPanel(null)}
          />
        )}
        {rightPanel === 'copilot' && (
          <SidePanelFrame key="copilot-panel">
            <KitAssistant id={conversation} ctx={chatCtx} title="Asistent" actions={panelActions} />
          </SidePanelFrame>
        )}
      </AnimatePresence>

      {/* The AI variant asks for a key first; it is fullscreen, so the gate is too. */}
      <AnimatePresence>
        {phase === 'app' && variant === 'ai' && (askingKey || !apiKey) && (
          <AppPane key="key-gate" className="fixed inset-0 z-40 bg-primary-100">
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
          </AppPane>
        )}
        {phase === 'app' && variant === 'ai' && apiKey && !askingKey && (
          <ImmersiveConversation
            key="ai"
            user={user}
            answers={answers}
            onAnswer={onAnswer}
            notes={notes}
            onNote={onNote}
            apiKey={apiKey}
            onPlan={onPlan}
            onFinish={() => {
              setVariant('classic');
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

      {/* The panes stay mounted while they close, so shadcn plays its own
          closing; `useKept` holds what they show until it has. */}
      {shownDrawer && (
          <FamilyDrawer
            key={`${shownDrawer.kind}-${shownDrawer.caregiverId || shownDrawer.visitId}`}
            drawer={shownDrawer}
            open={Boolean(drawer)}
            care={care}
            unlocked={unlocked}
            onCare={setCare}
            onClose={() => setDrawer(null)}
            onOpen={setDrawer}
            onFlash={(text) => setFlash({ text, at: Date.now() })}
            onContact={(c) => {
              setDrawer(null);
              contactCaregiver(c);
            }}
            onCaregiver={showCaregiver}
          />
      )}

      {shownSim && (
          <SimPanel
            open={sim && phase === 'app'}
            care={care}
            onCare={setCare}
            onFlash={say}
            onClose={() => setSim(false)}
          />
      )}

      {shownSharing && plan && (
          <SharePlanModal
            open={sharing}
            plan={plan}
            sentTo={sharedWith}
            onSend={(emails) => {
              setSharedWith((list) => [...new Set([...list, ...emails])]);
              setSharing(false);
              say(
                emails.length === 1
                  ? `Plan je poslat na ${emails[0]}.`
                  : `Plan je poslat na ${emails.length} adrese.`
              );
            }}
            onClose={() => setSharing(false)}
          />
      )}

      {conversations.map((c) => (
        <ChatSource key={c.id} id={c.id} ctx={chatCtx} onTitle={titleConversation} />
      ))}
      <Toast flash={flash} onDone={() => setFlash(null)} />

      {shownPaywall && plan && (
          <PaywallModal
            open={Boolean(paywall)}
            caregiver={shownPaywall.caregiver}
            unlocked={unlocked}
            alreadyAsked={Boolean(shownPaywall.caregiver && !canAsk(care, shownPaywall.caregiver.id))}
            country={user.country}
            onPay={(chosen) => {
              setUnlocked(true);
              setSubscription({ planId: chosen?.id, at: Date.now() });
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
    </SidebarProvider>
  );
}
