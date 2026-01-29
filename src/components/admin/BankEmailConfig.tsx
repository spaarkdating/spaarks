import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Webhook,
  Clock
} from "lucide-react";

interface BankEmailConfigProps {
  onSecretsConfigured?: () => void;
}

export const BankEmailConfig = ({ onSecretsConfigured }: BankEmailConfigProps) => {
  const { toast } = useToast();
  const [webhookCopied, setWebhookCopied] = useState(false);

  // The webhook URL for email forwarding
  const webhookUrl = `https://uavcfjxqdmlzgoxjeito.supabase.co/functions/v1/fetch-bank-emails`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setWebhookCopied(true);
    toast({
      title: "Webhook URL Copied",
      description: "Paste this in your email forwarding rules",
    });
    setTimeout(() => setWebhookCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertTitle>Semi-Automatic Payment Verification</AlertTitle>
        <AlertDescription>
          Set up email forwarding from your bank alerts to automatically verify payments.
          When users pay with UPI, their SPK reference will be matched with incoming bank alerts.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Option 1: Email Forwarding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              Option 1: Email Forwarding (Recommended)
            </CardTitle>
            <CardDescription>
              Forward bank transaction alerts to our webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value={webhookUrl}
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

            <div className="space-y-3 text-sm">
              <h4 className="font-medium">Setup Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>
                  In Gmail, go to <strong>Settings → Filters</strong>
                </li>
                <li>
                  Create a filter for bank emails containing "credited" or "UPI"
                </li>
                <li>
                  Use a service like <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Zapier</a> or <a href="https://make.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Make.com</a> to forward matching emails to the webhook
                </li>
              </ol>
            </div>

            <div className="pt-2">
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                No passwords needed
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Option 2: Scheduled Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Option 2: Scheduled Statement Upload
            </CardTitle>
            <CardDescription>
              Download and upload statements periodically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <h4 className="font-medium">How it works:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Download CSV statement from net banking (daily/weekly)</li>
                <li>Upload to the Bank Statement Processor tab</li>
                <li>System auto-matches transactions with pending payments</li>
                <li>Matching payments are auto-approved</li>
              </ol>
            </div>

            <Alert variant="default" className="bg-muted">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Most Indian banks allow CSV export from their net banking portal under 
                "Account Statement" or "Transaction History".
              </AlertDescription>
            </Alert>

            <Button variant="outline" className="w-full gap-2" asChild>
              <a href="?tab=bank-statements">
                Go to Bank Statement Processor
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Supported Banks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Supported Bank Formats
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
              'Other UPI Banks'
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

      {/* How Matching Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Auto-Matching Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary mb-2">1</div>
              <h4 className="font-medium mb-1">User Pays</h4>
              <p className="text-sm text-muted-foreground">
                User pays via UPI with unique reference note (e.g., SPK7X9M2KL)
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary mb-2">2</div>
              <h4 className="font-medium mb-1">Bank Alert Received</h4>
              <p className="text-sm text-muted-foreground">
                Bank sends credit alert email containing the reference
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary mb-2">3</div>
              <h4 className="font-medium mb-1">Auto-Verified</h4>
              <p className="text-sm text-muted-foreground">
                System matches reference + amount and activates subscription
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankEmailConfig;
