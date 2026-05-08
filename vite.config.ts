import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    // IMPORTANTE: Use exatamente o nome da pasta do seu repositório no GitHub
    // Se no GitHub estiver com traço (controle-gre), use /controle-gre/
    // Se estiver com underline (controle_gre), use /controle_gre/
    base: '/controle-gre/', 
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
  };
});
