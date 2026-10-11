import { useSyncExternalStore } from 'react';
import { MENU_WIDTH, useSidebar } from '@/components/ui/sidebar';

// How a pane beside the page is shown (the assistant, the care plan, the pane
// a card opens from the chat), by whether there is room for it
// (docs/patterns.md §12):
//
// - 'beside': a column next to the page, pushing it, only while the page keeps
//   at least 580. With the menu open that is a window 1280 wide and up; with
//   the menu folded to icons, 1104 and up;
// - 'over': no room, and wider than a phone: a drawer from the right over the
//   dimmed page, as every other drawer here is;
// - 'full': a phone (640 and under), the whole screen.
//
// Before this the pane pushed the page down to 901, and between 901 and 1180
// the page was left 200 to 480 wide.
const PANE = 432; // the pane's 420 and the 12 between it and the page
const PAGE_AT_LEAST = 580;
const WINDOW_EDGES = 24; // 12 at each side of the window
const MENU_GAP = 12; // between the menu and the page
const PHONE = 640;

const subscribe = (change) => {
  window.addEventListener('resize', change);
  return () => window.removeEventListener('resize', change);
};
const windowWidth = () => window.innerWidth;
const coarse = () => window.matchMedia('(pointer: coarse)').matches;

export function useSidePaneMode() {
  const width = useSyncExternalStore(subscribe, windowWidth, () => 1440);
  const { isMobile, collapsed } = useSidebar();
  if (width <= PHONE) return 'full';
  // a narrow screen has no menu beside the page, and never the room
  if (isMobile) return 'over';
  const menu = collapsed ? (coarse() ? MENU_WIDTH.foldedTouch : MENU_WIDTH.folded) : MENU_WIDTH.open;
  return width - WINDOW_EDGES - menu - MENU_GAP - PANE >= PAGE_AT_LEAST ? 'beside' : 'over';
}
