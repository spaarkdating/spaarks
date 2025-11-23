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

    // Verify the requesting user is a super admin
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

    // Check if user is super admin
    const { data: adminData } = await supabaseAdmin
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!adminData || adminData.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Only super admins can delete all users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting deletion of all users...");

    // Get all users from auth.users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to list users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete all users except the current admin
    let deletedCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const userToDelete of users) {
      // Skip the current admin user
      if (userToDelete.id === user.id) {
        console.log(`Skipping current admin: ${userToDelete.email}`);
        continue;
      }

      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
          userToDelete.id
        );

        if (deleteError) {
          console.error(`Failed to delete user ${userToDelete.email}:`, deleteError);
          failedCount++;
          errors.push({ email: userToDelete.email, error: deleteError.message });
        } else {
          console.log(`Deleted user: ${userToDelete.email}`);
          deletedCount++;
        }
      } catch (error) {
        console.error(`Exception deleting user ${userToDelete.email}:`, error);
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push({ email: userToDelete.email, error: errorMessage });
      }
    }

    // Delete orphaned data from tables
    console.log("Cleaning up orphaned data...");
    
    // Delete matches, messages, notifications, profile views, support tickets, photo reports
    const tablesToClean = [
      "matches",
      "messages", 
      "notifications",
      "profile_views",
      "support_tickets",
      "photo_reports",
      "photos",
      "user_interests",
      "blocked_users",
      "boost_purchases",
      "subscriptions",
      "payments",
    ];

    for (const table of tablesToClean) {
      try {
        // Keep data for the current admin only
        const { error: cleanError } = await supabaseAdmin
          .from(table)
          .delete()
          .neq("user_id", user.id);
        
        if (cleanError) {
          console.error(`Error cleaning ${table}:`, cleanError);
        } else {
          console.log(`Cleaned table: ${table}`);
        }
      } catch (error) {
        console.error(`Exception cleaning ${table}:`, error);
      }
    }

    // Log the admin action
    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_user_id: user.id,
      action_type: "user_delete",
      details: {
        action: "bulk_delete_all_users",
        deleted_count: deletedCount,
        failed_count: failedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

    const message = `Deleted ${deletedCount} users successfully. ${failedCount > 0 ? `Failed to delete ${failedCount} users.` : ""}`;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        deletedCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in delete-all-users function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
