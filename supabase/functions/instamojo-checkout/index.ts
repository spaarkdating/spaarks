import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  plan_type: string;
  amount: number;
  coupon_id?: string;
  discount_amount?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const INSTAMOJO_API_KEY = Deno.env.get("INSTAMOJO_API_KEY");
    const INSTAMOJO_AUTH_TOKEN = Deno.env.get("INSTAMOJO_AUTH_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!INSTAMOJO_API_KEY || !INSTAMOJO_AUTH_TOKEN) {
      throw new Error("Instamojo credentials not configured");
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Authorization header required");
    }

    // Create client with user's auth header to verify token
    const supabaseAuth = createClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify JWT using getClaims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      throw new Error("Invalid or expired token");
    }

    const user = claimsData.user;

    // Create service role client for database operations
    const supabaseClient = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    const { plan_type, amount, coupon_id, discount_amount } = await req.json() as PaymentRequest;

    if (!plan_type || amount === undefined) {
      throw new Error("Missing required fields: plan_type, amount");
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email, display_name")
      .eq("id", user.id)
      .single();

    const email = profile?.email || user.email;
    const name = profile?.display_name || "Spaark User";

    // Create Instamojo payment request using v1.1 API
    // Production endpoint - ensure your API Key and Auth Token are from www.instamojo.com/integrations
    const instamojoUrl = "https://www.instamojo.com/api/1.1/payment-requests/";
    
    const origin = req.headers.get("origin") || "https://spaarks.lovable.app";
    const redirectUrl = `${origin}/checkout/success?method=instamojo`;
    const webhookUrl = `${SUPABASE_URL}/functions/v1/instamojo-webhook`;

    const formData = new URLSearchParams();
    formData.append("amount", amount.toString());
    formData.append("purpose", `Spaark ${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)} Plan Subscription`);
    formData.append("buyer_name", name);
    formData.append("email", email || "");
    formData.append("redirect_url", redirectUrl);
    formData.append("webhook", webhookUrl);
    formData.append("allow_repeated_payments", "False");
    formData.append("send_email", "True");

    console.log("Creating Instamojo payment request for user:", user.id, "amount:", amount);

    const instamojoResponse = await fetch(instamojoUrl, {
      method: "POST",
      headers: {
        "X-Api-Key": INSTAMOJO_API_KEY,
        "X-Auth-Token": INSTAMOJO_AUTH_TOKEN,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const instamojoData = await instamojoResponse.json();

    console.log("Instamojo response:", JSON.stringify(instamojoData));

    if (!instamojoResponse.ok || !instamojoData.success) {
      console.error("Instamojo error:", instamojoData);
      const errorMessage = instamojoData.message || 
        (instamojoData.errors ? JSON.stringify(instamojoData.errors) : "Failed to create payment request");
      throw new Error(errorMessage);
    }

    const paymentRequest = instamojoData.payment_request;

    // Store payment request in database for tracking
    const { error: insertError } = await supabaseClient
      .from("payment_requests")
      .insert({
        user_id: user.id,
        plan_type,
        amount,
        transaction_id: paymentRequest.id,
        status: "pending",
      });

    if (insertError) {
      console.error("Error storing payment request:", insertError);
    }

    // If coupon was used, increment usage
    if (coupon_id && discount_amount && discount_amount > 0) {
      await supabaseClient.rpc("increment_coupon_usage", { p_coupon_id: coupon_id });
      
      await supabaseClient.from("coupon_usage").insert({
        coupon_id,
        user_id: user.id,
        order_amount: amount + discount_amount,
        discount_amount,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_request_id: paymentRequest.id,
        longurl: paymentRequest.longurl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in instamojo-checkout:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
