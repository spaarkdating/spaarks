import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "https://esm.sh/nodemailer@6.9.10";

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
    const TITAN_EMAIL_USER = Deno.env.get("TITAN_EMAIL_USER");
    const TITAN_EMAIL_PASSWORD = Deno.env.get("TITAN_EMAIL_PASSWORD");
    
    if (!TITAN_EMAIL_USER || !TITAN_EMAIL_PASSWORD) {
      console.error("Titan email credentials are not configured");
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
    console.log(`Titan user: ${TITAN_EMAIL_USER}`);

    // Create Titan SMTP transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.titan.email",
      port: 465,
      secure: true,
      auth: {
        user: TITAN_EMAIL_USER,
        pass: TITAN_EMAIL_PASSWORD,
      },
    });

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

    // Send emails
    let successCount = 0;
    const errors: string[] = [];

    for (const email of emails) {
      try {
        console.log(`Sending email to: ${email}`);
        
        const info = await transporter.sendMail({
          from: `"Spaark" <${TITAN_EMAIL_USER}>`,
          to: email,
          subject: subject,
          html: htmlContent,
        });
        
        successCount++;
        console.log(`Email sent successfully to: ${email}, messageId: ${info.messageId}`);
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
