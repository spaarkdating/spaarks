import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InquiryReplyRequest {
  to_email: string;
  to_name: string;
  subject: string;
  original_message: string;
  admin_reply: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-inquiry-reply function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_email, to_name, subject, original_message, admin_reply }: InquiryReplyRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    console.log("Sending reply email to:", to_email);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #e91e63 0%, #ff6b6b 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">💕 Spaark Dating Support</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 40px 30px; border-left: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
            <p style="color: #333; font-size: 18px; margin: 0 0 20px 0;">Hi ${to_name},</p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for reaching out to us. Our support team has responded to your inquiry.
            </p>
            
            <div style="background: #f5f5f5; padding: 15px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e91e63;">
              <p style="color: #666; font-size: 12px; font-weight: bold; margin: 0 0 8px 0; text-transform: uppercase;">Your Original Message:</p>
              <p style="color: #555; font-size: 14px; margin: 0; white-space: pre-wrap;">${original_message}</p>
            </div>
            
            <div style="background: #fff5f8; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fce4ec;">
              <p style="color: #e91e63; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Our Response:</p>
              <p style="color: #333; font-size: 15px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${admin_reply}</p>
            </div>
            
            <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
              If you have any further questions, feel free to reply to this email or visit our 
              <a href="https://spaarkdating.com/contact" style="color: #e91e63; text-decoration: underline;">contact page</a>.
            </p>
            
            <p style="color: #333; font-size: 15px; margin: 25px 0 0 0;">
              Best regards,<br>
              <strong>The Spaark Dating Team</strong>
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 25px; border-radius: 0 0 16px 16px; border: 1px solid #e9ecef; border-top: none; text-align: center;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              © 2025 Spaark Dating. All rights reserved.<br>
              <a href="https://spaarkdating.com" style="color: #e91e63; text-decoration: none;">spaarkdating.com</a>
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
        from: "Spaark Support <support@spaarkdating.com>",
        to: [to_email],
        reply_to: "spaarkdating@spaarkdating.com",
        subject: `Re: ${subject}`,
        html: htmlContent,
      }),
    });

    const result = await response.json();
    console.log("Resend response:", JSON.stringify(result));

    if (!response.ok) {
      console.error("Failed to send reply email:", JSON.stringify(result));
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Reply email sent successfully to:", to_email);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-inquiry-reply function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);