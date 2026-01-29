import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Shield, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Webhook,
  Loader2,
  Save,
  PlayCircle,
  Zap,
  RefreshCw,
  AlertCircle
} from "lucide-react";

export const BankEmailConfig = () => {
  const { toast } = useToast();
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [simulatingPayment, setSimulatingPayment] = useState<string | null>(null);

  // The webhook URL for receiving bank alerts
  const incomingWebhookUrl = `https://uavcfjxqdmlzgoxjeito.supabase.co/functions/v1/fetch-bank-emails`;

  useEffect(() => {
    loadSettings();
    loadPendingPayments();
  }, []);

  const loadSettings = async () => {
    try {
      const savedWebhook = localStorage.getItem("zapier_bank_webhook");
      if (savedWebhook) {
        setZapierWebhookUrl(savedWebhook);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*, profiles(display_name, email)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingPayments(data || []);
    } catch (error) {
      console.error("Error loading pending payments:", error);
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(incomingWebhookUrl);
    setWebhookCopied(true);
    toast({
      title: "Webhook URL Copied",
      description: "Use this URL in your Zapier 'Webhooks by Zapier' action",
    });
    setTimeout(() => setWebhookCopied(false), 2000);
  };

  const saveZapierWebhook = async () => {
    setSaving(true);
    try {
      localStorage.setItem("zapier_bank_webhook", zapierWebhookUrl);
      toast({
        title: "Webhook Saved",
        description: "Your Zapier webhook URL has been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save webhook",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testZapierWebhook = async () => {
    if (!zapierWebhookUrl) {
      toast({
        title: "Error",
        description: "Please enter your Zapier webhook URL first",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      await fetch(zapierWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          message: "Test connection from Spaark Admin Panel",
          source: "spaark-payment-verification",
        }),
      });
      toast({
        title: "Test Request Sent",
        description: "Check your Zapier dashboard to confirm the webhook was triggered",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to trigger webhook. Check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  // Simulate receiving a bank payment (auto-approve)
  const simulatePaymentReceived = async (payment: any) => {
    setSimulatingPayment(payment.id);
    try {
      // Call the webhook with the payment details
      const response = await fetch(incomingWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payment.amount,
          description: `UPI payment received SPK${payment.payment_reference?.replace('SPK', '') || ''} credited to account`,
        }),
      });

      const result = await response.json();
      
      if (result.matched) {
        toast({
          title: "Payment Auto-Verified! ✅",
          description: `Payment of ₹${payment.amount} has been auto-approved and subscription activated.`,
        });
        loadPendingPayments();
      } else {
        toast({
          title: "Payment Not Matched",
          description: "The payment reference didn't match. Check the SPK code.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to simulate payment",
        variant: "destructive",
      });
    } finally {
      setSimulatingPayment(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Auto-Approve Section */}
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            Quick Auto-Verify Pending Payments
          </CardTitle>
          <CardDescription>
            Simulate bank payment received to auto-approve pending payments instantly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {pendingPayments.length} pending payment{pendingPayments.length !== 1 ? 's' : ''}
            </span>
            <Button variant="outline" size="sm" onClick={loadPendingPayments} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {pendingPayments.length === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>No pending payments to verify!</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background border"
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      {(payment.profiles as any)?.display_name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ₹{payment.amount} • {payment.plan_type} plan
                    </div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {payment.payment_reference || 'No reference'}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => simulatePaymentReceived(payment)}
                    disabled={simulatingPayment === payment.id}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {simulatingPayment === payment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Auto-Verify
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
              <strong>Use this when:</strong> You've received the bank credit alert and confirmed the payment. 
              Clicking "Auto-Verify" simulates the bank webhook and activates the user's subscription.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Overview */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertTitle>Full Automation with Zapier/Make.com</AlertTitle>
        <AlertDescription>
          For fully hands-free automation, connect your bank email alerts to Zapier or Make.com.
          When users pay with the unique SPK reference, their payment is auto-verified without any admin action.
        </AlertDescription>
      </Alert>

      {/* Step 1: Create Zapier Zap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
            Create a Zapier Zap
          </CardTitle>
          <CardDescription>Set up email forwarding in Zapier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>Go to <a href="https://zapier.com/app/zaps/create" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Zapier</a> and create a new Zap</li>
              <li><strong>Trigger:</strong> Choose "Gmail" → "New Email Matching Search"</li>
              <li><strong>Search Query:</strong> <code className="bg-muted px-2 py-1 rounded text-xs">from:alerts@hdfcbank.com OR from:alerts@icicibank.com "credited" "SPK"</code></li>
              <li><strong>Action:</strong> Choose "Webhooks by Zapier" → "POST"</li>
              <li><strong>URL:</strong> Paste the webhook URL below</li>
              <li><strong>Payload Type:</strong> JSON</li>
              <li><strong>Data:</strong> Map <code className="bg-muted px-1 rounded">emailContent</code> to the email body</li>
            </ol>
          </div>

          <div className="space-y-2 pt-2">
            <Label>Spaark Webhook URL</Label>
            <div className="flex gap-2">
              <Input value={incomingWebhookUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyWebhook}>
                {webhookCopied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative: Make.com Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Alternative: Make.com Setup
          </CardTitle>
          <CardDescription>Prefer Make.com over Zapier? Follow these steps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>Go to <a href="https://www.make.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Make.com</a> and create a new Scenario</li>
              <li><strong>Trigger:</strong> Add "Gmail" → "Watch Emails"</li>
              <li><strong>Filter:</strong> From bank email, Subject contains "credited"</li>
              <li><strong>Action:</strong> Add "HTTP" → "Make a request" → POST to webhook URL</li>
              <li><strong>Body:</strong>
                <pre className="bg-muted p-2 rounded text-xs mt-1">{`{"emailContent": "{{1.text}}"}`}</pre>
              </li>
            </ol>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open("https://www.make.com", "_blank")} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Open Make.com
          </Button>
        </CardContent>
      </Card>

      {/* Optional: Notification Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
            Optional: Notification Webhook
          </CardTitle>
          <CardDescription>Get notified when payments are verified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Your Zapier Webhook URL (for notifications)</Label>
            <Input
              value={zapierWebhookUrl}
              onChange={(e) => setZapierWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className="font-mono text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveZapierWebhook} disabled={saving || !zapierWebhookUrl} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
            <Button variant="outline" onClick={testZapierWebhook} disabled={testing || !zapierWebhookUrl} className="gap-2">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Auto-Verification Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { step: "1", title: "User Pays", desc: "Pays via UPI with note: SPK7X9M2KL" },
              { step: "2", title: "Bank Alert", desc: "Bank emails credit alert" },
              { step: "3", title: "Webhook", desc: "Zapier/Make.com forwards to Spaark" },
              { step: "4", title: "Verified!", desc: "Payment approved, subscription active" },
            ].map((item) => (
              <div key={item.step} className="text-center p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold text-primary mb-2">{item.step}</div>
                <h4 className="font-medium mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Supported Banks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Supported Banks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'IDFC First', 'Yes Bank', 'Any UPI Bank'].map((bank) => (
              <div key={bank} className="flex items-center gap-2 p-2 rounded-md bg-muted">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">{bank}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankEmailConfig;
