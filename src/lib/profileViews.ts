import { supabase } from "@/integrations/supabase/client";

/**
 * Records a profile view when someone views another user's profile
 * This is triggered when:
 * - User clicks on a profile to view details
 * - User navigates to /profile/:id
 * - User clicks on a profile card in matches/dashboard
 * 
 * @param viewerId - The ID of the user viewing the profile
 * @param viewedProfileId - The ID of the profile being viewed
 * @returns Promise<boolean> - Returns true if successful, false otherwise
 */
export const recordProfileView = async (
  viewerId: string,
  viewedProfileId: string
): Promise<boolean> => {
  // Don't record self-views
  if (viewerId === viewedProfileId) {
    return false;
  }

  try {
    // First, try to get the current user to verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== viewerId) {
      console.warn("User not authenticated or viewer ID mismatch", { user: user?.id, viewerId });
      return false;
    }

    console.log("Recording profile view:", { viewerId, viewedProfileId });

    // Try insert first, if it fails due to duplicate, then update
    const { error: insertError } = await supabase
      .from("profile_views")
      .insert({
        viewer_id: viewerId,
        viewed_profile_id: viewedProfileId,
        viewed_at: new Date().toISOString(),
      });

    let isNewView = true;

    if (insertError) {
      // If it's a duplicate key error, update instead
      if (insertError.code === "23505" || insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
        console.log("Profile view already exists, updating timestamp");
        isNewView = false;
        const { error: updateError } = await supabase
          .from("profile_views")
          .update({ viewed_at: new Date().toISOString() })
          .eq("viewer_id", viewerId)
          .eq("viewed_profile_id", viewedProfileId);

        if (updateError) {
          console.error("Error updating profile view timestamp:", updateError);
          return false;
        }
        console.log("Profile view updated successfully");
      } else {
        console.error("Error inserting profile view:", insertError);
        console.error("Error details:", JSON.stringify(insertError, null, 2));
        return false;
      }
    } else {
      console.log("Profile view inserted successfully");
    }

    // Note: Notifications are created by database trigger
    // The trigger has been updated to use generic "Someone viewed your profile" message

    return true;
  } catch (error: any) {
    console.error("Error recording profile view:", error);
    return false;
  }
};

