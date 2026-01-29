import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Smartphone, 
  Copy, 
  CheckCircle, 
  Shield, 
  Loader2, 
  Upload, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface DynamicUPIPaymentProps {
  amount: number;
  planId: string;
  userId: string;
  onPaymentSubmitted: () => void;
  paymentSettings: {
    upi_id: string | null;
    upi_qr_url: string | null;
  } | null;
}

// Generate a unique payment reference
const generatePaymentReference = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const timestamp = Date.now().toString(36).toUpperCase();
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SPK${timestamp.slice(-4)}${random}`;
};

export const DynamicUPIPayment = ({ 
  amount, 
  planId, 
  userId, 
  onPaymentSubmitted,
  paymentSettings 
}: DynamicUPIPaymentProps) => {
  const { toast } = useToast();
  const [paymentReference, setPaymentReference] = useState(() => generatePaymentReference());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date>(() => new Date(Date.now() + 15 * 60 * 1000));
  const [timeLeft, setTimeLeft] = useState('15:00');

  // Countdown timer for payment reference
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        // Generate new reference when expired
        setPaymentReference(generatePaymentReference());
        setExpiresAt(new Date(Date.now() + 15 * 60 * 1000));
        toast({
          title: 'Reference refreshed',
          description: 'A new payment reference has been generated.',
        });
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, toast]);

  // Generate UPI deep link with payment reference as note
  const upiLink = useMemo(() => {
    if (!paymentSettings?.upi_id) return null;
    
    const params = new URLSearchParams({
      pa: paymentSettings.upi_id,
      pn: 'Spaark',
      am: amount.toString(),
      cu: 'INR',
      tn: paymentReference, // This is the unique note for tracking
    });
    
    return `upi://pay?${params.toString()}`;
  }, [paymentSettings?.upi_id, amount, paymentReference]);

  // Generate QR code URL using a free QR API
  const dynamicQrUrl = useMemo(() => {
    if (!upiLink) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
  }, [upiLink]);

  const copyToClipboard = async (text: string, type: 'upi' | 'ref') => {
    await navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
    toast({
      title: 'Copied!',
      description: type === 'upi' ? 'UPI ID copied' : 'Payment reference copied',
    });
  };

  const refreshReference = () => {
    setPaymentReference(generatePaymentReference());
    setExpiresAt(new Date(Date.now() + 15 * 60 * 1000));
    toast({
      title: 'New reference generated',
      description: 'Use this new reference in your UPI payment note.',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setPaymentProof(file);
    }
  };

  const handleSubmitPayment = async () => {
    if (!transactionId.trim()) {
      toast({
        title: 'Transaction ID required',
        description: 'Please enter your UPI transaction ID / UTR number.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let proofUrl = null;

      // Upload payment proof if provided
      if (paymentProof) {
        const fileExt = paymentProof.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProof);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName);

        proofUrl = publicUrl;
      }

      // Create payment request with unique reference
      const { error } = await supabase.from('payment_requests').insert({
        user_id: userId,
        plan_type: planId,
        amount: amount,
        payment_proof_url: proofUrl,
        transaction_id: transactionId.trim(),
        upi_reference: paymentReference, // Store our unique reference
        payment_reference: paymentReference, // Also in dedicated column
      });

      if (error) throw error;

      toast({
        title: 'Payment submitted!',
        description: 'We\'ll verify your payment automatically within minutes.',
      });

      onPaymentSubmitted();
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!paymentSettings?.upi_id) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <p className="text-muted-foreground">Payment settings not configured. Please contact support.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-primary" />
            Pay ₹{amount} via UPI
          </CardTitle>
          <CardDescription>Scan QR or use UPI ID - Include the reference in payment note</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Unique Payment Reference - CRITICAL */}
          <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 text-center space-y-2">
            <p className="text-sm font-medium text-primary">⚠️ IMPORTANT: Add this in payment note</p>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-background px-4 py-2 rounded-lg text-xl font-mono font-bold tracking-wider">
                {paymentReference}
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(paymentReference, 'ref')}
              >
                {copiedRef ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refreshReference}
                title="Generate new reference"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Reference expires in <span className="font-mono font-bold">{timeLeft}</span>
            </p>
          </div>

          {/* Dynamic QR Code */}
          <div className="flex justify-center">
            <div className="w-52 h-52 border rounded-lg overflow-hidden bg-white p-2">
              {dynamicQrUrl ? (
                <img
                  src={dynamicQrUrl}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* UPI ID */}
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">Or use UPI ID</p>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-background px-3 py-2 rounded text-lg font-mono">
                {paymentSettings.upi_id}
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(paymentSettings.upi_id!, 'upi')}
              >
                {copiedUpi ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-lg font-bold text-primary mt-2">Amount: ₹{amount}</p>
          </div>

          {/* Open UPI App Button (Mobile) */}
          {upiLink && (
            <Button 
              variant="outline" 
              className="w-full" 
              asChild
            >
              <a href={upiLink}>
                <Smartphone className="h-4 w-4 mr-2" />
                Open UPI App
              </a>
            </Button>
          )}

          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Auto-verification enabled</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              Payments with correct reference note are verified automatically from bank statements
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Payment Proof */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-primary" />
            Confirm Payment
          </CardTitle>
          <CardDescription>After payment, enter transaction details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID / UTR Number *</Label>
            <Input
              id="transactionId"
              placeholder="Enter your UPI transaction ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentProof">Payment Screenshot (Optional but helps)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <input
                type="file"
                id="paymentProof"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="paymentProof" className="cursor-pointer">
                {paymentProof ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>{paymentProof.name}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmitPayment}
            disabled={isSubmitting || !transactionId.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit for Auto-Verification
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Payments are auto-verified when we process bank statements
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
