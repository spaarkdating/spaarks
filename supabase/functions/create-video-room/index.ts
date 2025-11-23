import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY is not configured');
    }

    const { matchId, userId } = await req.json();

    if (!matchId || !userId) {
      throw new Error('matchId and userId are required');
    }

    console.log('Creating video room for match:', matchId);

    // Create a Daily.co room
    const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          max_participants: 2,
          enable_chat: true,
          enable_screenshare: false,
          enable_recording: 'local',
          exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
        },
      }),
    });

    if (!roomResponse.ok) {
      const errorText = await roomResponse.text();
      console.error('Daily.co API error:', errorText);

      return new Response(
        JSON.stringify({
          error: 'daily_api_error',
          status: roomResponse.status,
          details: errorText,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const roomData = await roomResponse.json();
    console.log('Video room created:', roomData.name);

    return new Response(
      JSON.stringify({
        roomUrl: roomData.url,
        roomName: roomData.name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating video room:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'unknown_error' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
