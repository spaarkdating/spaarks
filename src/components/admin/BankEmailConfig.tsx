import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Webhook,
  Clock,
  Loader2,
  Save,
  PlayCircle,
  Zap
} from "lucide-react";

export const BankEmailConfig = () => {
  const { toast } = useToast();
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  // The webhook URL for receiving bank alerts
  const incomingWebhookUrl = `https://uavcfjxqdmlzgoxjeito.supabase.co/functions/v1/fetch-bank-emails`;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single();

      if (error) throw error;
      
      // Check if there's a zapier_webhook_url in the data (we'll store it as a JSON field or add column)
      // For now, we'll use localStorage as a quick solution
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
      // Save to localStorage for now (can be moved to DB later)
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
        headers: {
          "Content-Type": "application/json",
        },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertTitle>Zapier Email Forwarding Setup</AlertTitle>
        <AlertDescription>
          Connect your bank email alerts to Zapier, which will forward credit notifications to Spaark.
          When users pay with the unique SPK reference, their payment is auto-verified.
        </AlertDescription>
      </Alert>

      {/* Step 1: Create Zapier Zap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
            Create a Zapier Zap
          </CardTitle>
          <CardDescription>
            Set up email forwarding in Zapier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>
                Go to <a href="https://zapier.com/app/zaps/create" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Zapier</a> and create a new Zap
              </li>
              <li>
                <strong>Trigger:</strong> Choose "Gmail" (or your email provider) → "New Email Matching Search"
              </li>
              <li>
                <strong>Search Query:</strong> Use: <code className="bg-muted px-2 py-1 rounded text-xs">from:alerts@hdfcbank.com OR from:alerts@icicibank.com "credited"</code>
              </li>
              <li>
                <strong>Action:</strong> Choose "Webhooks by Zapier" → "POST"
              </li>
              <li>
                <strong>URL:</strong> Paste the Spaark webhook URL below
              </li>
              <li>
                <strong>Payload Type:</strong> JSON
              </li>
              <li>
                <strong>Data:</strong> Map <code className="bg-muted px-1 rounded">emailContent</code> to the email body
              </li>
            </ol>
          </div>

          <div className="space-y-2 pt-2">
            <Label>Spaark Webhook URL (paste in Zapier)</Label>
            <div className="flex gap-2">
              <Input
                value={incomingWebhookUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyWebhook}
              >
                {webhookCopied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative: Make.com Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-sm font-bold">
              <Webhook className="h-3 w-3" />
            </div>
            Alternative: Make.com Setup
          </CardTitle>
          <CardDescription>
            Prefer Make.com over Zapier? Follow these steps instead
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>
                Go to <a href="https://www.make.com/en/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Make.com</a> and create a new Scenario
              </li>
              <li>
                <strong>Trigger Module:</strong> Add "Gmail" → "Watch Emails" (or your email provider)
              </li>
              <li>
                <strong>Filter:</strong> Set criteria:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>From: <code className="bg-muted px-1 rounded text-xs">alerts@hdfcbank.com</code> (or your bank)</li>
                  <li>Subject contains: <code className="bg-muted px-1 rounded text-xs">credited</code></li>
                </ul>
              </li>
              <li>
                <strong>Action Module:</strong> Add "HTTP" → "Make a request"
              </li>
              <li>
                <strong>URL:</strong> Paste the Spaark webhook URL (same as Zapier)
              </li>
              <li>
                <strong>Method:</strong> POST
              </li>
              <li>
                <strong>Body type:</strong> Raw → JSON
              </li>
              <li>
                <strong>Request content:</strong>
                <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
{`{
  "emailContent": "{{1.text}}",
  "subject": "{{1.subject}}",
  "from": "{{1.from.address}}"
}`}
                </pre>
              </li>
              <li>
                <strong>Headers:</strong> Add <code className="bg-muted px-1 rounded text-xs">Content-Type: application/json</code>
              </li>
            </ol>
          </div>

          <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Mail className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              <strong>Make.com Advantage:</strong> More generous free tier (1,000 operations/month) and visual scenario builder makes debugging easier.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://www.make.com/en/help/tutorials/getting-started-with-make", "_blank")}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Make.com Docs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Configure Zapier Webhook (Optional - for notifications) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
            Optional: Notification Webhook
          </CardTitle>
          <CardDescription>
            Get notified in Zapier when payments are verified (for Slack/Discord/Email alerts)
          </CardDescription>
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
            <p className="text-xs text-muted-foreground">
              Create a separate Zap with "Webhooks by Zapier" trigger to receive payment verification notifications
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={saveZapierWebhook}
              disabled={saving || !zapierWebhookUrl}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Webhook
            </Button>
            <Button
              variant="outline"
              onClick={testZapierWebhook}
              disabled={testing || !zapierWebhookUrl}
              className="gap-2"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              Test Webhook
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Search Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Bank Email Filters
          </CardTitle>
          <CardDescription>
            Use these search queries in Gmail/Zapier to filter bank transaction emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            {[
              { bank: "HDFC Bank", query: 'from:alerts@hdfcbank.com "credited"' },
              { bank: "ICICI Bank", query: 'from:alerts@icicibank.com "credited"' },
              { bank: "SBI", query: 'from:*@sbi.co.in "credited"' },
              { bank: "Axis Bank", query: 'from:alerts@axisbank.com "credited"' },
              { bank: "Kotak", query: 'from:*@kotak.com "credited"' },
              { bank: "All Banks (UPI)", query: '"UPI" "credited" "SPK"' },
            ].map((item) => (
              <div key={item.bank} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="font-medium text-sm">{item.bank}</span>
                <code className="text-xs bg-background px-2 py-1 rounded">{item.query}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Auto-Verification Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary mb-2">1</div>
              <h4 className="font-medium mb-1">User Pays</h4>
              <p className="text-xs text-muted-foreground">
                Pays via UPI with note: SPK7X9M2KL
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary mb-2">2</div>
              <h4 className="font-medium mb-1">Bank Alert</h4>
              <p className="text-xs text-muted-foreground">
                Bank emails credit alert to your inbox
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary mb-2">3</div>
              <h4 className="font-medium mb-1">Zapier Forwards</h4>
              <p className="text-xs text-muted-foreground">
                Zap sends email content to Spaark webhook
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary mb-2">4</div>
              <h4 className="font-medium mb-1">Auto-Verified</h4>
              <p className="text-xs text-muted-foreground">
                Payment approved, subscription activated!
              </p>
            </div>
          </div>

          <Alert variant="default" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              <strong>Tip:</strong> The SPK reference in the payment note is automatically matched with pending payments. 
              Users must include this exact note when paying!
            </AlertDescription>
          </Alert>
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
            {[
              'HDFC Bank',
              'ICICI Bank',
              'State Bank of India',
              'Axis Bank',
              'Kotak Mahindra',
              'IDFC First',
              'Yes Bank',
              'Any UPI Bank'
            ].map((bank) => (
              <div
                key={bank}
                className="flex items-center gap-2 p-2 rounded-md bg-muted"
              >
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
