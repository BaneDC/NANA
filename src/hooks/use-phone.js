import { useSyncExternalStore } from 'react';

// A phone, as docs/patterns.md §12 draws it: 640 and under. What changes
// there in markup rather than in CSS (a pane becomes a bottom sheet) asks this.
const PHONE = '(max-width: 640px)';

const subscribe = (change) => {
  const query = window.matchMedia(PHONE);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

export function useIsPhone() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(PHONE).matches, () => false);
}
