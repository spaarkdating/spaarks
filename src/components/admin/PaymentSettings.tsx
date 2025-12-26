import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, QrCode, Building2, Smartphone, Trash2 } from "lucide-react";

interface PaymentSettingsData {
  id: string;
  upi_id: string | null;
  upi_qr_url: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
}

export const PaymentSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState<PaymentSettingsData | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single();

      if (error) throw error;
      setSettings(data);
      if (data?.upi_qr_url) {
        setQrPreview(data.upi_qr_url);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load payment settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "QR code image should be less than 2MB",
          variant: "destructive",
        });
        return;
      }
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveQr = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("payment_settings")
        .update({
          upi_qr_url: null,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("id", settings.id);

      if (error) throw error;

      setQrPreview(null);
      setSettings({ ...settings, upi_qr_url: null });
      toast({
        title: "QR Code removed",
        description: "UPI QR code has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove QR code",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let qrUrl = settings.upi_qr_url;

      // Upload QR code if new file selected
      if (qrFile) {
        setUploading(true);
        const fileExt = qrFile.name.split(".").pop();
        const fileName = `upi-qr-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("upi-qr-codes")
          .upload(fileName, qrFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("upi-qr-codes")
          .getPublicUrl(fileName);

        qrUrl = publicUrl;
        setUploading(false);
      }

      const { error } = await supabase
        .from("payment_settings")
        .update({
          upi_id: settings.upi_id,
          upi_qr_url: qrUrl,
          bank_name: settings.bank_name,
          account_name: settings.account_name,
          account_number: settings.account_number,
          ifsc_code: settings.ifsc_code,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings({ ...settings, upi_qr_url: qrUrl });
      setQrFile(null);
      
      toast({
        title: "Settings saved",
        description: "Payment settings have been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Failed to load payment settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* UPI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              UPI Settings
            </CardTitle>
            <CardDescription>
              Configure your UPI ID and QR code for payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upi_id">UPI ID</Label>
              <Input
                id="upi_id"
                value={settings.upi_id || ""}
                onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                placeholder="yourname@upi"
              />
            </div>

            <div className="space-y-2">
              <Label>UPI QR Code</Label>
              {qrPreview ? (
                <div className="space-y-2">
                  <div className="relative w-48 h-48 border rounded-lg overflow-hidden bg-white">
                    <img
                      src={qrPreview}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Label
                      htmlFor="qr-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-sm"
                    >
                      <Upload className="h-4 w-4" />
                      Change QR
                    </Label>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveQr}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload your UPI QR code image
                  </p>
                  <Label
                    htmlFor="qr-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                  >
                    <Upload className="h-4 w-4" />
                    Upload QR Code
                  </Label>
                </div>
              )}
              <input
                id="qr-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrFileChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Bank Details
            </CardTitle>
            <CardDescription>
              Configure bank account details for direct transfers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={settings.bank_name || ""}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                placeholder="Enter bank name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">Account Holder Name</Label>
              <Input
                id="account_name"
                value={settings.account_name || ""}
                onChange={(e) => setSettings({ ...settings, account_name: e.target.value })}
                placeholder="Enter account holder name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={settings.account_number || ""}
                onChange={(e) => setSettings({ ...settings, account_number: e.target.value })}
                placeholder="Enter account number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifsc_code">IFSC Code</Label>
              <Input
                id="ifsc_code"
                value={settings.ifsc_code || ""}
                onChange={(e) => setSettings({ ...settings, ifsc_code: e.target.value })}
                placeholder="Enter IFSC code"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || uploading} className="gap-2">
          {saving || uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploading ? "Uploading..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PaymentSettings;
