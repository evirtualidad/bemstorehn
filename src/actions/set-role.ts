
'use server';

// NOTE: This server action is temporarily disabled while the application is using mock data.
// It will be re-enabled when Supabase integration is restored.

type Role = 'admin' | 'cashier';

export async function setRole(userId: string, role: Role): Promise<{ success: boolean, error?: string }> {
  console.warn(`Mock setRole called for userId: ${userId} with role: ${role}. No actual change will be made.`);
  
  // In a real scenario, you would have logic here to update the user's role.
  // For now, we'll just simulate a success response.
  if (!userId || !role) {
     return { success: false, error: 'User ID and role are required.' };
  }

  return { success: true };
}
