// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // Se você usa React

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do Vercel disponíveis durante o build
  // O Vercel define process.env.NODE_ENV como 'production' ou 'development'
  // e disponibiliza as variáveis de ambiente que você configurou no painel.
  const env = loadEnv(mode, process.cwd(), ''); // Carrega .env e variáveis de sistema

  return {
    plugins: [react()],
    define: {
      // Isso faz a substituição:
      // No seu código: process.env.API_KEY
      // No build final: "valor_da_sua_api_key_do_vercel"
      'process.env.API_KEY': JSON.stringify(env.API_KEY),

      // Para o Supabase, o Vite já lida com import.meta.env.VITE_... automaticamente,
      // então você não precisa definir VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY aqui
      // se estiver usando import.meta.env no código do Supabase.
      // Apenas para API_KEY do Gemini é que precisamos dessa "mágica" devido à exigência da biblioteca.
    }
  }
});
