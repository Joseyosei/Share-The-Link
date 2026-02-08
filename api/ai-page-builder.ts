import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { businessDescription } = req.body;

    if (!businessDescription) {
      return res.status(400).json({ error: "Business description is required" });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      // Fallback: generate a deterministic design without AI
      return res.status(200).json({
        generation: generateFallbackDesign(businessDescription),
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional web designer. Given a business description, generate a link-in-bio page design as JSON. Return ONLY valid JSON with this exact structure:
{
  "bio": "A compelling bio (max 150 chars)",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "background": "#hex",
    "text": "#hex",
    "accent": "#hex"
  },
  "layout": "minimal" | "bold" | "elegant" | "playful" | "professional",
  "font": "Inter" | "Poppins" | "Playfair Display" | "Space Grotesk" | "DM Sans",
  "ctas": [
    { "title": "Button text", "url": "https://example.com", "type": "primary" | "secondary" }
  ],
  "suggestions": ["tip1", "tip2", "tip3"]
}`,
          },
          {
            role: "user",
            content: `Design a link-in-bio page for: ${businessDescription}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return res.status(200).json({
        generation: generateFallbackDesign(businessDescription),
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({
        generation: generateFallbackDesign(businessDescription),
      });
    }

    const generation = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ generation });
  } catch (error) {
    console.error("AI builder error:", error);
    return res.status(200).json({
      generation: generateFallbackDesign(req.body?.businessDescription || ""),
    });
  }
}

function generateFallbackDesign(description: string) {
  const desc = description.toLowerCase();
  const isCreative = /art|design|photo|music|creative|fashion/i.test(desc);
  const isTech = /tech|software|dev|code|startup|saas/i.test(desc);
  const isFood = /food|restaurant|cafe|cook|recipe|bakery/i.test(desc);

  let layout: string, primary: string, secondary: string, background: string, font: string;

  if (isCreative) {
    layout = "bold";
    primary = "#E11D48";
    secondary = "#F472B6";
    background = "#FFF1F2";
    font = "Poppins";
  } else if (isTech) {
    layout = "minimal";
    primary = "#2563EB";
    secondary = "#60A5FA";
    background = "#F0F9FF";
    font = "Space Grotesk";
  } else if (isFood) {
    layout = "playful";
    primary = "#EA580C";
    secondary = "#FB923C";
    background = "#FFF7ED";
    font = "DM Sans";
  } else {
    layout = "professional";
    primary = "#7C3AED";
    secondary = "#A78BFA";
    background = "#FAF5FF";
    font = "Inter";
  }

  const words = description.split(" ").slice(0, 8).join(" ");
  const bio = `${words} - Building something extraordinary.`;

  return {
    bio: bio.slice(0, 150),
    colors: {
      primary,
      secondary,
      background,
      text: "#1A1A2E",
      accent: secondary,
    },
    layout,
    font,
    ctas: [
      { title: "Visit My Website", url: "https://example.com", type: "primary" },
      { title: "Get in Touch", url: "https://example.com/contact", type: "secondary" },
      { title: "Follow Me", url: "https://twitter.com", type: "secondary" },
    ],
    suggestions: [
      "Add a professional headshot to build trust",
      "Include your top 3-5 most important links",
      "Use a clear call-to-action on your primary link",
    ],
  };
}
