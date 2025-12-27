import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentNotificationRequest {
  email: string;
  name: string;
  type: "approved" | "rejected";
  planType: string;
  amount: number;
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, type, planType, amount, reason }: PaymentNotificationRequest = await req.json();

    console.log(`Sending ${type} payment notification to ${email}`);

    if (!email) {
      throw new Error("Email is required");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const displayName = name || "User";
    const planName = planType.charAt(0).toUpperCase() + planType.slice(1);

    let subject: string;
    let htmlContent: string;

    if (type === "approved") {
      subject = `🎉 Payment Approved - ${planName} Plan Activated!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Payment Approved! 🎉</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="font-size: 18px; margin-top: 0;">Hi ${displayName},</p>
              <p>Great news! Your payment of <strong>₹${amount}</strong> has been verified and approved.</p>
              
              <div style="background: white; border: 2px solid #ec4899; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                <h2 style="color: #ec4899; margin: 0 0 10px 0;">${planName} Plan</h2>
                <p style="color: #666; margin: 0;">Your subscription is now active!</p>
              </div>
              
              <h3 style="color: #333;">What's next?</h3>
              <ul style="color: #666;">
                <li>Explore your premium features</li>
                <li>Enjoy unlimited swipes</li>
                <li>Connect with more people</li>
              </ul>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://spaark.in/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open Spaark</a>
              </div>
              
              <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
                Thank you for choosing Spaark! ❤️
              </p>
            </div>
          </body>
        </html>
      `;
    } else {
      subject = `Payment Update - Action Required`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #374151; padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Payment Not Verified</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="font-size: 18px; margin-top: 0;">Hi ${displayName},</p>
              <p>We were unable to verify your payment of <strong>₹${amount}</strong> for the <strong>${planName} Plan</strong>.</p>
              
              ${reason ? `
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>
              </div>
              ` : ''}
              
              <h3 style="color: #333;">What can you do?</h3>
              <ul style="color: #666;">
                <li>Double-check your transaction details</li>
                <li>Ensure you uploaded the correct payment screenshot</li>
                <li>Contact our support team for assistance</li>
              </ul>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://spaark.in/checkout" style="display: inline-block; background: #374151; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 10px;">Try Again</a>
                <a href="https://spaark.in/support" style="display: inline-block; background: #ec4899; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Contact Support</a>
              </div>
              
              <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
                Need help? We're here for you!
              </p>
            </div>
          </body>
        </html>
      `;
    }

    // Send email using Resend API directly
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Spaark <noreply@spaark.in>",
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending payment notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
