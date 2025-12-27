import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting expired subscription check...");

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const now = new Date().toISOString();

    // Find all active subscriptions that have expired
    const { data: expiredSubs, error: fetchError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("id, user_id, plan, expires_at")
      .eq("status", "active")
      .lt("expires_at", now);

    if (fetchError) {
      console.error("Error fetching expired subscriptions:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredSubs?.length || 0} expired subscriptions`);

    if (!expiredSubs || expiredSubs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired subscriptions found", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deactivate each expired subscription
    const deactivatedIds: string[] = [];
    for (const sub of expiredSubs) {
      console.log(`Deactivating subscription ${sub.id} for user ${sub.user_id}`);

      // Update subscription status to expired
      const { error: updateError } = await supabaseAdmin
        .from("user_subscriptions")
        .update({
          status: "expired",
          plan: "free",
          updated_at: now,
        })
        .eq("id", sub.id);

      if (updateError) {
        console.error(`Error deactivating subscription ${sub.id}:`, updateError);
        continue;
      }

      deactivatedIds.push(sub.id);

      // Create notification for the user
      await supabaseAdmin.from("notifications").insert({
        user_id: sub.user_id,
        type: "subscription",
        title: "Subscription Expired",
        message: `Your ${sub.plan} plan has expired. Upgrade now to continue enjoying premium features!`,
      });

      console.log(`Successfully deactivated subscription ${sub.id} and notified user`);
    }

    console.log(`Deactivated ${deactivatedIds.length} subscriptions`);

    return new Response(
      JSON.stringify({
        message: "Expired subscriptions deactivated",
        count: deactivatedIds.length,
        deactivatedIds,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in deactivate-expired-subscriptions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
