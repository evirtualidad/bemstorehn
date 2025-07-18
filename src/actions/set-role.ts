
'use server';

import 'dotenv/config';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Error initializing Firebase Admin SDK in set-role:', error.message);
  }
}

type Role = 'admin' | 'cashier';

export async function setRole(userId: string, role: Role): Promise<{ success: boolean, error?: string }> {
  if (!admin.apps.length) {
    const errorMessage = "Firebase Admin SDK no está inicializado. Revisa las variables de entorno del servidor.";
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }
  try {
    const auth = admin.auth();
    
    // Set custom user claims
    await auth.setCustomUserClaims(userId, { role });
    
    console.log(`Successfully set role for user ${userId} to ${role}`);
    return { success: true };
  } catch (error: any) {
    console.error(`Error setting role for user ${userId}:`, error);
    let errorMessage = error.message || 'An unexpected error occurred.';
    if (error.code === 'auth/insufficient-permission' || error.code === 'permission-denied') {
        errorMessage = 'Permisos insuficientes para establecer roles. Revisa los roles IAM de tu cuenta de servicio.';
    }
    return { success: false, error: errorMessage };
  }
}
