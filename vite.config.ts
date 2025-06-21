// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente (ex: .env, .env.production) para process.env
  // Isso torna as variáveis de ambiente do Vercel (que são definidas em process.env durante o build)
  // acessíveis aqui.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Isso substituirá 'process.env.API_KEY' no seu código do lado do cliente
      // pelo valor real de API_KEY do ambiente de build.
      // Certifique-se de que a variável API_KEY (sem o prefixo VITE_) esteja configurada no Vercel.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),

      // As chaves do Supabase já são tratadas por import.meta.env.VITE_... no arquivo supabaseClient.ts
      // e devem ser configuradas no Vercel como VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
      // Portanto, nenhum 'define' é necessário para elas aqui se supabaseClient.ts usar import.meta.env.
    }
  };
});
