import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Crown, Zap, Sparkles, Star, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SubscriptionPlan {
  id: string;
  name: "free" | "plus" | "pro" | "elite";
  display_name: string;
  price_inr: number;
  profile_views_limit: number | null;
  daily_swipes_limit: number | null;
  active_matches_limit: number | null;
  messages_per_match_limit: number | null;
  can_send_voice: boolean;
  can_send_video: boolean;
  can_send_images: boolean;
  images_per_chat_per_day: number | null;
  videos_per_chat_per_day: number | null;
  video_max_duration_seconds: number | null;
  audio_messages_per_day: number | null;
}

type EditableFields = Omit<SubscriptionPlan, "id" | "name">;

const planIcons: Record<string, React.ReactNode> = {
  free: <Star className="h-5 w-5" />,
  plus: <Zap className="h-5 w-5" />,
  pro: <Sparkles className="h-5 w-5" />,
  elite: <Crown className="h-5 w-5" />,
};

const planColors: Record<string, string> = {
  free: "bg-slate-500/10 text-slate-600",
  plus: "bg-blue-500/10 text-blue-600",
  pro: "bg-primary/10 text-primary",
  elite: "bg-amber-500/10 text-amber-600",
};

export const SubscriptionPlansManagement = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedPlans, setEditedPlans] = useState<Record<string, Partial<EditableFields>>>({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price_inr", { ascending: true });

    if (error) {
      toast({
        title: "Error fetching plans",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  };

  const handleFieldChange = (planId: string, field: keyof EditableFields, value: string | number | boolean | null) => {
    setEditedPlans((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value,
      },
    }));
  };

  const getFieldValue = <K extends keyof SubscriptionPlan>(plan: SubscriptionPlan, field: K): SubscriptionPlan[K] => {
    if (editedPlans[plan.id]?.[field as keyof EditableFields] !== undefined) {
      return editedPlans[plan.id][field as keyof EditableFields] as SubscriptionPlan[K];
    }
    return plan[field];
  };

  const savePlan = async (plan: SubscriptionPlan) => {
    const changes = editedPlans[plan.id];
    if (!changes || Object.keys(changes).length === 0) {
      toast({
        title: "No changes",
        description: "No changes to save for this plan.",
      });
      return;
    }

    setSaving(plan.id);

    const { error } = await supabase
      .from("subscription_plans")
      .update(changes)
      .eq("id", plan.id);

    if (error) {
      toast({
        title: "Error saving plan",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Plan updated",
        description: `${plan.display_name} plan has been updated successfully.`,
      });
      setEditedPlans((prev) => {
        const { [plan.id]: _, ...rest } = prev;
        return rest;
      });
      fetchPlans();
    }
    setSaving(null);
  };

  const hasChanges = (planId: string) => {
    return editedPlans[planId] && Object.keys(editedPlans[planId]).length > 0;
  };

  const getNumericValue = (plan: SubscriptionPlan, field: keyof SubscriptionPlan): string | number => {
    const value = getFieldValue(plan, field);
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return value;
    return "";
  };

  const getStringValue = (plan: SubscriptionPlan, field: keyof SubscriptionPlan): string => {
    const value = getFieldValue(plan, field);
    if (typeof value === "string") return value;
    return "";
  };

  const getBoolValue = (plan: SubscriptionPlan, field: keyof SubscriptionPlan): boolean => {
    const value = getFieldValue(plan, field);
    return typeof value === "boolean" ? value : false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <p className="text-muted-foreground">
            Manage pricing and limits for all subscription tiers
          </p>
        </div>
        <Button variant="outline" onClick={fetchPlans} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${planColors[plan.name]?.replace('/10', '')}`} />
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${planColors[plan.name]}`}>
                    {planIcons[plan.name]}
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.display_name}
                      {hasChanges(plan.id) && (
                        <Badge variant="secondary" className="text-xs">Unsaved</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>Plan ID: {plan.name}</CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => savePlan(plan)}
                  disabled={saving === plan.id || !hasChanges(plan.id)}
                  className="gap-2"
                >
                  {saving === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`price-${plan.id}`}>Price (₹/month)</Label>
                  <Input
                    id={`price-${plan.id}`}
                    type="number"
                    min="0"
                    value={getNumericValue(plan, "price_inr")}
                    onChange={(e) =>
                      handleFieldChange(plan.id, "price_inr", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`display-${plan.id}`}>Display Name</Label>
                  <Input
                    id={`display-${plan.id}`}
                    value={getStringValue(plan, "display_name")}
                    onChange={(e) =>
                      handleFieldChange(plan.id, "display_name", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Limits */}
              <div>
                <h4 className="font-semibold mb-3">Usage Limits</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Leave empty for unlimited
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`swipes-${plan.id}`}>Daily Swipes</Label>
                    <Input
                      id={`swipes-${plan.id}`}
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                      value={getNumericValue(plan, "daily_swipes_limit")}
                      onChange={(e) =>
                        handleFieldChange(
                          plan.id,
                          "daily_swipes_limit",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`matches-${plan.id}`}>Active Matches</Label>
                    <Input
                      id={`matches-${plan.id}`}
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                      value={getNumericValue(plan, "active_matches_limit")}
                      onChange={(e) =>
                        handleFieldChange(
                          plan.id,
                          "active_matches_limit",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`messages-${plan.id}`}>Messages/Match</Label>
                    <Input
                      id={`messages-${plan.id}`}
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                      value={getNumericValue(plan, "messages_per_match_limit")}
                      onChange={(e) =>
                        handleFieldChange(
                          plan.id,
                          "messages_per_match_limit",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`views-${plan.id}`}>Profile Views</Label>
                    <Input
                      id={`views-${plan.id}`}
                      type="number"
                      min="0"
                      placeholder="None"
                      value={getNumericValue(plan, "profile_views_limit")}
                      onChange={(e) =>
                        handleFieldChange(
                          plan.id,
                          "profile_views_limit",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Media Limits */}
              <div>
                <h4 className="font-semibold mb-3">Media Limits</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`images-${plan.id}`}>Images/Chat/Day</Label>
                    <Input
                      id={`images-${plan.id}`}
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                      value={getNumericValue(plan, "images_per_chat_per_day")}
                      onChange={(e) =>
                        handleFieldChange(
                          plan.id,
                          "images_per_chat_per_day",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`videos-${plan.id}`}>Videos/Chat/Day</Label>
                    <Input
                      id={`videos-${plan.id}`}
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                      value={getNumericValue(plan, "videos_per_chat_per_day")}
                      onChange={(e) =>
                        handleFieldChange(
                          plan.id,
                          "videos_per_chat_per_day",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`video-dur-${plan.id}`}>Video Duration (s)</Label>
                    <Input
                      id={`video-dur-${plan.id}`}
                      type="number"
                      min="0"
                      value={getNumericValue(plan, "video_max_duration_seconds")}
                      onChange={(e) =>
                        handleFieldChange(
                          plan.id,
                          "video_max_duration_seconds",
                          parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`audio-${plan.id}`}>Audio/Day</Label>
                    <Input
                      id={`audio-${plan.id}`}
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                      value={getNumericValue(plan, "audio_messages_per_day")}
                      onChange={(e) =>
                        handleFieldChange(
                          plan.id,
                          "audio_messages_per_day",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Feature Toggles */}
              <div>
                <h4 className="font-semibold mb-3">Features</h4>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`images-toggle-${plan.id}`}
                      checked={getBoolValue(plan, "can_send_images")}
                      onCheckedChange={(checked) =>
                        handleFieldChange(plan.id, "can_send_images", checked)
                      }
                    />
                    <Label htmlFor={`images-toggle-${plan.id}`}>Can Send Images</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`voice-toggle-${plan.id}`}
                      checked={getBoolValue(plan, "can_send_voice")}
                      onCheckedChange={(checked) =>
                        handleFieldChange(plan.id, "can_send_voice", checked)
                      }
                    />
                    <Label htmlFor={`voice-toggle-${plan.id}`}>Can Send Voice</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`video-toggle-${plan.id}`}
                      checked={getBoolValue(plan, "can_send_video")}
                      onCheckedChange={(checked) =>
                        handleFieldChange(plan.id, "can_send_video", checked)
                      }
                    />
                    <Label htmlFor={`video-toggle-${plan.id}`}>Can Send Video</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlansManagement;
