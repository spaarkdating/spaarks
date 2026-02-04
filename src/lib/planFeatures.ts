// Utility to generate feature strings from subscription plan data

export interface SubscriptionPlanData {
  name: string;
  display_name: string;
  price_inr: number;
  daily_swipes_limit: number | null;
  active_matches_limit: number | null;
  messages_per_match_limit: number | null;
  profile_views_limit: number | null;
  can_send_images: boolean;
  can_send_voice: boolean;
  can_send_video: boolean;
  images_per_chat_per_day: number | null;
  videos_per_chat_per_day: number | null;
  video_max_duration_seconds: number | null;
  audio_messages_per_day: number | null;
  who_liked_you_limit?: number | null;
  // Call features
  can_audio_call?: boolean;
  can_video_call?: boolean;
  audio_calls_per_day?: number | null;
  video_calls_per_day?: number | null;
  call_duration_limit_minutes?: number | null;
}

export function generatePlanFeatures(plan: SubscriptionPlanData): string[] {
  const features: string[] = [];

  // Swipes
  if (plan.daily_swipes_limit === null) {
    features.push('Unlimited swipes');
  } else {
    features.push(`${plan.daily_swipes_limit} swipes per day`);
  }

  // Active matches
  if (plan.active_matches_limit === null) {
    features.push('Unlimited active matches');
  } else {
    features.push(`Up to ${plan.active_matches_limit} active matches`);
  }

  // Messages
  if (plan.messages_per_match_limit === null) {
    if (plan.can_send_voice && plan.can_send_video) {
      features.push('Text + Voice + Video messaging');
    } else if (plan.can_send_voice) {
      features.push('Text + Voice messaging');
    } else {
      features.push('Unlimited text messaging');
    }
  } else {
    features.push(`${plan.messages_per_match_limit} messages per match`);
  }

  // Profile views
  if (plan.profile_views_limit === null) {
    features.push('See all profile viewers + timestamps');
  } else if (plan.profile_views_limit === 0) {
    features.push('Cannot see profile viewers');
  } else {
    features.push(`See last ${plan.profile_views_limit} profile viewers`);
  }

  // Who liked you
  if (plan.who_liked_you_limit === null) {
    features.push('See all who liked you');
  } else if (plan.who_liked_you_limit === 0) {
    // Don't add feature for free tier
  } else {
    features.push(`See ${plan.who_liked_you_limit} people who liked you`);
  }

  // Images
  if (plan.can_send_images) {
    if (plan.images_per_chat_per_day === null) {
      features.push('Unlimited images');
    } else if (plan.images_per_chat_per_day > 0) {
      features.push(`${plan.images_per_chat_per_day} image${plan.images_per_chat_per_day > 1 ? 's' : ''} per chat per day`);
    }
  }

  // Videos
  if (plan.can_send_video) {
    if (plan.videos_per_chat_per_day === null) {
      features.push(`Unlimited videos (${plan.video_max_duration_seconds}s)`);
    } else if (plan.videos_per_chat_per_day > 0) {
      features.push(`${plan.videos_per_chat_per_day} video per chat (${plan.video_max_duration_seconds}s)`);
    }
  }

  // Audio messages
  if (plan.can_send_voice) {
    if (plan.audio_messages_per_day === null) {
      features.push('Unlimited audio messages');
    } else if (plan.audio_messages_per_day > 0) {
      features.push(`${plan.audio_messages_per_day} audio messages per day`);
    }
  }

  // Audio calls
  if (plan.can_audio_call) {
    if (plan.audio_calls_per_day === null) {
      features.push('Unlimited audio calls');
    } else if (plan.audio_calls_per_day && plan.audio_calls_per_day > 0) {
      const durationInfo = plan.call_duration_limit_minutes ? ` (${plan.call_duration_limit_minutes}min)` : '';
      features.push(`${plan.audio_calls_per_day} audio calls/day${durationInfo}`);
    }
  }

  // Video calls
  if (plan.can_video_call) {
    if (plan.video_calls_per_day === null) {
      features.push('Unlimited video calls');
    } else if (plan.video_calls_per_day && plan.video_calls_per_day > 0) {
      const durationInfo = plan.call_duration_limit_minutes ? ` (${plan.call_duration_limit_minutes}min)` : '';
      features.push(`${plan.video_calls_per_day} video calls/day${durationInfo}`);
    }
  }

  // Priority support for elite
  if (plan.name === 'elite') {
    features.push('Priority support');
  }

  return features;
}

// Generate shorter feature strings for landing page
export function generateShortFeatures(plan: SubscriptionPlanData): string[] {
  const features: string[] = [];

  // Swipes
  if (plan.daily_swipes_limit === null) {
    features.push('Unlimited swipes');
  } else {
    features.push(`${plan.daily_swipes_limit} swipes/day`);
  }

  // Matches
  if (plan.active_matches_limit === null) {
    features.push('Unlimited matches');
  } else {
    features.push(`${plan.active_matches_limit} active matches`);
  }

  // Messaging type
  if (plan.can_send_voice && plan.can_send_video) {
    features.push('Video messaging');
  } else if (plan.can_send_voice) {
    features.push('Voice messaging');
  } else {
    features.push('Text messaging');
  }

  // Profile views
  if (plan.profile_views_limit === null) {
    features.push('All viewers + timestamps');
  } else if (plan.profile_views_limit > 0) {
    features.push(`See ${plan.profile_views_limit} viewers`);
  }

  // Who liked you
  if (plan.who_liked_you_limit === null) {
    features.push('See all likes');
  } else if (plan.who_liked_you_limit && plan.who_liked_you_limit > 0) {
    features.push(`See ${plan.who_liked_you_limit} likes`);
  }

  // Media summary
  if (plan.can_send_images || plan.can_send_video) {
    const mediaParts: string[] = [];
    if (plan.images_per_chat_per_day === null) {
      mediaParts.push('Unlimited media');
    } else if (plan.images_per_chat_per_day && plan.images_per_chat_per_day > 0) {
      mediaParts.push(`${plan.images_per_chat_per_day} images`);
      if (plan.videos_per_chat_per_day && plan.videos_per_chat_per_day > 0) {
        mediaParts.push(`${plan.videos_per_chat_per_day} video/day`);
      }
    }
    if (mediaParts.length > 0) {
      features.push(mediaParts.join(' + '));
    }
  }

  // Calls summary
  if (plan.can_audio_call || plan.can_video_call) {
    if (plan.can_video_call && plan.video_calls_per_day === null) {
      features.push('Unlimited calls');
    } else if (plan.can_video_call) {
      features.push('Audio + Video calls');
    } else if (plan.can_audio_call) {
      features.push('Audio calls');
    }
  }

  // Elite extras
  if (plan.name === 'elite') {
    features.push('Priority support');
  }

  return features;
}
