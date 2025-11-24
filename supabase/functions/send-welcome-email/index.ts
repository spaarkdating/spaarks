import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
    
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw new Error("Gmail credentials are not configured");
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Sending welcome email to:", email);

    // Create Gmail SMTP client
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: GMAIL_USER,
      password: GMAIL_APP_PASSWORD,
    });

    // Send welcome email using Gmail SMTP
    await client.send({
      from: GMAIL_USER,
      to: email,
      subject: "Welcome to Spaark! 💖",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2663; font-size: 36px; margin: 0;">❤️ Spaark</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fff 100%); padding: 30px; border-radius: 15px; margin-bottom: 30px;">
            <h2 style="color: #dc2663; margin-top: 0;">Welcome to Spaark!</h2>
            <p style="color: #333; line-height: 1.8; font-size: 16px;">
              Thank you for subscribing to our newsletter! 🎉
            </p>
            <p style="color: #333; line-height: 1.8; font-size: 16px;">
              You'll now receive exclusive updates about:
            </p>
            <ul style="color: #555; line-height: 2; font-size: 15px;">
              <li>New features and improvements</li>
              <li>Dating tips and advice from experts</li>
              <li>Success stories from real couples</li>
              <li>Special promotions and offers</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cd7111eb-2755-4ab1-a11a-cbd30c682682.lovableproject.com" 
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

          <div style="border-top: 1px solid #e5e5e5; margin-top: 30px; padding-top: 20px;">
            <p style="text-align: center; color: #999; font-size: 13px; line-height: 1.6;">
              You're receiving this email because you subscribed to updates from Spaark.<br>
              If you no longer wish to receive these emails, you can unsubscribe at any time.
            </p>
            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 15px;">
              © 2024 Spaark. All rights reserved.<br>
              Made with ❤️ by Sourabh Sharma, Aakanksha Singh & Mandhata Singh
            </p>
          </div>
        </div>
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2663; font-size: 36px; margin: 0;">❤️ Spaark</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fff 100%); padding: 30px; border-radius: 15px; margin-bottom: 30px;">
            <h2 style="color: #dc2663; margin-top: 0;">Welcome to Spaark!</h2>
            <p style="color: #333; line-height: 1.8; font-size: 16px;">
              Thank you for subscribing to our newsletter! 🎉
            </p>
            <p style="color: #333; line-height: 1.8; font-size: 16px;">
              You'll now receive exclusive updates about:
            </p>
            <ul style="color: #555; line-height: 2; font-size: 15px;">
              <li>New features and improvements</li>
              <li>Dating tips and advice from experts</li>
              <li>Success stories from real couples</li>
              <li>Special promotions and offers</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cd7111eb-2755-4ab1-a11a-cbd30c682682.lovableproject.com" 
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

          <div style="border-top: 1px solid #e5e5e5; margin-top: 30px; padding-top: 20px;">
            <p style="text-align: center; color: #999; font-size: 13px; line-height: 1.6;">
              You're receiving this email because you subscribed to updates from Spaark.<br>
              If you no longer wish to receive these emails, you can unsubscribe at any time.
            </p>
            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 15px;">
              © 2024 Spaark. All rights reserved.<br>
              Made with ❤️ by Sourabh Sharma, Aakanksha Singh & Mandhata Singh
            </p>
          </div>
        </div>
      `,
    });

    await client.close();

    console.log("Welcome email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Welcome email sent successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
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
