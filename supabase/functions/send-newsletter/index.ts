import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
    
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw new Error("Gmail credentials are not configured");
    }

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No emails provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Gmail SMTP client
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: GMAIL_USER,
      password: GMAIL_APP_PASSWORD,
    });

    // Send emails using Gmail SMTP
    const emailPromises = emails.map(async (email) => {
      try {
        await client.send({
          from: GMAIL_USER,
          to: email,
          subject: subject,
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #dc2663; text-align: center; margin-bottom: 30px;">❤️ Spaark Update</h1>
              <div style="padding: 30px; background: #fef2f2; border-radius: 10px; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
                You're receiving this because you subscribed to Spaark updates.
              </p>
            </div>
          `,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #dc2663; text-align: center; margin-bottom: 30px;">❤️ Spaark Update</h1>
              <div style="padding: 30px; background: #fef2f2; border-radius: 10px; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
                You're receiving this because you subscribed to Spaark updates.
              </p>
            </div>
          `,
        });
        return { status: 'fulfilled' };
      } catch (error) {
        console.error(`Failed to send to ${email}:`, error);
        return { status: 'rejected', error };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === "fulfilled").length;

    await client.close();

    console.log(`Newsletter sent to ${successCount}/${emails.length} subscribers`);

    return new Response(
      JSON.stringify({ 
        message: `Newsletter sent successfully to ${successCount} subscribers` 
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
