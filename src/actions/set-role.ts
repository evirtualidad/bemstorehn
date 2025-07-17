
'use server';

import { createClient } from '@supabase/supabase-js';

type Role = 'admin' | 'cashier';

// This function runs on the server and uses the SERVICE_ROLE_KEY to gain admin privileges.
// It's secure because the key is never exposed to the client.

export async function setRole(userId: string, role: Role): Promise<{ success: boolean, error?: string }> {
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // IMPORTANT: This must be the SERVICE_ROLE_KEY, not the anon key.
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase server environment variables not set.');
    return { success: false, error: 'Configuración del servidor incompleta.' };
  }

  // Create a new admin client for this operation
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { app_metadata: { role: role } }
  );

  if (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
