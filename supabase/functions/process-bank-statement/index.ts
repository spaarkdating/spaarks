import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reference?: string;
}

interface ProcessResult {
  success: boolean;
  transactionsFound: number;
  paymentsMatched: number;
  matchedPayments: Array<{
    paymentId: string;
    userId: string;
    amount: number;
    reference: string;
  }>;
  errors: string[];
}

// Parse CSV bank statement (common format)
function parseCSVStatement(content: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header row(s)
  let dataStartIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('date') && (lower.includes('amount') || lower.includes('credit') || lower.includes('debit'))) {
      dataStartIndex = i + 1;
      break;
    }
  }

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Split by comma, handling quoted fields
    const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    if (parts.length < 3) continue;

    // Try to parse transaction - format varies by bank
    // Common formats: Date, Description, Debit, Credit, Balance
    // or: Date, Description, Amount, Type
    
    const cleanPart = (p: string | undefined): string => p?.replace(/^"|"$/g, '').trim() || '';
    
    const date = cleanPart(parts[0]);
    const description = cleanPart(parts[1]);
    let amount = 0;
    let type: 'credit' | 'debit' = 'credit';

    // Try different column configurations
    if (parts.length >= 4) {
      // Format: Date, Description, Debit, Credit
      const debit = parseFloat(cleanPart(parts[2]).replace(/[^0-9.-]/g, '')) || 0;
      const credit = parseFloat(cleanPart(parts[3]).replace(/[^0-9.-]/g, '')) || 0;
      
      if (credit > 0) {
        amount = credit;
        type = 'credit';
      } else if (debit > 0) {
        amount = debit;
        type = 'debit';
      }
    } else if (parts.length >= 3) {
      // Format: Date, Description, Amount (positive = credit, negative = debit)
      const amtStr = cleanPart(parts[2]).replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(amtStr) || 0;
      amount = Math.abs(parsed);
      type = parsed >= 0 ? 'credit' : 'debit';
    }

    if (amount > 0) {
      transactions.push({
        date,
        description,
        amount,
        type,
        reference: extractReference(description),
      });
    }
  }

  return transactions;
}

// Extract Spaark payment reference from description
function extractReference(description: string): string | undefined {
  // Look for SPK followed by alphanumeric chars (our payment reference format)
  const match = description.match(/SPK[A-Z0-9]{8}/i);
  return match ? match[0].toUpperCase() : undefined;
}

// Match transactions with pending payments
async function matchPayments(
  supabase: any,
  transactions: Transaction[]
): Promise<{ matched: Array<any>; errors: string[] }> {
  const matched: Array<any> = [];
  const errors: string[] = [];

  // Get all pending payment requests
  const { data: pendingPayments, error: fetchError } = await supabase
    .from('payment_requests')
    .select('id, user_id, amount, payment_reference, plan_type')
    .eq('status', 'pending')
    .not('payment_reference', 'is', null);

  if (fetchError) {
    errors.push(`Failed to fetch pending payments: ${fetchError.message}`);
    return { matched, errors };
  }

  console.log(`Found ${pendingPayments?.length || 0} pending payments with references`);
  console.log(`Processing ${transactions.length} transactions`);

  // Only consider credit transactions
  const creditTransactions = transactions.filter(t => t.type === 'credit' && t.reference);
  console.log(`Found ${creditTransactions.length} credit transactions with references`);

  for (const payment of pendingPayments || []) {
    // Find matching transaction by reference and amount
    const matchingTx = creditTransactions.find(tx => 
      tx.reference === payment.payment_reference &&
      Math.abs(tx.amount - payment.amount) < 1 // Allow ₹1 tolerance for rounding
    );

    if (matchingTx) {
      console.log(`Match found: ${payment.payment_reference} - ₹${payment.amount}`);
      
      try {
        // Update payment request status to approved
        const { error: updateError } = await supabase
          .from('payment_requests')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            admin_notes: `Auto-verified from bank statement. Transaction: ${matchingTx.description}`,
          })
          .eq('id', payment.id);

        if (updateError) {
          errors.push(`Failed to update payment ${payment.id}: ${updateError.message}`);
          continue;
        }

        // Activate user subscription
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        const { error: subError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: payment.user_id,
            plan: payment.plan_type,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (subError) {
          errors.push(`Failed to activate subscription for ${payment.user_id}: ${subError.message}`);
        }

        // Record payment
        await supabase.from('payments').insert({
          user_id: payment.user_id,
          amount: payment.amount,
          currency: 'INR',
          status: 'completed',
          transaction_type: 'subscription',
          payment_method: 'upi',
          description: `${payment.plan_type} plan subscription - Auto-verified`,
        });

        // Create notification
        await supabase.from('notifications').insert({
          user_id: payment.user_id,
          type: 'subscription',
          title: 'Payment Verified!',
          message: `Your payment of ₹${payment.amount} has been verified. Your ${payment.plan_type} plan is now active!`,
        });

        matched.push({
          paymentId: payment.id,
          userId: payment.user_id,
          amount: payment.amount,
          reference: payment.payment_reference,
        });

      } catch (e: any) {
        errors.push(`Error processing payment ${payment.id}: ${e.message}`);
      }
    }
  }

  return { matched, errors };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is super admin
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (!adminData) {
      return new Response(
        JSON.stringify({ error: 'Super admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let csvContent = '';
    let uploadId = '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get('file') as File;
      uploadId = formData.get('uploadId') as string || '';
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file uploaded' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      csvContent = await file.text();
    } else {
      // Handle JSON with CSV content
      const body = await req.json();
      csvContent = body.csvContent;
      uploadId = body.uploadId || '';
    }

    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'No CSV content provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing bank statement...');
    
    // Parse transactions
    const transactions = parseCSVStatement(csvContent);
    console.log(`Parsed ${transactions.length} transactions`);

    // Match with pending payments
    const { matched, errors } = await matchPayments(supabase, transactions);

    // Update upload record if provided
    if (uploadId) {
      await supabase
        .from('bank_statement_uploads')
        .update({
          status: 'completed',
          transactions_found: transactions.length,
          payments_matched: matched.length,
          processed_at: new Date().toISOString(),
        })
        .eq('id', uploadId);
    }

    const result: ProcessResult = {
      success: true,
      transactionsFound: transactions.length,
      paymentsMatched: matched.length,
      matchedPayments: matched,
      errors,
    };

    console.log(`Processing complete. Matched ${matched.length} payments.`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing bank statement:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
