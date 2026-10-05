// Every story is drawn on the app's own stylesheet (Tailwind, our tokens, the
// base), inside a white pane like the app's, 24 in from its edges (16 on a
// phone), so cards and their shadows look as they do on a screen.
import '../src/styles/index.css';

export default {
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    // the two widths the rules are checked at (docs/patterns.md §13)
    viewport: {
      options: {
        telefon: { name: 'Telefon 375×812', styles: { width: '375px', height: '812px' }, type: 'mobile' },
        desktop: { name: 'Desktop 1280×860', styles: { width: '1280px', height: '860px' }, type: 'desktop' },
      },
    },
    options: {
      storySort: {
        order: ['Osnovno', 'Polja', 'Kartica', 'Osoba i poseta', 'Prozori', 'Ostalo'],
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-card p-6 phone:p-4">
        <div className="mx-auto flex max-w-[720px] flex-col gap-3">
          <Story />
        </div>
      </div>
    ),
  ],
};
