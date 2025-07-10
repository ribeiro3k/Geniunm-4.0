// Script para validar a API do Google Gemini
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

const API_KEY = process.env.VITE_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.error('❌ Erro: VITE_API_KEY não encontrada no arquivo .env');
  console.log('\n📝 Para configurar:');
  console.log('1. Crie um arquivo .env na raiz do projeto');
  console.log('2. Adicione: VITE_API_KEY=sua_chave_api_aqui');
  console.log('3. Obtenha sua chave em: https://makersuite.google.com/app/apikey');
  process.exit(1);
}

console.log('🔑 Chave API encontrada:', API_KEY.substring(0, 10) + '...');

try {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  console.log('✅ GoogleGenAI inicializado com sucesso');
  
  // Testa a API com uma requisição simples
  const model = "gemini-2.5-flash-preview-04-17";
  const prompt = "Responda apenas com 'API funcionando!'";
  
  console.log('🧪 Testando API...');
  
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  
  console.log('✅ API funcionando! Resposta:', response.text);
  console.log('\n🎉 Configuração da API do Gemini está correta!');
  
} catch (error) {
  console.error('❌ Erro ao testar API:', error.message);
  
  if (error.message.includes('API key')) {
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Verifique se a chave API está correta');
    console.log('2. Certifique-se de que a API está habilitada no Google Cloud Console');
    console.log('3. Verifique se há restrições de IP ou domínio');
  }
  
  process.exit(1);
} 