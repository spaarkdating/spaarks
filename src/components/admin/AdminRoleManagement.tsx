import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Crown, UserCog, Headset, Shield, UserPlus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { logAdminAction } from "@/lib/auditLog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminRole = "super_admin" | "moderator" | "support";

const AdminRoleManagement = () => {
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<AdminRole>("support");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminUsers();
    fetchAllUsers();

    // Set up real-time subscription for admin_users changes
    const subscription = supabase
      .channel("admin_users_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_users" },
        () => {
          fetchAdminUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAdminUsers = async () => {
    setLoading(true);
    
    // Fetch admin users
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (adminError) {
      console.error("Error fetching admin users:", adminError);
      toast({
        title: "Error loading admin users",
        description: adminError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!adminData || adminData.length === 0) {
      setAdminUsers([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for all admin users
    const userIds = adminData.map(admin => admin.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Merge the data
    const mergedData = adminData.map(admin => ({
      ...admin,
      profile: profilesData?.find(p => p.id === admin.user_id) || null
    }));

    console.log("Admin users fetched:", mergedData);
    setAdminUsers(mergedData);
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .order("display_name", { ascending: true });

    if (data) {
      setAllUsers(data);
    }
  };

  const handleAddAdmin = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a user and role",
        variant: "destructive",
      });
      return;
    }

    // Check if user is already an admin
    const existingAdmin = adminUsers.find((admin) => admin.user_id === selectedUser);
    if (existingAdmin) {
      toast({
        title: "Error",
        description: "This user is already an admin",
        variant: "destructive",
      });
      return;
    }

    const selectedUserData = allUsers.find((u) => u.id === selectedUser);
    if (!selectedUserData) return;

    const { error } = await supabase.from("admin_users").insert({
      user_id: selectedUser,
      email: selectedUserData.email || "",
      role: selectedRole,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await logAdminAction({
        actionType: "admin_create",
        targetUserId: selectedUser,
        details: {
          user_name: selectedUserData.display_name || selectedUserData.email,
          role: selectedRole,
        },
      });

      toast({
        title: "Admin added",
        description: `${selectedUserData.display_name || selectedUserData.email} has been granted ${selectedRole} access.`,
      });

      setIsAddDialogOpen(false);
      setSelectedUser("");
      setSelectedRole("support");
      fetchAdminUsers();
    }
  };

  const handleUpdateRole = async (adminId: string, userId: string, newRole: AdminRole, userName: string) => {
    const { error } = await supabase
      .from("admin_users")
      .update({ role: newRole })
      .eq("id", adminId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await logAdminAction({
        actionType: "role_change",
        targetUserId: userId,
        targetResourceId: adminId,
        details: {
          user_name: userName,
          new_role: newRole,
        },
      });

      toast({
        title: "Role updated",
        description: `${userName}'s role has been updated to ${newRole}.`,
      });
      fetchAdminUsers();
    }
  };

  const handleRemoveAdmin = async (adminId: string, userId: string, userName: string, role: string) => {
    if (role === "super_admin") {
      toast({
        title: "Error",
        description: "Cannot remove super admin access",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("admin_users").delete().eq("id", adminId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await logAdminAction({
        actionType: "admin_delete",
        targetUserId: userId,
        targetResourceId: adminId,
        details: {
          user_name: userName,
          removed_role: role,
        },
      });

      toast({
        title: "Admin removed",
        description: `${userName}'s admin access has been revoked.`,
      });
      fetchAdminUsers();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Crown className="h-4 w-4" />;
      case "moderator":
        return <UserCog className="h-4 w-4" />;
      case "support":
        return <Headset className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "moderator":
        return "default";
      case "support":
        return "secondary";
      default:
        return "outline";
    }
  };

  const availableUsers = allUsers.filter(
    (user) => !adminUsers.some((admin) => admin.user_id === user.id)
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading admin users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Admin Role Management
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grant Admin Access</DialogTitle>
                <DialogDescription>
                  Select a user and assign them a partial admin role. Note: Super admin role
                  can only be assigned via the admin registration page.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.display_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admin Role</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as AdminRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">
                        <div className="flex items-center gap-2">
                          <Headset className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Support</div>
                            <div className="text-xs text-muted-foreground">
                              Can manage support tickets
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="moderator">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Moderator</div>
                            <div className="text-xs text-muted-foreground">
                              Can manage tickets and photo reports
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAdmin}>Grant Access</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No admin users found
                </TableCell>
              </TableRow>
            ) : (
              adminUsers.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <span className="font-medium">
                      {admin.profile?.display_name || "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getRoleBadgeVariant(admin.role)}
                      className="flex items-center gap-1 w-fit"
                    >
                      {getRoleIcon(admin.role)}
                      {admin.role.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(admin.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {admin.role !== "super_admin" ? (
                        <>
                          <Select
                            value={admin.role}
                            onValueChange={(value) =>
                              handleUpdateRole(
                                admin.id,
                                admin.user_id,
                                value as AdminRole,
                                admin.profile?.display_name || admin.email
                              )
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="support">Support</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleRemoveAdmin(
                                admin.id,
                                admin.user_id,
                                admin.profile?.display_name || admin.email,
                                admin.role
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Protected
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminRoleManagement;
