// What a pane does when it opens: keep focus where the content put it (a field
// with autoFocus), or else take it on the pane itself, so that no button inside
// it starts out ringed as if it had been tabbed to.
export function focusPane(e) {
  e.preventDefault();
  const pane = e.currentTarget;
  if (pane.contains(document.activeElement)) return;
  // a field asked for it (autoFocus, which TextField marks as data-autofocus)
  const field = pane.querySelector('[data-autofocus]');
  (field || pane).focus({ preventScroll: true });
}
