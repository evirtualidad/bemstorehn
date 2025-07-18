
'use server';

import type { User } from '@supabase/supabase-js';

export type UserWithRole = User & {
    app_metadata: {
        role?: 'admin' | 'cashier';
        provider?: string;
        providers?: string[];
    }
}

const mockUsers: UserWithRole[] = [
    {
        id: 'user_admin_mock',
        email: 'admin@example.com',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: { role: 'admin', provider: 'email', providers: ['email'] },
        user_metadata: {},
        aud: 'authenticated',
        identities: [],
        phone: ''
    },
    {
        id: 'user_cashier_mock',
        email: 'cashier@example.com',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        last_sign_in_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        app_metadata: { role: 'cashier', provider: 'email', providers: ['email'] },
        user_metadata: {},
        aud: 'authenticated',
        identities: [],
        phone: ''
    }
];

export async function getUsers(): Promise<{ users: UserWithRole[], error?: string }> {
  console.log("SIMULATION: Fetching mock users.");
  // Simulate network delay
  await new Promise(res => setTimeout(res, 500));
  
  return { users: mockUsers };
}
