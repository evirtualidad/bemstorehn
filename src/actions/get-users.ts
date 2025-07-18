
'use server';

import { getAdmin } from '@/lib/firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';

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
  const { admin, error: adminError } = getAdmin();
  if (!admin || adminError) {
    const errorMessage = adminError || "Firebase Admin SDK no está inicializado.";
    console.error(errorMessage);
    return { users: [], error: errorMessage };
  }

  try {
    const auth = admin.auth();
    const userRecords = await auth.listUsers();
    
    const users = userRecords.users.map((user: UserRecord) => ({
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
    if (error.code === 'auth/insufficient-permission' || error.code === 'permission-denied') {
        errorMessage = 'Permisos insuficientes. Revisa los roles IAM de tu cuenta de servicio.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { users: [], error: errorMessage };
  }
}
