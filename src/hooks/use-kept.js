import { useEffect, useState } from 'react';

// What a pane shows, kept while it closes. A pane is shadcn's: it stays
// mounted, `open` says whether it is open, and closing plays its own animation
// (docs/patterns.md §7). What it shows usually goes the moment it closes (the
// drawer that was open is set back to null), so this hands back the last value
// that was there until the animation has run — 500ms, the longest of them
// (vaul's sheet on a phone) — and only then lets it go.
const CLOSING = 500;

export function useKept(value) {
  const [kept, setKept] = useState(value);
  useEffect(() => {
    if (value) {
      setKept(value);
      return undefined;
    }
    const gone = setTimeout(() => setKept(null), CLOSING);
    return () => clearTimeout(gone);
  }, [value]);
  return value || kept;
}
