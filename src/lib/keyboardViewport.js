// When the keyboard opens, iOS Safari keeps the page full height and pans the
// whole of it up to bring the focused field into view: the header goes off the
// top, and a message the chat has just pinned to the top of the conversation
// goes with it. What should move is the composer, and nothing else.
//
// So the app follows the part of the screen that is actually visible (the
// visual viewport): its height and its offset go into two properties, and the
// app and every full-screen layer are sized and placed by them (app.css, under
// `pointer: coarse`). With the keyboard up the app is shorter, not further up —
// the chat's docked composer sits on the keyboard, and the header and the
// messages stay where they were.
//
// Not while someone is pinch-zooming: then the visible part is a zoomed-in
// window onto the page, and the page must not shrink to fit it.
export function followVisualViewport() {
  const vv = window.visualViewport;
  if (!vv) return;
  const root = document.documentElement.style;
  let frame = 0;
  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (Math.abs(vv.scale - 1) > 0.01) {
        root.removeProperty('--vv-height');
        root.removeProperty('--vv-top');
        return;
      }
      root.setProperty('--vv-height', `${Math.round(vv.height)}px`);
      root.setProperty('--vv-top', `${Math.round(vv.offsetTop)}px`);
    });
  };
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  update();
}

// After a message is sent on a phone, the keyboard goes down. With it up, the
// conversation has a third of the screen: the question is pinned to the top
// and the answer, as it grows, pushes it out of sight. Down, the question and
// its answer are both there to read. The kit puts the cursor straight into the
// fresh composer after a send, so for a moment after sending a focus that
// lands in an editable is let go as well.
export function dropKeyboardAfterSend() {
  if (!window.matchMedia?.('(pointer: coarse)').matches) return;
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
