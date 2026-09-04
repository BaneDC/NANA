import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
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
});
