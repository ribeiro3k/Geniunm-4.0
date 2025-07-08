import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ERROR_MESSAGE } from '../constants';
import { TABLE_FLASHCARDS, TABLE_FLASHCARD_PROGRESS } from '../constants';
import { SupabaseFlashcard, UserFlashcardProgress } from '../types';

// Access Supabase URL and Anon Key using import.meta.env for Vite compatibility
// The user must ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in their Vercel environment.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    // The SUPABASE_ERROR_MESSAGE will be more general, guiding to check Vercel env vars.
    console.error(SUPABASE_ERROR_MESSAGE);
  }
} else {
  // This console error will use the (updated) SUPABASE_ERROR_MESSAGE from constants.ts
  // The message should guide them to check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.
  console.error(SUPABASE_ERROR_MESSAGE);
}

export const supabase = supabaseInstance;

export async function fetchFlashcardsByTheme(theme: string): Promise<SupabaseFlashcard[]> {
  if (!supabase) throw new Error('Supabase não inicializado');
  const { data, error } = await supabase
    .from(TABLE_FLASHCARDS)
    .select('*')
    .eq('theme', theme)
    .order('ordem', { ascending: true });
  if (error) throw error;
  return data as SupabaseFlashcard[];
}

export async function fetchUserFlashcardProgress(user_id: string): Promise<UserFlashcardProgress[]> {
  if (!supabase) throw new Error('Supabase não inicializado');
  const { data, error } = await supabase
    .from(TABLE_FLASHCARD_PROGRESS)
    .select('*')
    .eq('user_id', user_id);
  if (error) throw error;
  return data as UserFlashcardProgress[];
}

export async function upsertUserFlashcardProgress(user_id: string, flashcard_id: string) {
  if (!supabase) throw new Error('Supabase não inicializado');
  const { data, error } = await supabase
    .from(TABLE_FLASHCARD_PROGRESS)
    .upsert([
      {
        user_id,
        flashcard_id,
        last_viewed_at: new Date().toISOString(),
        completed: true
      }
    ], { onConflict: 'user_id,flashcard_id' });
  if (error) throw error;
  return data;
}

export async function setFlashcardFavorite(user_id: string, flashcard_id: string, is_favorite: boolean) {
  if (!supabase) throw new Error('Supabase não inicializado');
  const { data, error } = await supabase
    .from(TABLE_FLASHCARD_PROGRESS)
    .upsert([
      { user_id, flashcard_id, is_favorite }
    ], { onConflict: 'user_id,flashcard_id' });
  if (error) throw error;
  return data;
}

export async function fetchFavoriteFlashcards(user_id: string): Promise<SupabaseFlashcard[]> {
  if (!supabase) throw new Error('Supabase não inicializado');
  // Primeiro busca os IDs dos flashcards favoritos
  const { data: progress, error: errorProgress } = await supabase
    .from(TABLE_FLASHCARD_PROGRESS)
    .select('flashcard_id')
    .eq('user_id', user_id)
    .eq('is_favorite', true);
  if (errorProgress) throw errorProgress;
  const ids = (progress ?? []).map((p: any) => p.flashcard_id);
  if (ids.length === 0) return [];
  // Busca os flashcards por esses IDs
  const { data, error } = await supabase
    .from(TABLE_FLASHCARDS)
    .select('*')
    .in('id', ids);
  if (error) throw error;
  return data as SupabaseFlashcard[];
}

// Funções para CRUD de etiquetas e relacionamento scripts_etiquetas
export async function fetchTags(user_id: string) {
  if (!supabase) throw new Error('Supabase não inicializado');
  const { data, error } = await supabase
    .from('etiquetas')
    .select('*')
    .eq('created_by', user_id)
    .order('nome', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createTag({ nome, cor, created_by }: { nome: string, cor: string, created_by: string }) {
  if (!supabase) throw new Error('Supabase não inicializado');
  const { data, error } = await supabase
    .from('etiquetas')
    .insert([{ nome, cor, created_by }])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateTag({ id, nome, cor }: { id: string, nome: string, cor: string }) {
  if (!supabase) throw new Error('Supabase não inicializado');
  const { data, error } = await supabase
    .from('etiquetas')
    .update({ nome, cor })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteTag(id: string) {
  if (!supabase) throw new Error('Supabase não inicializado');
  const { error } = await supabase
    .from('etiquetas')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function fetchTagsForScript(script_id: string) {
  if (!supabase) throw new Error('Supabase não inicializado');
  const { data, error } = await supabase
    .from('scripts_etiquetas')
    .select('etiqueta_id, etiquetas(*)')
    .eq('script_id', script_id);
  if (error) throw error;
  return data?.map((row: any) => row.etiquetas);
}

export async function assignTagToScript(script_id: string, etiqueta_id: string) {
  if (!supabase) throw new Error('Supabase não inicializado');
  const { error } = await supabase
    .from('scripts_etiquetas')
    .insert([{ script_id, etiqueta_id }]);
  if (error) throw error;
}

export async function removeTagFromScript(script_id: string, etiqueta_id: string) {
  if (!supabase) throw new Error('Supabase não inicializado');
  const { error } = await supabase
    .from('scripts_etiquetas')
    .delete()
    .eq('script_id', script_id)
    .eq('etiqueta_id', etiqueta_id);
  if (error) throw error;
}
