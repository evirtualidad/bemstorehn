
'use server';

// NOTE: This server action is temporarily disabled while the application is using mock data.
// It will be re-enabled when Supabase integration is restored.

import type { User } from '@supabase/supabase-js';

export type UserWithRole = User & {
    app_metadata: {
        role?: 'admin' | 'cashier';
        provider?: string;
        providers?: string[];
    }
}

// Mock implementation
export async function getUsers(): Promise<{ users: UserWithRole[], error?: string }> {
  console.warn("getUsers is using mock data.");
  const mockUsers: UserWithRole[] = [
    {
      id: 'mock-user-1',
      app_metadata: { role: 'admin', provider: 'email' },
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'admin@example.com',
      last_sign_in_at: new Date().toISOString(),
    },
    {
      id: 'mock-user-2',
      app_metadata: { role: 'cashier', provider: 'email' },
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'cashier@example.com',
      last_sign_in_at: new Date().toISOString(),
    },
  ];

  return Promise.resolve({ users: mockUsers });
}
