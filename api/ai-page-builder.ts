import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { businessDescription, websiteUrl } = req.body;

    if (!businessDescription) {
      return res.status(400).json({ error: "Business description is required" });
    }

    // Try to fetch web info about the business if a URL is provided
    let webContext = "";
    if (websiteUrl) {
      try {
        const fetchRes = await fetch(websiteUrl, {
          headers: { "User-Agent": "ShareTheLink-Bot/1.0" },
          signal: AbortSignal.timeout(5000),
        });
        if (fetchRes.ok) {
          const html = await fetchRes.text();
          // Extract useful text from meta tags and headings
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
          const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
          const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);

          const parts = [
            titleMatch?.[1] ? `Website title: ${titleMatch[1]}` : "",
            descMatch?.[1] ? `Description: ${descMatch[1]}` : "",
            ogDescMatch?.[1] ? `About: ${ogDescMatch[1]}` : "",
            h1Match?.[1] ? `Headline: ${h1Match[1]}` : "",
          ].filter(Boolean);

          webContext = parts.length > 0 ? `\n\nWeb info found: ${parts.join(". ")}` : "";
        }
      } catch {
        // Web fetch failed, continue without it
      }
    }

    const fullDescription = businessDescription + webContext;

    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        generation: generateFallbackDesign(fullDescription),
        themes: generateThemeVariants(fullDescription),
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
            content: `Design a link-in-bio page for: ${fullDescription}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      return res.status(200).json({
        generation: generateFallbackDesign(fullDescription),
        themes: generateThemeVariants(fullDescription),
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({
        generation: generateFallbackDesign(fullDescription),
        themes: generateThemeVariants(fullDescription),
      });
    }

    const generation = JSON.parse(jsonMatch[0]);
    return res.status(200).json({
      generation,
      themes: generateThemeVariants(fullDescription),
    });
  } catch (error) {
    console.error("AI builder error:", error);
    return res.status(200).json({
      generation: generateFallbackDesign(req.body?.businessDescription || ""),
      themes: generateThemeVariants(req.body?.businessDescription || ""),
    });
  }
}

interface ThemeVariant {
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  font: string;
  layout: string;
}

function generateThemeVariants(description: string): ThemeVariant[] {
  return [
    {
      name: "Minimal Light",
      description: "Clean and professional with soft whites",
      colors: {
        primary: "#111827",
        secondary: "#6B7280",
        background: "#FFFFFF",
        text: "#111827",
        accent: "#3B82F6",
      },
      font: "Inter",
      layout: "minimal",
    },
    {
      name: "Bold Gradient",
      description: "Eye-catching with vibrant purple and pink",
      colors: {
        primary: "#7C3AED",
        secondary: "#EC4899",
        background: "#0F0F23",
        text: "#F9FAFB",
        accent: "#A78BFA",
      },
      font: "Space Grotesk",
      layout: "bold",
    },
    {
      name: "Warm Sunset",
      description: "Inviting and energetic with warm tones",
      colors: {
        primary: "#EA580C",
        secondary: "#F59E0B",
        background: "#FFFBEB",
        text: "#292524",
        accent: "#FB923C",
      },
      font: "DM Sans",
      layout: "playful",
    },
    {
      name: "Dark Professional",
      description: "Sleek and modern with dark backgrounds",
      colors: {
        primary: "#3B82F6",
        secondary: "#06B6D4",
        background: "#0F172A",
        text: "#F1F5F9",
        accent: "#22D3EE",
      },
      font: "Space Grotesk",
      layout: "professional",
    },
    {
      name: "Elegant Rose",
      description: "Sophisticated with soft rose and cream",
      colors: {
        primary: "#BE185D",
        secondary: "#F472B6",
        background: "#FFF1F2",
        text: "#1C1917",
        accent: "#E11D48",
      },
      font: "Playfair Display",
      layout: "elegant",
    },
    {
      name: "Nature Fresh",
      description: "Organic and calming with green tones",
      colors: {
        primary: "#059669",
        secondary: "#34D399",
        background: "#ECFDF5",
        text: "#1E293B",
        accent: "#10B981",
      },
      font: "DM Sans",
      layout: "minimal",
    },
  ];
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
