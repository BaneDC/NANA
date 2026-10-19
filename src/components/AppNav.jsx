import { Children } from 'react';
import { useShowMore } from '@/hooks/use-show-more';
import { useIsPhone } from '@/hooks/use-phone';
import {
  ChevronDown,
  CircleHelp,
  Inbox,
  Users,
  Wallet,
  FlaskConical,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Send,
  Settings,
} from 'lucide-react';
import Logo from './Logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFold,
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
import { msg, t } from '@/i18n';

// The pages that open from the family's home stay under it in the nav: her page
// is a part of the dashboard, not a place of its own (every visit is a drawer
// on the home since 11 October). The
// requests were one too, behind a link at the foot of the home; they are asked
// for too often for that, so they are a place in the nav.
const HOME_VIEWS = ['dashboard', 'caregiver'];

// the account is in Settings (the Profile page went on 10 October)
const FOOTER_ITEMS = [{ id: 'settings', label: msg('Podešavanja'), icon: Settings }];
// "Pomoć" stands over them and is not a page: it opens the coordinator's
// contact in a dialog (HelpDialog), so it is never the selected item

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
          <span className="text-small text-(--nav-text-muted)">{note}</span>
        </button>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

// A nav row that folds a list of its own away — used by the conversations and
// Care plans. A row with `onOpen` is a page too, with the fold on its chevron
// (`SidebarMenuAction`); a row without one (the conversations) only folds, the
// whole row its button, so pressing it never lands somewhere unasked
// (docs/patterns.md §4). The list hangs off a line, 16 in.
function Section({ label, icon: Icon, active, onOpen, open, onToggle, empty, children }) {
  const { collapsed, setCollapsed } = useSidebar();
  // An empty list still drew its rule and its margins, which read as a gap
  // between this section and the next.
  const hasItems = Children.toArray(children).length > 0;
  // Folded to icons there is nowhere for the list to open: the row opens the
  // menu, with the list. The row itself stays, so folding moves nothing.
  const unfold = () => {
    setCollapsed(false);
    onToggle(true);
  };
  const named = collapsed ? { 'aria-label': label, title: label } : {};
  const list = hasItems
    ? children
    : empty && (
        <SidebarMenuSubItem className="px-2 py-2 text-small text-(--nav-text-muted)">
          {empty}
        </SidebarMenuSubItem>
      );
  return (
    <Collapsible asChild open={open && !collapsed} onOpenChange={onToggle}>
      <SidebarMenuItem className="flex flex-col gap-1">
        {onOpen ? (
          <>
            <SidebarMenuButton isActive={active} onClick={collapsed ? unfold : onOpen} {...named}>
              <Icon size={16} strokeWidth={1.75} />
              <span className={FADES}>{label}</span>
            </SidebarMenuButton>
            <SidebarMenuAction
              className={cn(FADES, 'menu-folded:pointer-events-none')}
              onClick={() => onToggle(!open)}
              aria-label={open ? t('Skupi: {label}', { label }) : t('Proširi: {label}', { label })}
              aria-expanded={open}
            >
              <Chevron open={open} />
            </SidebarMenuAction>
          </>
        ) : (
          <SidebarMenuButton onClick={collapsed ? unfold : () => onToggle(!open)} aria-expanded={open && !collapsed} {...named}>
            <Icon size={16} strokeWidth={1.75} />
            <span className={FADES}>{label}</span>
            <Chevron open={open} className={cn('ml-auto text-(--nav-text-muted)', FADES)} />
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

// What a row says, fading as the column folds; the edge cuts it, so it stays
// where it is (docs/patterns.md §4).
const FADES = 'transition-opacity duration-200 ease-out menu-folded:opacity-0';

// A row that opens a page, with its count of what waits.
// Folded to icons it is its icon, and says its name in `title`.
function Place({ icon: Icon, label, active, count, onClick }) {
  const { collapsed } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        onClick={onClick}
        aria-label={collapsed ? label : undefined}
        title={collapsed ? label : undefined}
      >
        <Icon size={16} strokeWidth={1.75} />
        <span className={FADES}>{label}</span>
      </SidebarMenuButton>
      {count > 0 && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
    </SidebarMenuItem>
  );
}

export default function AppNav({
  role = 'family',
  market = 'fi',
  boardBadge = 0,
  view,
  onView,
  user,
  recordOf,
  onHelp,
  onSim,
  careBadge,
  requestsBadge,
  threads,
  activeThread,
  onSelectThread,
  onNewChat,
  chatListOpen,
  onToggleChatList,
}) {
  // the latest five conversations, then ten more in place (docs/patterns.md §8a)
  const chats = useShowMore(threads, { first: 5 });
  // On a narrow screen the nav is a drawer over the page, so anything that
  // navigates also closes it — otherwise the page it opened is behind the nav.
  const { setOpenMobile, collapsed } = useSidebar();
  const phone = useIsPhone();
  // her side (docs/superpowers/specs/2026-10-19-temelj-design.md): no chat, her own pages
  const caregiver = role === 'caregiver';
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
        {/* the logo, and the button that folds the menu to icons. Folded, the
            logo fades under the edge and the button, at the row's end, is where
            the icons under it stand. The row is 28 either way; the button's
            square (36) spills over it, so folding moves nothing down. */}
        <div className="flex h-7 items-center">
          <div className={cn('min-w-0 flex-1 overflow-hidden', FADES)}>
            <div className="ml-2 w-fit">
              <Logo width={110} />
            </div>
          </div>
          <SidebarFold />
        </div>

        {/* Starting a conversation is the one thing the menu asks for, so it is a
            button of its own above the list of them, not a "+" folded into the
            row beside a chevron. */}
        {/* one button in both: folded, its words narrow away and the "+" is
            left in the middle of the square */}
        {!caregiver && (
          <Button
            variant="secondary"
            className="w-full shrink-0 gap-0 px-0"
            aria-label={collapsed ? t('Novi razgovor') : undefined}
            title={collapsed ? t('Novi razgovor') : undefined}
            onClick={go(onNewChat)}
          >
            <Plus size={14} strokeWidth={1.75} />
            <span className="ml-2 max-w-40 overflow-hidden transition-[max-width,margin,opacity] duration-200 ease-out menu-folded:ml-0 menu-folded:max-w-0 menu-folded:opacity-0">
              {t('Novi razgovor')}
            </span>
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {!caregiver && (
            <>
              {/* Earlier conversations, folded: the row opens the list and goes
                  nowhere. A new one starts from "Novi razgovor" above. */}
              <Section
                label={t('Istorija razgovora')}
                icon={MessageSquare}
                open={chatListOpen}
                onToggle={onToggleChatList}
                empty={t('Još nema razgovora.')}
              >
                {/* the open one is always in the list */}
                {threads
                  .filter((th) => chats.visible.includes(th) || (view === 'chat' && activeThread === th.id))
                  .map((th) => (
                    <SubItem
                      key={th.id}
                      active={view === 'chat' && activeThread === th.id}
                      title={th.title}
                      note={th.date}
                      onClick={go(() => onSelectThread(th.id))}
                    />
                  ))}
                {chats.rest > 0 && (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <button type="button" onClick={chats.more}>
                        <span className="text-small text-(--nav-text-muted)">{t('Prikaži još {count}', { count: Math.min(chats.step, chats.rest) })}</span>
                      </button>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )}
              </Section>

              <Place
                icon={LayoutDashboard}
                label={t('Moja nega')}
                active={HOME_VIEWS.includes(view)}
                count={careBadge}
                onClick={go(() => onView('dashboard'))}
              />
              <Place
                icon={Search}
                label={t('Pronađi negovateljicu')}
                active={view === 'find-caregiver'}
                onClick={go(() => onView('find-caregiver'))}
              />
              <Place
                icon={Send}
                label={t('Moji upiti')}
                active={view === 'requests'}
                count={requestsBadge}
                onClick={go(() => onView('requests'))}
              />
            </>
          )}
          {/* her side: for now one page, the requests sent to her; the board,
              her clients and her earnings come with part 3 */}
          {caregiver && market === 'sr' && (
            <Place icon={Inbox} label={t('Upiti')} active={view === 'requests' || view === 'client'} count={requestsBadge} onClick={go(() => onView('requests'))} />
          )}
          {/* Finland: her board, her clients, her earnings (part 3) */}
          {caregiver && market !== 'sr' && (
            <>
              <Place icon={LayoutDashboard} label={t('Tabla')} active={view === 'board'} count={boardBadge} onClick={go(() => onView('board'))} />
              <Place icon={Users} label={t('Klijenti')} active={view === 'clients' || view === 'client'} onClick={go(() => onView('clients'))} />
              <Place icon={Wallet} label={t('Zarada')} active={view === 'earnings'} onClick={go(() => onView('earnings'))} />
            </>
          )}

          {/* The care plan has no place here: before anyone comes it is
              "Moja nega" itself, and after that what is left of it is on that
              page too (docs/patterns.md §4a). */}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="gap-2">
          {/* the simulation, which Ctrl+H opens with a keyboard: a phone has
              no Ctrl, so there it is a row of its own (docs/patterns.md §4) */}
          {phone && onSim && <Place icon={FlaskConical} label={t('Simulacija')} onClick={go(() => onSim())} />}
          <Place icon={CircleHelp} label={t('Pomoć')} onClick={go(() => onHelp())} />
          {FOOTER_ITEMS.map(({ id, label, icon }) => (
            <Place key={id} icon={icon} label={t(label)} active={view === id} onClick={go(() => onView(id))} />
          ))}
        </SidebarMenu>
        {/* who is signed in: a white card, the avatar as tall as the name and
            the e-mail. Folded, the card's white and its side padding go with
            the width, so the avatar slides 8 to the column's edge; the padding
            above and below stays, so the card is as tall and nothing over it
            moves. Folded, the ring is the avatar's, not the tall, narrow
            card's. It opens the medical record of the person they care for
            (docs/patterns.md §10a), ringed on hover and while that page is
            open, as a card that opens something is. */}
        <button
          type="button"
          onClick={go(() => onView(caregiver ? 'profile' : 'record'))}
          aria-current={view === (caregiver ? 'profile' : 'record') ? 'page' : undefined}
          aria-label={caregiver ? t('Moj profil') : recordOf ? t('Medicinski karton: {name}', { name: recordOf }) : t('Medicinski karton')}
          title={caregiver ? t('Moj profil') : t('Medicinski karton')}
          className="group/me flex w-full cursor-pointer items-start gap-3 rounded-2xl bg-(--nav-card) p-2 text-left menu-folded:rounded-lg menu-folded:bg-transparent menu-folded:px-0 pointer-coarse:menu-folded:pl-1 transition-[padding,background-color,border-radius,box-shadow] duration-200 ease-out outline-none hover:shadow-[0_0_0_1px_var(--color-primary-300)] focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[current=page]:shadow-[0_0_0_1px_var(--color-primary-300)] menu-folded:shadow-none! menu-folded:focus-visible:ring-0 [--avatar:calc(var(--text-xs-leading)+var(--text-small-leading))]"
        >
          <Avatar className="transition-shadow duration-200 ease-out menu-folded:group-hover/me:shadow-[0_0_0_1px_var(--color-primary-300)] menu-folded:group-aria-[current=page]/me:shadow-[0_0_0_1px_var(--color-primary-300)] menu-folded:group-focus-visible/me:ring-[3px] menu-folded:group-focus-visible/me:ring-ring/50">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className={cn('flex min-w-0 flex-1 flex-col', FADES)}>
            <span className="truncate text-xs font-medium text-foreground">{user.name || t('Gost')}</span>
            <span className="truncate text-small text-muted-foreground">{user.email}</span>
          </span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
