// The old button, kept for the onboarding only (Immersive*, which keeps its
// own look and is not part of the move to shadcn); drawn by .btn in
// onboarding.css. Everything else uses Button from @/components/ui/button.
import { motion } from 'motion/react';

export default function Button({
  variant = 'primary',
  size,
  full,
  iconOnly,
  className,
  children,
  ...props
}) {
  // `className` is merged rather than spread through: coming in with the rest
  // of the props it landed after this one and replaced it outright, so a caller
  // adding a single positioning class silently lost `btn` and every variant
  // style with it.
  const classes = [
    'btn',
    variant,
    size === 'lg' ? 'lg' : '',
    full ? 'full' : '',
    iconOnly ? 'icon-only' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.button whileTap={{ scale: 0.97 }} className={classes} {...props}>
      {children}
    </motion.button>
  );
}
