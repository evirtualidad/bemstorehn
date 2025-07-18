
'use server';

import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

export interface UserWithRole {
    uid: string;
    email?: string;
    metadata: {
        creationTime?: string;
        lastSignInTime?: string;
    };
    customClaims?: {
        [key: string]: any;
        role?: 'admin' | 'cashier';
    };
}


export async function getUsers(): Promise<{ users: UserWithRole[], error?: string }> {
  try {
    await initFirebaseAdmin();
    const auth = getAuth();
    const userRecords = await auth.listUsers();
    
    const users = userRecords.users.map(user => ({
      uid: user.uid,
      email: user.email,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
      },
      customClaims: user.customClaims,
    }));
    
    return { users };
  } catch (error: any) {
    console.error("Error fetching users from Firebase Admin:", error);
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/insufficient-permission') {
        errorMessage = 'Insufficient permissions. Check service account roles.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { users: [], error: errorMessage };
  }
}
