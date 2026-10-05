"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { MenuIcon } from "lucide-react"
import { Slot } from "radix-ui"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { focusPane } from "@/lib/sheet"

// shadcn's sidebar as NANA's menu (docs/patterns.md §4). With a mouse it is a
// column beside the page, 232 wide, straight on the warm ground, and it never
// folds away; on a narrow screen (≤900, `useIsMobile`) it is a drawer from the
// left on the ground's tint, over the same dimmed page as every pane.
//
// What changed from shadcn's file, and why:
// - The desktop sidebar is in the page's flow, not fixed, and has no collapsed
//   state: the menu is always there. So no rail, no gap, no cookie (a cookie
//   the visitor never agreed to, for a state that cannot change) and no
//   tooltips for the icon-only state. `Ctrl/⌘ B` still opens the drawer.
// - The drawer is drawn here rather than through our `SheetContent`, which is
//   the floating pane on the right (§7).
// - Rows, sub rows and the count are drawn by §4: rows 8 by 12, 8 corners,
//   14px; hover is the ground's warm tint, what is open the primary's 200 with
//   the text dark and medium. Everything grows to 44 under a finger.
// - No `SidebarInput`, `SidebarMenuSkeleton` or `SidebarSeparator`: nothing
//   uses them.

const SIDEBAR_WIDTH = "232px"
const SIDEBAR_WIDTH_MOBILE = "min(280px,84vw)"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

const SidebarContext = React.createContext(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

function SidebarProvider({
  className,
  style,
  children,
  ...props
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((open) => !open)
  }, [isMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  const contextValue = React.useMemo(
    () => ({
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [isMobile, openMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={{
          "--sidebar-width": SIDEBAR_WIDTH,
          ...style,
        }}
        className={cn("group/sidebar-wrapper flex w-full", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

const sidebarInner = "flex min-h-full w-full flex-col gap-4 px-3 py-4 text-sidebar-foreground"

function Sidebar({
  className,
  children,
  label = "Meni",
  ...props
}) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar()

  if (isMobile) {
    return (
      <SheetPrimitive.Root open={openMobile} onOpenChange={setOpenMobile}>
        <SheetPrimitive.Portal>
          <SheetPrimitive.Overlay
            data-slot="sidebar-overlay"
            className="fixed inset-0 z-30 bg-[rgba(42,42,42,0.3)] backdrop-blur-[2px] transition-none duration-180 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
          />
          <SheetPrimitive.Content
            data-sidebar="sidebar"
            data-slot="sidebar"
            data-mobile="true"
            aria-describedby={undefined}
            onOpenAutoFocus={focusPane}
            className={cn(
              "fixed inset-y-0 left-0 z-31 w-(--sidebar-width) overflow-y-auto rounded-r-3xl bg-sidebar shadow-container outline-none transition-none",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left duration-240 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
              className
            )}
            style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE }}
            {...props}
          >
            <SheetPrimitive.Title className="sr-only">{label}</SheetPrimitive.Title>
            <div className={sidebarInner}>{children}</div>
          </SheetPrimitive.Content>
        </SheetPrimitive.Portal>
      </SheetPrimitive.Root>
    )
  }

  return (
    <nav
      data-slot="sidebar"
      data-sidebar="sidebar"
      aria-label={label}
      className={cn(
        "mr-3 h-full w-(--sidebar-width) shrink-0 rounded-3xl",
        className
      )}
      {...props}
    >
      <div className={sidebarInner}>{children}</div>
    </nav>
  )
}

// The button that opens the drawer, in the bar over the page on a narrow
// screen.
function SidebarTrigger({
  className,
  onClick,
  ...props
}) {
  const { toggleSidebar, openMobile } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn(
        "size-9 rounded-lg text-(--nav-text) hover:bg-(--nav-hover) hover:text-(--nav-text) pointer-coarse:size-11",
        className
      )}
      aria-expanded={openMobile}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <MenuIcon size={18} strokeWidth={1.75} />
      <span className="sr-only">Otvori meni</span>
    </Button>
  )
}

function SidebarInset({ className, ...props }) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn("relative flex w-full flex-1 flex-col", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex shrink-0 flex-col gap-4", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex shrink-0 flex-col gap-2", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn("flex shrink-0 items-center px-3 text-small text-(--nav-text-muted)", className)}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 list-none flex-col gap-1", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

// A row: hover tints it, `isActive` marks the page that is open. A row with a
// `SidebarMenuAction` beside it (the fold of Care plans) keeps the action's
// room on its right and tints with it, as one row.
const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground outline-hidden transition-[background-color,color] duration-150 group-has-data-[sidebar=menu-action]/menu-item:pr-9 group-has-data-[sidebar=menu-action]/menu-item:pointer-coarse:pr-14 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-hover/menu-item:bg-sidebar-accent group-hover/menu-item:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-primary data-[active=true]:font-medium data-[active=true]:text-sidebar-primary-foreground group-hover/menu-item:data-[active=true]:bg-sidebar-primary group-hover/menu-item:data-[active=true]:text-sidebar-primary-foreground pointer-coarse:min-h-11 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  className,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      type={asChild ? undefined : "button"}
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      className={cn(sidebarMenuButtonVariants({ variant }), className)}
      {...props}
    />
  )
}

// A small square on the right of a row, over it: 24, 44 under a finger. Set
// from the row's top, not centred on the item, which holds the open list too.
function SidebarMenuAction({
  className,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      type={asChild ? undefined : "button"}
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "absolute top-1.5 right-2 flex size-6 cursor-pointer items-center justify-center rounded-lg text-(--nav-text-muted) outline-hidden transition-[background-color,color] duration-150 hover:bg-(--nav-card) hover:text-primary-600 focus-visible:ring-[3px] focus-visible:ring-ring/50 peer-data-[active=true]/menu-button:text-sidebar-primary-foreground pointer-coarse:top-0 pointer-coarse:size-11 [&>svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

// A count of what came back and waits: the primary, white, 16 tall, at the
// row's end.
function SidebarMenuBadge({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute top-1/2 right-3 min-w-4 -translate-y-1/2 rounded-lg bg-primary px-1 text-center text-[11px] leading-4 font-medium text-primary-foreground tabular-nums select-none",
        className
      )}
      {...props}
    />
  )
}

// A folded list under a row hangs off a line, 16 in.
function SidebarMenuSub({ className, ...props }) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "mt-1 mb-2 ml-4 flex min-w-0 list-none flex-col border-l border-sidebar-border pl-3",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

// A row inside a folded list: its title, and the date or state under it.
function SidebarMenuSubButton({
  asChild = false,
  isActive = false,
  className,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "a"

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-active={isActive}
      className={cn(
        "flex w-full min-w-0 cursor-pointer flex-col rounded-lg px-2 py-2 text-left text-sidebar-foreground outline-hidden transition-[background-color,color] duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
        "data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
}
