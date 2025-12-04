import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  subject: string;
  message: string;
  emails: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, message, emails }: NewsletterRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service is not configured");
    }

    if (!emails || emails.length === 0) {
      console.log("No emails provided");
      return new Response(JSON.stringify({ message: "No emails provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Sending newsletter to ${emails.length} subscribers...`);
    console.log(`Subject: ${subject}`);
    console.log(`Emails: ${emails.join(", ")}`);

    // Send emails using Resend HTTP API directly
    let successCount = 0;
    const errors: string[] = [];

    for (const email of emails) {
      try {
        console.log(`Sending email to: ${email}`);

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
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">💕 Spaark</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Find Your Perfect Match</p>
              </div>
              
              <!-- Content -->
              <div style="background-color: #ffffff; padding: 40px 30px; border-left: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
                <div style="color: #333333; font-size: 16px; line-height: 1.8;">
                  ${message.replace(/\n/g, "<br>")}
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e9ecef; border-top: none; text-align: center;">
                <p style="color: #666666; font-size: 14px; margin: 0 0 15px 0;">
                  Follow us for more updates
                </p>
                <p style="color: #999999; font-size: 12px; margin: 0 0 15px 0;">
                  © 2025 Spaark Dating. All rights reserved.
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
            subject: subject,
            html: htmlContent,
          }),
        });

        const result = await response.json();
        console.log(`Response for ${email}:`, JSON.stringify(result));

        if (!response.ok) {
          console.error(`Failed to send to ${email}:`, JSON.stringify(result));
          errors.push(`${email}: ${result.message || result.name || "Unknown error"}`);
        } else {
          successCount++;
          console.log(`Email sent successfully to: ${email}, id: ${result.id}`);
        }
      } catch (error: any) {
        console.error(`Failed to send to ${email}:`, error.message);
        errors.push(`${email}: ${error.message}`);
      }
    }

    console.log(`Newsletter sent to ${successCount}/${emails.length} subscribers`);
    if (errors.length > 0) {
      console.log(`Errors: ${errors.join(", ")}`);
    }

    return new Response(
      JSON.stringify({
        message: `Newsletter sent successfully to ${successCount} subscribers`,
        successCount,
        totalEmails: emails.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error sending newsletter:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
