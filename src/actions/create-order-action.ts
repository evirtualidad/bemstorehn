
'use server';

import type { Order } from '@/hooks/use-orders';
import { supabase } from '@/lib/supabase';

/**
 * Server action to securely insert an order into the Supabase database.
 * @param order The complete order object to be saved.
 * @returns An object indicating success or failure, with an error message if applicable.
 */
export async function createOrderAction(order: Order): Promise<{ success: boolean, error?: string }> {
  try {
    const { error: insertError } = await supabase.from('orders').insert(order);

    if (insertError) {
      console.error('[Server Action Error] Supabase insert failed:', insertError.message);
      return { success: false, error: insertError.message };
    }

    console.log(`[Server Action] Order ${order.display_id} saved successfully to Supabase.`);
    return { success: true };

  } catch (e: any) {
    console.error('[Server Action Error] An unexpected error occurred:', e.message);
    return { success: false, error: 'An unexpected server error occurred.' };
  }
}
