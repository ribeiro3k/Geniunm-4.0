
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ERROR_MESSAGE } from '../constants';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error(SUPABASE_ERROR_MESSAGE);
  // In a real app, you might want to throw an error or display a global message
  // For this exercise, we'll allow the app to load but features relying on Supabase will fail.
  // Components should check if supabase is null before using it.
}

export const supabase = supabaseInstance;
