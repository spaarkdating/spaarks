import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's email and display name before deletion
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", user.id)
      .single();

    const userEmail = user.email || profile?.email;
    const displayName = profile?.display_name || "Unknown";

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "Could not retrieve user email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Block the email first (so even if deletion fails partially, email is blocked)
    const { error: blockError } = await supabaseAdmin
      .from("blocked_emails")
      .insert({
        email: userEmail.toLowerCase(),
        user_display_name: displayName,
        reason: "User requested permanent account deletion"
      });

    if (blockError && !blockError.message.includes("duplicate")) {
      console.error("Error blocking email:", blockError);
      return new Response(
        JSON.stringify({ error: "Failed to process deletion request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete all user-related data from various tables
    const tablesToClean = [
      "notifications",
      "messages",
      "matches",
      "message_reactions",
      "profile_views",
      "photos",
      "user_interests",
      "support_tickets",
      "photo_reports",
      "profile_reports",
      "boost_purchases",
      "coupon_usage",
      "usage_tracking",
      "user_subscriptions",
      "subscriptions",
      "payments",
      "testimonials",
      "id_card_verifications"
    ];

    for (const table of tablesToClean) {
      try {
        await supabaseAdmin.from(table).delete().eq("user_id", user.id);
      } catch (e) {
        console.log(`Could not clean ${table}, may not have user_id column`);
      }
    }

    // Also clean tables where user might be referenced differently
    await supabaseAdmin.from("messages").delete().eq("sender_id", user.id);
    await supabaseAdmin.from("messages").delete().eq("receiver_id", user.id);
    await supabaseAdmin.from("matches").delete().eq("liked_user_id", user.id);
    await supabaseAdmin.from("profile_views").delete().eq("viewer_id", user.id);
    await supabaseAdmin.from("profile_views").delete().eq("viewed_profile_id", user.id);
    await supabaseAdmin.from("photo_reports").delete().eq("reporter_id", user.id);
    await supabaseAdmin.from("photo_reports").delete().eq("reported_user_id", user.id);
    await supabaseAdmin.from("profile_reports").delete().eq("reporter_id", user.id);
    await supabaseAdmin.from("profile_reports").delete().eq("reported_user_id", user.id);
    await supabaseAdmin.from("blocked_users").delete().eq("blocked_user_id", user.id);

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
    }

    // Delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted account and blocked email: ${userEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account permanently deleted. This email can no longer be used." 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in delete-account function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
