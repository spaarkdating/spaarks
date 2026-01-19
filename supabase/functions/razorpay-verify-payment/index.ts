import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan_type: string;
  amount: number;
  coupon_id?: string;
  discount_amount?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay secret not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Authorization header required");
    }

    const supabaseAuth = createClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      throw new Error("Invalid or expired token");
    }

    const user = claimsData.user;

    const supabaseClient = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      plan_type,
      amount,
      coupon_id,
      discount_amount
    } = await req.json() as VerifyRequest;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const encoder = new TextEncoder();
    const key = encoder.encode(RAZORPAY_KEY_SECRET);
    const data = encoder.encode(body);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    // Payment verified - update payment request
    await supabaseClient
      .from("payment_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        upi_reference: razorpay_payment_id,
      })
      .eq("transaction_id", razorpay_order_id);

    // Check founding member status
    const { data: founderData } = await supabaseClient
      .from("founding_members")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isFoundingMember = !!founderData;

    // Create/update subscription
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { data: existingSub } = await supabaseClient
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingSub) {
      await supabaseClient
        .from("user_subscriptions")
        .update({
          plan: plan_type,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          cancelled_at: null,
          is_founding_member: isFoundingMember,
          razorpay_payment_id: razorpay_payment_id,
        })
        .eq("id", existingSub.id);
    } else {
      await supabaseClient
        .from("user_subscriptions")
        .insert({
          user_id: user.id,
          plan: plan_type,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_founding_member: isFoundingMember,
          razorpay_payment_id: razorpay_payment_id,
        });
    }

    // Record payment
    await supabaseClient.from("payments").insert({
      user_id: user.id,
      amount,
      currency: "INR",
      status: "completed",
      payment_method: "razorpay_upi",
      transaction_type: "subscription",
      description: `${plan_type} plan subscription`,
    });

    // Handle coupon
    if (coupon_id && discount_amount && discount_amount > 0) {
      await supabaseClient.rpc("increment_coupon_usage", { p_coupon_id: coupon_id });
      await supabaseClient.from("coupon_usage").insert({
        coupon_id,
        user_id: user.id,
        order_amount: amount + discount_amount,
        discount_amount,
      });
    }

    // Create notification
    await supabaseClient.from("notifications").insert({
      user_id: user.id,
      type: "subscription",
      title: "Subscription Activated! 🎉",
      message: `Your ${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)} plan is now active. Enjoy your premium features!`,
    });

    // Send email notification
    try {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("email, display_name")
        .eq("id", user.id)
        .single();

      if (profile?.email) {
        await fetch(`${SUPABASE_URL}/functions/v1/send-payment-notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: profile.email,
            name: profile.display_name,
            type: "approved",
            planType: plan_type,
            amount,
          }),
        });
      }
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Payment verified and subscription activated" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in razorpay-verify-payment:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
