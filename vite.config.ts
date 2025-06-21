// vite.config.js (ou vite.config.ts)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Se você usa React

export default defineConfig(({ mode }) => {
  // O Vercel disponibiliza as variáveis de ambiente para o processo de build.
  // Aqui, estamos assumindo que 'API_KEY' está disponível como process.env.API_KEY
  // DURANTE O BUILD no ambiente Vercel.
  const apiKeyFromEnv = process.env.API_KEY;

  return {
    plugins: [react()], // Adicione outros plugins se necessário
    define: {
      'process.env.API_KEY': JSON.stringify(apiKeyFromEnv)
      // Se você precisasse fazer o mesmo para o Supabase (mas não precisa, pois ele usa VITE_):
      // 'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
      // 'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
    }
  }
});
