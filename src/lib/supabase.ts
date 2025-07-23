
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Initialize a placeholder client
let supabase: SupabaseClient;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    // In case of error, assign a mock object to prevent runtime errors elsewhere
    supabase = {} as SupabaseClient;
  }
} else {
  console.warn("Supabase configuration is missing. The app will run in a simulated local mode. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in the .env file.");
  // This mock object prevents runtime errors when Supabase is not configured.
  supabase = {} as SupabaseClient;
}

export { supabase };
