import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ChevronRight, ChevronDown, BookOpen, Rocket, Palette, Link2, Radio, Wand2, BarChart3, Store, Share2, HelpCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";

// ── Documentation Data ─────────────────────────────────────────────────────

interface DocArticle {
  id: string;
  title: string;
  content: string;
  tags?: string[];
}

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  articles: DocArticle[];
}

const docs: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    color: "text-emerald-500",
    articles: [
      {
        id: "welcome",
        title: "Welcome to Share The Link",
        tags: ["intro", "overview", "about"],
        content: `Share The Link is the first link-in-bio platform with built-in live streaming for entrepreneurs. Create a beautiful page for all your links, go live with one click, and grow your business — all in one platform.

**Key Features:**
- Unlimited links in one page
- Built-in live streaming with chat and tips
- AI page builder (30-second setup)
- Accept tips and payments (2% platform fee)
- Advanced analytics dashboard
- Full customization with themes

**Who is it for?**
- Entrepreneurs building in public
- Content creators monetizing their audience
- Coaches and consultants
- Small business owners
- Freelancers and solopreneurs
- Churches and ministries`,
      },
      {
        id: "quick-start",
        title: "Quick Start Guide (5 Minutes)",
        tags: ["setup", "first", "begin", "account"],
        content: `Get up and running with Share The Link in 5 minutes.

**Step 1: Create Your Account (1 min)**
1. Go to sharethelink.app
2. Click "Sign Up"
3. Sign up with Google or Apple for instant access, OR enter your email and create a password
4. If using email, verify your email — you're in!

You can also sign up with Google or Apple for one-click instant access.

**Step 2: Build Your Page (2 min)**
Option A — AI Builder (Recommended):
1. Click "Create with AI" or go to AI Builder from the sidebar
2. Describe your business in 2-3 sentences
3. AI generates your complete page in 30 seconds
4. Review, pick a theme, and customize
5. Publish!

Option B — Manual Builder:
1. Go to Dashboard and start adding links
2. Customize your appearance from the Appearance page
3. Publish when ready

**Step 3: Add Your First Link (1 min)**
1. Click "Add Link" on the Links page
2. Enter the URL and a title
3. Click Save — your link is live!

**Step 4: Share Your Page (30 sec)**
1. Click the Share button on your dashboard
2. Copy your unique link: sharethelink.app/yourname
3. Paste it on social media, email signatures, anywhere

**Step 5: Go Live (Optional)**
1. Click "Go Live" from the Live Streaming page
2. Allow camera and microphone access
3. Enter a stream title and start streaming`,
      },
      {
        id: "creating-account",
        title: "Creating Your Account",
        tags: ["signup", "register", "login", "password", "email"],
        content: `**Signup Methods:**

Email and Password (Standard):
- Enter your email address
- Create a password (8+ characters, include a number or symbol)
- Check your inbox for a confirmation link
- Click the link to verify

Social Login (Faster):
- Google (one-click sign up and login)
- Apple (one-click sign up and login — keeps your email private if you choose)

**Profile Setup:**

Required fields:
- Display name (appears on your page)
- Username (your unique URL — e.g. sharethelink.app/yourname)

Optional fields:
- Profile photo
- Bio/description
- Location
- Website URL
- Social media links

**Username Guidelines:**
- 3-30 characters
- Letters, numbers, and underscores only
- Cannot start with a number
- Must be unique
- Tip: Match your social media handle for consistency`,
      },
      {
        id: "dashboard",
        title: "Understanding the Dashboard",
        tags: ["navigation", "sidebar", "overview", "home"],
        content: `The dashboard is your home base. Here's what you'll find:

**Sidebar Navigation:**
- Dashboard — Overview with quick stats and recent activity
- Links — Add, edit, organize, and schedule your links
- Live Streaming — Go live, manage past streams, view stream analytics
- Media — Browse and manage your stream recordings
- AI Builder — Generate or redesign your profile page with AI
- My Shop — List products and services for your audience
- Appearance — Customize your theme, colors, fonts, layout
- Analytics — Track views, clicks, and visitor insights
- Settings — Account, billing, custom domain, security
- Help — FAQs, video tutorials, and support contact

**Quick Stats (Dashboard Home):**
- Total page views (all-time)
- Link clicks (last 30 days)
- Total streams and tips earned
- Top performing link

**Quick Actions:**
- Add a new link
- Go live
- Share your page
- View analytics`,
      },
    ],
  },
  {
    id: "building-pages",
    title: "Building Your Page",
    icon: Palette,
    color: "text-violet-500",
    articles: [
      {
        id: "ai-builder",
        title: "AI Page Builder",
        tags: ["ai", "generate", "automatic", "smart", "bot"],
        content: `The AI Page Builder generates a complete, professional page in 30 seconds.

**How It Works:**
1. Go to AI Builder from the sidebar
2. Describe your business in 2-3 sentences
3. Optionally paste your website URL for the AI to pull real info
4. Click "Generate with AI"
5. The AI creates a bio, links, color scheme, and layout
6. Choose from multiple theme variants
7. Customize anything you want, then apply

**Tips for Better Results:**

Be specific:
- Instead of "I'm a coach" say "I'm a business coach helping first-time founders launch their startups"

Mention your niche:
- Instead of "I help people" say "I help remote workers stay healthy with 30-minute home workouts"

State a clear goal:
- Instead of "I want visitors to engage" say "I want visitors to book a 15-minute discovery call"

**Theme Selection:**
After generation, you'll see 6 theme variants:
- Minimal Light — Clean and simple
- Bold Gradient — High energy, colorful
- Warm Sunset — Warm tones, inviting
- Dark Professional — Sleek and modern
- Elegant Rose — Soft and refined
- Nature Fresh — Green and organic

Click any theme to preview it, then click Apply to save.`,
      },
      {
        id: "customization",
        title: "Customizing Your Design",
        tags: ["theme", "colors", "fonts", "layout", "design", "appearance"],
        content: `Go to Appearance in the sidebar to customize your page.

**Color Settings:**
- Primary color — Your main brand color (buttons, links, accents)
- Secondary color — Supporting hover states, borders, icons
- Background — Solid color, gradient, pattern, animated effects, or custom background image
- Text color — Auto adjusts for contrast, or pick manually

**Typography:**
Choose from 20+ fonts:
- Inter (modern, clean)
- Poppins (friendly, rounded)
- Playfair Display (elegant, serif)
- Montserrat (geometric, bold)

Font sizes: Small, Medium (default), or Large.

**Layout Options:**
- Single column — One link per row (best for most use cases)
- Two columns — More compact, great for 6-12 links
- Grid (3 columns) — Visual links with images
- Masonry — Pinterest-style, varied heights

All layouts automatically adapt to single column on mobile.

**Button Styles:**
Shapes: Rounded, Square, Pill, Custom border-radius
Sizes: Small (32px), Medium (48px), Large (64px)
Styles: Filled, Outlined, Minimal, Shadow, 3D
Animations: None, Fade, Lift, Glow, Pulse

**Background Image:**
Upload your own background image for a fully personalized profile:
- Supported formats: JPG, PNG, WebP, GIF
- Maximum file size: 5MB
- The image will cover the entire profile background
- Works with all button styles and text colors
- Go to Appearance → Wallpaper → Image to upload`,
      },
      {
        id: "templates",
        title: "Choosing a Template",
        tags: ["template", "presets", "starter"],
        content: `Templates give you a head start. Choose one and customize from there.

**Available Templates:**

Minimal — Clean, simple, text-focused. Great for personal brands, writers, and photographers.

Bold — Large buttons, high contrast. Great for course creators, event promoters, and product launches.

Creative — Unique layouts, visual elements. Great for designers, illustrators, and fashion brands.

Professional — Conservative design, trust-building. Great for consultants, lawyers, and B2B services.

Ecommerce — Product grids, price displays, buy buttons. Great for online stores, digital products, and merch sellers.

Blank — Start from scratch with full control.

All templates are fully customizable — you can change every color, font, layout, and section.`,
      },
    ],
  },
  {
    id: "managing-links",
    title: "Managing Links",
    icon: Link2,
    color: "text-blue-500",
    articles: [
      {
        id: "adding-links",
        title: "Adding and Editing Links",
        tags: ["add", "edit", "url", "create", "button"],
        content: `**Adding a Link:**
1. Go to the Links page from the sidebar
2. Click "Add Link"
3. Enter the URL (e.g. https://yourwebsite.com)
4. Add a title (e.g. "My Website")
5. Optional: add a description, icon, or thumbnail
6. Click Save

**Editing a Link:**
- Click the pencil icon on any link to edit
- Change the URL, title, description, or icon
- Click Save to update

**Deleting a Link:**
- Click the trash icon on any link
- Confirm deletion

**Reordering Links:**
- Drag and drop links to rearrange their order
- The order is saved automatically

**Link Types:**
- URL — Any web address
- Email — Opens the user's email client
- Phone — Opens the phone dialer
- Social — Auto-detected icon for major platforms

You can add unlimited links on all plans.`,
      },
      {
        id: "link-analytics",
        title: "Link Analytics",
        tags: ["clicks", "views", "stats", "performance", "tracking"],
        content: `Track how your links are performing from the Analytics page.

**What You Can See:**
- Total clicks per link
- Click-through rate (CTR)
- Views over time (7, 30, or 90 days)
- Top-performing links ranked by clicks
- Visitor countries and devices

**Link-Level Stats:**
Each link shows its click count on the Links page. For deeper insights, go to Analytics.

**Tips:**
- Put your most important link at the top — it gets the most clicks
- Links with thumbnails/images get 2-3x more clicks
- Use clear, action-oriented titles like "Book a Call" instead of "Click Here"`,
      },
    ],
  },
  {
    id: "live-streaming",
    title: "Live Streaming",
    icon: Radio,
    color: "text-red-500",
    articles: [
      {
        id: "going-live",
        title: "Going Live",
        tags: ["stream", "broadcast", "camera", "video", "live"],
        content: `Share The Link has built-in live streaming — no third-party tools needed.

**How to Go Live:**
1. Go to Live Streaming from the sidebar
2. Click "Go Live"
3. Allow camera and microphone access
4. Enter a stream title and optional description
5. Click "Start Streaming"
6. You're live!

**During Your Stream:**
- Viewers can join from your public profile page
- Real-time chat lets your audience interact
- Viewers can send tips (you set a minimum amount)
- You can see live viewer count
- PiP (Picture-in-Picture) mini-player keeps the stream visible as viewers navigate

**Ending Your Stream:**
- Click "End Stream" when you're done
- A recording is automatically saved to your Media page
- Stream stats (viewers, tips, duration) are recorded

**Sharing Your Live Stream:**
Your live stream URL is: sharethelink.app/live/yourusername
Share it on social media to invite viewers.`,
      },
      {
        id: "recordings",
        title: "Recordings and Media",
        tags: ["recording", "vod", "replay", "media", "video"],
        content: `When you end a live stream, a recording is automatically saved.

**Accessing Your Recordings:**
1. Go to Media from the sidebar
2. You'll see all your past recordings with thumbnails
3. Click any recording to play it
4. Toggle visibility between Public and Private

**Recording Details:**
Each recording shows:
- Title (from your stream title)
- Date and duration
- View count
- Visibility status

**Managing Recordings:**
- Change visibility: Public recordings appear on the public Media page for anyone to browse. Private recordings are only visible to you.
- Delete: Remove recordings you no longer want.

**Public Media Page:**
Visitors can browse public recordings at sharethelink.app/media with filters for All, Live Now, Recent, and Trending.`,
      },
    ],
  },
  {
    id: "ai-tools",
    title: "AI Builder",
    icon: Wand2,
    color: "text-amber-500",
    articles: [
      {
        id: "ai-overview",
        title: "AI Tools Overview",
        tags: ["ai", "artificial intelligence", "automation"],
        content: `Share The Link uses AI to help you build and optimize your page.

**AI Page Builder:**
Describe your business and AI generates a complete profile with bio, links, theme, and layout. Choose from 6 theme variants after generation.

**Web Retrieval:**
Paste your website URL and the AI pulls real information about your business to generate a more accurate profile.

**Smart Suggestions:**
The AI analyzes your industry and audience to suggest:
- Relevant link titles and CTAs
- Color schemes that match your brand
- Layout styles that work for your niche
- Bio copy that converts visitors

**How to Access:**
Go to AI Builder from the sidebar, or try it on the homepage without signing up.`,
      },
    ],
  },
  {
    id: "my-shop",
    title: "My Shop",
    icon: Store,
    color: "text-orange-500",
    articles: [
      {
        id: "shop-setup",
        title: "Setting Up Your Shop",
        tags: ["products", "sell", "ecommerce", "store", "catalog"],
        content: `My Shop lets you list products and services directly on your profile.

**Adding a Product:**
1. Go to My Shop from the sidebar
2. Click "Add Product"
3. Fill in the details:
   - Name (required)
   - Description
   - Price
   - Category (Digital Product, Physical Product, Service, etc.)
   - Image URL
   - Purchase/External Link (e.g. Gumroad, Shopify, Etsy)
4. Click Save

**Managing Products:**
- Toggle products on/off with the active switch
- Edit any product by clicking the edit icon
- Delete products you no longer sell
- View your total catalog value and product count

**Your Storefront:**
Your products appear on your public profile page. Visitors can browse and click through to your purchase link.

**Tip:** Add a compelling image and clear description. Products with images get significantly more clicks.`,
      },
    ],
  },
  {
    id: "auto-share",
    title: "Auto-Share Links",
    icon: Share2,
    color: "text-pink-500",
    articles: [
      {
        id: "auto-share-setup",
        title: "Scheduling Auto-Shares",
        tags: ["schedule", "social media", "twitter", "facebook", "linkedin", "whatsapp"],
        content: `Auto-Share lets you schedule your links to be shared on social media automatically.

**How to Schedule:**
1. Go to the Links page
2. Scroll down to "Auto-Share Links" section
3. Click "Schedule Share"
4. Select the link you want to share
5. Choose one or more platforms: Twitter/X, Facebook, LinkedIn, WhatsApp, Email
6. Add an optional message
7. Set the date and time
8. Click "Schedule"

**Supported Platforms:**
- Twitter / X
- Facebook
- LinkedIn
- WhatsApp
- Email

**Quick Share:**
Below the Schedule dialog, you'll see Quick Share buttons for each of your links. Click any platform icon to share immediately.

**Managing Scheduled Shares:**
- View all scheduled shares in the Auto-Share section
- Cancel a scheduled share before it posts
- See the status of each share (Scheduled, Posted, Cancelled)`,
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: BarChart3,
    color: "text-cyan-500",
    articles: [
      {
        id: "analytics-overview",
        title: "Analytics Dashboard",
        tags: ["stats", "data", "visitors", "performance", "reports"],
        content: `The Analytics page gives you a complete picture of how your page is performing.

**Overview Stats:**
- Total page views
- Total link clicks
- Click-through rate
- Unique visitors

**Charts:**
- Views over time (7, 30, or 90 days)
- Clicks by link
- Top referrers
- Device breakdown (mobile vs desktop)

**Link Performance:**
See which links get the most clicks. Use this to:
- Put top-performing links at the top of your page
- Remove or improve links that aren't getting clicks
- A/B test different titles and descriptions

**Stream Analytics:**
- Total streams
- Peak concurrent viewers
- Total tips earned
- Average stream duration

**Tip:** Check analytics weekly and optimize. Move high-performing links up, rewrite low-performing ones.`,
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Help and FAQ",
    icon: HelpCircle,
    color: "text-gray-500",
    articles: [
      {
        id: "faq",
        title: "Frequently Asked Questions",
        tags: ["help", "support", "questions", "common", "issues"],
        content: `**Q: Is Share The Link free?**
A: Yes! The free plan includes unlimited links, basic analytics, and live streaming. Pro features like custom domains and advanced analytics require a paid plan.

**Q: How do I change my username?**
A: Go to Settings from the sidebar and update your username. Note that your old URL will no longer work after the change.

**Q: Can I use my own domain?**
A: Yes, on the Pro plan. Go to Settings > Custom Domain, add a CNAME record pointing to sharethelink.app, and we'll configure it with a free SSL certificate.

**Q: How do I accept tips during live streams?**
A: Connect your Stripe account in Settings > Payments. Once connected, viewers can send tips during your live streams. Share The Link takes a 2% platform fee.

**Q: My stream isn't loading. What do I do?**
A: Check these things:
1. Allow camera and microphone access in your browser
2. Use a modern browser (Chrome, Firefox, Edge)
3. Check your internet connection (minimum 5 Mbps upload)
4. Try refreshing the page
5. If the issue persists, contact support

**Q: How do I delete my account?**
A: Go to Settings > Account > Delete Account. This action is permanent and cannot be undone.

**Q: How do I contact support?**
A: Go to Help from the sidebar, or email support@sharethelink.com. You can also reach us on Twitter @sharethelink.`,
      },
      {
        id: "troubleshooting",
        title: "Troubleshooting Common Issues",
        tags: ["bug", "error", "fix", "broken", "problem"],
        content: `**Page Not Loading:**
- Clear your browser cache (Ctrl+Shift+Delete)
- Try a different browser
- Disable browser extensions temporarily
- Check if sharethelink.app is down (rare)

**Links Not Saving:**
- Check your internet connection
- Make sure the URL is valid (starts with http:// or https://)
- Try refreshing the page and adding again
- If the error persists, try logging out and back in

**Stream Quality Issues:**
- Ensure at least 5 Mbps upload speed
- Close other bandwidth-heavy applications
- Use a wired connection if possible
- Lower your camera resolution in stream settings
- Check CPU usage — close unnecessary tabs

**Payment/Tip Issues:**
- Verify your Stripe account is fully set up
- Check that your Stripe account is in good standing
- Ensure the viewer's payment method is valid
- Contact support if tips aren't appearing in your balance

**Profile Not Appearing in Search:**
- Make sure your profile is set to Public
- Add a complete bio with relevant keywords
- Allow 24-48 hours for search indexing
- Share your link on social media to boost visibility

**Still Stuck?**
Email support@sharethelink.com with:
- Your username
- Browser and device info
- Screenshots of the issue
- Steps to reproduce the problem`,
      },
    ],
  },
];

// ── Components ──────────────────────────────────────────────────────────────

function DocsSidebar({
  sections,
  activeArticle,
  onSelect,
  searchQuery,
  onSearchChange,
  expandedSections,
  onToggleSection,
}: {
  sections: DocSection[];
  activeArticle: string;
  onSelect: (sectionId: string, articleId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  expandedSections: Set<string>;
  onToggleSection: (id: string) => void;
}) {
  return (
    <aside className="w-72 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.id);
          const hasActiveChild = section.articles.some((a) => a.id === activeArticle);

          return (
            <div key={section.id}>
              <button
                onClick={() => onToggleSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  hasActiveChild
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${section.color}`} />
                <span className="flex-1 text-left truncate">{section.title}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-5 pl-4 border-l border-border/60 mt-1 mb-2 space-y-0.5">
                  {section.articles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => onSelect(section.id, article.id)}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                        activeArticle === article.id
                          ? "text-foreground bg-primary/10 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {article.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileSidebar({
  sections,
  activeArticle,
  onSelect,
  searchQuery,
  onSearchChange,
  expandedSections,
  onToggleSection,
  isOpen,
  onClose,
}: {
  sections: DocSection[];
  activeArticle: string;
  onSelect: (sectionId: string, articleId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  expandedSections: Set<string>;
  onToggleSection: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-80 bg-background shadow-xl">
        <DocsSidebar
          sections={sections}
          activeArticle={activeArticle}
          onSelect={(s, a) => {
            onSelect(s, a);
            onClose();
          }}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          expandedSections={expandedSections}
          onToggleSection={onToggleSection}
        />
      </div>
    </div>
  );
}

// Simple markdown-ish renderer
function RenderContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        if (!trimmed) return <div key={i} className="h-3" />;

        // Headings
        if (trimmed.startsWith("**Q:")) {
          return (
            <p key={i} className="font-semibold text-foreground mt-5 mb-1">
              {trimmed.replace(/\*\*/g, "")}
            </p>
          );
        }
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <h3 key={i} className="text-base font-semibold text-foreground mt-6 mb-2">
              {trimmed.replace(/\*\*/g, "")}
            </h3>
          );
        }

        // Bold sections within a line
        if (trimmed.includes("**")) {
          const parts = trimmed.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="text-muted-foreground leading-relaxed mb-1">
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j} className="text-foreground font-medium">
                    {part}
                  </strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          );
        }

        // List items
        if (trimmed.startsWith("- ") || trimmed.match(/^\d+\.\s/)) {
          const text = trimmed.replace(/^[-\d.]+\s/, "");
          const isNumbered = trimmed.match(/^(\d+)\./);
          return (
            <div key={i} className="flex gap-2 ml-4 mb-1">
              <span className="text-muted-foreground flex-shrink-0 mt-0.5">
                {isNumbered ? `${isNumbered[1]}.` : "\u2022"}
              </span>
              <span className="text-muted-foreground leading-relaxed">{text}</span>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="text-muted-foreground leading-relaxed mb-1">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const initialSection = searchParams.get("section") || docs[0].id;
  const initialArticle = searchParams.get("article") || docs[0].articles[0].id;

  const [activeSection, setActiveSection] = useState(initialSection);
  const [activeArticle, setActiveArticle] = useState(initialArticle);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set([initialSection])
  );

  // Filter sections/articles based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return docs;
    const q = searchQuery.toLowerCase();
    return docs
      .map((section) => ({
        ...section,
        articles: section.articles.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.content.toLowerCase().includes(q) ||
            a.tags?.some((t) => t.includes(q))
        ),
      }))
      .filter((s) => s.articles.length > 0);
  }, [searchQuery]);

  // When search query changes, expand matching sections
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedSections(new Set(filteredSections.map((s) => s.id)));
    }
  }, [searchQuery, filteredSections]);

  const currentSection = docs.find((s) => s.id === activeSection);
  const currentArticle = currentSection?.articles.find((a) => a.id === activeArticle);

  // Find prev/next articles for navigation
  const allArticles = docs.flatMap((s) => s.articles.map((a) => ({ ...a, sectionId: s.id, sectionTitle: s.title })));
  const currentIdx = allArticles.findIndex((a) => a.id === activeArticle);
  const prevArticle = currentIdx > 0 ? allArticles[currentIdx - 1] : null;
  const nextArticle = currentIdx < allArticles.length - 1 ? allArticles[currentIdx + 1] : null;

  const handleSelect = (sectionId: string, articleId: string) => {
    setActiveSection(sectionId);
    setActiveArticle(articleId);
    setSearchParams({ section: sectionId, article: articleId });
    window.scrollTo({ top: 0 });
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex-shrink-0">
              <Logo textClassName="text-foreground" size="sm" />
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>/</span>
              <Badge variant="secondary" className="font-medium gap-1.5">
                <BookOpen className="w-3 h-3" />
                Documentation
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Back to Home
              </Link>
            </Button>
            <Button size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/signup">
                Get Started
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <DocsSidebar
            sections={filteredSections}
            activeArticle={activeArticle}
            onSelect={handleSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
          />
        </div>

        {/* Mobile Sidebar */}
        <MobileSidebar
          sections={filteredSections}
          activeArticle={activeArticle}
          onSelect={handleSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10">
            {currentArticle ? (
              <>
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <button
                    onClick={() => toggleSection(activeSection)}
                    className="hover:text-foreground transition-colors"
                  >
                    {currentSection?.title}
                  </button>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-foreground font-medium">{currentArticle.title}</span>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-foreground mb-8 text-balance">
                  {currentArticle.title}
                </h1>

                {/* Content */}
                <RenderContent content={currentArticle.content} />

                {/* Prev/Next Navigation */}
                <div className="flex items-center justify-between mt-16 pt-6 border-t border-border gap-4">
                  {prevArticle ? (
                    <button
                      onClick={() => handleSelect(prevArticle.sectionId, prevArticle.id)}
                      className="flex flex-col items-start gap-1 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors flex-1 text-left"
                    >
                      <span className="text-xs text-muted-foreground">Previous</span>
                      <span className="text-sm font-medium text-foreground">{prevArticle.title}</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  {nextArticle ? (
                    <button
                      onClick={() => handleSelect(nextArticle.sectionId, nextArticle.id)}
                      className="flex flex-col items-end gap-1 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors flex-1 text-right"
                    >
                      <span className="text-xs text-muted-foreground">Next</span>
                      <span className="text-sm font-medium text-foreground">{nextArticle.title}</span>
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No article selected
                </h2>
                <p className="text-muted-foreground">
                  Choose a topic from the sidebar to get started.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
