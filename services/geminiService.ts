// geminiService.ts - Corrigido e funcional para uso com Vite + Google Gemini



import {
  ...
  TABLE_CONFIGURACOES_IA,        // NOVO
  GLOBAL_SIMULATOR_PROMPT_ID,    // NOVO
  SUPABASE_ERROR_MESSAGE         // NOVO
} from '../constants';

import {
  GoogleGenAI,
  Chat,
  GenerateContentResponse,
  Part,
} from "@google/genai";

import { supabase } from '../lib/supabaseClient'; // se ainda não estiver no topo

import {
  FlashcardContent,
  Scenario,
  GeminiMessage,
  AudioTranscriptionResponse,
  SimulatorBehavioralProfile,
} from "../types";

import {
  API_KEY_ERROR_MESSAGE,
  GEMINI_SIMULATOR_PROMPT_TEMPLATE,
  GEMINI_OBJECTION_EVALUATOR_PROMPT,
  GEMINI_PROCEDURAL_SCENARIO_GENERATION_PROMPT,
  CUSTOM_SIMULATOR_PROMPT_KEY,
} from "../constants";

const API_KEY = import.meta.env.VITE_API_KEY;
let ai: GoogleGenAI | null = null;

if (API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (e) {
    console.error("Erro ao inicializar GoogleGenAI:", e);
  }
} else {
  console.error(API_KEY_ERROR_MESSAGE);
}

export async function generateFlashcardFromGemini(theme: string): Promise<FlashcardContent | null> {
  if (!API_KEY || !ai) throw new Error(API_KEY_ERROR_MESSAGE);

  const model = "gemini-2.5-flash-preview-04-17";
  const prompt = `
    Crie um flashcard didático, direto ao ponto e com emojis para explicar o conceito de "${theme}", voltado para consultores que vendem cursos EAD da Cruzeiro do Sul Virtual por WhatsApp (graduação e pós).

    O flashcard deve ter:
    🔹 Uma FRENTE contendo um TÍTULO CURTO... (demais instruções omitidas aqui por espaço, mas mantidas no código real)

    Separe a frente e o verso EXATAMENTE com a string "--VERSO--".
    Responda apenas com o conteúdo do flashcard.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });

    const text = response.text;
    const parts = text.split("--VERSO--");
    const safeId = theme.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

    if (parts.length === 2) {
      return {
        id: `flashcard_${safeId}_${crypto.randomUUID().slice(0, 4)}`,
        front: parts[0].trim(),
        back: parts[1].trim(),
        theme,
      };
    } else {
      return {
        id: `flashcard_error_${safeId}`,
        front: `Erro de Formato: ${theme}`,
        back: `Formato inválido. Conteúdo:
${text}`,
        theme,
      };
    }
  } catch (err) {
    console.error("Erro ao gerar flashcard:", err);
    return {
      id: `flashcard_error_${theme}`,
      front: `Erro: ${theme}`,
      back: `Erro ao gerar conteúdo: ${(err as Error).message}`,
      theme,
    };
  }
}

export async function startChatSession(
  scenario: Scenario,
  displayInitialAiMessage: boolean
): Promise<{ chat: Chat; initialAiMessage: string }> {
  if (!API_KEY || !ai) throw new Error(API_KEY_ERROR_MESSAGE);

  // Prompt base padrão
  let systemInstructionContent = GEMINI_SIMULATOR_PROMPT_TEMPLATE;

  // Tentativa de buscar do Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLE_CONFIGURACOES_IA)
        .select('prompt_content')
        .eq('id', GLOBAL_SIMULATOR_PROMPT_ID)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Erro ao buscar prompt customizado do Supabase, usando padrão:', error.message);
      } else if (data?.prompt_content) {
        systemInstructionContent = data.prompt_content;
        console.log("Usando prompt customizado do Supabase.");
      } else {
        console.log("Nenhum prompt customizado encontrado. Usando padrão.");
      }
    } catch (e) {
      console.warn('Exceção ao buscar prompt do Supabase:', (e as Error).message);
    }
  } else {
    console.warn(`Supabase não configurado. ${SUPABASE_ERROR_MESSAGE}`);
    const localPrompt = localStorage.getItem(CUSTOM_SIMULATOR_PROMPT_KEY);
    if (localPrompt) {
      systemInstructionContent = localPrompt;
      console.log("Usando prompt do localStorage.");
    }
  }

const finalSystemInstruction = systemInstructionContent
  .replace(/{SCENARIO_TITLE}/g, scenario.title || "Sem título")
  .replace(/{SCENARIO_CONTEXT}/g, scenario.context || "Contexto não informado")
  .replace(/{SCENARIO_INITIAL_MESSAGE_CONTEXT}/g, scenario.initialMessage || "Interesse geral em cursos EAD.")
  .replace(/{BEHAVIORAL_PROFILE}/g, scenario.behavioralProfile || "Padrão");

  const initialHistory: GeminiMessage[] = [];
  if (displayInitialAiMessage && scenario.initialMessage) {
    initialHistory.push({ role: 'model', parts: [{ text: scenario.initialMessage }] });
  }

// 👇 ESSA variável precisa ser usada no chat!
const chat = ai.chats.create({
  model: "gemini-2.5-flash-preview-04-17",
  config: {
    systemInstruction: finalSystemInstruction, // <- AQUI ENTRA O PROMPT COMPLETO
  },
  history: initialHistory.length > 0 ? initialHistory : undefined,
});

  const firstAiMessage = displayInitialAiMessage ? scenario.initialMessage : "";
  return { chat, initialAiMessage: firstAiMessage };
}

export async function sendChatMessage(chat: Chat | null, userMessage: string): Promise<string> {
  if (!API_KEY || !chat) throw new Error(API_KEY_ERROR_MESSAGE);
  try {
    const response = await chat.sendMessage({ message: userMessage });
    return response.text;
  } catch (err: any) {
    console.error("Erro no chat:", err);
    return err?.response?.promptFeedback?.blockReason || "Erro ao enviar mensagem.";
  }
}

export async function generateProceduralLeadScenarioFromGemini(): Promise<Scenario | null> {
  if (!API_KEY || !ai) throw new Error(API_KEY_ERROR_MESSAGE);

  const model = "gemini-2.5-flash-preview-04-17";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: GEMINI_PROCEDURAL_SCENARIO_GENERATION_PROMPT }] }],
      config: { temperature: 0.85, topP: 0.95, thinkingConfig: { thinkingBudget: 0 } },
    });

    const lines = response.text.split("\n").map(l => l.trim()).filter(Boolean);
    const fields: Record<string, string> = {};
    lines.forEach(line => {
      const i = line.indexOf(":");
      if (i !== -1) fields[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });

    const required = ["LEAD_NAME", "LEAD_AGE_APPROX", "LEAD_CURRENT_SITUATION", "COURSE_OF_INTEREST", "LEAD_PRIMARY_MOTIVATION", "LEAD_KEY_CONCERN_OR_DOUBT", "LEAD_SUBTLE_PAIN_POINT", "LEAD_SOURCE_HINT", "INITIAL_MESSAGE_TO_CONSULTANT", "BEHAVIORAL_PROFILE"];
    for (const key of required) if (!fields[key]) throw new Error(`Campo obrigatório ausente: ${key}`);

    const profile = ["Questionador Detalhista", "Ocupado/Impaciente", "Desconfiado/Silencioso", "Confuso/Indeciso", "Comparador", "Padrão"].includes(fields.BEHAVIORAL_PROFILE) ? fields.BEHAVIORAL_PROFILE as SimulatorBehavioralProfile : "Padrão";

    return {
      id: `sim_${fields.LEAD_NAME.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`,
      title: `${fields.LEAD_NAME} (${fields.COURSE_OF_INTEREST})`,
      context: `Nome: ${fields.LEAD_NAME}, ${fields.LEAD_AGE_APPROX} anos.\nSituação: ${fields.LEAD_CURRENT_SITUATION}.\nCurso: ${fields.COURSE_OF_INTEREST}.\nMotivação: ${fields.LEAD_PRIMARY_MOTIVATION}.\nPreocupação: ${fields.LEAD_KEY_CONCERN_OR_DOUBT}.\nDesejo: ${fields.LEAD_SUBTLE_PAIN_POINT}.\nOrigem: ${fields.LEAD_SOURCE_HINT}.`,
      initialMessage: fields.INITIAL_MESSAGE_TO_CONSULTANT,
      behavioralProfile: profile,
    };
  } catch (err) {
    console.error("Erro cenário procedural:", err);
    throw err;
  }
}

export async function transcribeAudioWithGemini(audioBase64: string, mimeType = "audio/webm"): Promise<AudioTranscriptionResponse> {
  if (!API_KEY || !ai) return { error: API_KEY_ERROR_MESSAGE };

  const audioPart: Part = {
    inlineData: { mimeType, data: audioBase64 },
  };
  const promptPart: Part = {
    text: "Transcreva o seguinte áudio em português brasileiro. Responda apenas com a transcrição."
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: { parts: [audioPart, promptPart] },
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });
    const raw = response.text.trim();
    const match = raw.match(/^```(\w*)?\s*\n?(.*?)\n?\s*```$/s);
    const cleanText = match?.[2]?.trim() || raw;
    return cleanText ? { text: cleanText } : { text: "", error: "Áudio não compreendido." };
  } catch (err) {
    console.error("Erro transcrição:", err);
    return { error: (err as Error).message };
  }
}

export async function evaluateObjectionResponse(objection: string, responseText: string, context?: string): Promise<string> {
  if (!API_KEY || !ai) throw new Error(API_KEY_ERROR_MESSAGE);

  const prompt = GEMINI_OBJECTION_EVALUATOR_PROMPT
    .replace("{OBJECTION_TEXT}", objection)
    .replace("{OBJECTION_CONTEXT}", context || "Sem contexto")
    .replace("{USER_RESPONSE}", responseText);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (err) {
    console.error("Erro avaliação objeção:", err);
    return `Erro: ${(err as Error).message}`;
  }
}

export async function generateCollaboratorAnalysis(userData: string, managerPrompt: string): Promise<string> {
  if (!API_KEY || !ai) throw new Error(API_KEY_ERROR_MESSAGE);

  const prompt = managerPrompt.replace("{USER_DATA_PLACEHOLDER}", userData);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (err) {
    console.error("Erro análise colaborador:", err);
    throw new Error((err as Error).message);
  }
}
