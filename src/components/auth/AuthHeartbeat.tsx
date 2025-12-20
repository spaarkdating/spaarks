import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

/**
 * Keeps profiles.last_online fresh for authenticated users so stats like "Active Users"
 * update without needing manual refresh.
 */
export function AuthHeartbeat() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const ping = () => {
      // Fire-and-forget; we don't want to block UI.
      supabase.rpc("update_last_online").then(() => {
        // ignore
      });
    };

    ping();
    const interval = setInterval(ping, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session]);

  return null;
}
