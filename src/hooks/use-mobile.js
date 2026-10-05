import { useSyncExternalStore } from 'react';

// shadcn's `useIsMobile`, for the menu (`Sidebar`): true on a narrow screen,
// 900 and under (the `narrow:` variant, docs/patterns.md §12), where the menu
// is a drawer rather than a column beside the page. A phone, 640 and under,
// is `useIsPhone`.
const NARROW = '(max-width: 900px)';

const subscribe = (change) => {
  const query = window.matchMedia(NARROW);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

export function useIsMobile() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(NARROW).matches, () => false);
}
