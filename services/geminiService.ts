// geminiService.ts - Corrigido e funcional com integração Supabase para prompt do simulador

import {
  GoogleGenAI,
  Chat,
  GenerateContentResponse,
  Part,
} from "@google/genai";

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
  TABLE_CONFIGURACOES_IA,
  GLOBAL_SIMULATOR_PROMPT_ID,
  SUPABASE_ERROR_MESSAGE
} from "../constants";

import { supabase } from "../lib/supabaseClient";

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

export async function startChatSession(
  scenario: Scenario,
  displayInitialAiMessage: boolean
): Promise<{ chat: Chat; initialAiMessage: string }> {
  if (!API_KEY || !ai) throw new Error(API_KEY_ERROR_MESSAGE);

  // Prompt padrão
  let systemInstructionContent = GEMINI_SIMULATOR_PROMPT_TEMPLATE;

  // Busca no Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLE_CONFIGURACOES_IA)
        .select("prompt_content")
        .eq("id", GLOBAL_SIMULATOR_PROMPT_ID)
        .single();

      if (error && error.code !== "PGRST116") {
        console.warn("Erro ao buscar prompt do Supabase, usando padrão:", error.message);
      } else if (data?.prompt_content) {
        systemInstructionContent = data.prompt_content;
        console.log("Usando prompt customizado do Supabase.");
      } else {
        console.log("Nenhum prompt customizado no Supabase. Usando padrão.");
      }
    } catch (e) {
      console.warn("Exceção ao buscar prompt do Supabase:", (e as Error).message);
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
    initialHistory.push({ role: "model", parts: [{ text: scenario.initialMessage }] });
  }

  const chat = ai.chats.create({
    model: "gemini-2.5-flash-preview-04-17",
    config: {
      systemInstruction: finalSystemInstruction,
    },
    history: initialHistory.length > 0 ? initialHistory : undefined,
  });

  const firstAiMessage = displayInitialAiMessage ? scenario.initialMessage : "";
  return { chat, initialAiMessage: firstAiMessage };
}
