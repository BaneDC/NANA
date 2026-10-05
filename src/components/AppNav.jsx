import { Children } from 'react';
import {
  ChevronDown,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Send,
  Settings,
  User,
} from 'lucide-react';
import Logo from './Logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// The pages that open from the family's home stay under it in the nav: her page
// and every visit are parts of the dashboard, not places of their own. The
// requests were one too, behind a link at the foot of the home; they are asked
// for too often for that, so they are a place in the nav.
const HOME_VIEWS = ['dashboard', 'caregiver', 'visits'];

const FOOTER_ITEMS = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'settings', label: 'Podešavanja', icon: Settings },
];

// The menu's look (it sits straight on the warm page ground, docs/patterns.md
// §4): rows 8 by 12, 8 corners, 14px text; hover is the ground's warm tint,
// and what is open is the primary's 200 with the text dark and medium.
const row =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--nav-hover) hover:text-foreground pointer-coarse:min-h-11 [&_svg]:shrink-0'
const rowActive = 'bg-(--nav-selected) font-medium text-(--nav-selected-text) hover:bg-(--nav-selected) hover:text-(--nav-selected-text)'

function Chevron({ open, className }) {
  return (
    <ChevronDown
      size={15}
      strokeWidth={2}
      className={cn('transition-transform duration-200', !open && 'rotate-180', className)}
    />
  );
}

// A count of what came back and waits: the primary, white, 16 tall.
function Count({ children }) {
  return (
    <span className="ml-auto min-w-4 rounded-lg bg-primary px-1 text-center text-[11px] leading-4 font-medium text-primary-foreground">
      {children}
    </span>
  );
}

// A row inside a folded list: its title, and the date or state under it.
function SubItem({ active, title, note, onClick }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full cursor-pointer flex-col rounded-lg px-2 py-2 text-left text-(--nav-text) transition-[background-color,color] duration-150 hover:bg-(--nav-hover) hover:text-foreground',
        active && 'bg-(--nav-selected) text-(--nav-selected-text) hover:bg-(--nav-selected) hover:text-(--nav-selected-text)'
      )}
      onClick={onClick}
    >
      <span className={cn('truncate text-small', active && 'font-medium')}>{title}</span>
      <span className="text-[11px] leading-[14px] text-(--nav-text-muted)">{note}</span>
    </button>
  );
}

// A nav row that folds a list of its own away — used by the conversations and
// Care plans. A row with `onOpen` is a page too, with the fold on its chevron;
// a row without one (the conversations) only folds, the whole row its button,
// so pressing it never lands somewhere unasked (docs/patterns.md §4). The list
// hangs off a line, 16 in.
function Section({ label, icon: Icon, active, onOpen, open, onToggle, empty, children }) {
  // An empty list still drew its rule and its margins, which read as a gap
  // between this section and the next.
  const hasItems = Children.toArray(children).length > 0;
  const list = hasItems
    ? children
    : empty && <p className="px-2 py-2 text-[11px] leading-[14px] text-(--nav-text-muted)">{empty}</p>;
  return (
    <Collapsible open={open} onOpenChange={onToggle} className="flex flex-col gap-1">
      {onOpen ? (
        <div className={cn(row, 'p-0', active && rowActive)}>
          <button
            type="button"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 pr-1 pl-3 text-left [font:inherit] text-inherit pointer-coarse:min-h-11"
            onClick={onOpen}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={16} strokeWidth={1.75} />
            <span>{label}</span>
          </button>
          <button
            type="button"
            className={cn(
              'mr-2 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-(--nav-text-muted) transition-[background-color,color] duration-150 hover:bg-(--nav-card) hover:text-primary-600 pointer-coarse:size-11',
              active && 'text-(--nav-selected-text)'
            )}
            onClick={() => onToggle(!open)}
            aria-label={open ? `Skupi: ${label}` : `Proširi: ${label}`}
            aria-expanded={open}
          >
            <Chevron open={open} />
          </button>
        </div>
      ) : (
        <button type="button" className={row} onClick={() => onToggle(!open)} aria-expanded={open}>
          <Icon size={16} strokeWidth={1.75} />
          <span>{label}</span>
          <Chevron open={open} className="ml-auto text-(--nav-text-muted)" />
        </button>
      )}

      {list && (
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="mt-1 mb-2 ml-4 flex flex-col border-l border-(--nav-line) pl-3">{list}</div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export default function AppNav({
  view,
  onView,
  user,
  careBadge,
  requestsBadge,
  threads,
  activeThread,
  onSelectThread,
  onNewChat,
  chatListOpen,
  onToggleChatList,
  planEntries,
  selectedPlan,
  onSelectPlan,
  planListOpen,
  onTogglePlanList,
  open,
  onClose,
}) {
  // On a phone the nav is a drawer over the page, so anything that navigates
  // also closes it — otherwise the page it opened is behind the nav.
  const go = (fn) => (...args) => {
    fn?.(...args);
    onClose?.();
  };
  const initials =
    user.name
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'NP';
  const item = (active) => cn(row, active && rowActive);

  return (
    // Beside the page with a mouse; on a narrow screen a drawer from the left,
    // on the ground's tint, over a scrim (App)
    <nav
      data-slot="app-nav"
      data-open={open || undefined}
      className={cn(
        'mr-3 flex h-full w-[232px] shrink-0 flex-col gap-4 rounded-3xl px-3 py-4',
        'narrow:fixed narrow:inset-y-0 narrow:left-0 narrow:z-31 narrow:m-0 narrow:w-[min(280px,84vw)] narrow:-translate-x-[101%] narrow:overflow-y-auto narrow:rounded-l-none narrow:bg-primary-100 narrow:shadow-container narrow:transition-transform narrow:duration-240 narrow:ease-[cubic-bezier(0.22,0.61,0.36,1)] narrow:data-open:translate-x-0'
      )}
    >
      <div className="flex items-center px-2 pt-2">
        <Logo width={110} />
      </div>

      {/* Starting a conversation is the one thing the menu asks for, so it is a
          button of its own above the list of them, not a "+" folded into the
          row beside a chevron. */}
      <Button variant="secondary" className="w-full shrink-0" onClick={go(onNewChat)}>
        <Plus size={14} strokeWidth={1.75} />
        Novi razgovor
      </Button>

      <div className="flex flex-col gap-1">
        {/* Earlier conversations, folded: the row opens the list and goes
            nowhere. A new one starts from "Novi razgovor" above. */}
        <Section
          label="Istorija razgovora"
          icon={MessageSquare}
          open={chatListOpen}
          onToggle={onToggleChatList}
          empty="Još nema razgovora."
        >
          {threads.map((t) => (
            <SubItem
              key={t.id}
              active={view === 'chat' && activeThread === t.id}
              title={t.title}
              note={t.date}
              onClick={go(() => onSelectThread(t.id))}
            />
          ))}
        </Section>

        <button
          type="button"
          className={item(HOME_VIEWS.includes(view))}
          onClick={go(() => onView('dashboard'))}
          aria-current={HOME_VIEWS.includes(view) ? 'page' : undefined}
        >
          <LayoutDashboard size={16} strokeWidth={1.75} />
          <span>Moja nega</span>
          {careBadge > 0 && <Count>{careBadge}</Count>}
        </button>

        <button
          type="button"
          className={item(view === 'find-caregiver')}
          onClick={go(() => onView('find-caregiver'))}
          aria-current={view === 'find-caregiver' ? 'page' : undefined}
        >
          <Search size={16} strokeWidth={1.75} />
          <span>Pronađi negovateljicu</span>
        </button>

        <button
          type="button"
          className={item(view === 'requests')}
          onClick={go(() => onView('requests'))}
          aria-current={view === 'requests' ? 'page' : undefined}
        >
          <Send size={16} strokeWidth={1.75} />
          <span>Vaši upiti</span>
          {requestsBadge > 0 && <Count>{requestsBadge}</Count>}
        </button>

        <Section
          label="Planovi nege"
          icon={FileText}
          active={view === 'plans' || view === 'plan-detail'}
          onOpen={go(() => onView('plans'))}
          open={planListOpen}
          onToggle={onTogglePlanList}
          empty="Još nema planova"
        >
          {planEntries.map((e) => (
            <SubItem
              key={e.id}
              active={view === 'plan-detail' && selectedPlan === e.id}
              title={e.title}
              note={e.archived ? e.date : 'Aktivan'}
              onClick={go(() => onSelectPlan(e.id))}
            />
          ))}
        </Section>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        {FOOTER_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={item(view === id)}
            onClick={go(() => onView(id))}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon size={16} strokeWidth={1.75} />
            <span>{label}</span>
          </button>
        ))}
        {/* who is signed in: a white card, the avatar as tall as the name and
            the e-mail */}
        <div className="flex items-start gap-3 rounded-2xl bg-(--nav-card) p-2 [--avatar:calc(var(--text-xs-leading)+14px)]">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-medium text-foreground">{user.name || 'Gost'}</span>
            <span className="truncate text-[11px] leading-[14px] text-muted-foreground">{user.email}</span>
          </span>
        </div>
      </div>
    </nav>
  );
}
