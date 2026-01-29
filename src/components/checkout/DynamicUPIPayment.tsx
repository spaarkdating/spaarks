import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Smartphone, 
  Copy, 
  CheckCircle, 
  Shield, 
  Loader2, 
  RefreshCw,
  AlertCircle,
  Clock,
  CreditCard
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
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
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

  const copyToClipboard = async (text: string, type: 'upi' | 'ref' | 'amount') => {
    await navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else if (type === 'ref') {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
    toast({
      title: 'Copied!',
      description: type === 'upi' ? 'UPI ID copied' : type === 'ref' ? 'Payment reference copied' : 'Amount copied',
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

  const handleConfirmPayment = async () => {
    if (!transactionId.trim()) {
      toast({
        title: 'Transaction ID required',
        description: 'Please enter your UPI transaction ID / UTR number after making the payment.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create payment request with transaction ID for manual verification
      const { error } = await supabase.from('payment_requests').insert({
        user_id: userId,
        plan_type: planId,
        amount: amount,
        upi_reference: paymentReference,
        payment_reference: paymentReference,
        transaction_id: transactionId.trim(),
        admin_notes: `Transaction ID: ${transactionId.trim()}, Reference: ${paymentReference}, Amount: ₹${amount}`,
      });

      if (error) throw error;

      toast({
        title: 'Payment submitted!',
        description: 'Your payment will be verified by our team within 24 hours.',
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
          <CardDescription>Scan QR or use UPI ID - Payment auto-verifies!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Instructions */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-primary flex items-center gap-2">
              <Shield className="h-4 w-4" />
              How to Pay
            </h4>
            <ol className="text-sm space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">1</Badge>
                <span>Scan QR or pay to UPI ID below</span>
              </li>
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">2</Badge>
                <span>Pay <strong>exact amount</strong>: ₹{amount}</span>
              </li>
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">3</Badge>
                <span>Enter your <strong>Transaction ID / UTR</strong> below</span>
              </li>
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">4</Badge>
                <span>Click "Submit Payment" - we'll verify within 24 hours!</span>
              </li>
            </ol>
          </div>

          {/* Unique Payment Reference - CRITICAL */}
          <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 text-center space-y-2">
            <p className="text-sm font-medium text-primary">⚠️ Add this in payment note/remarks</p>
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
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Expires in <span className="font-mono font-bold">{timeLeft}</span></span>
            </div>
          </div>

          {/* Amount to Pay */}
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Pay Exactly</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">₹{amount}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(amount.toString(), 'amount')}
              >
                {copiedAmount ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
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

          {/* Transaction ID Input */}
          <div className="bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-4 space-y-3">
            <Label htmlFor="transaction-id" className="flex items-center gap-2 font-semibold text-yellow-700 dark:text-yellow-300">
              <CreditCard className="h-4 w-4" />
              Enter Transaction ID / UTR Number *
            </Label>
            <Input
              id="transaction-id"
              placeholder="e.g., 123456789012 or UPI Ref ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="font-mono text-lg"
            />
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              You'll find this in your UPI app's payment confirmation or SMS from your bank.
            </p>
          </div>

          {/* Confirm Payment Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirmPayment}
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
                Submit Payment for Verification
              </>
            )}
          </Button>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
            <p className="text-xs text-center text-blue-700 dark:text-blue-300">
              <strong>Manual verification:</strong> Our team will verify your payment within 24 hours using the transaction ID you provided.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
