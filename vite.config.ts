// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import postcss from './postcss.config.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    css: {
      postcss,
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  };
});
