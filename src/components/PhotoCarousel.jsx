import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
const PHOTOS = [photo1, photo2, photo3, photo4];

// A fixed duration matters: with a spring the exit finished out of step with the
// resize of its neighbours, so the rail lurched when the item unmounted.
const DURATION = 0.85;
// Material 3 "emphasized" easing.
const EASE = [0.2, 0, 0, 1];

export default function PhotoCarousel({ interval = 3200 }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setOffset((o) => o + 1), interval);
    return () => clearInterval(id);
  }, [interval]);

  return (
    <div className="w-[480px] max-w-full shrink-0 px-4">
      <div className="flex w-full overflow-hidden">
        {/* keys are virtual positions, so the leftmost item exits while a new
            one is appended right — no element ever flies across the rail */}
        <AnimatePresence initial={false}>
          {SLOT_WIDTHS.map((width, i) => {
            const position = offset + i;
            return (
              <motion.div
                key={position}
                className="h-[190px] shrink-0"
                // the gap is carried inside the animated width, so an item that
                // has shrunk to nothing occupies nothing — removing it can no
                // longer collapse a leftover 8px and jolt the whole rail
                initial={{ width: 0 }}
                animate={{ width: width + GAP }}
                exit={{ width: 0 }}
                transition={{ duration: DURATION, ease: EASE }}
              >
                {/* fixed-width image, so narrowing the slot crops instead of squashing */}
                <div className="relative h-full w-[calc(100%-8px)] overflow-hidden rounded-3xl">
                  <img
                    src={PHOTOS[position % PHOTOS.length]}
                    alt=""
                    className="absolute top-0 left-1/2 block h-full -translate-x-1/2 object-cover"
                    style={{ width: HERO_WIDTH }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
