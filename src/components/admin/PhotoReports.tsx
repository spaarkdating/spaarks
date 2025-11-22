import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

interface PhotoReportsProps {
  adminRole: "admin" | "moderator";
}

const PhotoReports = ({ adminRole }: PhotoReportsProps) => {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  const fetchReports = async () => {
    const { data } = await (supabase as any)
      .from("photo_reports")
      .select(`
        *,
        reporter:profiles!photo_reports_reporter_id_fkey(display_name, email),
        reported_user:profiles!photo_reports_reported_user_id_fkey(display_name, email),
        photo:photos(photo_url)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setReports(data);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleApproveReport = async (reportId: string, photoId: string) => {
    const { error: deletePhotoError } = await supabase
      .from("photos")
      .delete()
      .eq("id", photoId);

    if (deletePhotoError) {
      toast({
        title: "Error",
        description: deletePhotoError.message,
        variant: "destructive",
      });
      return;
    }

    const { error: updateError } = await (supabase as any)
      .from("photo_reports")
      .update({
        status: "approved",
        resolved_at: new Date().toISOString(),
        admin_notes: adminNotes,
      })
      .eq("id", reportId);

    if (updateError) {
      toast({
        title: "Error",
        description: updateError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Report approved",
        description: "Photo has been removed and report marked as approved.",
      });
      setSelectedReport(null);
      setAdminNotes("");
      fetchReports();
    }
  };

  const handleRejectReport = async (reportId: string) => {
    const { error } = await (supabase as any)
      .from("photo_reports")
      .update({
        status: "rejected",
        resolved_at: new Date().toISOString(),
        admin_notes: adminNotes,
      })
      .eq("id", reportId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Report rejected",
        description: "Report has been marked as rejected.",
      });
      setSelectedReport(null);
      setAdminNotes("");
      fetchReports();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "approved":
        return "destructive";
      case "rejected":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Photo Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No photo reports</p>
            </div>
          ) : (
            reports.map((report) => (
              <Card
                key={report.id}
                className={`cursor-pointer transition-colors ${
                  selectedReport?.id === report.id ? "border-primary" : ""
                }`}
                onClick={() => {
                  setSelectedReport(report);
                  setAdminNotes(report.admin_notes || "");
                }}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={report.photo?.photo_url}
                      alt="Reported"
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">
                            Reported: {report.reported_user?.display_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            By: {report.reporter?.display_name}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold">{report.reason}</p>
                      {report.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {report.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {selectedReport && (
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <img
                src={selectedReport.photo?.photo_url}
                alt="Reported"
                className="w-full max-h-96 object-contain rounded mb-4"
              />
              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="font-semibold">Reported User:</span>{" "}
                  {selectedReport.reported_user?.display_name || "Unknown"}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Reporter:</span>{" "}
                  {selectedReport.reporter?.display_name || "Unknown"}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Reason:</span> {selectedReport.reason}
                </p>
                {selectedReport.description && (
                  <p className="text-sm">
                    <span className="font-semibold">Description:</span> {selectedReport.description}
                  </p>
                )}
                <Badge variant={getStatusColor(selectedReport.status)}>
                  {selectedReport.status}
                </Badge>
              </div>
            </div>

            {selectedReport.status === "pending" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    rows={4}
                    disabled={adminRole === "moderator"}
                  />
                </div>

                {adminRole === "moderator" && (
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>View Only:</strong> Moderators can view reports but cannot take action. Contact a full admin to approve or reject.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApproveReport(selectedReport.id, selectedReport.photo_id)}
                    className="flex-1 bg-destructive hover:bg-destructive/90"
                    disabled={adminRole === "moderator"}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Remove Photo
                  </Button>
                  <Button
                    onClick={() => handleRejectReport(selectedReport.id)}
                    variant="outline"
                    className="flex-1"
                    disabled={adminRole === "moderator"}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Report
                  </Button>
                </div>
              </>
            )}

            {selectedReport.status !== "pending" && selectedReport.admin_notes && (
              <div className="bg-muted p-4 rounded">
                <p className="text-sm font-semibold mb-1">Admin Notes:</p>
                <p className="text-sm">{selectedReport.admin_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PhotoReports;
