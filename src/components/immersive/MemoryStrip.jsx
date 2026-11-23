import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { MEMORIES } from '@/data/memories';
import { t } from '@/i18n';

// The family's memories under the sign-in (docs/patterns.md §10, decided
// 23. 11.): one life from the child's side, as a line of years at the foot of
// the page with the memories' photos over it, as in a dock.
//
// The line: the memories evenly along it, whatever the years between them
// (decided 23. 11.: by the years, the first four stood on each other and the
// later ones far apart), each a tick a little darker, three small ticks
// between two, for the rhythm; the memory in focus a little darker still.
//
// The photos, as in Apple's dock (decided 23. 11.: centred each on its tick
// and scaled, they lay over each other by uneven amounts, and the focus jumped
// from memory to memory): a row of squares, 8 apart, never one over another.
// At rest each stands over its tick. Near the focus they grow, smoothly with
// the distance and not a memory at a time, up to the full 192 at the focus,
// and push the others aside; the point of the row under the focus stays under
// it. Away from the focus they fade out. None goes past the line's ends: at an
// end the photo in focus stops at it, the others are pressed against it, and
// both ends fade softly. The ticks grow the same way. The
// focus follows the mouse; the memory nearest it, a press or a drag on the
// line, a photo, or the keyboard's arrows (it is a slider) is the one in
// focus. Its year is under the line, with the two ends, under its tick; an end
// it would come near steps aside.
//
// The focus always goes on through the years by itself, one every 3 s, and
// after the last back to the first (decided 23. 11.: until then it stopped
// for good at the first touch). It waits while someone has it in hand (the
// mouse over it, a finger on the line, the keyboard on the slider) and goes on
// 3 s after they let go. With reduced motion it does not go by itself, and
// a change is instant. Not on a phone, where it would only be under the fold
// (StepPage).

const FIRST = MEMORIES[0].year;
const LAST = MEMORIES[MEMORIES.length - 1].year;
const N = MEMORIES.length;
// three small ticks between two memories: a memory every fourth tick
const EVERY = 4;
const TICKS = (N - 1) * EVERY + 1;
const PLAY = 3000;
// the photos: their full size (onboarding.css, .imm-strip-photo), the room
// between two, how far the growth reaches from the focus in memories, and
// where they start and finish fading out, in memories from the focus
const FULL = 192;
const GAP = 8;
const REACH = 2.5;
const FADE_FROM = 1.5;
const FADE_TO = 4.5;
// the last stretch before the line's end, in px, where what does not fit is
// pressed together (the ends fade over the outer 48 of it, onboarding.css)
const KNEE = 96;
// the ticks: how far their growth reaches, in px, and their height
const TICK_REACH = 28;
const TICK_REST = 8;
const TICK_FULL = 32;
// how quick the focus and the year are, critically damped: after the mouse
// near at once, from memory to memory softer
const QUICK = 18;
const SOFT = 10;
// the ends' padding (onboarding.css, .imm-strip-ends button), and the least
// room between the year in focus and an end before the end steps aside
const END_PAD = 8;
const APART = 16;

// where the focus was, kept across the sign-in's pages
let kept = 0;

const bell = (d, reach) => Math.exp(-(d * d) / (2 * reach * reach));
// the dock's growth: 1 at the focus, 0 from `reach` on, smooth between
const swell = (d, reach) => (d < reach ? (1 + Math.cos((Math.PI * d) / reach)) / 2 : 0);
// how far from the focus's edge something `d` away stands, with `room` to the
// line's end: where it is until the last KNEE before the end, and pressed ever
// closer to the end after that, never past it
const toEnd = (d, room) => {
  if (room < 0.5) return 0;
  const k = Math.min(KNEE, room);
  const free = room - k;
  return d <= free ? d : free + k * Math.tanh((d - free) / k);
};
const smooth = (a, b, v) => {
  const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

// `still`: as with reduced motion (its story in Storybook, which cannot ask for it)
export default function MemoryStrip({ still: standing = false }) {
  const still = useReducedMotion() || standing;
  const [at, setAt] = useState(kept);
  const photos = useRef([]);
  const track = useRef(null);
  const ticks = useRef([]);
  const year = useRef(null);
  const ends = useRef([]);
  // what the loop reads, so it never waits for React: the focus `p` and the
  // year `y` on the line, with their speeds; `keys`: the keyboard is on the
  // slider
  const live = useRef({ at: kept, p: null, pv: 0, y: null, yv: 0, hover: null, keys: false, kick: () => {}, wait: () => {} });

  const go = useCallback((i) => {
    const n = (i + N) % N;
    if (n === live.current.at) return;
    kept = n;
    live.current.at = n;
    setAt(n);
    live.current.kick();
  }, []);

  useEffect(() => {
    const s = live.current;
    let raf = 0;
    let then = 0;

    const frame = (now) => {
      raf = 0;
      const line = track.current;
      if (!line) return;
      const L = line.clientWidth;
      const slot = L / (N - 1);
      const x = (i) => i * slot;
      const dt = then ? Math.min(0.05, (now - then) / 1000) : 0;
      then = now;
      // a critically damped spring, exact for any step
      const spring = (from, speed, to, w) => {
        if (still || from == null) return [to, 0];
        const d = from - to;
        const e = Math.exp(-w * dt);
        const next = to + (d + (speed + w * d) * dt) * e;
        const v = (speed - w * (speed + w * d) * dt) * e;
        return Math.abs(next - to) < 0.05 && Math.abs(v) < 1 ? [to, 0] : [next, v];
      };

      // the focus: under the mouse, or else on the memory in focus
      const aim = s.hover ?? x(s.at);
      [s.p, s.pv] = spring(s.p, s.pv, aim, s.hover == null ? SOFT : QUICK);
      [s.y, s.yv] = spring(s.y, s.yv, x(s.at), SOFT);

      // the dock: each photo's size by how far its tick is from the focus,
      // then the row laid out 8 apart, shifted so the point of it under the
      // focus stays there (at rest, each photo over its tick)
      const rest = slot - GAP;
      const size = MEMORIES.map((_, i) => rest + (FULL - rest) * swell(Math.abs(x(i) - s.p), REACH * slot));
      const mid = [];
      size.forEach((w, i) => mid.push(i ? mid[i - 1] + (size[i - 1] + w) / 2 + GAP : 0));
      const u = Math.min(N - 1, Math.max(0, s.p / slot));
      const a = Math.floor(u);
      const b = Math.min(N - 1, a + 1);
      // never past the line's ends (decided 23. 11.): the photo in focus
      // stops at an end, as the year does, and what is beyond it on that side
      // is pressed against the end, more the farther it is, so near the focus
      // nothing changes; the stage fades both ends softly (onboarding.css)
      const anchor = Math.min(L - FULL / 2, Math.max(FULL / 2, s.p));
      const shift = anchor - (mid[a] + (mid[b] - mid[a]) * (u - a));
      const zl = anchor - FULL / 2;
      const zr = anchor + FULL / 2;
      const press = (v) => (v < zl ? zl - toEnd(zl - v, zl) : v > zr ? zr + toEnd(v - zr, L - zr) : v);
      const alpha = MEMORIES.map((_, i) => 1 - smooth(FADE_FROM, FADE_TO, Math.abs(i - u)));

      MEMORIES.forEach((_, i) => {
        const el = photos.current[i];
        if (!el) return;
        const from = press(mid[i] + shift - size[i] / 2);
        const w = press(mid[i] + shift + size[i] / 2) - from;
        if (alpha[i] < 0.01 || w < 1) {
          el.style.display = 'none';
          return;
        }
        el.style.display = '';
        el.style.transform = `translate3d(${from.toFixed(1)}px, 0, 0) scale(${(w / FULL).toFixed(4)})`;
        el.style.opacity = alpha[i].toFixed(3);
      });

      // the ticks grow the same way around the focus
      for (let k = 0; k < TICKS; k++) {
        const el = ticks.current[k];
        if (!el) continue;
        const g = bell((k / EVERY) * slot - s.p, TICK_REACH);
        el.style.transform = `scaleY(${((TICK_REST + (TICK_FULL - TICK_REST) * g) / TICK_FULL).toFixed(3)})`;
      }

      // the year in focus under its tick, inside the line; an end it would
      // come nearer than APART to steps aside
      const label = year.current;
      if (label) {
        const w = label.offsetWidth;
        const lx = Math.min(L - w, Math.max(0, s.y - w / 2));
        label.style.transform = `translate3d(${lx.toFixed(1)}px, 0, 0)`;
        const [first, last] = ends.current;
        first?.classList.toggle('is-aside', lx < first.offsetWidth - 2 * END_PAD + APART);
        last?.classList.toggle('is-aside', lx + w > L - (last.offsetWidth - 2 * END_PAD) - APART);
      }

      // on until the focus and the year have come where they were going
      if (s.p !== aim || s.y !== x(s.at)) raf = requestAnimationFrame(frame);
    };
    s.kick = () => {
      if (raf) return;
      then = 0;
      raf = requestAnimationFrame(frame);
    };
    s.kick();

    const ro = new ResizeObserver(() => s.kick());
    if (track.current) ro.observe(track.current);
    window.addEventListener('resize', s.kick);

    // by itself through the years, always: not while someone has it in hand,
    // and 3 s after anything they do
    let timer = 0;
    const step = () => {
      if (s.hover == null && !s.keys) go(s.at + 1);
      s.wait();
    };
    s.wait = () => {
      clearTimeout(timer);
      if (!still) timer = setTimeout(step, PLAY);
    };
    s.wait();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener('resize', s.kick);
      s.kick = () => {};
      s.wait = () => {};
    };
  }, [still, go]);

  // the pointer on the line or over the photos: the focus follows it, and the
  // memory nearest to it is the one in focus
  const point = (e) => {
    const r = track.current.getBoundingClientRect();
    const x = Math.min(r.width, Math.max(0, e.clientX - r.left));
    live.current.hover = x;
    go(Math.round((x / r.width) * (N - 1)));
    live.current.kick();
    live.current.wait();
  };
  const onMove = (e) => {
    if (e.pointerType === 'mouse' || track.current.hasPointerCapture?.(e.pointerId)) point(e);
  };
  const onDown = (e) => {
    track.current.setPointerCapture?.(e.pointerId);
    point(e);
  };
  const onLeave = (e) => {
    if (track.current.hasPointerCapture?.(e.pointerId)) return;
    live.current.hover = null;
    live.current.kick();
    live.current.wait();
  };
  const onKey = (e) => {
    const now = live.current.at;
    const to = { ArrowLeft: now - 1, ArrowDown: now - 1, ArrowRight: now + 1, ArrowUp: now + 1, Home: 0, End: N - 1 }[e.key];
    if (to == null) return;
    e.preventDefault();
    // the keys move the focus, even with the mouse resting on the line
    live.current.hover = null;
    go(Math.min(N - 1, Math.max(0, to)));
    live.current.wait();
  };
  // the keyboard on the slider holds it; a click on it does not
  const onFocus = (e) => {
    live.current.keys = e.currentTarget.matches(':focus-visible');
  };
  const onBlur = () => {
    live.current.keys = false;
    live.current.wait();
  };
  const pick = (i) => {
    live.current.hover = null;
    go(i);
    live.current.wait();
  };

  const m = MEMORIES[at];
  return (
    <section className="imm-strip" aria-label={t('Sećanja')}>
      <div className="imm-strip-time" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div className="imm-strip-stage" aria-hidden="true">
          {MEMORIES.map((p, i) => (
            <img
              key={p.year}
              ref={(el) => (photos.current[i] = el)}
              className="imm-strip-photo"
              src={p.src}
              alt=""
              draggable={false}
              decoding="async"
              onClick={() => pick(i)}
            />
          ))}
        </div>
        <div
          ref={track}
          role="slider"
          tabIndex={0}
          aria-label={t('Godina sećanja')}
          aria-valuemin={FIRST}
          aria-valuemax={LAST}
          aria-valuenow={m.year}
          className="imm-strip-ticks"
          onPointerDown={onDown}
          onPointerUp={(e) => {
            track.current.releasePointerCapture?.(e.pointerId);
            if (e.pointerType !== 'mouse') onLeave(e);
          }}
          onKeyDown={onKey}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          {Array.from({ length: TICKS }, (_, k) => (
            <span
              key={k}
              ref={(el) => (ticks.current[k] = el)}
              className={`imm-strip-tick${k === at * EVERY ? ' is-on' : ''}${k % EVERY === 0 ? ' has-memory' : ''}`}
            />
          ))}
        </div>
        <div className="imm-strip-ends">
          <button type="button" ref={(el) => (ends.current[0] = el)} onClick={() => pick(0)}>
            {FIRST}
          </button>
          <span ref={year} className="imm-strip-year" aria-hidden="true">
            {m.year}
          </span>
          <button type="button" ref={(el) => (ends.current[1] = el)} onClick={() => pick(N - 1)}>
            {LAST}
          </button>
        </div>
      </div>
    </section>
  );
}
