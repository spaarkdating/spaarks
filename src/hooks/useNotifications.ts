import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useNotifications = (userId?: string) => {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = useCallback((title: string, body: string, data?: { url?: string }) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: title,
      } as NotificationOptions);
      if (data?.url) {
        notification.onclick = () => {
          window.focus();
          window.location.href = data.url!;
        };
      }
    }
  }, []);

  // Listen for real-time notifications from Supabase
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as any;
          showNotification(notification.title, notification.message, {
            url: notification.type === "message" ? "/messages" :
                 notification.type === "match" ? "/matches" :
                 notification.type === "profile_view" ? "/profile-views" : "/dashboard"
          });
        }
      )
      .subscribe();

    // Also listen for new messages
    const msgChannel = supabase
      .channel(`messages-notify-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const msg = payload.new as any;
          // Get sender name
          const { data: sender } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", msg.sender_id)
            .single();
          
          showNotification(
            `New message from ${sender?.display_name || "Someone"}`,
            msg.content?.substring(0, 100) || "Sent you a message",
            { url: "/messages" }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(msgChannel);
    };
  }, [userId, showNotification]);

  return { showNotification };
};
