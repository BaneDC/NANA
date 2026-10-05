import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge knows Tailwind's own sizes, not ours: left alone it read
// `text-small` and `text-badge` (src/styles/index.css) as colours and dropped
// them for the colour that came after. They are told apart here, with the
// colours ours adds, and our shadows.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['small', 'badge'] }],
      leading: [{ leading: ['body'] }],
      shadow: [{ shadow: ['card', 'container', 'button'] }],
    },
  },
});

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
