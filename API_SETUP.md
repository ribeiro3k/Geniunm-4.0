# 🚀 Configuração da API do Google Gemini

## 📋 Pré-requisitos

1. **Conta Google**: Você precisa de uma conta Google
2. **Google Cloud Project**: Acesso ao Google Cloud Console
3. **API Key**: Chave de API do Google Gemini

## 🔑 Como obter a API Key

### 1. Acesse o Google AI Studio
- Vá para: https://makersuite.google.com/app/apikey
- Faça login com sua conta Google

### 2. Crie uma nova API Key
- Clique em "Create API Key"
- Escolha "Create API Key in new project" ou use um projeto existente
- Copie a chave gerada (formato: `AIzaSy...`)

## ⚙️ Configuração do Projeto

### 1. Crie o arquivo `.env`
Na raiz do projeto, crie um arquivo chamado `.env` com o seguinte conteúdo:

```env
# Google Gemini API Key
VITE_API_KEY=sua_chave_api_aqui

# Environment
NODE_ENV=development
```

### 2. Substitua a chave
Substitua `sua_chave_api_aqui` pela chave real que você obteve no Google AI Studio.

## 🧪 Validação da API

### 1. Instale as dependências
```bash
npm install
```

### 2. Execute o script de validação
```bash
npm run validate-api
```

### 3. Verifique a saída
Se tudo estiver correto, você verá:
```
🔑 Chave API encontrada: AIzaSyAxZ...
✅ GoogleGenAI inicializado com sucesso
🧪 Testando API...
✅ API funcionando! Resposta: API funcionando!
🎉 Configuração da API do Gemini está correta!
```

## 🔧 Solução de Problemas

### Erro: "VITE_API_KEY não encontrada"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Confirme se a variável está escrita corretamente: `VITE_API_KEY=`
- Reinicie o servidor de desenvolvimento após criar o arquivo

### Erro: "API key invalid"
- Verifique se a chave API está correta
- Certifique-se de que a API está habilitada no Google Cloud Console
- Verifique se há restrições de IP ou domínio

### Erro: "API not enabled"
- Vá para o Google Cloud Console
- Habilite a API do Google Generative AI
- Aguarde alguns minutos para a ativação

## 📁 Estrutura de Arquivos

```
projeto/
├── .env                    # Variáveis de ambiente (NÃO commitar)
├── .env.example           # Exemplo de configuração
├── validate-api.js        # Script de validação
├── services/
│   └── geminiService.ts   # Serviço da API
└── package.json           # Dependências e scripts
```

## 🚀 Uso no Código

A API está configurada para ser usada através do `geminiService.ts`:

```typescript
import { generateFlashcardFromGemini } from './services/geminiService';

// Exemplo de uso
const flashcard = await generateFlashcardFromGemini("Marketing Digital");
```

## 🔒 Segurança

- **NUNCA** commite o arquivo `.env` no Git
- O arquivo `.env` já está no `.gitignore`
- Use variáveis de ambiente diferentes para desenvolvimento e produção
- Monitore o uso da API para evitar custos inesperados

## 📞 Suporte

Se você encontrar problemas:
1. Verifique se seguiu todos os passos
2. Execute `npm run validate-api` para diagnosticar
3. Consulte a documentação oficial: https://ai.google.dev/ 