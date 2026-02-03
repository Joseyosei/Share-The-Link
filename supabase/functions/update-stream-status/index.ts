import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    const { streamId, status, viewerCount } = await req.json();

    if (!streamId || !status) {
      throw new Error("Stream ID and status are required");
    }

    // Verify ownership
    const { data: stream, error: fetchError } = await supabaseClient
      .from("streams")
      .select("user_id")
      .eq("id", streamId)
      .single();

    if (fetchError || !stream) {
      throw new Error("Stream not found");
    }

    if (stream.user_id !== user.id) {
      throw new Error("Not authorized to update this stream");
    }

    // Build update object
    const updates: Record<string, unknown> = { status };

    if (status === "live") {
      updates.started_at = new Date().toISOString();
    } else if (status === "ended") {
      updates.ended_at = new Date().toISOString();
    }

    if (viewerCount !== undefined) {
      updates.viewer_count = viewerCount;
      
      // Update peak viewers if current is higher
      const { data: currentStream } = await supabaseClient
        .from("streams")
        .select("peak_viewers")
        .eq("id", streamId)
        .single();
      
      if (currentStream && viewerCount > (currentStream.peak_viewers || 0)) {
        updates.peak_viewers = viewerCount;
      }
    }

    // Update stream
    const { data: updatedStream, error: updateError } = await supabaseClient
      .from("streams")
      .update(updates)
      .eq("id", streamId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update stream");
    }

    return new Response(
      JSON.stringify({ stream: updatedStream }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
