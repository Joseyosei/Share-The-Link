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

    const { businessDescription } = await req.json();

    if (!businessDescription || businessDescription.length < 10) {
      throw new Error("Please provide a detailed business description");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert brand strategist and web designer. Generate a complete professional page design for a link-in-bio profile.

Return ONLY valid JSON in this exact format:
{
  "bio": "A compelling 2-3 sentence bio that captures the essence of this business",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex", 
    "background": "#hex",
    "text": "#hex",
    "accent": "#hex"
  },
  "layout": "minimal|bold|elegant|playful|professional",
  "font": "Inter|Poppins|Playfair Display|Montserrat|Space Grotesk",
  "ctas": [
    { "title": "CTA text", "url": "suggested-url-path", "type": "primary|secondary" }
  ],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

Make the design unique and tailored to their specific business type. Be creative with colors that match their industry.`
          },
          {
            role: "user",
            content: `Generate a complete page design for this business: ${businessDescription}`
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", errorText);
      throw new Error("AI service temporarily unavailable");
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let generatedPage;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedPage = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse AI response");
    }

    // Save to database
    const { data: generation, error: dbError } = await supabaseClient
      .from("ai_generations")
      .insert({
        user_id: user.id,
        business_description: businessDescription,
        generated_bio: generatedPage.bio,
        generated_colors: generatedPage.colors,
        generated_layout: generatedPage.layout,
        generated_ctas: generatedPage.ctas,
        generated_font: generatedPage.font,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Continue even if save fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        generation: generatedPage,
        generationId: generation?.id,
      }),
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
