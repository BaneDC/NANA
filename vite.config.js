import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // The AI variant's key, from ANTHROPIC_API_KEY in `.env.local` (gitignored).
  // Only the dev server hands it to the page; a build defines it as empty, so no
  // key can end up in dist/ however the build was run. No VITE_ prefix either, so
  // Vite never puts it on import.meta.env by itself.
  const key = command === 'serve' ? loadEnv(mode, process.cwd(), '').ANTHROPIC_API_KEY || '' : '';

  return {
    plugins: [react()],
    base: './',
    define: {
      __DEV_ANTHROPIC_KEY__: JSON.stringify(key),
    },
    server: {
      // bind every interface: on its own Vite only listened on IPv6 [::1], so a
      // browser resolving localhost to 127.0.0.1 got connection refused
      host: true,
      // The harness hands the dev server a free port through PORT; 5180 stays
      // the default so a plain `npm run dev` still lands where the README says.
      port: Number(process.env.PORT) || 5180,
      // Strict only when a port was assigned to us, where binding anything else
      // would mean the preview points at nothing. Run by hand it walks to the
      // next free port instead of dying because a second copy is already up.
      strictPort: Boolean(process.env.PORT),
    },
  };
});
