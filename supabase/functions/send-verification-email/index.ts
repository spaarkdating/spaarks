import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  displayName: string;
  status: "approved" | "rejected";
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName, status, rejectionReason }: VerificationEmailRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!email || !status) {
      return new Response(JSON.stringify({ error: "Email and status are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Sending verification ${status} email to:`, email);

    const userName = displayName || "there";
    const isApproved = status === "approved";

    const htmlContent = isApproved
      ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">✅ Verification Approved!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your account is now active</p>
          </div>
          
          <!-- Content -->
          <div style="background-color: #ffffff; padding: 40px 30px; border-left: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hey ${userName}! 🎉</h2>
            
            <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
              Great news! Your student ID card has been verified and your Spaark account is now fully activated.
            </p>
            
            <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 25px 0;">
              You can now:
            </p>
            
            <ul style="color: #555555; font-size: 15px; line-height: 2; margin: 0 0 25px 0; padding-left: 20px;">
              <li>💕 Browse and swipe on profiles</li>
              <li>💬 Chat with your matches</li>
              <li>✨ Complete your profile to get more matches</li>
              <li>🔍 Discover people near you</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://spaarkdating.com/dashboard" 
                 style="background: linear-gradient(135deg, #dc2663, #b91c5c); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                Start Exploring 💕
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e9ecef; border-top: none; text-align: center;">
            <p style="color: #999999; font-size: 12px; margin: 0 0 15px 0;">
              © 2025 Spaark Dating. All rights reserved.<br>
              Made with ❤️ by Saurabh Sharma, Aakanksha Singh & Mandhata Singh
            </p>
          </div>
        </div>
      </body>
      </html>
    `
      : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">ID Card Verification Update</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Action required</p>
          </div>
          
          <!-- Content -->
          <div style="background-color: #ffffff; padding: 40px 30px; border-left: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName},</h2>
            
            <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
              Unfortunately, we couldn't verify your student ID card at this time.
            </p>
            
            ${rejectionReason ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600;">Reason:</p>
              <p style="color: #7f1d1d; font-size: 14px; margin: 8px 0 0 0;">${rejectionReason}</p>
            </div>
            ` : ''}
            
            <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 20px 0;">
              Don't worry! You can resubmit your ID card for verification. Please make sure:
            </p>
            
            <ul style="color: #555555; font-size: 15px; line-height: 2; margin: 0 0 25px 0; padding-left: 20px;">
              <li>📸 The image is clear and well-lit</li>
              <li>📄 All text on the ID is readable</li>
              <li>🎓 It's a valid student ID card</li>
              <li>📅 The ID hasn't expired</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://spaarkdating.com/dashboard" 
                 style="background: linear-gradient(135deg, #dc2663, #b91c5c); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                Resubmit ID Card
              </a>
            </div>
            
            <p style="color: #888888; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0; text-align: center;">
              Need help? <a href="https://spaarkdating.com/support" style="color: #dc2663;">Contact our support team</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e9ecef; border-top: none; text-align: center;">
            <p style="color: #999999; font-size: 12px; margin: 0 0 15px 0;">
              © 2025 Spaark Dating. All rights reserved.<br>
              Made with ❤️ by Saurabh Sharma, Aakanksha Singh & Mandhata Singh
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = isApproved
      ? "✅ Your Spaark Account is Now Active!"
      : "⚠️ ID Card Verification Update - Action Required";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Spaark <no-reply@spaarkdating.com>",
        to: [email],
        subject,
        html: htmlContent,
      }),
    });

    const result = await response.json();
    console.log("Resend response:", JSON.stringify(result));

    if (!response.ok) {
      console.error("Failed to send verification email:", JSON.stringify(result));
      throw new Error(result.message || "Failed to send email");
    }

    console.log(`Verification ${status} email sent successfully to:`, email);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Verification ${status} email sent successfully`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
