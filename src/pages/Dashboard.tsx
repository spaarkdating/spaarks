import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { OnlineDashboard } from "./OnlineDashboard";
import { OfflineDashboard } from "./OfflineDashboard";
import { VerificationPending } from "@/components/VerificationPending";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [datingMode, setDatingMode] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      // Check if user is admin
      const { data: isAdmin, error: adminCheckError } = await supabase.rpc("is_admin");

      if (adminCheckError) {
        console.error("Error checking admin status:", adminCheckError);
      }

      if (isAdmin === true) {
        navigate("/admin");
        return;
      }

      setUser(session.user);

      // Get user's profile and verification status
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!profile?.bio || !profile?.gender || !profile?.looking_for) {
        navigate("/onboarding");
        return;
      }

      // Check verification status
      const vs = (profile as any).verification_status || "pending";
      setVerificationStatus(vs);

      if (vs === "rejected") {
        const { data: verification } = await supabase
          .from("id_card_verifications")
          .select("rejection_reason")
          .eq("user_id", session.user.id)
          .maybeSingle();
        setRejectionReason(verification?.rejection_reason || undefined);
      }

      setDatingMode(profile.dating_mode || "online");
      setIsLoading(false);
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  if (!user || isLoading) return null;

  // Show verification pending/rejected screen
  if (verificationStatus === "pending" || verificationStatus === "rejected") {
    return <VerificationPending status={verificationStatus} rejectionReason={rejectionReason} />;
  }

  // Route to appropriate dashboard based on dating mode
  if (datingMode === "offline") {
    return <OfflineDashboard user={user} onLogout={handleLogout} />;
  }

  return <OnlineDashboard user={user} onLogout={handleLogout} />;
};

export default Dashboard;
