import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: WelcomeEmailRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Sending welcome email to:", email);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2663 0%, #e84393 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">💕 Welcome to Spaark!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your journey to finding love begins here</p>
          </div>
          
          <!-- Content -->
          <div style="background-color: #ffffff; padding: 40px 30px; border-left: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Thank you for subscribing! 🎉</h2>
            
            <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
              We're thrilled to have you join our community. You'll now receive exclusive updates about:
            </p>
            
            <ul style="color: #555555; font-size: 15px; line-height: 2; margin: 0 0 25px 0; padding-left: 20px;">
              <li>✨ New features and improvements</li>
              <li>💡 Dating tips and advice from experts</li>
              <li>💑 Success stories from real couples</li>
              <li>🎁 Special promotions and offers</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://spaarkdating.com" 
                 style="background: linear-gradient(135deg, #dc2663, #b91c5c); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                Visit Spaark
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e9ecef; border-top: none; text-align: center;">
            <p style="color: #666666; font-size: 14px; margin: 0 0 15px 0;">
              Follow us for more updates
            </p>
            <p style="color: #999999; font-size: 12px; margin: 0 0 15px 0;">
              © 2025 Spaark Dating. All rights reserved.<br>
              Made with ❤️ by Saurabh Sharma, Aakanksha Singh & Mandhata Singh
            </p>
            <p style="color: #999999; font-size: 11px; margin: 0;">
              You're receiving this because you subscribed to Spaark updates.<br>
              <a href="https://spaarkdating.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #dc2663; text-decoration: underline;">Unsubscribe</a> from these emails.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Spaark <no-reply@spaarkdating.com>",
        to: [email],
        subject: "Welcome to Spaark! 💕",
        html: htmlContent,
      }),
    });

    const result = await response.json();
    console.log("Resend response:", JSON.stringify(result));

    if (!response.ok) {
      console.error("Failed to send welcome email:", JSON.stringify(result));
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Welcome email sent successfully to:", email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
