// iPhone and iPad zoom the page into any field whose text is under 16px when it
// is focused, and leave it zoomed after — the chat's composer ended up off to
// one side with the keyboard up. Every field is 16px under a finger (base.css),
// and this is the guard behind that: `maximum-scale=1` stops Safari zooming
// on focus at all.
//
// Only on iOS. Safari has ignored maximum-scale for pinch-zoom since iOS 10, so
// people can still zoom with two fingers; Android's browsers honour it, and it
// would take pinch-zoom away there — and they do not zoom on focus anyway.
export function preventFocusZoomOnIOS() {
  const ios =
    /iP(hone|od|ad)/.test(navigator.userAgent) ||
    // iPadOS asks for the desktop site and reports itself as a Mac
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios) return;
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta && !/maximum-scale/.test(meta.content)) meta.content += ', maximum-scale=1';
}
