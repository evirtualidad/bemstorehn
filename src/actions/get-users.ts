
'use server';

import { createClient, type User } from '@supabase/supabase-js';

export type UserWithRole = User & {
    app_metadata: {
        role?: 'admin' | 'cashier';
        provider?: string;
        providers?: string[];
    }
}

export async function getUsers(): Promise<{ users: UserWithRole[], error?: string }> {
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // IMPORTANT: This must be the SERVICE_ROLE_KEY, not the anon key.
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase server environment variables not set.');
    return { users: [], error: 'Configuración del servidor incompleta.' };
  }

  // Create a new admin client for this operation
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error('Error fetching users:', error);
    return { users: [], error: error.message };
  }

  return { users: data.users as UserWithRole[] };
}
