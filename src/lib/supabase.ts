
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use a singleton pattern to ensure the client is created only once.
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabase) {
    return supabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided in .env');
  }

  // Create a new client instance.
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  return supabase;
}

// Export a single instance of the client.
export const supabaseClient = getSupabaseClient();
