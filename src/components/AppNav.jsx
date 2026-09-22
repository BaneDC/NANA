import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  Settings,
  User,
} from 'lucide-react';
import Logo from './Logo';

// The pages that open from the family's home stay under it in the nav: her page,
// every visit and every request are parts of the dashboard, not places of their own.
const HOME_VIEWS = ['dashboard', 'caregiver', 'visits', 'requests'];

const FOOTER_ITEMS = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'settings', label: 'Podešavanja', icon: Settings },
];

// A nav row that folds a list of its own away — used by Chat and Care plans.
function Section({ id, label, icon: Icon, active, onOpen, open, onToggle, onAdd, children }) {
  return (
    <>
      <div className={`nav-item has-action${active ? ' is-active' : ''}`}>
        <button
          type="button"
          className="nav-item-main"
          onClick={onOpen}
          aria-current={active ? 'page' : undefined}
        >
          <Icon size={16} strokeWidth={1.75} />
          <span>{label}</span>
        </button>
        <button
          type="button"
          className="nav-inline-btn"
          onClick={onToggle}
          aria-label={open ? `Skupi: ${label}` : `Proširi: ${label}`}
          aria-expanded={open}
        >
          <ChevronDown size={15} strokeWidth={2} className={`toggle-chevron${open ? '' : ' is-up'}`} />
        </button>
        {onAdd && (
          <button
            type="button"
            className="nav-inline-btn"
            onClick={onAdd}
            aria-label="Novi razgovor"
            title="Novi razgovor"
          >
            <Plus size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={`${id}-list`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="nav-sub">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function AppNav({
  view,
  onView,
  user,
  badge,
  threads,
  activeThread,
  liveTitle,
  onSelectThread,
  onNewChat,
  chatListOpen,
  onToggleChatList,
  planEntries,
  selectedPlan,
  onSelectPlan,
  planListOpen,
  onTogglePlanList,
  variant,
  onVariant,
  onRestart,
}) {
  const initials =
    user.name
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'NP';

  return (
    <nav className="app-nav">
      <div className="nav-head">
        <Logo width={110} />
      </div>

      <div className="nav-group">
        <Section
          id="chat"
          label="Razgovor"
          icon={MessageSquare}
          active={view === 'chat'}
          onOpen={() => onView('chat')}
          open={chatListOpen}
          onToggle={onToggleChatList}
          onAdd={onNewChat}
        >
          <button
            type="button"
            className={`nav-sub-item${activeThread === 'live' ? ' is-active' : ''}`}
            onClick={() => onSelectThread('live')}
          >
            <span className="nav-sub-label">{liveTitle}</span>
            <span className="nav-sub-date">Trenutni</span>
          </button>
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`nav-sub-item${activeThread === t.id ? ' is-active' : ''}`}
              onClick={() => onSelectThread(t.id)}
            >
              <span className="nav-sub-label">{t.title}</span>
              <span className="nav-sub-date">{t.date}</span>
            </button>
          ))}
        </Section>

        <button
          type="button"
          className={`nav-item${HOME_VIEWS.includes(view) ? ' is-active' : ''}`}
          onClick={() => onView('dashboard')}
          aria-current={HOME_VIEWS.includes(view) ? 'page' : undefined}
        >
          <LayoutDashboard size={16} strokeWidth={1.75} />
          <span>Moja nega</span>
          {badge > 0 && <span className="nav-badge">{badge}</span>}
        </button>

        <button
          type="button"
          className={`nav-item${view === 'find-caregiver' ? ' is-active' : ''}`}
          onClick={() => onView('find-caregiver')}
          aria-current={view === 'find-caregiver' ? 'page' : undefined}
        >
          <Search size={16} strokeWidth={1.75} />
          <span>Pronađi negovateljicu</span>
        </button>

        <Section
          id="plan"
          label="Planovi nege"
          icon={FileText}
          active={view === 'plans' || view === 'plan-detail'}
          onOpen={() => onView('plans')}
          open={planListOpen}
          onToggle={onTogglePlanList}
        >
          {planEntries.length === 0 && <p className="nav-sub-empty">Još nema planova</p>}
          {planEntries.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`nav-sub-item${
                view === 'plan-detail' && selectedPlan === e.id ? ' is-active' : ''
              }`}
              onClick={() => onSelectPlan(e.id)}
            >
              <span className="nav-sub-label">{e.title}</span>
              <span className="nav-sub-date">{e.archived ? e.date : 'Aktivan'}</span>
            </button>
          ))}
        </Section>
      </div>

      <div className="nav-group nav-group-end">
        {/* both questionnaire variants stay available — they write the same answers */}
        <div className="nav-variant">
          <span className="nav-variant-label">Upitnik</span>
          <div className="segmented" role="group" aria-label="Vrsta upitnika">
            {[
              ['classic', 'Klasični'],
              ['immersive', 'Imerzivni'],
              ['ai', 'AI'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={variant === id ? 'is-active' : ''}
                onClick={() => onVariant(id)}
                aria-pressed={variant === id}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {FOOTER_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`nav-item${view === id ? ' is-active' : ''}`}
            onClick={() => onView(id)}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon size={16} strokeWidth={1.75} />
            <span>{label}</span>
          </button>
        ))}
        <div className="nav-user">
          <span className="cg-avatar">{initials}</span>
          <span className="nav-user-text">
            <span className="nav-user-name">{user.name || 'Gost'}</span>
            <span className="nav-user-mail">{user.email}</span>
          </span>
          <button type="button" className="ci-btn" onClick={onRestart} aria-label="Počni ispočetka">
            <RotateCcw size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </nav>
  );
}
