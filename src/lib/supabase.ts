
import { type SupabaseClient } from '@supabase/supabase-js';

// This file is adapted for a fully local development environment.
// All Supabase interactions are disabled.

console.warn("Application is running in a fully local mode. No data will be sent to Supabase.");

// This constant will be checked by hooks to determine if they should use local data.
export const isSupabaseConfigured = false;

// We export a null/mock object to prevent runtime errors in components
// that might still import `supabase`.
export const supabase = {} as SupabaseClient;
