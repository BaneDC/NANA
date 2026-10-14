import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Register from './screens/Register';
import Dashboard from './screens/Dashboard';
import FindCaregiver from './screens/FindCaregiver';
import MedicalRecord from './screens/MedicalRecord';
import Settings from './screens/Settings';
import AppNav from './components/AppNav';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Logo from './components/Logo';
import CaregiverSidebar from './components/CaregiverSidebar';
import KitAssistant, { CHANGE_OPENER, ChatPane, ChatSource, chatStage, chatStore } from './components/KitAssistant';
import { demoAnswersNow, demoCountry, demoNotesNow, demoUser, wantsDemo } from './data/demoCase';
import { loadProgress, saveProgress, updateAccount } from './lib/account';
import { Plus, X } from 'lucide-react';
import HelpDialog from './components/HelpDialog';
import PaywallModal from './components/PaywallModal';
import AskAssistant from './components/AskAssistant';
import SharePlanModal from './components/SharePlanModal';
import ImmersiveConversation from './screens/ImmersiveConversation';
import FamilyDrawer from './components/family/FamilyDrawer';
import CaregiverPage from './screens/CaregiverPage';
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
import { askCaregiver, canAsk, cardTrouble, linkCard, dateOfToday, firstName, plansToConfirm, relanguage, standingWith, unseenAnswers, waitingOnYou } from './data/familyCare';
import { declineCard } from './data/sim';
import { requestSaid, startCare, withAnswers } from './data/familyStart';
import { fillCare } from './data/demoFill';
import SimPanel from './components/family/SimPanel';
import { useKept } from './hooks/use-kept';
import { buildPlan, caregivers, coordinator } from './data/carePlan';
import { applyChanges, describeChanges, planDiff } from './data/planEdits';
import { recordImpact, writeEvent, written } from './data/record';
import { requestFoot, requestNote } from './data/firstSteps';
import { changeEntry } from './data/planLog';
import { demoPerson, newPerson, planOf, withPlan } from './data/person';
import { localized, locale, msg, setLang, t, useKeepScroll, useLang } from './i18n';
import { setMarket } from './data/market';
import { renewalAt, renewsOn } from './data/plans';


// /?demo opens past the onboarding, on a finished plan — for trying the chat and
// everything after it without talking the conversation through each time.
const DEMO = wantsDemo();
const demoStart = DEMO ? reconcile({}, demoAnswersNow()).answers : null;
// /?demo&puno opens it already a week into care (src/data/demoFill.js), so a
// reload does not mean clicking through the simulation again.
const FILLED = DEMO && new URLSearchParams(window.location.search).has('puno');

// What registration already told us about the person writing, as the answer the
// onboarding would otherwise ask for, so Minna does not ask it again.
const aboutYou = (u) => ({ values: { 'your-name': u.name, 'your-phone': u.phone } });

// The screen: the menu and the pane beside it, 12 from the window's edges;
// on a narrow screen the top bar above the pane, edge to edge.
// the pages "Pitaj asistenta" or "Prijavi promenu" open the assistant from (docs/patterns.md §4)
const ASSISTANT_PAGES = ['dashboard', 'record'];
const shell = 'flex h-full overflow-hidden p-3 narrow:flex-col narrow:p-0';

export default function App() {
  // A switch of language draws everything under here again; what App keeps stays.
  const lang = useLang();
  useKeepScroll(lang);
  const [phase, setPhase] = useState(DEMO ? 'app' : 'register'); // register | app
  const [view, setView] = useState(DEMO ? 'dashboard' : 'chat');
  // `role` is chosen at registration and decides which of the two applications
  // this is: the family's, or the caregiver's. Switching means starting over:
  // reloading the page goes back to sign-in.
  const [user, setUser] = useState(
    DEMO ? { ...demoUser, country: demoCountry() } : { name: '', email: '', role: 'family' }
  );
  // The facts of the place (the emergency number) follow the country registered with.
  setMarket(user.country);
  // An account that chose a language in Settings opens in it.
  useEffect(() => {
    if (user.language) setLang(user.language);
  }, [user.language]);
  // The one person this account cares for (src/data/person.js): her answers and
  // notes, the plan built from them, what changed in it, and the care around
  // her. Everything below reads her from here, so nothing has a second source.
  const [person, setPerson] = useState(() => {
    if (!DEMO) return newPerson();
    const p = demoPerson(demoStart, demoNotesNow(), demoUser);
    return FILLED ? { ...p, care: fillCare(withAnswers(p.care, demoStart, demoUser)) } : p;
  });
  // a part of her set on its own, as a value or from the one before
  const setPart = useCallback(
    (key) => (next) => setPerson((p) => ({ ...p, [key]: typeof next === 'function' ? next(p[key]) : next })),
    []
  );
  const setAnswers = useMemo(() => setPart('answers'), [setPart]);
  const setNotes = useMemo(() => setPart('notes'), [setPart]);
  const setCare = useMemo(() => setPart('care'), [setPart]);
  // after a switch, the dates kept on the care are said in the new language
  const firstLang = useRef(lang);
  useEffect(() => {
    if (lang === firstLang.current) return;
    firstLang.current = lang;
    setCare(relanguage);
  }, [lang, setCare]);
  // her medical record: what the answers do not hold, and its history
  const setRecord = useMemo(() => setPart('record'), [setPart]);
  const { answers, notes, care, record, log: planLog } = person;
  // rebuilt when what it is built from changes, not on every change to her care
  const { planMade } = person;
  const plan = useMemo(() => planOf({ planMade, answers, notes }), [planMade, answers, notes, lang]);
  const [unlocked, setUnlocked] = useState(FILLED);
  // which plan they paid for and when, so settings can say what they are on
  const [subscription, setSubscription] = useState(FILLED ? { planId: 'monthly', at: Date.now() } : null); // { planId, at }
  // one slot on the right: the care plan or the assistant, never both
  const [rightPanel, setRightPanel] = useState(null); // null | 'plan' | 'copilot'
  // null when closed, otherwise { caregiver } — a caregiver means the user tapped one
  // to request their number, no caregiver means they unlocked the recommendations.
  const [paywall, setPaywall] = useState(null);
  // "Pomoć" in the menu: the coordinator's contact, over whatever page is open
  const [help, setHelp] = useState(false);
  // what asking a caregiver costs, said the same wherever it is said
  const askNote = requestNote(unlocked, user.country);
  const shownPaywall = useKept(paywall);
  // a renewal that went through: the next period, on the plan they chose for it
  const renewSubscription = () => {
    setSubscription((x) => ({ planId: x.nextPlanId || x.planId, at: renewalAt(user.country, x.planId, x.at) }));
    say(t('Pretplata je obnovljena.'));
  };
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
  const onNote = useCallback((note) => setNotes((n) => (n.includes(note) ? n : [...n, note])), []);
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
    say(t('Podaci su sačuvani.'));
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
  const changePlan = ({ nextAnswers, nextNotes, source, fromRecord = false }) => {
    const nextPlan = plan ? buildPlan(nextAnswers, nextNotes) : null;
    const prev = planChange?.prev || { answers, notes, plan, log: planLog };
    // the history gets a line only when the plan reads differently afterwards
    const entry = nextPlan && changeEntry({ before: { answers, notes, plan }, after: { answers: nextAnswers, notes: nextNotes, plan: nextPlan }, source });
    const nextLog = entry ? [entry, ...planLog] : planLog;
    const changed = Object.keys({ ...prev.answers, ...nextAnswers })
      .filter((id) => JSON.stringify(prev.answers[id]) !== JSON.stringify(nextAnswers[id]) && nextAnswers[id])
      .map((id) => ({ questionId: id, answer: nextAnswers[id] }));
    // kept until "U redu", so said in every language: the plans are built again
    // in each, since what they name is in the language they were built in
    const { desc, diff } = localized(() => ({
      desc: describeChanges(prev.answers, changed),
      diff: planDiff(prev.plan && buildPlan(prev.answers, prev.notes), nextPlan && buildPlan(nextAnswers, nextNotes)),
    }));
    setPlanChange({
      source: planChange && planChange.source !== source ? 'both' : source,
      rows: desc.rows,
      frailty: desc.frailty,
      saved: nextNotes.filter((n) => !prev.notes.includes(n)),
      recs: diff.recs,
      letter: diff.letter,
      touched: diff.touched,
      // whether any of it was written from the medical record
      fromRecord: fromRecord || Boolean(planChange?.fromRecord),
      at: Date.now(),
      prev,
    });
    setPerson((p) => ({ ...p, answers: nextAnswers, notes: nextNotes, log: nextLog }));
  };

  // What the family agreed to in the assistant: the answers it moves build the
  // plan again, and what happened is written into her medical record with
  // every answer and entry it moved, what it did to the plan and what to do
  // next. The record is where a change to her is kept, and the assistant is
  // the only way one is made: a correction of what was written wrong comes
  // through here too, and is kept as a correction.
  const applyFromAssistant = (changes, { event, health = [], correction = false } = {}) => {
    const impact = changes.length ? recordImpact({ answers, notes, plan, changes }) : null;
    if (changes.length) {
      changePlan({ nextAnswers: applyChanges(answers, changes).answers, nextNotes: notes, source: 'assistant', fromRecord: true });
    }
    // the record's entry works the impact out again in each language it is kept in
    const impactFor = () => (changes.length ? recordImpact({ answers, notes, plan: plan && buildPlan(answers, notes), changes }) : null);
    setRecord((r) => writeEvent(r, care.now, { event, impactFor, health, care, correction }));
    say(impact?.touched.length ? t('Upisano u karton. Plan nege je izmenjen.') : t('Upisano u karton.'));
  };

  const addNotes = (added) => {
    const fresh = added.filter((note) => !notes.includes(note));
    if (!fresh.length) return;
    changePlan({ nextAnswers: answers, nextNotes: [...notes, ...fresh], source: 'assistant' });
  };

  const undoPlanChange = () => {
    if (!planChange) return;
    const { answers: a, notes: n, log } = planChange.prev;
    setPerson((p) => ({ ...p, answers: a, notes: n, log }));
    if (planChange.fromRecord) {
      setRecord((r) =>
        written(r, care.now, {
          kind: 'undo',
          by: 'you',
          title: msg('Izmene su poništene'),
          lines: [localized(() => t('Vraćeno kako je bilo: {what}.', { what: planChange.rows.map((row) => t(row.title)).join(', ') }))],
        })
      );
    }
    setPlanChange(null);
    say(t('Izmena je poništena.'));
  };
  const goToChat = () => setView('chat');
  // In Razgovor the assistant is the page itself, so it is not opened again beside it.
  // "Pitaj asistenta" and "Prijavi promenu" open the panel, and when it is open
  // already they keep it open and put the cursor where the family writes; only
  // X closes it (docs/patterns.md §4). Not on a phone: there the panel is the
  // whole screen and a keyboard coming up would cover what it says.
  const focusComposer = (after = 50) => {
    if (window.matchMedia('(max-width: 640px)').matches) return;
    let tries = 0;
    const find = () => {
      const box = document.querySelector('.chat-side [contenteditable=plaintext-only]');
      if (box) box.focus();
      else if (tries++ < 20) setTimeout(find, 50);
    };
    setTimeout(find, after);
  };
  const askAssistant = () => {
    if (view === 'chat') return;
    setRightPanel('copilot');
    focusComposer();
  };
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
  const startConversation = (opener = false) => {
    convSeq.current += 1;
    const id = `c${convSeq.current}`;
    setConversations((list) => [...list, { id, title: '', at: Date.now(), opener }]);
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
    setCare(askCaregiver(id, requestSaid(care)));
    say(t('Poruka je poslata zajedno sa planom nege. {name} obično odgovori istog dana.', { name: firstName(c.name) }));
    return true;
  };
  const openPage = (page) => {
    // the care plan has no page of its own: it is on "Moja nega"
    setView({ 'my-care': 'dashboard', plan: 'dashboard' }[page] || page);
  };

  chatCtx.current = {
    conversation,
    plan,
    answers,
    care,
    // her medical record and the prototype's day, for what the assistant writes into it
    record,
    today: dateOfToday(care),
    user,
    apiKey,
    onAddNotes: addNotes,
    onApplyChanges: applyFromAssistant,
    onAskCaregiver: assistantAsk,
    onOpenPage: openPage,
    // for what opens in the chat's pane
    unlocked,
    askFoot: requestFoot(unlocked),
    // nothing has been asked of the assistant yet: it says what it is for
    // (docs/patterns.md §4b)
    firstChat: !conversations.some((c) => c.title),
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
      { id: 'new', label: t('Novi razgovor'), icon: <Plus size={16} strokeWidth={2} />, onClick: () => chatCtx.current.onNewChat() },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang]
  );
  // a new conversation stays in the panel; while this one is empty there is nothing to leave
  const panelActions = useMemo(
    () => [
      {
        id: 'new',
        label: t('Novi razgovor'),
        icon: <Plus size={16} strokeWidth={2} />,
        onClick: () => chatStage(chatStore.get(chatCtx.current.conversation)) !== 'empty' && startConversation(),
        pinned: true,
      },
      { id: 'close', label: t('Zatvori panel'), icon: <X size={16} strokeWidth={1.75} />, onClick: () => setRightPanel(null), pinned: true },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang]
  );

  // "Prijavi promenu" on the medical record: the assistant opens beside it
  // already asking what changed (a fixed opener, sent as the family's own).
  // An empty conversation gets the opener, one that
  // has only the opener is just shown again, and one where the family has said
  // something is left as it is for a new conversation (docs/patterns.md §10a).
  const reportChange = () => {
    setRightPanel('copilot');
    const chat = chatStore.get(conversation);
    const stage = chatStage(chat);
    // a new conversation is drawn anew, so the cursor waits for it
    focusComposer(stage === 'talk' ? 300 : 50);
    if (stage === 'talk') return startConversation(true);
    const draft = chat?.turns[chat.turns.length - 1];
    if (stage === 'empty' && draft && !chat.isStreaming) chat.submit(draft.id, t(CHANGE_OPENER));
  };

  // The demo from the sign-in screen: the same finished case as /?demo.
  const openDemo = () => {
    const answersNow = reconcile({}, demoAnswersNow()).answers;
    setUser({ ...demoUser, country: demoCountry() });
    setPerson(demoPerson(answersNow, demoNotesNow(), demoUser));
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
          ? t('Trenutni')
          : new Date(c.at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }),
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
      <div key={lang} className={shell}>
        <CaregiverApp user={user} />
      </div>
    );
  }

  return (
    <SidebarProvider key={lang} className={shell}>
      {/* On a phone there is no room for a nav beside the page, so it becomes a
          drawer and this bar is what opens it. Above 900px the bar is not
          drawn at all and the nav is a column again. */}
      {phase === 'app' && !fullscreen && (
        <div className="hidden shrink-0 items-center gap-2 px-3 py-2 narrow:flex">
          <SidebarTrigger />
          <Logo width={96} />
          {/* only where the pages carry one: Moja nega and a care plan
              (docs/patterns.md §4); the chat is the assistant itself, and the
              medical record has its own one action, "Prijavi promenu" */}
          {view === 'dashboard' && <AskAssistant className="ml-auto" onClick={askAssistant} />}
        </div>
      )}

      {phase === 'app' && !fullscreen && (
        <AppNav
          view={view}
          onView={setView}
          user={user}
          recordOf={answers['about-person']?.values?.name}
          onHelp={() => setHelp(true)}
          careBadge={waitingOnYou(care).length + plansToConfirm(care).length}
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
                  title={t('Razgovor')}
                  actions={chatActions}
                  openPane={openPane}
                  onOpenPane={setOpenPane}
                />
              ) : (
                <Page>
                  <Attention title={t('Upoznavanje nije završeno')}>
                    <Card>
                      <CardDescription>
                        {t('Minna pamti sve što ste do sada rekli. Kad završite, pravi plan nege i predlaže negovateljice.')}
                      </CardDescription>
                      <CardFooter>
                        <Button onClick={() => startVariant('ai')}>{t('Nastavite razgovor')}</Button>
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
                  unlocked={unlocked}
                  askNote={askNote}
                  planChange={planChange}
                  onSelectCaregiver={selectCaregiver}
                  onOpenCaregiver={showProfile}
                  onUnlock={() => setPaywall({ caregiver: null })}
                  standingOf={(id) => standingWith(care, id)}
                  onUndoChange={undoPlanChange}
                  onDismissChange={() => setPlanChange(null)}
                  onCare={setCare}
                  onFlash={say}
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
              {view === 'requests' && (
                <RequestsPage
                  care={care}
                  askNote={askNote}
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
                  askNote={askNote}
                  onContact={contactCaregiver}
                  onCare={setCare}
                  onDrawer={setDrawer}
                  onFlash={(text) => setFlash({ text, at: Date.now() })}
                />
              )}
              {view === 'record' && (
                <MedicalRecord
                  answers={answers}
                  plan={plan}
                  care={care}
                  record={record}
                  planChange={planChange}
                  onGoToChat={goToChat}
                  onOpenPlan={() => setView('dashboard')}
                  onReportChange={reportChange}
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
                      : on === 'renew'
                        ? renewSubscription()
                      : on === 'change'
                        ? setPaywall({ caregiver: null, change: true })
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
        {/* open stays open, but it is shown only on the pages it opens from;
            elsewhere it steps aside and is back on the way back */}
        {rightPanel === 'copilot' && ASSISTANT_PAGES.includes(view) && (
          <SidePanelFrame key="copilot-panel" onClose={() => setRightPanel(null)}>
            <KitAssistant id={conversation} ctx={chatCtx} title={t('Asistent')} actions={panelActions} className="chat-side" />
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
            // The first thing after the onboarding is the home, which is the
            // care plan itself until someone comes (docs/patterns.md §4a).
            onFinish={() => {
              setVariant('classic');
              setView('dashboard');
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
            plan={plan}
            unlocked={unlocked}
            askNote={askNote}
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
            // the whole example in one go, with the subscription it needs
            onFill={() => {
              setCare(fillCare);
              setUnlocked(true);
              setSubscription((x) => x || { planId: 'monthly', at: Date.now() });
              setDrawer(null);
              setView('dashboard');
              setSim(false);
              say(t('Primer je popunjen: dve negovateljice, posete, i dve stvari koje čekaju na vas.'));
            }}
            // The renewal, from Stripe's side. The subscription keeps real
            // dates and the simulation a clock of its own, so the day it
            // renews is a button rather than days passing.
            onRenew={
              subscription &&
              (() => {
                if (subscription.cancelled) {
                  // a cancelled one runs out instead
                  setSubscription(null);
                  setUnlocked(false);
                  return say(t('Pretplata je istekla.'));
                }
                const bad = cardTrouble(care);
                if (bad === 'declined' || bad === 'expired') {
                  setCare(declineCard);
                  return say(t('Naplata pretplate nije uspela.'));
                }
                renewSubscription();
              })
            }
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
                  ? t('Plan je poslat na {email}.', { email: emails[0] })
                  : t('Plan je poslat na {count} adrese.', { count: emails.length })
              );
            }}
            onClose={() => setSharing(false)}
          />
      )}

      {conversations.map((c) => (
        <ChatSource key={c.id} id={c.id} ctx={chatCtx} onTitle={titleConversation} opener={c.opener} />
      ))}
      <Toast flash={flash} onDone={() => setFlash(null)} />

      <HelpDialog
        open={help}
        coordinator={plan?.coordinator || coordinator}
        // a prototype: the message goes nowhere, the family is told who reads it
        onSend={() => say(t('Poruka je poslata. {name} će vam se javiti danas.', { name: firstName((plan?.coordinator || coordinator).name) }))}
        onClose={() => setHelp(false)}
      />

      {shownPaywall && plan && (
          <PaywallModal
            open={Boolean(paywall)}
            caregiver={shownPaywall.caregiver}
            unlocked={unlocked}
            alreadyAsked={Boolean(shownPaywall.caregiver && !canAsk(care, shownPaywall.caregiver.id))}
            country={user.country}
            // changing plans: the one they are on, or already moving to
            current={shownPaywall.change ? subscription?.nextPlanId || subscription?.planId : undefined}
            startsOn={subscription ? renewsOn(user.country, subscription.planId, subscription.at) : ''}
            onPay={(chosen) => {
              if (paywall.change) {
                // back to the plan they are on clears the move
                const next = chosen.id === subscription.planId ? undefined : chosen.id;
                setSubscription((x) => ({ ...x, nextPlanId: next }));
                say(
                  next
                    ? t('Od {date} imate {plan}.', { date: renewsOn(user.country, subscription.planId, subscription.at), plan: chosen.name })
                    : t('Ostajete na paketu {plan}.', { plan: chosen.name })
                );
                setPaywall(null);
                return;
              }
              setUnlocked(true);
              setSubscription({ planId: chosen?.id, at: Date.now() });
              // the card it is paid with is kept for the visits too, so it is
              // never asked for twice
              setCare((c) => (c.payment?.connected ? c : linkCard(c)));
              say(t('Pretplata je aktivna.'));
              // unlocking the plan has nothing left to do here; a message still has to be sent
              if (!paywall.caregiver) setPaywall(null);
            }}
            onSend={(message) => {
              setCare(askCaregiver(paywall.caregiver.id, message));
              say(t('Poruka je poslata zajedno sa planom nege. {name} obično odgovori istog dana.', { name: firstName(paywall.caregiver.name) }));
              setPaywall(null);
            }}
            onClose={() => setPaywall(null)}
          />
      )}
    </SidebarProvider>
  );
}
