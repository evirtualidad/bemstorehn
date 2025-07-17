
'use server';

import { supabaseClient } from '@/lib/supabase';

type Role = 'admin' | 'cashier';

export async function setRole(userId: string, role: Role): Promise<{ success: boolean, error?: string }> {
  // NOTE: This can only be called from a server component or a server action
  // for it to have the necessary service_role permissions.
  // We are creating a temporary admin client here for this action.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { app_metadata: { role: role } }
  );

  if (error) {
    console.error('Error setting role:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
