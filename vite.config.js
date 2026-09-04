import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    // bind every interface: on its own Vite only listened on IPv6 [::1], so a
    // browser resolving localhost to 127.0.0.1 got connection refused
    host: true,
    // The harness hands the dev server a free port through PORT when another
    // one of these is already running; 5180 stays the default so a plain
    // `npm run dev` still lands where the README says it does.
    port: Number(process.env.PORT) || 5180,
    // fail loudly instead of silently moving to another port
    strictPort: true,
  },
});
