import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { plan, action } = await req.json();
    
    if (action === 'create_order') {
      const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
      const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

      if (!razorpayKeyId || !razorpayKeySecret) {
        return new Response(JSON.stringify({ error: 'Payment gateway not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get plan details
      const { data: planData, error: planError } = await supabaseClient
        .from('subscription_plans')
        .select('*')
        .eq('name', plan)
        .single();

      if (planError || !planData) {
        return new Response(JSON.stringify({ error: 'Invalid plan' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check founding member status for price
      const { data: foundingMember } = await supabaseClient
        .from('founding_members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      let finalPrice = planData.price_inr;
      if (foundingMember) {
        // Check if they have a locked price
        const { data: existingSub } = await supabaseClient
          .from('user_subscriptions')
          .select('founding_member_price_locked')
          .eq('user_id', user.id)
          .eq('plan', plan)
          .single();
        
        if (existingSub?.founding_member_price_locked) {
          finalPrice = existingSub.founding_member_price_locked;
        }
      }

      // Create Razorpay order
      const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
        },
        body: JSON.stringify({
          amount: finalPrice * 100, // Razorpay expects amount in paise
          currency: 'INR',
          receipt: `sub_${user.id}_${Date.now()}`,
          notes: {
            user_id: user.id,
            plan: plan,
            is_founding_member: !!foundingMember,
          },
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        console.error('Razorpay order creation failed:', orderData);
        return new Response(JSON.stringify({ error: 'Failed to create order' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        order_id: orderData.id,
        amount: finalPrice,
        currency: 'INR',
        key_id: razorpayKeyId,
        plan: planData,
        is_founding_member: !!foundingMember,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'verify_payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
      
      const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
      
      // Verify signature
      const crypto = await import("https://deno.land/std@0.168.0/crypto/mod.ts");
      const encoder = new TextEncoder();
      const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);
      const key = encoder.encode(razorpayKeySecret);
      
      const hmac = await crypto.crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      
      const signature = await crypto.crypto.subtle.sign("HMAC", hmac, data);
      const expectedSignature = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (expectedSignature !== razorpay_signature) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get plan from order notes (fetch order from Razorpay)
      const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
      const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
        },
      });
      const orderData = await orderResponse.json();
      const planName = orderData.notes?.plan;
      const isFoundingMember = orderData.notes?.is_founding_member === 'true';

      // Get plan details
      const { data: planData } = await supabaseClient
        .from('subscription_plans')
        .select('price_inr')
        .eq('name', planName)
        .single();

      // Use service role for subscription update
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Update or create subscription
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error: subError } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          plan: planName,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          razorpay_payment_id,
          razorpay_subscription_id: razorpay_order_id,
          is_founding_member: isFoundingMember,
          founding_member_price_locked: isFoundingMember ? planData?.price_inr : null,
        }, {
          onConflict: 'user_id',
        });

      if (subError) {
        console.error('Subscription update failed:', subError);
        return new Response(JSON.stringify({ error: 'Failed to update subscription' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, plan: planName }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
