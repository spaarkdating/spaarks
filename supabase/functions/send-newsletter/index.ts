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
      return new Response(
        JSON.stringify({ message: "No emails provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Sending newsletter to ${emails.length} subscribers...`);
    console.log(`Subject: ${subject}`);
    console.log(`Emails: ${emails.join(', ')}`);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2663; text-align: center; margin-bottom: 30px;">❤️ Spaark Update</h1>
        <div style="padding: 30px; background: #fef2f2; border-radius: 10px; line-height: 1.6;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
          You're receiving this because you subscribed to Spaark updates.
        </p>
      </div>
    `;

    // Send emails using Resend HTTP API directly
    let successCount = 0;
    const errors: string[] = [];

    for (const email of emails) {
      try {
        console.log(`Sending email to: ${email}`);
        
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Spaark <onboarding@resend.dev>",
            to: [email],
            subject: subject,
            html: htmlContent,
          }),
        });

        const result = await response.json();
        console.log(`Response for ${email}:`, JSON.stringify(result));
        
        if (!response.ok) {
          console.error(`Failed to send to ${email}:`, JSON.stringify(result));
          errors.push(`${email}: ${result.message || result.name || 'Unknown error'}`);
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
      console.log(`Errors: ${errors.join(', ')}`);
    }

    return new Response(
      JSON.stringify({ 
        message: `Newsletter sent successfully to ${successCount} subscribers`,
        successCount,
        totalEmails: emails.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending newsletter:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
