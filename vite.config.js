import { defineConfig } from 'vite';

// Relative assets also work at https://user.github.io/repository/.
export default defineConfig({ base: './', server: { port: 5173, strictPort: true } });
