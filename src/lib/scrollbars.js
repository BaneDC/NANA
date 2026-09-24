// Scrollbars that are only there while you are scrolling.
//
// The gutter is reserved at all times in CSS, so nothing on the page moves when
// a thumb appears; all this does is mark whatever is being scrolled, and clear
// the mark once it has been still for a moment. Capture phase, because a scroll
// event on an element does not bubble.
const QUIET_MS = 700;

export function showScrollbarsWhileScrolling() {
  const timers = new WeakMap();

  document.addEventListener(
    'scroll',
    (e) => {
      const el = e.target === document || e.target === window ? document.documentElement : e.target;
      if (!el?.classList) return;
      el.classList.add('is-scrolling');
      clearTimeout(timers.get(el));
      timers.set(
        el,
        setTimeout(() => el.classList.remove('is-scrolling'), QUIET_MS)
      );
    },
    true
  );
}
