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
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
          const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
          const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
          const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
          const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
          // Try to extract theme color
          const themeColor = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i);

          const parts = [
            titleMatch?.[1] ? `Website title: ${titleMatch[1]}` : "",
            ogTitleMatch?.[1] ? `Brand name: ${ogTitleMatch[1]}` : "",
            descMatch?.[1] ? `Description: ${descMatch[1]}` : "",
            ogDescMatch?.[1] ? `About: ${ogDescMatch[1]}` : "",
            h1Match?.[1] ? `Headline: ${h1Match[1]}` : "",
            keywordsMatch?.[1] ? `Keywords: ${keywordsMatch[1]}` : "",
            themeColor?.[1] ? `Brand color: ${themeColor[1]}` : "",
          ].filter(Boolean);

          webContext = parts.length > 0 ? `\n\nWeb info found from ${websiteUrl}: ${parts.join(". ")}` : "";
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
            content: `You are a professional web designer and brand strategist specializing in link-in-bio pages. Given a business description (and optionally web info scraped from their site), generate a complete, personalized link-in-bio page design.

IMPORTANT RULES:
- The bio MUST be written specifically for this business/person. Reference their actual name, services, or niche.
- Colors should match the industry and brand personality (e.g., green for eco/health, dark for tech, warm for food).
- If web info is provided, use the brand name, description, and any brand colors found.
- CTAs should be specific and actionable for their business type (not generic).
- The bio should be engaging, professional, and max 150 characters.
- Suggest 3 specific, actionable tips relevant to their industry.

Return ONLY valid JSON with this exact structure:
{
  "bio": "A compelling, personalized bio (max 150 chars)",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "background": "#hex",
    "text": "#hex",
    "accent": "#hex"
  },
  "layout": "minimal" | "bold" | "elegant" | "playful" | "professional",
  "font": "Inter" | "Poppins" | "Playfair Display" | "Space Grotesk" | "DM Sans" | "Outfit" | "Plus Jakarta Sans" | "Crimson Pro",
  "ctas": [
    { "title": "Specific button text", "url": "https://example.com", "type": "primary" | "secondary" }
  ],
  "suggestions": ["specific tip 1", "specific tip 2", "specific tip 3"]
}`,
          },
          {
            role: "user",
            content: `Design a link-in-bio page for: ${fullDescription}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
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
    const themes = generateThemeVariants(fullDescription);
    return res.status(200).json({ generation, themes });
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

function detectCategory(description: string): string {
  const d = description.toLowerCase();
  if (/church|pastor|ministry|faith|sermon|worship|prayer|christian|gospel/i.test(d)) return "faith";
  if (/photo|video|film|camera|cinemat|visual/i.test(d)) return "creative";
  if (/coach|fitness|trainer|health|wellness|gym|yoga|nutrition/i.test(d)) return "fitness";
  if (/music|artist|band|dj|singer|rapper|producer|beat/i.test(d)) return "music";
  if (/shop|store|product|sell|ecommerce|jewelry|handmade|boutique|fashion/i.test(d)) return "shop";
  if (/tech|developer|software|dev|code|startup|saas|engineer|app/i.test(d)) return "tech";
  if (/food|restaurant|cafe|cook|recipe|bakery|chef|catering/i.test(d)) return "food";
  if (/real.?estate|property|realtor|agent|homes|housing/i.test(d)) return "realestate";
  if (/beauty|makeup|skincare|nail|salon|spa|aesthetic/i.test(d)) return "beauty";
  if (/consult|mentor|speaker|life.?coach|business.?coach|advisor|strategy/i.test(d)) return "consulting";
  if (/education|tutor|teacher|course|school|academy|learn|training/i.test(d)) return "education";
  if (/art|paint|draw|illustrat|sculpt|gallery|creative/i.test(d)) return "art";
  if (/podcast|blog|writer|author|journalist|content.?creator|influencer/i.test(d)) return "content";
  if (/travel|adventure|tour|guide|hotel|hospitality/i.test(d)) return "travel";
  if (/nonprofit|charity|ngo|volunteer|cause|community|foundation/i.test(d)) return "nonprofit";
  return "default";
}

function generateThemeVariants(description: string): ThemeVariant[] {
  const category = detectCategory(description);

  // Base themes that work for everyone
  const allThemes: ThemeVariant[] = [
    {
      name: "Minimal Light",
      description: "Clean and professional with soft whites",
      colors: { primary: "#111827", secondary: "#6B7280", background: "#FFFFFF", text: "#111827", accent: "#3B82F6" },
      font: "Inter",
      layout: "minimal",
    },
    {
      name: "Dark Professional",
      description: "Sleek and modern with dark backgrounds",
      colors: { primary: "#3B82F6", secondary: "#06B6D4", background: "#0F172A", text: "#F1F5F9", accent: "#22D3EE" },
      font: "Space Grotesk",
      layout: "professional",
    },
    {
      name: "Bold Gradient",
      description: "Eye-catching with vibrant purple and pink",
      colors: { primary: "#7C3AED", secondary: "#EC4899", background: "#0F0F23", text: "#F9FAFB", accent: "#A78BFA" },
      font: "Space Grotesk",
      layout: "bold",
    },
    {
      name: "Warm Sunset",
      description: "Inviting and energetic with warm tones",
      colors: { primary: "#EA580C", secondary: "#F59E0B", background: "#FFFBEB", text: "#292524", accent: "#FB923C" },
      font: "DM Sans",
      layout: "playful",
    },
    {
      name: "Elegant Rose",
      description: "Sophisticated with soft rose and cream",
      colors: { primary: "#BE185D", secondary: "#F472B6", background: "#FFF1F2", text: "#1C1917", accent: "#E11D48" },
      font: "Playfair Display",
      layout: "elegant",
    },
    {
      name: "Nature Fresh",
      description: "Organic and calming with green tones",
      colors: { primary: "#059669", secondary: "#34D399", background: "#ECFDF5", text: "#1E293B", accent: "#10B981" },
      font: "DM Sans",
      layout: "minimal",
    },
  ];

  // Category-specific themes
  const categoryThemes: Record<string, ThemeVariant[]> = {
    faith: [
      {
        name: "Sacred Gold",
        description: "Royal and reverent with gold accents",
        colors: { primary: "#92400E", secondary: "#D97706", background: "#FFFBEB", text: "#1C1917", accent: "#F59E0B" },
        font: "Crimson Pro",
        layout: "elegant",
      },
      {
        name: "Heavenly Blue",
        description: "Peaceful and spiritual with sky tones",
        colors: { primary: "#1E40AF", secondary: "#60A5FA", background: "#EFF6FF", text: "#1E293B", accent: "#3B82F6" },
        font: "Playfair Display",
        layout: "minimal",
      },
    ],
    creative: [
      {
        name: "Studio Dark",
        description: "Dramatic and artistic with contrast",
        colors: { primary: "#E11D48", secondary: "#FB7185", background: "#0C0A09", text: "#FAFAF9", accent: "#F43F5E" },
        font: "Plus Jakarta Sans",
        layout: "bold",
      },
      {
        name: "Gallery White",
        description: "Clean gallery aesthetic with minimal color",
        colors: { primary: "#18181B", secondary: "#71717A", background: "#FAFAFA", text: "#18181B", accent: "#A1A1AA" },
        font: "Outfit",
        layout: "minimal",
      },
    ],
    fitness: [
      {
        name: "Energy Burst",
        description: "High-energy with bold contrast",
        colors: { primary: "#DC2626", secondary: "#F97316", background: "#18181B", text: "#F5F5F5", accent: "#EF4444" },
        font: "Space Grotesk",
        layout: "bold",
      },
      {
        name: "Zen Wellness",
        description: "Calm and balanced for wellness brands",
        colors: { primary: "#0D9488", secondary: "#5EEAD4", background: "#F0FDFA", text: "#134E4A", accent: "#14B8A6" },
        font: "DM Sans",
        layout: "minimal",
      },
    ],
    music: [
      {
        name: "Stage Lights",
        description: "Electric and vibrant like a concert",
        colors: { primary: "#9333EA", secondary: "#F472B6", background: "#0A0118", text: "#F5F3FF", accent: "#C084FC" },
        font: "Space Grotesk",
        layout: "bold",
      },
      {
        name: "Vinyl Classic",
        description: "Retro warmth with analog vibes",
        colors: { primary: "#D97706", secondary: "#FBBF24", background: "#1C1917", text: "#FEF3C7", accent: "#F59E0B" },
        font: "Outfit",
        layout: "playful",
      },
    ],
    tech: [
      {
        name: "Terminal",
        description: "Hacker aesthetic with green on dark",
        colors: { primary: "#22C55E", secondary: "#4ADE80", background: "#030712", text: "#D1FAE5", accent: "#10B981" },
        font: "Space Grotesk",
        layout: "minimal",
      },
      {
        name: "Blueprint",
        description: "Professional tech with blue precision",
        colors: { primary: "#2563EB", secondary: "#60A5FA", background: "#F0F9FF", text: "#0F172A", accent: "#3B82F6" },
        font: "Inter",
        layout: "professional",
      },
    ],
    shop: [
      {
        name: "Luxury Boutique",
        description: "Premium and refined shopping experience",
        colors: { primary: "#1C1917", secondary: "#A16207", background: "#FFFBEB", text: "#1C1917", accent: "#D97706" },
        font: "Playfair Display",
        layout: "elegant",
      },
      {
        name: "Fresh Market",
        description: "Bright and playful for casual shopping",
        colors: { primary: "#059669", secondary: "#F97316", background: "#FFFFFF", text: "#1E293B", accent: "#10B981" },
        font: "DM Sans",
        layout: "playful",
      },
    ],
    food: [
      {
        name: "Kitchen Warm",
        description: "Appetizing and inviting with warm browns",
        colors: { primary: "#92400E", secondary: "#D97706", background: "#FFF7ED", text: "#431407", accent: "#EA580C" },
        font: "DM Sans",
        layout: "playful",
      },
      {
        name: "Fine Dining",
        description: "Elegant and upscale restaurant aesthetic",
        colors: { primary: "#1C1917", secondary: "#78716C", background: "#FAFAF9", text: "#1C1917", accent: "#B91C1C" },
        font: "Playfair Display",
        layout: "elegant",
      },
    ],
    realestate: [
      {
        name: "Property Pro",
        description: "Trust and authority in real estate",
        colors: { primary: "#1E3A5F", secondary: "#3B82F6", background: "#F8FAFC", text: "#0F172A", accent: "#2563EB" },
        font: "Inter",
        layout: "professional",
      },
    ],
    beauty: [
      {
        name: "Blush & Gold",
        description: "Luxurious and feminine beauty aesthetic",
        colors: { primary: "#BE185D", secondary: "#F9A8D4", background: "#FDF2F8", text: "#831843", accent: "#EC4899" },
        font: "Playfair Display",
        layout: "elegant",
      },
    ],
    consulting: [
      {
        name: "Executive",
        description: "Authoritative and trustworthy for consultants",
        colors: { primary: "#0F172A", secondary: "#334155", background: "#F8FAFC", text: "#0F172A", accent: "#2563EB" },
        font: "Inter",
        layout: "professional",
      },
    ],
    education: [
      {
        name: "Campus",
        description: "Friendly and approachable for educators",
        colors: { primary: "#7C3AED", secondary: "#A78BFA", background: "#FAF5FF", text: "#1E1B4B", accent: "#8B5CF6" },
        font: "Plus Jakarta Sans",
        layout: "playful",
      },
    ],
    content: [
      {
        name: "Creator Studio",
        description: "Modern and bold for content creators",
        colors: { primary: "#DC2626", secondary: "#F87171", background: "#18181B", text: "#FAFAFA", accent: "#EF4444" },
        font: "Outfit",
        layout: "bold",
      },
    ],
    travel: [
      {
        name: "Wanderlust",
        description: "Adventurous and free-spirited",
        colors: { primary: "#0891B2", secondary: "#22D3EE", background: "#ECFEFF", text: "#164E63", accent: "#06B6D4" },
        font: "DM Sans",
        layout: "playful",
      },
    ],
    nonprofit: [
      {
        name: "Compassion",
        description: "Warm and trustworthy for causes",
        colors: { primary: "#059669", secondary: "#F59E0B", background: "#FFFFFF", text: "#1E293B", accent: "#10B981" },
        font: "Inter",
        layout: "minimal",
      },
    ],
  };

  // Combine: category-specific first, then universal themes
  const specific = categoryThemes[category] || [];
  const combined = [...specific, ...allThemes];

  // Return max 8 themes, deduplicating by name
  const seen = new Set<string>();
  const result: ThemeVariant[] = [];
  for (const t of combined) {
    if (!seen.has(t.name) && result.length < 8) {
      seen.add(t.name);
      result.push(t);
    }
  }
  return result;
}

function generateFallbackDesign(description: string) {
  const category = detectCategory(description);

  // Extract a name from description
  const nameMatch = description.match(/(?:I'm|I am|my name is|name is)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i);
  const orgMatch = description.match(/(?:founder|lead|ceo|owner|creator|head|director)(?:\s+\w+)?\s+(?:of|at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i);
  const personName = nameMatch?.[1] || "";
  const orgName = orgMatch?.[1] || "";

  interface CategoryProfile {
    layout: string;
    primary: string;
    secondary: string;
    background: string;
    text: string;
    font: string;
    bioTemplate: (name: string) => string;
    ctas: Array<{ title: string; url: string; type: "primary" | "secondary" }>;
    suggestions: string[];
  }

  const profiles: Record<string, CategoryProfile> = {
    faith: {
      layout: "elegant",
      primary: "#7C3AED",
      secondary: "#C084FC",
      background: "#FAF5FF",
      text: "#3B0764",
      font: "Playfair Display",
      bioTemplate: (n) => n ? `${n} - Spreading faith, hope, and love through ministry.` : "Spreading faith, hope, and love through ministry and community.",
      ctas: [
        { title: "Watch Sermons", url: "https://example.com/sermons", type: "primary" },
        { title: "Prayer Requests", url: "https://example.com/prayer", type: "secondary" },
        { title: "Give / Donate", url: "https://example.com/give", type: "secondary" },
        { title: "Join Community", url: "https://example.com/community", type: "secondary" },
      ],
      suggestions: [
        "Add your latest sermon or devotional video",
        "Include a prayer request form to engage your congregation",
        "Add links to your podcast or YouTube channel",
      ],
    },
    creative: {
      layout: "bold",
      primary: "#E11D48",
      secondary: "#FB7185",
      background: "#0C0A09",
      text: "#FAFAF9",
      font: "Space Grotesk",
      bioTemplate: (n) => n ? `${n} - Capturing stories through a creative lens.` : "Capturing stories and moments through a creative lens.",
      ctas: [
        { title: "View Portfolio", url: "https://example.com/portfolio", type: "primary" },
        { title: "Book a Session", url: "https://example.com/book", type: "secondary" },
        { title: "Instagram", url: "https://instagram.com", type: "secondary" },
      ],
      suggestions: [
        "Showcase your best 5-10 pieces in your portfolio link",
        "Add a booking calendar link for client sessions",
        "Include testimonials from past clients",
      ],
    },
    fitness: {
      layout: "bold",
      primary: "#059669",
      secondary: "#34D399",
      background: "#ECFDF5",
      text: "#064E3B",
      font: "DM Sans",
      bioTemplate: (n) => n ? `${n} - Helping you build strength and sustainable habits.` : "Helping you build strength and sustainable healthy habits.",
      ctas: [
        { title: "Free Consultation", url: "https://example.com/consult", type: "primary" },
        { title: "Programs & Pricing", url: "https://example.com/programs", type: "secondary" },
        { title: "Client Results", url: "https://example.com/results", type: "secondary" },
      ],
      suggestions: [
        "Add before/after client transformation photos",
        "Include a free workout or meal plan as a lead magnet",
        "Link to your scheduling app for consultations",
      ],
    },
    music: {
      layout: "bold",
      primary: "#7C3AED",
      secondary: "#A78BFA",
      background: "#1E1033",
      text: "#F5F3FF",
      font: "Space Grotesk",
      bioTemplate: (n) => n ? `${n} - Making music that moves your soul.` : "Making music that moves your soul. New tracks dropping soon.",
      ctas: [
        { title: "Latest Release", url: "https://open.spotify.com", type: "primary" },
        { title: "Tour Dates", url: "https://example.com/tour", type: "secondary" },
        { title: "Merch Store", url: "https://example.com/merch", type: "secondary" },
      ],
      suggestions: [
        "Link directly to your latest single or album on Spotify",
        "Add upcoming show dates and ticket links",
        "Include a pre-save link for unreleased tracks",
      ],
    },
    shop: {
      layout: "elegant",
      primary: "#D97706",
      secondary: "#FBBF24",
      background: "#FFFBEB",
      text: "#78350F",
      font: "Playfair Display",
      bioTemplate: (n) => n ? `${n} - Curated products made with love and care.` : "Curated products made with love, care, and attention to detail.",
      ctas: [
        { title: "Shop All Products", url: "https://example.com/shop", type: "primary" },
        { title: "New Arrivals", url: "https://example.com/new", type: "secondary" },
        { title: "Contact Us", url: "https://example.com/contact", type: "secondary" },
      ],
      suggestions: [
        "Feature your bestselling products prominently",
        "Add a seasonal collection or limited edition link",
        "Include customer reviews and testimonials",
      ],
    },
    tech: {
      layout: "minimal",
      primary: "#2563EB",
      secondary: "#60A5FA",
      background: "#F0F9FF",
      text: "#0F172A",
      font: "Space Grotesk",
      bioTemplate: (n) => n ? `${n} - Building the future with code and innovation.` : "Building the future with code, design, and innovation.",
      ctas: [
        { title: "My Projects", url: "https://github.com", type: "primary" },
        { title: "Blog / Writing", url: "https://example.com/blog", type: "secondary" },
        { title: "Hire Me", url: "https://example.com/contact", type: "secondary" },
      ],
      suggestions: [
        "Pin your best GitHub repositories or live demos",
        "Write about your tech stack and approach",
        "Add a link to your resume or CV",
      ],
    },
    food: {
      layout: "playful",
      primary: "#EA580C",
      secondary: "#FB923C",
      background: "#FFF7ED",
      text: "#431407",
      font: "DM Sans",
      bioTemplate: (n) => n ? `${n} - Serving delicious food that brings people together.` : "Serving delicious food that brings people together.",
      ctas: [
        { title: "View Menu", url: "https://example.com/menu", type: "primary" },
        { title: "Order Online", url: "https://example.com/order", type: "primary" },
        { title: "Reservations", url: "https://example.com/reserve", type: "secondary" },
      ],
      suggestions: [
        "Add mouth-watering food photography to your profile",
        "Include delivery app links (UberEats, DoorDash)",
        "Feature weekly specials or seasonal menus",
      ],
    },
    realestate: {
      layout: "professional",
      primary: "#1E3A5F",
      secondary: "#3B82F6",
      background: "#F8FAFC",
      text: "#0F172A",
      font: "Inter",
      bioTemplate: (n) => n ? `${n} - Your trusted partner in finding the perfect home.` : "Your trusted real estate partner for buying and selling homes.",
      ctas: [
        { title: "View Listings", url: "https://example.com/listings", type: "primary" },
        { title: "Schedule a Showing", url: "https://example.com/schedule", type: "secondary" },
        { title: "Market Report", url: "https://example.com/report", type: "secondary" },
      ],
      suggestions: [
        "Showcase your latest property listings with photos",
        "Include a home valuation tool link",
        "Add client testimonials and success stories",
      ],
    },
    beauty: {
      layout: "elegant",
      primary: "#BE185D",
      secondary: "#F9A8D4",
      background: "#FDF2F8",
      text: "#831843",
      font: "Playfair Display",
      bioTemplate: (n) => n ? `${n} - Helping you look and feel your absolute best.` : "Helping you look and feel your absolute best, inside and out.",
      ctas: [
        { title: "Book Appointment", url: "https://example.com/book", type: "primary" },
        { title: "Services & Pricing", url: "https://example.com/services", type: "secondary" },
        { title: "Before & After", url: "https://example.com/gallery", type: "secondary" },
      ],
      suggestions: [
        "Add before/after transformation photos",
        "Link to your online booking system",
        "Feature your most popular services prominently",
      ],
    },
    consulting: {
      layout: "professional",
      primary: "#0F172A",
      secondary: "#334155",
      background: "#F8FAFC",
      text: "#0F172A",
      font: "Inter",
      bioTemplate: (n) => n ? `${n} - Helping businesses grow with strategic expertise.` : "Helping businesses and individuals achieve breakthrough results.",
      ctas: [
        { title: "Book a Call", url: "https://example.com/call", type: "primary" },
        { title: "Services", url: "https://example.com/services", type: "secondary" },
        { title: "Testimonials", url: "https://example.com/testimonials", type: "secondary" },
      ],
      suggestions: [
        "Add case studies showcasing client results",
        "Include a free resource or lead magnet",
        "Feature logos of companies you have worked with",
      ],
    },
    education: {
      layout: "playful",
      primary: "#7C3AED",
      secondary: "#A78BFA",
      background: "#FAF5FF",
      text: "#1E1B4B",
      font: "Plus Jakarta Sans",
      bioTemplate: (n) => n ? `${n} - Empowering learners to reach their full potential.` : "Empowering learners to reach their full potential.",
      ctas: [
        { title: "Browse Courses", url: "https://example.com/courses", type: "primary" },
        { title: "Free Resources", url: "https://example.com/free", type: "secondary" },
        { title: "Student Reviews", url: "https://example.com/reviews", type: "secondary" },
      ],
      suggestions: [
        "Offer a free introductory lesson or resource",
        "Add student testimonials and success stories",
        "Link to your course platform directly",
      ],
    },
    art: {
      layout: "elegant",
      primary: "#DC2626",
      secondary: "#FCA5A5",
      background: "#FAFAF9",
      text: "#1C1917",
      font: "Playfair Display",
      bioTemplate: (n) => n ? `${n} - Creating art that tells stories and sparks emotion.` : "Creating art that tells stories and sparks emotion.",
      ctas: [
        { title: "View Gallery", url: "https://example.com/gallery", type: "primary" },
        { title: "Commission Work", url: "https://example.com/commission", type: "secondary" },
        { title: "Shop Prints", url: "https://example.com/prints", type: "secondary" },
      ],
      suggestions: [
        "Curate your best 10-15 pieces in an online gallery",
        "Add a commission request form with pricing tiers",
        "Link to your art prints store",
      ],
    },
    content: {
      layout: "bold",
      primary: "#DC2626",
      secondary: "#F87171",
      background: "#18181B",
      text: "#FAFAFA",
      font: "Outfit",
      bioTemplate: (n) => n ? `${n} - Creating content that inspires and entertains.` : "Creating content that inspires, educates, and entertains.",
      ctas: [
        { title: "Latest Content", url: "https://example.com/latest", type: "primary" },
        { title: "Collaborate With Me", url: "https://example.com/collab", type: "secondary" },
        { title: "Subscribe", url: "https://example.com/subscribe", type: "secondary" },
      ],
      suggestions: [
        "Pin your most viral or popular content piece",
        "Add a media kit link for brand collaborations",
        "Include a newsletter signup for your audience",
      ],
    },
    travel: {
      layout: "playful",
      primary: "#0891B2",
      secondary: "#22D3EE",
      background: "#ECFEFF",
      text: "#164E63",
      font: "DM Sans",
      bioTemplate: (n) => n ? `${n} - Exploring the world one adventure at a time.` : "Exploring the world one adventure at a time. Come along!",
      ctas: [
        { title: "Travel Guides", url: "https://example.com/guides", type: "primary" },
        { title: "Book a Trip", url: "https://example.com/book", type: "secondary" },
        { title: "Photo Gallery", url: "https://example.com/gallery", type: "secondary" },
      ],
      suggestions: [
        "Share your top destination guides with practical tips",
        "Add affiliate links to travel gear you recommend",
        "Include a trip planning consultation link",
      ],
    },
    nonprofit: {
      layout: "minimal",
      primary: "#059669",
      secondary: "#F59E0B",
      background: "#FFFFFF",
      text: "#1E293B",
      font: "Inter",
      bioTemplate: (n) => n ? `${n} - Making a difference in our community, together.` : "Making a difference in our community, one step at a time.",
      ctas: [
        { title: "Donate Now", url: "https://example.com/donate", type: "primary" },
        { title: "Volunteer", url: "https://example.com/volunteer", type: "secondary" },
        { title: "Our Impact", url: "https://example.com/impact", type: "secondary" },
      ],
      suggestions: [
        "Show your impact with numbers and stories",
        "Make the donate button prominent and easy to find",
        "Add a volunteer signup form link",
      ],
    },
    default: {
      layout: "professional",
      primary: "#7C3AED",
      secondary: "#A78BFA",
      background: "#FAF5FF",
      text: "#1E1B4B",
      font: "Inter",
      bioTemplate: (n) => n ? `${n} - Building something extraordinary, one step at a time.` : "Building something extraordinary, one step at a time.",
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
    },
  };

  const profile = profiles[category] || profiles.default;
  const displayName = orgName || personName || "";
  const bio = profile.bioTemplate(displayName).slice(0, 150);

  return {
    bio,
    colors: {
      primary: profile.primary,
      secondary: profile.secondary,
      background: profile.background,
      text: profile.text,
      accent: profile.secondary,
    },
    layout: profile.layout,
    font: profile.font,
    ctas: profile.ctas,
    suggestions: profile.suggestions,
  };
}
