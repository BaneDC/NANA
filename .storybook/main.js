// Storybook for NANA Prime: every shadcn component as we dressed it, and the
// parts built from them, on their own, for visual QA (docs/storybook.md).
// It runs on the project's own vite.config.js (Tailwind, the `@` alias), so a
// story draws exactly what a screen draws.
export default {
  framework: { name: '@storybook/react-vite', options: {} },
  stories: ['../src/stories/**/*.stories.@(js|jsx)'],
  addons: [],
  core: { disableTelemetry: true },
  // A story never talks to the assistant: whatever the dev server would hand
  // the page from .env.local stays out of Storybook.
  viteFinal: (config) => ({
    ...config,
    define: { ...config.define, __DEV_ANTHROPIC_KEY__: JSON.stringify('') },
  }),
};
