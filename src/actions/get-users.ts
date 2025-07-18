
'use server';

import type { User } from 'firebase/auth';

export type UserWithRole = User & {
    customClaims?: {
        role?: 'admin' | 'cashier';
    }
}

const mockUsers: any[] = [
    {
        uid: 'user_admin_mock',
        email: 'admin@example.com',
        metadata: {
            creationTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            lastSignInTime: new Date().toISOString(),
        },
        customClaims: { role: 'admin' },
    },
    {
        uid: 'user_cashier_mock',
        email: 'cashier@example.com',
        metadata: {
            creationTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            lastSignInTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        customClaims: { role: 'cashier' },
    }
];

export async function getUsers(): Promise<{ users: UserWithRole[], error?: string }> {
  console.log("SIMULATION: Fetching mock users.");
  // Simulate network delay
  await new Promise(res => setTimeout(res, 500));
  
  return { users: mockUsers };
}
