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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseClient = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Parse webhook payload - Instamojo sends form data
    const formData = await req.formData();
    
    const paymentId = formData.get("payment_id") as string;
    const paymentRequestId = formData.get("payment_request_id") as string;
    const status = formData.get("status") as string;
    const amount = formData.get("amount") as string;
    const mac = formData.get("mac") as string; // Message Authentication Code

    console.log("Instamojo webhook received:", { paymentId, paymentRequestId, status, amount });

    if (!paymentRequestId || !status) {
      throw new Error("Missing required webhook fields");
    }

    // Find the payment request
    const { data: paymentRequest, error: fetchError } = await supabaseClient
      .from("payment_requests")
      .select("*")
      .eq("transaction_id", paymentRequestId)
      .single();

    if (fetchError || !paymentRequest) {
      console.error("Payment request not found:", paymentRequestId);
      throw new Error("Payment request not found");
    }

    if (status === "Credit") {
      // Payment successful - update payment request
      await supabaseClient
        .from("payment_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          upi_reference: paymentId,
        })
        .eq("id", paymentRequest.id);

      // Check if user is a founding member
      const { data: founderData } = await supabaseClient
        .from("founding_members")
        .select("id")
        .eq("user_id", paymentRequest.user_id)
        .maybeSingle();

      const isFoundingMember = !!founderData;

      // Create/update subscription
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      // Check for existing subscription
      const { data: existingSub } = await supabaseClient
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", paymentRequest.user_id)
        .maybeSingle();

      if (existingSub) {
        await supabaseClient
          .from("user_subscriptions")
          .update({
            plan: paymentRequest.plan_type,
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            cancelled_at: null,
            is_founding_member: isFoundingMember,
            razorpay_payment_id: paymentId,
          })
          .eq("id", existingSub.id);
      } else {
        await supabaseClient
          .from("user_subscriptions")
          .insert({
            user_id: paymentRequest.user_id,
            plan: paymentRequest.plan_type,
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            is_founding_member: isFoundingMember,
            razorpay_payment_id: paymentId,
          });
      }

      // Record payment
      await supabaseClient.from("payments").insert({
        user_id: paymentRequest.user_id,
        amount: parseFloat(amount),
        currency: "INR",
        status: "completed",
        payment_method: "instamojo",
        transaction_type: "subscription",
        description: `${paymentRequest.plan_type} plan subscription`,
      });

      // Create notification
      await supabaseClient.from("notifications").insert({
        user_id: paymentRequest.user_id,
        type: "subscription",
        title: "Subscription Activated! 🎉",
        message: `Your ${paymentRequest.plan_type.charAt(0).toUpperCase() + paymentRequest.plan_type.slice(1)} plan is now active. Enjoy your premium features!`,
      });

      // Send confirmation email
      try {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("email, display_name")
          .eq("id", paymentRequest.user_id)
          .single();

        if (profile?.email) {
          await fetch(`${SUPABASE_URL}/functions/v1/send-payment-notification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profile.email,
              name: profile.display_name,
              type: "approved",
              planType: paymentRequest.plan_type,
              amount: parseFloat(amount),
            }),
          });
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      console.log("Payment processed successfully for user:", paymentRequest.user_id);
    } else {
      // Payment failed
      await supabaseClient
        .from("payment_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          admin_notes: `Payment status: ${status}`,
        })
        .eq("id", paymentRequest.id);

      console.log("Payment failed for user:", paymentRequest.user_id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in instamojo-webhook:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
