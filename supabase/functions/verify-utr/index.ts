import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UTRVerificationRequest {
  utr: string;
  amount: number;
  paymentRequestId: string;
}

interface UTRVerificationResult {
  verified: boolean;
  status: "verified" | "not_found" | "amount_mismatch" | "pending" | "error" | "manual_required";
  message: string;
  bankResponse?: any;
  confidence: number;
}

// UTR format validation patterns
const UTR_PATTERNS = {
  IMPS: /^[0-9]{12}$/, // 12-digit IMPS UTR
  NEFT: /^[A-Z]{4}[A-Z0-9]{7}[0-9]{9}$/, // Bank code + reference
  UPI: /^[0-9]{12,22}$/, // UPI transaction reference
  RTGS: /^[A-Z]{4}[A-Z0-9]{7}[0-9]{9}$/, // Similar to NEFT
  GENERIC: /^[A-Za-z0-9]{8,25}$/, // Generic alphanumeric
};

const detectUTRType = (utr: string): string | null => {
  const cleanUtr = utr.trim().replace(/\s/g, "");
  
  if (UTR_PATTERNS.IMPS.test(cleanUtr)) return "IMPS";
  if (UTR_PATTERNS.NEFT.test(cleanUtr)) return "NEFT";
  if (UTR_PATTERNS.UPI.test(cleanUtr)) return "UPI";
  if (UTR_PATTERNS.RTGS.test(cleanUtr)) return "RTGS";
  if (UTR_PATTERNS.GENERIC.test(cleanUtr)) return "GENERIC";
  
  return null;
};

const validateUTRFormat = (utr: string): { valid: boolean; type: string | null; confidence: number } => {
  const type = detectUTRType(utr);
  
  if (!type) {
    return { valid: false, type: null, confidence: 0 };
  }
  
  // Higher confidence for specific formats vs generic
  const confidenceMap: Record<string, number> = {
    IMPS: 85,
    NEFT: 80,
    UPI: 90,
    RTGS: 80,
    GENERIC: 50,
  };
  
  return { valid: true, type, confidence: confidenceMap[type] || 50 };
};

// Placeholder for bank API integration
// Replace this function with actual bank API calls when available
const verifyWithBankAPI = async (
  utr: string,
  amount: number,
  utrType: string
): Promise<UTRVerificationResult> => {
  // Check if bank API credentials are configured
  const bankApiKey = Deno.env.get("BANK_API_KEY");
  const bankApiSecret = Deno.env.get("BANK_API_SECRET");
  const bankApiEndpoint = Deno.env.get("BANK_API_ENDPOINT");
  
  if (!bankApiKey || !bankApiSecret || !bankApiEndpoint) {
    // Bank API not configured - return manual verification required
    return {
      verified: false,
      status: "manual_required",
      message: "Bank API not configured. Manual verification required.",
      confidence: 0,
    };
  }
  
  try {
    // Example bank API call structure (customize based on actual API)
    const response = await fetch(`${bankApiEndpoint}/verify-transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${bankApiKey}`,
        "X-API-Secret": bankApiSecret,
      },
      body: JSON.stringify({
        utr_number: utr,
        expected_amount: amount,
        transaction_type: utrType,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Bank API error: ${response.status}`);
    }
    
    const bankData = await response.json();
    
    // Parse bank API response (customize based on actual API response format)
    if (bankData.status === "success" && bankData.verified) {
      // Check amount match
      if (bankData.amount === amount) {
        return {
          verified: true,
          status: "verified",
          message: `Transaction verified via ${utrType}. Amount: ₹${amount}`,
          bankResponse: bankData,
          confidence: 100,
        };
      } else {
        return {
          verified: false,
          status: "amount_mismatch",
          message: `Amount mismatch. Expected: ₹${amount}, Found: ₹${bankData.amount}`,
          bankResponse: bankData,
          confidence: 70,
        };
      }
    } else if (bankData.status === "pending") {
      return {
        verified: false,
        status: "pending",
        message: "Transaction is still pending at the bank",
        bankResponse: bankData,
        confidence: 60,
      };
    } else {
      return {
        verified: false,
        status: "not_found",
        message: "Transaction not found in bank records",
        bankResponse: bankData,
        confidence: 30,
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Bank API error:", error);
    return {
      verified: false,
      status: "error",
      message: `Bank API error: ${errorMessage}`,
      confidence: 0,
    };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { utr, amount, paymentRequestId } = await req.json() as UTRVerificationRequest;

    if (!utr) {
      return new Response(
        JSON.stringify({ error: "UTR number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UTR format
    const formatValidation = validateUTRFormat(utr);
    
    if (!formatValidation.valid) {
      return new Response(
        JSON.stringify({
          verified: false,
          status: "error",
          message: "Invalid UTR format. Please check the number and try again.",
          confidence: 0,
          formatValid: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Attempt bank API verification
    const verificationResult = await verifyWithBankAPI(utr, amount, formatValidation.type!);
    
    // If bank API is not available, use format-based confidence
    if (verificationResult.status === "manual_required") {
      verificationResult.confidence = formatValidation.confidence;
      verificationResult.message = `UTR format valid (${formatValidation.type}). Bank API not configured - manual verification recommended.`;
    }

    // Log verification attempt
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (paymentRequestId) {
      // Update payment request with verification result
      await supabase
        .from("payment_requests")
        .update({
          admin_notes: `UTR Verification: ${verificationResult.status} (${verificationResult.confidence}% confidence) - ${verificationResult.message}`,
        })
        .eq("id", paymentRequestId);
    }

    return new Response(
      JSON.stringify({
        ...verificationResult,
        utrType: formatValidation.type,
        formatValid: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("UTR verification error:", error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        verified: false,
        status: "error",
        confidence: 0,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
