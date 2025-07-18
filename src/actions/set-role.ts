
'use server';

type Role = 'admin' | 'cashier';

export async function setRole(userId: string, role: Role): Promise<{ success: boolean, error?: string }> {
  console.log(`SIMULATION: Setting role for user ${userId} to ${role}`);
  // In a real app, you would update the user's metadata in your auth provider.
  // Here, we just simulate a successful operation.
  
  // Simulate network delay
  await new Promise(res => setTimeout(res, 300));

  // Simulate potential failure
  if (userId === 'fail_case') {
    return { success: false, error: 'Simulated failure to update role.' };
  }

  return { success: true };
}
