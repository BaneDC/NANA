import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useIsPhone } from '@/hooks/use-phone';
import photo1 from '../assets/photo1.jpg';
import photo2 from '../assets/photo2.jpg';
import photo3 from '../assets/photo3.jpg';
import photo4 from '../assets/photo4.jpg';

// Material 3 multi-browse carousel, auto-advancing.
// Slot widths come straight from the Figma layout (sum + 3×8px gap = 448px).
// An item enters small on the right, becomes the hero, then shrinks away left.
const SLOT_WIDTHS = [36.67, 126.67, 190, 70.67];
const HERO_WIDTH = 190;
const GAP = 8;
// the four slots and the three gaps between them: the rail's full width
const RAIL = SLOT_WIDTHS.reduce((n, w) => n + w, 0) + 3 * GAP;
const PHOTOS = [photo1, photo2, photo3, photo4];

// A fixed duration matters: with a spring the exit finished out of step with the
// resize of its neighbours, so the rail lurched when the item unmounted.
const DURATION = 0.85;
// Material 3 "emphasized" easing.
const EASE = [0.2, 0, 0, 1];

// The way to the other door ("Nemate nalog?") stays above the fold on every
// screen (decided 12. 11., dizajner): where the page is too short for it, the
// carousel gives up height, never width (shrunk whole it was a small thing in
// the middle, turned down the same day), down to 80; shorter still, the page
// scrolls. The page marks that button `data-fold`; a page with none (a form)
// keeps the carousel whole.
const FIT_MIN = 80;
// room left under the button, to the screen's edge: the column's own gap
const FIT_ROOM = 24;

export default function PhotoCarousel({ interval = 3200 }) {
  const [offset, setOffset] = useState(0);
  // Narrower than the rail (a phone), the whole rail shrinks to fit, every
  // slot and the height alike, so all four show as on a desktop instead of
  // the right one being cut off. Never larger than the layout.
  const railRef = useRef(null);
  const [scale, setScale] = useState(1);
  // the most height it may take, to keep the fold's button in view; null: all
  const [cap, setCap] = useState(null);
  // on a phone a third of the screen's height (decided 11. 11., dizajner):
  // shrunk to the width with the rest it was a strip of 150; the slots keep
  // their widths and grow tall, the photos cropped to them
  const phone = useIsPhone();
  const natural = phone ? 'calc(100svh / 3)' : `${HERO_WIDTH * scale}px`;
  const height = cap == null ? natural : `min(${natural}, ${cap}px)`;
  useLayoutEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const size = () => setScale(Math.min(1, (el.clientWidth - 3 * GAP) / (RAIL - 3 * GAP)));
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // How much the carousel must give up for the button to fit: the page's
  // content from its top to the button's bottom, against the page's height.
  // Only the carousel's height moves the button, so one measure settles it.
  useLayoutEffect(() => {
    const rail = railRef.current;
    const pane = rail?.parentElement?.parentElement;
    if (!pane) return;
    const measure = () => {
      const fold = pane.querySelector('[data-fold]');
      const first = pane.firstElementChild;
      if (!fold || !first) return setCap(null);
      // where the content starts when it does not fit and the page scrolls
      const top = parseFloat(getComputedStyle(pane).paddingTop) + parseFloat(getComputedStyle(first).marginTop);
      const need = top + (fold.getBoundingClientRect().bottom - first.getBoundingClientRect().top) + FIT_ROOM;
      const next = Math.max(FIT_MIN, Math.round(rail.offsetHeight - (need - pane.clientHeight)));
      setCap((now) => (now === next ? now : next));
    };
    let frame = 0;
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(later);
    ro.observe(pane);
    // another page in the same frame, or an error under a field
    const mo = new MutationObserver(later);
    mo.observe(pane, { childList: true, subtree: true });
    document.fonts?.ready.then(later);
    return () => (cancelAnimationFrame(frame), ro.disconnect(), mo.disconnect());
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setOffset((o) => o + 1), interval);
    return () => clearInterval(id);
  }, [interval]);

  return (
    <div className="w-[480px] max-w-full shrink-0 px-4">
      <div ref={railRef} className="w-full">
        <div className="flex overflow-hidden">
        {/* keys are virtual positions, so the leftmost item exits while a new
            one is appended right — no element ever flies across the rail */}
        <AnimatePresence initial={false}>
          {SLOT_WIDTHS.map((width, i) => {
            const position = offset + i;
            return (
              <motion.div
                key={position}
                className="shrink-0"
                style={{ height }}
                // the gap is carried inside the animated width, so an item that
                // has shrunk to nothing occupies nothing — removing it can no
                // longer collapse a leftover 8px and jolt the whole rail
                initial={{ width: 0 }}
                animate={{ width: width * scale + GAP }}
                exit={{ width: 0 }}
                transition={{ duration: DURATION, ease: EASE }}
              >
                {/* fixed-width image, so narrowing the slot crops instead of squashing */}
                <div className="relative h-full w-[calc(100%-8px)] overflow-hidden rounded-3xl">
                  <img
                    src={PHOTOS[position % PHOTOS.length]}
                    alt=""
                    className="absolute top-0 left-1/2 block h-full -translate-x-1/2 object-cover"
                    style={{ width: HERO_WIDTH * scale }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
