import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';

// NOTE: This file is now used to initialize the Supabase client.
// The previous content related to local data has been removed.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required. Please check your .env file.");
}

export const supabase = createPagesBrowserClient<Database>({
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
});
