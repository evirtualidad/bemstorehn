
'use server';

import { supabaseClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export type UserWithRole = User & {
    app_metadata: {
        role?: 'admin' | 'cashier';
        provider?: string;
        providers?: string[];
    }
}

export async function getUsers(): Promise<{ users: UserWithRole[], error?: string }> {
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

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error.message);
    return { users: [], error: error.message };
  }

  // Cast users to UserWithRole, ensuring app_metadata exists
  const usersWithRoles: UserWithRole[] = users.map(user => ({
    ...user,
    app_metadata: {
      ...user.app_metadata,
      role: user.app_metadata.role || 'cashier', // Default to cashier if no role
    },
  }));

  return { users: usersWithRoles };
}
