// The software keyboard on a phone, and what may move when it comes and goes in
// the chat: its composer, and nothing else.
//
// Measured in Safari on iOS 26 (simulator, frame by frame, `?kbdebug`):
// - a tapped field makes Safari scroll the page to the end of the document as
//   the keyboard comes up — by the keyboard's height, wherever the field is —
//   and there is no stopping that scroll once it has started: scrolling back
//   from script, or reshaping the page, lands a frame late and the header
//   bounced ~300pt;
// - Safari decides that scroll at the moment the field takes focus, from where
//   the field is at that moment. So the tap on the chat's composer is taken
//   over: the composer is lifted far above the screen, focused, and put back a
//   frame later. Safari finds it already in view and does not scroll — the page
//   stays where it is, header and all.
// - The keyboard now covers the bottom of the page instead, so when it opens
//   the app is made as tall as what the keyboard leaves (--app-height, base.css)
//   and its bottom, the composer, sits on the keyboard. That is the one thing
//   that moves.
//
// What is left: on some re-openings (not the first) Safari still nudges the
// page by ~35pt for ~0.25s and puts it back by itself. It happens before the
// page hears of the keyboard and does not depend on where the composer is;
// nothing measured from here changes it (docs/patterns.md §10).
//
// Only the chat's composer. Every other field keeps Safari's own behaviour —
// the page scrolls to show it, as forms do everywhere. Only on iOS for the
// takeover; not while pinch-zoomed.

const COARSE = '(pointer: coarse)';
const COMPOSER = '.nana-chat [contenteditable]:not([contenteditable="false"])';
const html = () => document.documentElement;
const isIOS = () =>
  /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function caretToEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function moveOnlyTheComposer() {
  const vv = window.visualViewport;
  if (!vv || !window.matchMedia?.(COARSE).matches) return;

  const zoomed = () => Math.abs(vv.scale - 1) > 0.01;
  const writing = () => Boolean(document.activeElement?.matches?.(COMPOSER));

  if (isIOS()) {
    let start = null;
    document.addEventListener(
      'touchstart',
      (e) => {
        const t = e.touches[0];
        start = t ? { x: t.clientX, y: t.clientY } : null;
      },
      { capture: true, passive: true }
    );
    document.addEventListener(
      'touchend',
      (e) => {
        const el = e.target.closest?.(COMPOSER);
        const t = e.changedTouches[0];
        if (!el || el === document.activeElement || zoomed() || !start || !t) return;
        if (Math.hypot(t.clientX - start.x, t.clientY - start.y) > 10) return; // a drag, not a tap
        e.preventDefault();
        el.style.translate = '0 -2000px';
        el.focus();
        caretToEnd(el); // where a tap into a draft would usually go on
        requestAnimationFrame(() => (el.style.translate = ''));
      },
      { capture: true, passive: false }
    );
  }

  // The keyboard's own resize carries its final height at the start of its
  // animation, so the composer goes up with it. Not for Safari's toolbars
  // growing and shrinking (under 120pt).
  let base = window.innerHeight;
  const fit = () => {
    if (zoomed()) return;
    if (!writing()) {
      base = window.innerHeight;
      return;
    }
    if (base - vv.height > 120) html().style.setProperty('--app-height', `${Math.round(vv.height)}px`);
  };
  vv.addEventListener('resize', fit);
  document.addEventListener(
    'focusout',
    () => setTimeout(() => !writing() && html().style.removeProperty('--app-height'), 0),
    true
  );
}

// On a phone the keyboard opens only for a finger. The chat kit puts the cursor
// into its composer by itself — when the chat opens and again after every
// answer — and on a phone each of those brought the keyboard up unasked and
// moved everything with it. A focus into the chat's composer is let through
// only if a finger has just touched that composer — a tap on the menu that
// opened the chat a moment before does not count.
export function keyboardOnlyForFingers() {
  if (!window.matchMedia?.(COARSE).matches) return;
  let touched = 0;
  let where = null;
  document.addEventListener(
    'pointerdown',
    (e) => {
      touched = performance.now();
      where = e.target;
    },
    true
  );
  const focus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function focusIfTouched(options) {
    if (this.isContentEditable && this.closest('.nana-chat')) {
      const box = this.closest('[class*="ick-surface-"]') || this;
      if (performance.now() - touched > 800 || !box.contains(where)) return undefined;
    }
    return focus.call(this, options);
  };
}

// After a message is sent on a phone, the keyboard goes down. With it up, the
// conversation has a third of the screen: the question is pinned to the top
// and the answer, as it grows, pushes it out of sight. Down, the question and
// its answer are both there to read. The kit puts the cursor straight into the
// fresh composer after a send, so for a moment after sending a focus that
// lands in an editable is let go as well.
export function dropKeyboardAfterSend() {
  if (!window.matchMedia?.(COARSE).matches) return;
  const letGo = (el) => el?.isContentEditable && el.blur();
  const onFocus = (e) => letGo(e.target);
  letGo(document.activeElement);
  document.addEventListener('focusin', onFocus, true);
  requestAnimationFrame(() => letGo(document.activeElement));
  // the kit's own focus lands about 20ms after the send; this catches it even
  // where no focus event is fired (a window that is not the focused one)
  setTimeout(() => letGo(document.activeElement), 120);
  setTimeout(() => document.removeEventListener('focusin', onFocus, true), 600);
}


// `?kbdebug`: the numbers this works from and the last few events, pinned to
// the visible part of the screen, for checking it on a phone or in the
// simulator (docs/patterns.md §10).
export function keyboardDebug() {
  if (!new URLSearchParams(window.location.search).has('kbdebug')) return;
  const box = document.createElement('pre');
  box.style.cssText =
    'position:fixed;left:4px;top:56px;z-index:9999;margin:0;padding:4px 6px;font:11px/14px monospace;' +
    'background:rgba(0,0,0,.75);color:#0f0;border-radius:4px;pointer-events:none';
  document.body.appendChild(box);
  const vv = window.visualViewport;
  const log = [];
  const t0 = performance.now();
  const note = (what) => {
    log.push(`${Math.round(performance.now() - t0)} ${what}`);
    if (log.length > 10) log.shift();
  };
  document.addEventListener('focusin', (e) => note(`focus ${e.target.tagName}`), true);
  vv?.addEventListener('resize', () => note(`keyboard ${Math.round(vv.height)}`));
  window.addEventListener('scroll', () => note(`page scroll ${Math.round(window.scrollY)}`));
  vv?.addEventListener('scroll', () => note(`view pan ${Math.round(vv.offsetTop)}`));
  const tick = () => {
    box.style.top = `${Math.round((vv?.offsetTop || 0) + 56)}px`;
    box.textContent =
      `inner ${window.innerHeight}  vv ${Math.round(vv?.height)}  pan ${Math.round(vv?.offsetTop)}  scale ${vv?.scale?.toFixed(2)}\n` +
      `scrollY ${Math.round(window.scrollY)}  --app-height ${html().style.getPropertyValue('--app-height') || '-'}  focus ${document.activeElement?.tagName}\n` +
      log.join('\n');
    requestAnimationFrame(tick);
  };
  tick();
}
