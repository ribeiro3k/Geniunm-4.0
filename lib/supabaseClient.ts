import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ERROR_MESSAGE } from '../constants';

// Access Supabase URL and Anon Key using process.env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // This console error will use the (updated) SUPABASE_ERROR_MESSAGE from constants.ts
  console.error(SUPABASE_ERROR_MESSAGE); 
}

export const supabase = supabaseInstance;
