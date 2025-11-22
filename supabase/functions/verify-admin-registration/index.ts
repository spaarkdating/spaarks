import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    const { secretCode, userId, email, role } = await req.json();

    console.log("Admin registration request received for user:", userId, "role:", role || "admin");

    // Validate input
    if (!secretCode || !userId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate role if provided
    const validRoles = ["admin", "moderator"];
    const assignedRole = role && validRoles.includes(role) ? role : "admin";

    // Check the admin secret code
    const adminSecret = Deno.env.get("ADMIN_SECRET_CODE");
    
    if (secretCode !== adminSecret) {
      console.log("Invalid admin secret code provided");
      return new Response(
        JSON.stringify({ error: "Invalid admin secret code" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has admin role
    const { data: existingAdmin } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingAdmin) {
      console.log("User already has admin role");
      return new Response(
        JSON.stringify({ success: true, message: "User already has admin role" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create admin user record
    const { error: insertError } = await supabase
      .from("admin_users")
      .insert({
        user_id: userId,
        email: email,
        role: assignedRole,
      });

    if (insertError) {
      console.error("Error creating admin user:", insertError);
      throw insertError;
    }

    console.log(`${assignedRole} role successfully assigned to user:`, userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${assignedRole} role successfully assigned` 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error in verify-admin-registration:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
