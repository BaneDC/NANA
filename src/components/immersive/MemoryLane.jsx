import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { MEMORIES } from '@/data/memories';

// Memories around the family's sign-in (docs/patterns.md §10, decided 23. 11.):
// as if walking into one's own memories. The photos of one life lie along a
// road into the distance, the earliest nearest, and the eye drifts slowly
// down it, year by year; the form stays still in the middle. Far ones are
// small, pale and soft (air between them and the eye); near ones grow and
// dissolve as they pass. None has an edge: each fades into the sky, as a
// memory has none.
//
// Drawn with the page's own projection rather than CSS 3D, so each photo's
// size, blur and fade follow its distance exactly, and nothing ever runs past
// the screen: a photo dissolves over its last 120 px before an edge and is
// gone before it would cross it (docs/patterns.md §13, overflow).
//
// The mouse leans the eye a little (near photos move more than far ones); on
// a phone the tilt does, once allowed. With reduced motion the road stands
// still and the photos only appear.

// the distance at which a photo is its own size, as a camera's focal length
const FOCAL = 900;
// closer than this a memory has passed
const NEAR = 0.6 * FOCAL;
// between two memories along the road
const GAP = 0.25 * FOCAL;
// the whole road: the memories, then a stretch of sky before they begin
// again, so the last years never stand in front of the first
const LENGTH = (MEMORIES.length + 4) * GAP;
// a memory every 5.5 s; the whole life in about 110 s, then it begins again
const SPEED = GAP / 5.5;
// as the page comes the first memory is near, the later years down the road
const START = NEAR - 1.8 * FOCAL;
// how far the eye leans with the mouse or the phone, at that distance
const SWAY = 36;
// a photo fades out over its last 120 px before the screen's edge (less on
// a phone, where everything is near an edge)
const EDGE = 120;

// How far down the road the eye is, kept across the sign-in's pages (and
// "Ko ste?"), so the journey goes on from one page to the next instead of
// starting over; and whether the photos were already seen, so they do not
// fade in again on every page.
let travelled = 0;
let seen = false;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp1 = (x) => Math.min(1, Math.max(-1, x));
// the same every time for the same memory: where it lies is not random per visit
const hash = (n) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// Where a memory lies around the form: an angle on a ring (each year a
// golden angle on from the last, so neighbours in time are never neighbours
// on the screen) and a little nearer or farther than the ring. Far down the
// road a memory stands on the ring, just past the form; as it comes near it
// grows and moves out towards the screen's edge, where it dissolves. Not a
// straight corridor, whose far end would gather every photo behind the form:
// the form is the far end. Each a little askew, as photos put down by hand.
function place(i) {
  const angle = i * 2.39996 + 0.6;
  return {
    ux: Math.cos(angle),
    uy: Math.sin(angle),
    reach: 0.9 + 0.2 * hash(i + 17),
    turn: (hash(i + 33) * 2 - 1) * 3,
  };
}

// What must stay legible: the words of the page (its title, the links and
// rows under it), not its glass. Behind a glass card a memory may go on, the
// card's own frost veils it; behind words it is fainter. A form is looked
// into (it is `display: contents`).
const glass = (el) => el.matches('[data-slot=step-panel], .imm-option') || el.firstElementChild?.matches('.imm-option');
function wordsIn(el, out) {
  for (const c of el.children) {
    if (c.classList.contains('contents')) wordsIn(c, out);
    else if (!glass(c)) out.push(c.getBoundingClientRect());
  }
  return out;
}

// how much of a photo lies behind the page's words (0 to 1)
function covered(l, t, r, b, zones) {
  let area = 0;
  for (const z of zones) {
    const w = Math.min(r, z.right) - Math.max(l, z.left);
    const h = Math.min(b, z.bottom) - Math.max(t, z.top);
    if (w > 0 && h > 0) area += w * h;
  }
  return Math.min(1, area / ((r - l) * (b - t)));
}

// `clear`: refs to what holds the page's words (its column and its foot); a
// photo behind the words is fainter. `still`: as with reduced motion (its
// story in Storybook, which cannot ask for it)
export default function MemoryLane({ clear = [], still: standing = false }) {
  const still = useReducedMotion() || standing;
  const root = useRef(null);
  const figures = useRef([]);
  // redraws one frame: for a photo that has loaded, with the road standing still
  const redraw = useRef(() => {});
  const born = useRef(MEMORIES.map(() => (seen ? -Infinity : 0)));
  const clearRef = useRef(clear);
  clearRef.current = clear;

  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    let vw = 0;
    let vh = 0;
    let soft = 1;
    let edge = EDGE;
    let ringX = 0.34;
    let spots = [];
    const layout = () => {
      vw = el.clientWidth;
      vh = el.clientHeight;
      const narrow = vw < 640;
      // a photo at its own size: a quarter of the screen's long way, 140 to
      // 380; on a phone a third, or they are only specks
      const base = Math.min(380, Math.max(140, Math.max(vw, vh) * (narrow ? 0.36 : 0.25)));
      edge = Math.min(EDGE, 0.12 * Math.min(vw, vh));
      // on a phone the ring is narrower across: the form takes the width,
      // and a memory behind its glass is still a memory
      ringX = narrow ? 0.24 : 0.34;
      // a smaller photo (a phone) is blurred less, or nothing of it is left
      soft = Math.max(0.5, base / 380);
      spots = MEMORIES.map((m, i) => {
        const w = m.wide ? base * 1.12 : base * 0.84;
        const h = m.wide ? w * 0.75 : (w * 4) / 3;
        const f = figures.current[i];
        if (f) {
          f.style.width = `${w}px`;
          f.style.height = `${h}px`;
        }
        return { ...place(i), w, h };
      });
    };
    layout();

    // what each photo was last given, so only what changed is written
    const last = MEMORIES.map(() => ({ shown: false, blur: -1, z: null }));
    let camX = 0;
    let camY = 0;
    let aimX = 0;
    let aimY = 0;

    const frame = (dt, now) => {
      if (!still) travelled += SPEED * dt;
      const k = 1 - Math.exp(-dt * 3);
      camX += (aimX - camX) * k;
      camY += (aimY - camY) * k;
      const camZ = START + travelled;
      const zones = [];
      for (const r of clearRef.current) if (r.current) wordsIn(r.current, zones);
      for (let i = 0; i < MEMORIES.length; i++) {
        const f = figures.current[i];
        const spot = spots[i];
        if (!f || !spot) continue;
        const d = NEAR + ((((i * GAP - camZ) % LENGTH) + LENGTH) % LENGTH);
        const s = FOCAL / d;
        const w = spot.w * s;
        const h = spot.h * s;
        // the ring a third of the way out, and out more as it comes near
        const grow = 0.14 * s;
        const left = vw / 2 + spot.ux * spot.reach * (ringX + grow) * vw - camX * s - w / 2;
        const top = vh / 2 + spot.uy * spot.reach * (0.34 + grow) * vh - camY * s - h / 2;
        // the turn reaches a little past the photo's box
        const lean = ((w + h) / 2) * Math.sin((Math.abs(spot.turn) * Math.PI) / 180);
        const room = Math.min(left, top, vw - left - w, vh - top - h) - lean;
        let alpha =
          0.92 *
          smooth(0, edge, room) *
          // passing: it dissolves as it comes too close
          smooth(NEAR, NEAR + 0.3 * FOCAL, d) *
          // the far end of the road, where the first memories come back
          (1 - smooth(0.78, 0.98, (d - NEAR) / LENGTH)) *
          // the air: the farther, the paler
          (1 - 0.55 * smooth(1.5 * FOCAL, 5 * FOCAL, d));
        // what lies behind the page's words is fainter, so they stay legible
        if (alpha > 0.01 && zones.length) alpha *= 1 - 0.7 * covered(left, top, left + w, top + h, zones);
        // a photo only once it is there; the first time, gently
        const at = born.current[i];
        alpha *= at === 0 ? 0 : still ? 1 : smooth(0, 900, now - at);

        const shown = alpha > 0.01;
        if (shown !== last[i].shown) {
          f.style.display = shown ? 'block' : 'none';
          last[i].shown = shown;
        }
        if (!shown) continue;
        // drawn at its own size and scaled about its middle
        f.style.transform = `translate3d(${(left + (w - spot.w) / 2).toFixed(1)}px, ${(top + (h - spot.h) / 2).toFixed(1)}px, 0) scale(${s.toFixed(4)}) rotate(${spot.turn.toFixed(2)}deg)`;
        f.style.opacity = alpha.toFixed(3);
        // never sharp; softer the farther, and as it passes too close. The
        // blur is the photo's own, before it is scaled, so it is divided back.
        const blur = soft * (1 + 4 * smooth(1.6 * FOCAL, 5.4 * FOCAL, d) + 4 * (1 - smooth(NEAR, 1.2 * FOCAL, d)));
        const local = Math.round((blur / s) * 4) / 4;
        if (local !== last[i].blur) {
          f.style.filter = `blur(${local}px)`;
          last[i].blur = local;
        }
        // the nearer over the farther; changes only as one goes round
        const z = Math.floor((LENGTH + NEAR - d) / GAP);
        if (z !== last[i].z) {
          f.style.zIndex = String(z);
          last[i].z = z;
        }
      }
    };
    redraw.current = () => frame(0, performance.now());

    // photos already there (from the cache) before this ran
    figures.current.forEach((f, i) => {
      const img = f?.querySelector('img');
      if (img?.complete && img.naturalWidth && born.current[i] === 0) born.current[i] = seen ? -Infinity : performance.now();
    });

    const ro = new ResizeObserver(() => {
      layout();
      redraw.current();
    });
    ro.observe(el);

    let raf = 0;
    let live = true;
    const off = [];
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      off.push(() => target.removeEventListener(type, fn, opts));
    };

    if (still) {
      redraw.current();
      // the page scrolls over it: what is behind the words changes
      on(window, 'scroll', () => redraw.current(), { capture: true, passive: true });
    } else {
      let then = performance.now();
      const tick = (now) => {
        // a tab come back from the background does not jump down the road
        const dt = Math.min(0.05, (now - then) / 1000);
        then = now;
        frame(dt, now);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      // the mouse leans the eye; out of the window, it comes back
      on(
        window,
        'pointermove',
        (e) => {
          if (e.pointerType !== 'mouse') return;
          aimX = ((e.clientX / vw) * 2 - 1) * SWAY;
          aimY = ((e.clientY / vh) * 2 - 1) * SWAY;
        },
        { passive: true }
      );
      on(document.documentElement, 'pointerleave', () => {
        aimX = 0;
        aimY = 0;
      });

      // on a phone the tilt, from how it was held when it began
      const Orientation = window.DeviceOrientationEvent;
      if (Orientation && window.matchMedia('(pointer: coarse)').matches) {
        let rest = null;
        const tilt = (e) => {
          if (e.beta == null || e.gamma == null) return;
          rest ??= [e.beta, e.gamma];
          aimX = clamp1((e.gamma - rest[1]) / 20) * SWAY * 1.5;
          aimY = clamp1((e.beta - rest[0]) / 20) * SWAY * 1.5;
        };
        if (typeof Orientation.requestPermission === 'function') {
          // iOS asks first, and only on a tap: the first tap on the sky or a
          // photo, never on a field or a button, so the question does not
          // come up over what she is typing
          const ask = (e) => {
            if (e.target.closest?.('input, textarea, select, button, a, label, [role]')) return;
            window.removeEventListener('touchend', ask, true);
            Orientation.requestPermission()
              .then((answer) => live && answer === 'granted' && on(window, 'deviceorientation', tilt))
              .catch(() => {});
          };
          on(window, 'touchend', ask, true);
        } else on(window, 'deviceorientation', tilt);
      }
    }

    return () => {
      live = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      off.forEach((f) => f());
      if (born.current.some((b) => b !== 0)) seen = true;
    };
  }, [still]);

  const loaded = (i) => {
    if (born.current[i] !== 0) return;
    born.current[i] = seen ? -Infinity : performance.now();
    redraw.current();
  };

  return (
    <div ref={root} className={`imm-memories${still ? ' is-still' : ''}`} aria-hidden="true">
      {MEMORIES.map((m, i) => (
        <figure key={m.year} ref={(f) => (figures.current[i] = f)} className="imm-memory">
          <img className="imm-memory-photo" src={m.src} alt="" decoding="async" draggable={false} onLoad={() => loaded(i)} />
          <figcaption className="imm-memory-year">{m.year}</figcaption>
        </figure>
      ))}
    </div>
  );
}
