import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, User, Ticket, AlertTriangle, Settings } from "lucide-react";

const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();

    // Set up real-time subscription for audit log changes
    const subscription = supabase
      .channel("audit_logs_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_audit_logs" },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select(
        `
        *,
        admin:profiles!admin_audit_logs_admin_user_id_fkey(display_name, email),
        target:profiles!admin_audit_logs_target_user_id_fkey(display_name, email)
      `
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching audit logs:", error);
    } else if (data) {
      console.log("Audit logs fetched:", data);
      setLogs(data);
    }
    setLoading(false);
  };

  const getActionIcon = (actionType: string) => {
    if (actionType.includes("user")) return <User className="h-4 w-4" />;
    if (actionType.includes("ticket")) return <Ticket className="h-4 w-4" />;
    if (actionType.includes("report")) return <AlertTriangle className="h-4 w-4" />;
    if (actionType.includes("role") || actionType.includes("admin"))
      return <Settings className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes("delete") || actionType.includes("ban"))
      return "destructive";
    if (actionType.includes("unban") || actionType.includes("resolve"))
      return "default";
    if (actionType.includes("reject")) return "secondary";
    return "outline";
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading audit logs...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Audit Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {log.admin?.display_name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.admin?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getActionColor(log.action_type)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getActionIcon(log.action_type)}
                        {formatActionType(log.action_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.target ? (
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {log.target.display_name || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.target.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground max-w-xs">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          "-"
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AuditLogs;
