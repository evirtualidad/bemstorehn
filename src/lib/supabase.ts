
import { createPagesBrowserClient, type SupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';

// NOTE: This file is now used to initialize the Supabase client.
// The previous content related to local data has been removed.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient<Database>;
let isSupabaseConfigured = false;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createPagesBrowserClient<Database>({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  });
  isSupabaseConfigured = true;
} else {
  console.warn("Supabase credentials are not set. App will run in a simulated/local mode.");
  // Assign a mock object if Supabase is not configured to avoid runtime errors
  supabase = {} as SupabaseClient<Database>;
  isSupabaseConfigured = false;
}


export { supabase, isSupabaseConfigured };
