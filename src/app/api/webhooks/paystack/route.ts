import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    // 1. Verify the request is actually from Paystack
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "Missing Paystack Secret Key" }, { status: 500 });

    const body = await req.text();
    const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
    const signature = req.headers.get('x-paystack-signature');

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature. Intruder detected." }, { status: 401 });
    }

    const event = JSON.parse(body);

    // 2. Process Successful Payments
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference; // This is our tracking_number
      const metadata = data.metadata;

      // A. Check if the frontend already saved this order (Idempotency check)
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('tracking_number', reference)
        .single();

      if (existingOrder) {
        // Order exists! Just ensure it's marked as paid.
        await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', existingOrder.id);
        return NextResponse.json({ message: "Order already processed by frontend. Status verified." }, { status: 200 });
      }

      // B. Order DOES NOT exist (The user's browser crashed!). Save them using the metadata.
      if (metadata && metadata.checkout_data && metadata.cart_payload) {
        const checkoutData = JSON.parse(metadata.checkout_data);
        const cartPayload = JSON.parse(metadata.cart_payload);

        await supabase.rpc('process_checkout', {
          p_user_id: metadata.user_id,
          p_email: data.customer.email,
          p_first_name: checkoutData.firstName,
          p_last_name: checkoutData.lastName,
          p_phone: checkoutData.phone,
          p_additional_phone: checkoutData.additionalPhone,
          p_address: checkoutData.address,
          p_landmark: checkoutData.landmark,
          p_state: checkoutData.state,
          p_lga: checkoutData.lga,
          p_payment_method: 'paystack',
          p_payment_status: 'paid',
          p_tracking_number: reference, 
          p_cart_items: cartPayload
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}