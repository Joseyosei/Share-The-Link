const BOT_USER_AGENTS = [
  "googlebot",
  "bingbot",
  "applebot",
  "yandexbot",
  "duckduckbot",
  "baiduspider",
  "twitterbot",
  "facebookexternalhit",
  "linkedinbot",
  "slackbot",
  "whatsapp",
  "telegrambot",
  "discordbot",
  "pinterestbot",
  "petalbot",
  "semrushbot",
  "ahrefsbot",
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}

const PRERENDERED_PAGES: Record<string, { title: string; description: string; content: string }> = {
  "/": {
    title: "Share The Link - Free Link in Bio Platform for Creators",
    description: "The ultimate link-in-bio platform for founders and creators. Showcase your products, content, and brand in one beautiful page. Free forever plan.",
    content: `
      <h1>One link to share everything you create</h1>
      <p>The ultimate link-in-bio platform for founders and creators. Showcase your products, content, and brand in one beautiful page.</p>
      <p>No credit card required. Free forever plan.</p>

      <h2>How It Works</h2>
      <ol>
        <li><strong>AI Generates Your Page</strong> - Describe your campaign. AI builds a beautiful, conversion-optimized page instantly.</li>
        <li><strong>Share to 7 Platforms</strong> - One click distributes to Instagram, TikTok, X, LinkedIn, Facebook, WhatsApp and Telegram.</li>
        <li><strong>Go Live and Monetize</strong> - Stream live to your audience. Accept tips with a 90/10 creator-first split.</li>
      </ol>

      <h2>Why Share The Link</h2>
      <ul>
        <li><strong>AI Page Builder</strong> - Describe your business and get a professional page in 30 seconds.</li>
        <li><strong>One-Click Distribution</strong> - Share to 7 platforms with a single click.</li>
        <li><strong>Built-in Live Streaming</strong> - Stream directly from your dashboard with real-time chat and tips.</li>
        <li><strong>One Link, Everything</strong> - Share all your products, content, and social profiles in one beautiful page.</li>
        <li><strong>Built for Entrepreneurs</strong> - Sell products directly with zero transaction fees.</li>
        <li><strong>No Ads, Ever</strong> - Your profile stays clean and professional.</li>
        <li><strong>Lightning Fast</strong> - Sub-second page loads worldwide.</li>
        <li><strong>Advanced Analytics</strong> - Track clicks, views, and conversions with detailed insights.</li>
      </ul>

      <h2>Ready to share everything with one link?</h2>
      <p>Join thousands of creators and entrepreneurs who use Share The Link to grow their audience and monetize their content.</p>
      <a href="/signup">Start for Free</a> | <a href="/pricing">View Pricing</a>
    `,
  },
  "/pricing": {
    title: "Pricing - Share The Link",
    description: "Simple, transparent pricing. Start free and upgrade as you grow. No hidden fees, cancel anytime. Free, Pro ($7/mo), Business ($23/mo), and Enterprise plans.",
    content: `
      <h1>Choose your plan</h1>
      <p>Start free and upgrade as you grow. No hidden fees, cancel anytime.</p>

      <h2>Free Plan - Free forever</h2>
      <ul>
        <li>Unlimited links</li>
        <li>Social icons</li>
        <li>Basic themes</li>
        <li>Basic click tracking</li>
        <li>Email support</li>
        <li>SSL certificate</li>
      </ul>

      <h2>Pro Plan - $7/month</h2>
      <ul>
        <li>Everything in Free, plus:</li>
        <li>Video embeds</li>
        <li>Custom colors and fonts</li>
        <li>Custom backgrounds</li>
        <li>Remove branding</li>
        <li>Device breakdown analytics</li>
        <li>Geographic data</li>
        <li>Conversion tracking</li>
        <li>Priority support</li>
        <li>Tip jar and donations</li>
      </ul>

      <h2>Business Plan - $23/month</h2>
      <ul>
        <li>Everything in Pro, plus:</li>
        <li>Product showcases</li>
        <li>Link scheduling</li>
        <li>Custom CSS</li>
        <li>Export data (CSV)</li>
        <li>API access</li>
        <li>Custom domain</li>
        <li>Digital product sales</li>
        <li>0% transaction fees</li>
        <li>Unlimited team members</li>
      </ul>

      <h2>Enterprise Plan - Custom pricing</h2>
      <ul>
        <li>Everything in Business, plus:</li>
        <li>White-label solution</li>
        <li>SSO/SAML</li>
        <li>Custom contracts</li>
        <li>SLA guarantee</li>
        <li>Dedicated account manager</li>
      </ul>

      <p>Secure payments powered by Stripe. Cancel anytime.</p>
      <a href="/signup">Start for Free</a> | <a href="/contact">Contact Sales</a>
    `,
  },
  "/features": {
    title: "Features - Share The Link",
    description: "Powerful features for modern creators. Analytics, custom themes, live streaming, AI page builder, media hub, auto-share, and more. Everything you need to grow.",
    content: `
      <h1>Powerful features for modern creators</h1>
      <p>From analytics to customization, we've built everything you need to grow your audience and monetize your content.</p>

      <h2>One Link, Everything</h2>
      <p>Share all your products, content, and social profiles in one beautiful, customizable page that represents your brand.</p>

      <h2>Built for Entrepreneurs</h2>
      <p>Sell products directly through your profile with zero transaction fees. Integrate with your favorite e-commerce tools.</p>

      <h2>No Ads, Ever</h2>
      <p>Your profile stays clean and professional. We never show ads to your visitors.</p>

      <h2>Lightning Fast</h2>
      <p>Optimized for speed. Your visitors get instant access to your content with sub-second page loads worldwide.</p>

      <h2>Advanced Analytics</h2>
      <p>Track clicks, views, and conversions with detailed insights. Understand your audience with real-time analytics.</p>

      <h2>Custom Themes</h2>
      <p>Make your profile uniquely yours with custom colors, fonts, backgrounds, and button styles.</p>

      <h2>Live Streaming</h2>
      <p>Go live directly from your dashboard. Stream to your audience with real-time chat, tips, and viewer analytics built in.</p>

      <h2>Media Hub</h2>
      <p>All your stream recordings in one place. Your audience can browse, search, and watch your content anytime.</p>

      <h2>AI Page Builder</h2>
      <p>Describe your business and let AI design your profile page in seconds. Choose from generated themes and layouts.</p>

      <h2>My Shop</h2>
      <p>List your products and services directly on your profile. Your audience can discover and purchase without leaving your page.</p>

      <h2>Auto-Share Links</h2>
      <p>Schedule your links to be shared on X, Facebook, LinkedIn, and WhatsApp automatically at the perfect time.</p>

      <h2>Secure and Private</h2>
      <p>Enterprise-grade security protects your data. SSL encryption, regular backups, and GDPR compliance included.</p>

      <a href="/signup">Start for Free</a> | <a href="/pricing">View Pricing</a>
    `,
  },
  "/templates": {
    title: "Templates - Share The Link",
    description: "Browse beautiful, ready-to-use link-in-bio templates. Choose from professional designs for creators, entrepreneurs, musicians, and more. Customize instantly.",
    content: `
      <h1>Beautiful templates for every creator</h1>
      <p>Browse our collection of professionally designed templates. Choose one and customize it to match your brand in seconds.</p>
      <p>Templates for creators, entrepreneurs, musicians, artists, podcasters, coaches, and more.</p>
      <a href="/signup">Start for Free</a>
    `,
  },
  "/signup": {
    title: "Sign Up Free - Share The Link",
    description: "Create your free Share The Link account. Build a beautiful link-in-bio page in seconds. No credit card required.",
    content: `
      <h1>Create your free account</h1>
      <p>Join thousands of creators and entrepreneurs on Share The Link. Build your link-in-bio page in seconds. No credit card required.</p>
    `,
  },
  "/login": {
    title: "Log In - Share The Link",
    description: "Log in to your Share The Link account to manage your links, analytics, and profile.",
    content: `
      <h1>Log in to Share The Link</h1>
      <p>Access your dashboard to manage links, view analytics, and customize your profile.</p>
    `,
  },
};

export default function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") || "";

  if (!isBot(userAgent)) {
    return;
  }

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, "") || "/";

  const page = PRERENDERED_PAGES[pathname];
  if (!page) {
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${page.title}</title>
  <meta name="description" content="${page.description}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="https://sharethelink.app${pathname === "/" ? "" : pathname}" />

  <meta property="og:title" content="${page.title}" />
  <meta property="og:description" content="${page.description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://sharethelink.app${pathname === "/" ? "" : pathname}" />
  <meta property="og:image" content="https://sharethelink.app/share-the-link-logo.jpg" />
  <meta property="og:site_name" content="Share The Link" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${page.title}" />
  <meta name="twitter:description" content="${page.description}" />
  <meta name="twitter:image" content="https://sharethelink.app/share-the-link-logo.jpg" />

  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="Share The Link" />
  <link rel="apple-touch-icon" href="/share-the-link-logo.jpg" />

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Share The Link",
    "url": "https://sharethelink.app",
    "description": "${page.description}",
    "applicationCategory": "SocialNetworkingApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free forever plan"
    }
  }
  </script>
</head>
<body>
  <header>
    <nav>
      <a href="/">Share The Link</a>
      <a href="/features">Features</a>
      <a href="/templates">Templates</a>
      <a href="/pricing">Pricing</a>
      <a href="/signup">Sign Up Free</a>
      <a href="/login">Log In</a>
    </nav>
  </header>
  <main>
    ${page.content}
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} Share The Link. All rights reserved.</p>
    <nav>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
      <a href="/blog">Blog</a>
      <a href="/docs">Documentation</a>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/careers">Careers</a>
    </nav>
  </footer>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Robots-Tag": "index, follow",
    },
  });
}

export const config = {
  matcher: ["/", "/pricing", "/features", "/templates", "/signup", "/login"],
};
