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
