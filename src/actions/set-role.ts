
'use server';

import { getAdmin } from '@/lib/firebase-admin';

type Role = 'admin' | 'cashier';

export async function setRole(userId: string, role: Role): Promise<{ success: boolean, error?: string }> {
  const { admin, error: adminError } = getAdmin();
  if (!admin || adminError) {
    const errorMessage = adminError || "Firebase Admin SDK no está inicializado. Revisa las variables de entorno del servidor.";
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const auth = admin.auth();
    
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
