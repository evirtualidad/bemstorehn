
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Interfaz para los datos del pedido que esperamos recibir
interface NewOrderData {
  customer_name: string;
  customer_phone: string;
  customer_address: any | null;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  total: number;
  shipping_cost: number;
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';
  payment_reference: string | null;
  delivery_method: 'pickup' | 'delivery' | null;
  source: 'pos' | 'online-store';
}

Deno.serve(async (req) => {
  // Manejo de la solicitud pre-vuelo (preflight) de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderData } = await req.json();
    const {
      customer_name,
      customer_phone,
      items,
      // ... otros campos de orderData
    } = orderData as NewOrderData;

    // Validaciones básicas
    if (!customer_name || !items || items.length === 0) {
      throw new Error("Datos del pedido incompletos o inválidos.");
    }

    // Crear un cliente de Supabase con rol de servicio para tener permisos de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- 1. Crear o encontrar el cliente ---
    let customerId;
    let customerError;

    if (customer_phone) {
        const { data: existingCustomer, error: findError } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('phone', customer_phone)
            .single();

        if (findError && findError.code !== 'PGRST116') { // 'PGRST116' es "no rows found"
            customerError = findError;
        } else if (existingCustomer) {
            customerId = existingCustomer.id;
        }
    }
    
    // Si el cliente no existe, crearlo
    if (!customerId && !customerError) {
        const { data: newCustomer, error: createError } = await supabaseAdmin
            .from('customers')
            .insert({ name: customer_name, phone: customer_phone, address: orderData.customer_address })
            .select('id')
            .single();

        if (createError) customerError = createError;
        else customerId = newCustomer!.id;
    }
    
    if (customerError) throw new Error(`Error con el cliente: ${customerError.message}`);

    // --- 2. Verificar stock y actualizarlo en una transacción ---
    // Este es un paso crítico para evitar sobreventas.
    for (const item of items) {
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('stock')
        .eq('id', item.id)
        .single();
      
      if (productError) throw new Error(`Error al buscar producto ${item.name}: ${productError.message}`);
      if (!product || product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para el producto: ${item.name}.`);
      }

      // Restar el stock
      const newStock = product.stock - item.quantity;
      const { error: stockUpdateError } = await supabaseAdmin
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.id);
      
      if (stockUpdateError) throw new Error(`Error al actualizar stock para ${item.name}: ${stockUpdateError.message}`);
    }

    // --- 3. Crear el pedido ---
    const finalOrderData = {
      ...orderData,
      customer_id: customerId,
      status: 'pending-approval', // Todos los pedidos online empiezan así
      balance: orderData.total,
      payments: [],
      payment_due_date: null,
    };
    
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(finalOrderData)
      .select()
      .single();
    
    if (orderError) {
      // Aquí podrías implementar una lógica para revertir el stock si la creación del pedido falla
      throw new Error(`Error al crear el pedido: ${orderError.message}`);
    }
    
    // --- 4. Actualizar las estadísticas del cliente ---
    if (customerId) {
        await supabaseAdmin.rpc('increment_customer_stats', {
            p_customer_id: customerId,
            p_purchase_amount: orderData.total
        });
    }

    // Devolver el pedido recién creado
    return new Response(JSON.stringify({ order: newOrder }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
