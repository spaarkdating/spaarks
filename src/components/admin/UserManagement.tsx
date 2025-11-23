import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ban, CheckCircle, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { logAdminAction } from "@/lib/auditLog";

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*, photos(photo_url, display_order)")
      .order("created_at", { ascending: false });

    if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBanUser = async (userId: string, userName: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: "banned" } as any)
      .eq("id", userId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await logAdminAction({
        actionType: "user_ban",
        targetUserId: userId,
        details: { user_name: userName, reason: "Admin action" },
      });
      
      toast({
        title: "User banned",
        description: "User has been banned successfully.",
      });
      fetchUsers();
    }
  };

  const handleUnbanUser = async (userId: string, userName: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: "active" } as any)
      .eq("id", userId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await logAdminAction({
        actionType: "user_unban",
        targetUserId: userId,
        details: { user_name: userName },
      });

      toast({
        title: "User unbanned",
        description: "User has been unbanned successfully.",
      });
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await logAdminAction({
        actionType: "user_delete",
        targetUserId: userId,
        details: { user_name: userName },
      });

      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
      fetchUsers();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Online</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {user.photos?.[0]?.photo_url ? (
                      <img
                        src={user.photos[0].photo_url}
                        alt={user.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <UserX className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium">{user.display_name || "No name"}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.account_status === "active"
                        ? "default"
                        : user.account_status === "banned"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {user.account_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  {user.last_online
                    ? formatDistanceToNow(new Date(user.last_online), { addSuffix: true })
                    : "Never"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {user.account_status === "active" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleBanUser(user.id, user.display_name || user.email)}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Ban
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleUnbanUser(user.id, user.display_name || user.email)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Unban
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteUser(user.id, user.display_name || user.email)}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
