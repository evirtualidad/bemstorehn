
'use server';

import 'dotenv/config';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

type Role = 'admin' | 'cashier';

export async function setRole(userId: string, role: Role): Promise<{ success: boolean, error?: string }> {
  try {
    await initFirebaseAdmin();
    const auth = getAuth();
    
    // Set custom user claims
    await auth.setCustomUserClaims(userId, { role });
    
    console.log(`Successfully set role for user ${userId} to ${role}`);
    return { success: true };
  } catch (error: any) {
    console.error(`Error setting role for user ${userId}:`, error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
