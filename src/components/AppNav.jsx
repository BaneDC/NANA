import { Children, useState } from 'react';
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
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

function Chevron({ open, className }) {
  return (
    <ChevronDown
      size={15}
      strokeWidth={2}
      className={cn('transition-transform duration-200', !open && 'rotate-180', className)}
    />
  );
}

// A row inside a folded list: its title, and the date or state under it.
function SubItem({ active, title, note, onClick }) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={active}>
        <button type="button" onClick={onClick}>
          <span className={cn('truncate text-small', active && 'font-medium')}>{title}</span>
          <span className="text-[11px] leading-[14px] text-(--nav-text-muted)">{note}</span>
        </button>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

// how many conversations the menu lists before "Prikaži sve"
const CHATS = 5;

// A nav row that folds a list of its own away — used by the conversations and
// Care plans. A row with `onOpen` is a page too, with the fold on its chevron
// (`SidebarMenuAction`); a row without one (the conversations) only folds, the
// whole row its button, so pressing it never lands somewhere unasked
// (docs/patterns.md §4). The list hangs off a line, 16 in.
function Section({ label, icon: Icon, active, onOpen, open, onToggle, empty, children }) {
  // An empty list still drew its rule and its margins, which read as a gap
  // between this section and the next.
  const hasItems = Children.toArray(children).length > 0;
  const list = hasItems
    ? children
    : empty && (
        <SidebarMenuSubItem className="px-2 py-2 text-[11px] leading-[14px] text-(--nav-text-muted)">
          {empty}
        </SidebarMenuSubItem>
      );
  return (
    <Collapsible asChild open={open} onOpenChange={onToggle}>
      <SidebarMenuItem className="flex flex-col gap-1">
        {onOpen ? (
          <>
            <SidebarMenuButton isActive={active} onClick={onOpen}>
              <Icon size={16} strokeWidth={1.75} />
              <span>{label}</span>
            </SidebarMenuButton>
            <SidebarMenuAction
              onClick={() => onToggle(!open)}
              aria-label={open ? `Skupi: ${label}` : `Proširi: ${label}`}
              aria-expanded={open}
            >
              <Chevron open={open} />
            </SidebarMenuAction>
          </>
        ) : (
          <SidebarMenuButton onClick={() => onToggle(!open)} aria-expanded={open}>
            <Icon size={16} strokeWidth={1.75} />
            <span>{label}</span>
            <Chevron open={open} className="ml-auto text-(--nav-text-muted)" />
          </SidebarMenuButton>
        )}

        {list && (
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <SidebarMenuSub>{list}</SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
}

// A row that opens a page, with its count of what waits.
function Place({ icon: Icon, label, active, count, onClick }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={active} onClick={onClick}>
        <Icon size={16} strokeWidth={1.75} />
        <span>{label}</span>
      </SidebarMenuButton>
      {count > 0 && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
    </SidebarMenuItem>
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
}) {
  // the latest conversations in the menu, the rest on asking
  const [allChats, setAllChats] = useState(false);
  // On a narrow screen the nav is a drawer over the page, so anything that
  // navigates also closes it — otherwise the page it opened is behind the nav.
  const { setOpenMobile } = useSidebar();
  const go = (fn) => (...args) => {
    fn?.(...args);
    setOpenMobile(false);
  };
  const initials =
    user.name
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'NP';

  return (
    <Sidebar>
      <SidebarHeader>
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
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {/* Earlier conversations, folded: the row opens the list and goes
              nowhere. A new one starts from "Novi razgovor" above. */}
          <Section
            label="Istorija razgovora"
            icon={MessageSquare}
            open={chatListOpen}
            onToggle={onToggleChatList}
            empty="Još nema razgovora."
          >
            {/* the latest few, then the rest on asking (docs/patterns.md §8a);
                the open one is always in the list */}
            {threads
              .filter((t, i) => allChats || i < CHATS || (view === 'chat' && activeThread === t.id))
              .map((t) => (
                <SubItem
                  key={t.id}
                  active={view === 'chat' && activeThread === t.id}
                  title={t.title}
                  note={t.date}
                  onClick={go(() => onSelectThread(t.id))}
                />
              ))}
            {threads.length > CHATS && (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <button type="button" onClick={() => setAllChats((v) => !v)}>
                    <span className="text-small text-(--nav-text-muted)">
                      {allChats ? 'Prikaži manje' : `Prikaži sve (${threads.length})`}
                    </span>
                  </button>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )}
          </Section>

          <Place
            icon={LayoutDashboard}
            label="Moja nega"
            active={HOME_VIEWS.includes(view)}
            count={careBadge}
            onClick={go(() => onView('dashboard'))}
          />
          <Place
            icon={Search}
            label="Pronađi negovateljicu"
            active={view === 'find-caregiver'}
            onClick={go(() => onView('find-caregiver'))}
          />
          <Place
            icon={Send}
            label="Vaši upiti"
            active={view === 'requests'}
            count={requestsBadge}
            onClick={go(() => onView('requests'))}
          />

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
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="gap-2">
          {FOOTER_ITEMS.map(({ id, label, icon }) => (
            <Place key={id} icon={icon} label={label} active={view === id} onClick={go(() => onView(id))} />
          ))}
        </SidebarMenu>
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
      </SidebarFooter>
    </Sidebar>
  );
}
