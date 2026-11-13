import { useEffect, useRef, useState } from 'react';

// A Radix Select draws every item even while it is closed (to know their
// texts), on every render of what holds it: a hundred years in the calendar,
// the countries' codes by the phone, and the form slowed to half a second a
// press in dev (measured 13. 11.). Ours name the chosen one themselves
// (SelectValue's children), so the items are drawn only from the press that
// opens the list until its closing has faded (150 ms, kept a little longer).
export function useListOpen() {
  const [open, setOpen] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onOpenChange = (next) => {
    clearTimeout(timer.current);
    setOpen(next);
    if (next) setDrawn(true);
    else timer.current = setTimeout(() => setDrawn(false), 300);
  };
  return { open, onOpenChange, drawn };
}
