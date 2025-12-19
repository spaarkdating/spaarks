import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;
    
    if (action === "create_order") {
      const { plan, coupon_code } = body;
      
      const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
      const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

      if (!razorpayKeyId || !razorpayKeySecret) {
        return new Response(JSON.stringify({ error: "Payment gateway not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get plan details
      const { data: planData, error: planError } = await supabaseClient
        .from("subscription_plans")
        .select("*")
        .eq("name", plan)
        .single();

      if (planError || !planData) {
        return new Response(JSON.stringify({ error: "Invalid plan" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check founding member status
      const { data: foundingMember } = await supabaseClient
        .from("founding_members")
        .select("*")
        .eq("user_id", user.id)
        .single();

      let finalPrice = planData.price_inr;
      let founderDiscount = 0;
      let couponDiscount = 0;
      let couponId = null;

      // Apply founding member discount (20%)
      if (foundingMember) {
        const { data: existingSub } = await supabaseClient
          .from("user_subscriptions")
          .select("founding_member_price_locked")
          .eq("user_id", user.id)
          .eq("plan", plan)
          .single();
        
        if (existingSub?.founding_member_price_locked) {
          founderDiscount = planData.price_inr - existingSub.founding_member_price_locked;
        } else {
          founderDiscount = Math.round(planData.price_inr * 0.2);
        }
        finalPrice = planData.price_inr - founderDiscount;
      }

      // Validate and apply coupon
      if (coupon_code) {
        const { data: couponData } = await supabaseClient.rpc("validate_coupon", {
          p_code: coupon_code,
          p_plan: plan,
          p_user_id: user.id,
        });

        if (couponData?.valid) {
          couponId = couponData.coupon_id;
          if (couponData.discount_type === "percentage") {
            couponDiscount = Math.round(finalPrice * (couponData.discount_value / 100));
          } else {
            couponDiscount = Math.min(couponData.discount_value, finalPrice);
          }
          finalPrice = Math.max(0, finalPrice - couponDiscount);
        }
      }

      console.log(`Creating order: Plan ${plan}, Original: ${planData.price_inr}, Founder: -${founderDiscount}, Coupon: -${couponDiscount}, Final: ${finalPrice}`);

      // Create Razorpay order
      const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
        },
        body: JSON.stringify({
          amount: finalPrice * 100,
          currency: "INR",
          receipt: `sub_${user.id}_${Date.now()}`,
          notes: {
            user_id: user.id,
            plan: plan,
            is_founding_member: foundingMember ? "true" : "false",
            coupon_id: couponId || "",
            original_price: planData.price_inr,
            founder_discount: founderDiscount,
            coupon_discount: couponDiscount,
          },
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        console.error("Razorpay order creation failed:", orderData);
        return new Response(JSON.stringify({ error: "Failed to create order" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        order_id: orderData.id,
        amount: finalPrice * 100,
        currency: "INR",
        key_id: razorpayKeyId,
        plan: planData,
        is_founding_member: !!foundingMember,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify_payment") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, coupon_id } = body;
      
      const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
      const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
      
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
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      if (expectedSignature !== razorpay_signature) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get order details from Razorpay
      const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
        headers: {
          "Authorization": "Basic " + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
        },
      });
      const orderData = await orderResponse.json();
      const planName = orderData.notes?.plan;
      const isFoundingMember = orderData.notes?.is_founding_member === "true";
      const orderCouponId = orderData.notes?.coupon_id || coupon_id;
      const orderAmount = orderData.amount / 100;
      const couponDiscount = parseFloat(orderData.notes?.coupon_discount || "0");

      // Get plan details
      const { data: planData } = await supabaseClient
        .from("subscription_plans")
        .select("price_inr")
        .eq("name", planName)
        .single();

      // Use service role for updates
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Update subscription
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error: subError } = await supabaseAdmin
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          plan: planName,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          razorpay_payment_id,
          razorpay_subscription_id: razorpay_order_id,
          is_founding_member: isFoundingMember,
          founding_member_price_locked: isFoundingMember ? planData?.price_inr : null,
        }, {
          onConflict: "user_id",
        });

      if (subError) {
        console.error("Subscription update failed:", subError);
        return new Response(JSON.stringify({ error: "Failed to update subscription" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Record coupon usage if applicable
      if (orderCouponId && couponDiscount > 0) {
        await supabaseAdmin.from("coupon_usage").insert({
          coupon_id: orderCouponId,
          user_id: user.id,
          order_amount: orderAmount,
          discount_amount: couponDiscount,
        });

        // Increment coupon usage count
        await supabaseAdmin.rpc("increment_coupon_usage", { p_coupon_id: orderCouponId });
      }

      console.log(`Payment verified: User ${user.id}, Plan ${planName}, Amount ${orderAmount}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Razorpay checkout error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
