import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Clock
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
    setIsSubmitting(true);

    try {
      // Create payment request - no manual entry needed
      // Auto-verification will match by payment_reference and amount
      const { error } = await supabase.from('payment_requests').insert({
        user_id: userId,
        plan_type: planId,
        amount: amount,
        upi_reference: paymentReference,
        payment_reference: paymentReference,
        admin_notes: `Awaiting auto-verification. Reference: ${paymentReference}, Amount: ₹${amount}`,
      });

      if (error) throw error;

      toast({
        title: 'Payment registered!',
        description: 'Your payment will be auto-verified within minutes once we receive it.',
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
              How Auto-Verification Works
            </h4>
            <ol className="text-sm space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">1</Badge>
                <span>Pay <strong>exact amount</strong>: ₹{amount}</span>
              </li>
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">2</Badge>
                <span>Add <strong>reference code</strong> in payment note</span>
              </li>
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">3</Badge>
                <span>Click "I've Made Payment" - we'll verify automatically!</span>
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

          {/* Confirm Payment Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirmPayment}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                I've Made the Payment
              </>
            )}
          </Button>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
            <p className="text-xs text-center text-blue-700 dark:text-blue-300">
              <strong>No manual entry needed!</strong> We auto-verify by matching the payment reference and amount from bank alerts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
