import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface VerificationState {
  isLoading: boolean;
  isVerified: boolean;
  verificationStatus: string | null;
  user: any | null;
}

/**
 * Hook to check user verification status and redirect unverified users to dashboard
 * where the VerificationPending component will be shown.
 * 
 * @param redirectUnverified - If true, redirects unverified users to /dashboard
 * @returns Verification state including loading, verified status, and user
 */
export function useVerificationGuard(redirectUnverified: boolean = true): VerificationState {
  const [state, setState] = useState<VerificationState>({
    isLoading: true,
    isVerified: false,
    verificationStatus: null,
    user: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerification = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin - admins bypass verification
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (isAdmin === true) {
        setState({
          isLoading: false,
          isVerified: true,
          verificationStatus: "approved",
          user: session.user,
        });
        return;
      }

      // Get verification status from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_status")
        .eq("id", session.user.id)
        .single();

      const verificationStatus = (profile as any)?.verification_status || "pending";
      const isVerified = verificationStatus === "approved";

      setState({
        isLoading: false,
        isVerified,
        verificationStatus,
        user: session.user,
      });

      // Redirect unverified users to dashboard where VerificationPending is shown
      if (redirectUnverified && !isVerified) {
        navigate("/dashboard");
      }
    };

    checkVerification();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectUnverified]);

  return state;
}

/**
 * Utility function to check verification status without hook (for BottomNav)
 */
export async function checkUserVerificationStatus(userId: string): Promise<{
  isVerified: boolean;
  verificationStatus: string;
}> {
  // Check if admin
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin === true) {
    return { isVerified: true, verificationStatus: "approved" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", userId)
    .single();

  const verificationStatus = (profile as any)?.verification_status || "pending";
  return {
    isVerified: verificationStatus === "approved",
    verificationStatus,
  };
}
