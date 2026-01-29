import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Download,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface UploadHistory {
  id: string;
  file_name: string;
  status: string;
  transactions_found: number;
  payments_matched: number;
  created_at: string;
  processed_at: string | null;
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

export const BankStatementProcessor = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [lastResult, setLastResult] = useState<ProcessResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const fetchUploadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_statement_uploads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUploadHistory((data as UploadHistory[]) || []);
    } catch (error: any) {
      console.error('Error fetching upload history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a CSV file',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const processStatement = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a bank statement CSV file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setIsProcessing(true);
    setLastResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Create upload record
      const { data: uploadRecord, error: insertError } = await supabase
        .from('bank_statement_uploads')
        .insert({
          uploaded_by: session.user.id,
          file_name: selectedFile.name,
          file_url: '', // We process directly, no need to store
          status: 'processing',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Read file content
      const csvContent = await selectedFile.text();

      // Call edge function
      const { data, error } = await supabase.functions.invoke('process-bank-statement', {
        body: JSON.stringify({
          csvContent,
          uploadId: uploadRecord.id,
        }),
      });

      if (error) throw error;

      setLastResult(data as ProcessResult);

      if (data.paymentsMatched > 0) {
        toast({
          title: 'Payments verified!',
          description: `Auto-verified ${data.paymentsMatched} payment(s) from ${data.transactionsFound} transactions.`,
        });
      } else {
        toast({
          title: 'Processing complete',
          description: `Found ${data.transactionsFound} transactions. No pending payments matched.`,
        });
      }

      setSelectedFile(null);
      fetchUploadHistory();

    } catch (error: any) {
      console.error('Error processing statement:', error);
      toast({
        title: 'Processing failed',
        description: error.message || 'Failed to process bank statement',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bank Statement Auto-Verification
          </CardTitle>
          <CardDescription>
            Upload bank statement CSV to automatically verify pending payments matching unique references
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              id="bankStatement"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />
            <label htmlFor="bankStatement" className="cursor-pointer">
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload bank statement</p>
                  <p className="text-xs text-muted-foreground">CSV format, max 10MB</p>
                </div>
              )}
            </label>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
            <p className="font-medium">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Users receive unique payment references (e.g., SPK7X2HABCD)</li>
              <li>They must include this reference in their UPI payment note</li>
              <li>Upload your bank statement CSV here</li>
              <li>System matches transactions by reference + amount</li>
              <li>Matching payments are auto-approved and subscriptions activated</li>
            </ul>
          </div>

          <Button 
            onClick={processStatement} 
            disabled={!selectedFile || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Process Statement
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Last Result */}
      {lastResult && (
        <Card className={lastResult.paymentsMatched > 0 ? 'border-green-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {lastResult.paymentsMatched > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              Processing Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-2xl font-bold">{lastResult.transactionsFound}</p>
                <p className="text-sm text-muted-foreground">Transactions Found</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{lastResult.paymentsMatched}</p>
                <p className="text-sm text-muted-foreground">Payments Matched</p>
              </div>
            </div>

            {lastResult.matchedPayments.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium">Verified Payments:</p>
                <div className="space-y-2">
                  {lastResult.matchedPayments.map((payment, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                      <div>
                        <code className="font-mono text-sm">{payment.reference}</code>
                        <p className="text-xs text-muted-foreground">User: {payment.userId.slice(0, 8)}...</p>
                      </div>
                      <Badge variant="default" className="bg-green-500">₹{payment.amount}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lastResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-destructive">Errors:</p>
                <div className="bg-destructive/10 p-3 rounded-lg text-sm text-destructive">
                  {lastResult.errors.map((error, idx) => (
                    <p key={idx}>{error}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Processing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : uploadHistory.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No processing history yet</p>
          ) : (
            <div className="space-y-3">
              {uploadHistory.map((upload) => (
                <div 
                  key={upload.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{upload.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(upload.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p>{upload.transactions_found} transactions</p>
                      <p className="text-green-600 font-medium">{upload.payments_matched} matched</p>
                    </div>
                    {getStatusBadge(upload.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Template */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Need a sample format?</p>
              <p className="text-sm text-muted-foreground">
                Most bank CSV exports work. Common format: Date, Description, Debit, Credit
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="data:text/csv;charset=utf-8,Date,Description,Debit,Credit,Balance%0A2024-01-15,UPI/SPK7X2HABCD/Payment,0,149,10149%0A2024-01-14,UPI/SPK8Y3ICDEF/Payment,0,249,10000"
                download="sample_bank_statement.csv"
              >
                <Download className="h-4 w-4 mr-2" />
                Sample CSV
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
