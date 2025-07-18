
'use server';

import * as admin from 'firebase-admin';
import serviceAccount from '@/lib/serviceAccountKey.json';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Error initializing Firebase Admin SDK in get-users:', error.message);
  }
}

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
  if (!admin.apps.length) {
    const errorMessage = "Firebase Admin SDK no está inicializado. Revisa las variables de entorno del servidor.";
    console.error(errorMessage);
    return { users: [], error: errorMessage };
  }

  try {
    const auth = admin.auth();
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
  } catch (error: any)
{
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
