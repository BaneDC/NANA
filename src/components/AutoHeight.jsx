import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

// A part whose content changes in place (a dialog's body when another choice
// is picked): its height follows the content, 250ms with a strong ease-out,
// rather than jumping, so the box around it grows or shrinks as one piece.
// Clipped only while it moves, and 16 wider than itself on each side, so a
// field reaching into the padding, or its focus line, is not cut off.
export default function AutoHeight({ className, children }) {
  const inner = useRef(null);
  const [height, setHeight] = useState('auto');
  const [moving, setMoving] = useState(false);
  const still = useReducedMotion();

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const watch = new ResizeObserver(() => setHeight(el.offsetHeight));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ height }}
      transition={still ? { duration: 0 } : { duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      onAnimationStart={() => setMoving(true)}
      onAnimationComplete={() => setMoving(false)}
      className="-mx-4 px-4"
      style={{ overflow: moving ? 'hidden' : 'visible' }}
    >
      <div ref={inner} className={className}>
        {children}
      </div>
    </motion.div>
  );
}
