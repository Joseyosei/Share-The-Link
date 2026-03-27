import { useState } from "react";
import {
  HelpCircle, Search, Link2, Radio, Play, Wand2, Store, Palette, BarChart3, Settings,
  ChevronDown, ChevronRight, ExternalLink, MessageCircle, Mail, BookOpen,
  Shield, CreditCard, Users, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { Link } from "react-router-dom";

interface FAQItem {
  question: string;
  answer: string;
}

interface GuideSection {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  href: string;
  steps: string[];
}

const guideSections: GuideSection[] = [
  {
    id: "dashboard",
    icon: BarChart3,
    title: "Dashboard",
    description: "Your command center showing link stats, quick actions, and live profile preview.",
    color: "bg-blue-500/10 text-blue-600",
    href: "/dashboard",
    steps: [
      "View total links, clicks, and active links at a glance",
      "See a live preview of your public profile on the right",
      "Quick access to Live Streaming and AI Builder features",
      "Add, edit, toggle, or delete links directly from the dashboard",
    ],
  },
  {
    id: "links",
    icon: Link2,
    title: "Links Management",
    description: "Add, organize, and schedule all your important links in one place.",
    color: "bg-purple-500/10 text-purple-600",
    href: "/dashboard/links",
    steps: [
      "Click 'Add Link' to create a new link with title and URL",
      "Drag and drop links to reorder them on your profile",
      "Toggle links on/off without deleting them",
      "Use Auto-Share to schedule links to social media platforms",
      "View click analytics per link",
    ],
  },
  {
    id: "streaming",
    icon: Radio,
    title: "Live Streaming",
    description: "Go live, earn tips from viewers, and save recordings for replay.",
    color: "bg-red-500/10 text-red-600",
    href: "/streaming",
    steps: [
      "Click 'Go Live' and enter a stream title and description",
      "Share your unique stream link with your audience",
      "Viewers can send tips during your live stream (90/10 split)",
      "Streams are automatically recorded and saved",
      "Watch past streams from the 'Past Streams' section",
    ],
  },
  {
    id: "media",
    icon: Play,
    title: "Media Library",
    description: "Browse and watch recorded streams, both yours and from other creators.",
    color: "bg-green-500/10 text-green-600",
    href: "/media",
    steps: [
      "Browse trending and recent stream recordings",
      "Filter by category or search for specific content",
      "Watch recordings with full video player controls",
      "See live streams that are currently broadcasting",
    ],
  },
  {
    id: "ai-builder",
    icon: Wand2,
    title: "AI Page Builder",
    description: "Describe your business and let AI create a professional page design instantly.",
    color: "bg-violet-500/10 text-violet-600",
    href: "/ai-builder",
    steps: [
      "Describe your business in 2-3 sentences",
      "AI generates a complete page design with colors, layout, and content",
      "Preview the generated design before applying",
      "Customize and tweak the AI-generated design",
      "Apply the design to your public profile",
    ],
  },
  {
    id: "shop",
    icon: Store,
    title: "My Shop",
    description: "List and sell your products, digital goods, and services to your audience.",
    color: "bg-orange-500/10 text-orange-600",
    href: "/connect",
    steps: [
      "Click 'Add Product' to list a new item",
      "Set the product name, description, price, and category",
      "Add an image URL and external purchase link (Gumroad, Shopify, etc.)",
      "Toggle products on/off to show/hide them",
      "Share your shop link with your audience",
    ],
  },
  {
    id: "appearance",
    icon: Palette,
    title: "Appearance",
    description: "Customize your profile's theme, colors, fonts, and layout.",
    color: "bg-pink-500/10 text-pink-600",
    href: "/dashboard/appearance",
    steps: [
      "Choose from pre-built themes (Minimal, Gradient, Dark, etc.)",
      "Customize button styles: rounded, sharp, outline, or shadow",
      "Select font families for your profile page",
      "Preview changes in real-time before saving",
      "Pro users can access premium themes and remove branding",
      "Upload a custom background image under Wallpaper → Image",
      "Choose animated backgrounds like aurora, particles, or waves",
    ],
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings",
    description: "Manage your profile details, social handles, and account security.",
    color: "bg-gray-500/10 text-gray-600",
    href: "/dashboard/settings",
    steps: [
      "Upload a profile image by clicking the camera icon",
      "Set your display name, username, and bio",
      "Add social media handles (Twitter, Instagram, YouTube, etc.)",
      "Change your password for account security",
      "Manage your subscription plan",
    ],
  },
];

const faqItems: FAQItem[] = [
  {
    question: "How do I share my profile link?",
    answer: "Your profile link is sharethelink.app/[username]. You can find it at the top of your Dashboard. Copy it and share it anywhere -- social media bios, email signatures, business cards, etc.",
  },
  {
    question: "How does live streaming work?",
    answer: "Go to Live Streaming, click 'Go Live', enter a title, and start broadcasting. Your audience can watch via your unique stream URL and send tips. Streams are automatically recorded so you can rewatch them later.",
  },
  {
    question: "How do I earn money from tips?",
    answer: "When viewers send tips during your live stream, you receive 90% of each tip. The remaining 10% covers platform and payment processing fees. Tips are processed through Stripe and deposited to your connected account.",
  },
  {
    question: "What's included in the Pro plan?",
    answer: "Pro includes unlimited links, custom themes and colors, advanced analytics, video embeds, AI Page Builder, live streaming, priority support, and the ability to remove Share The Link branding.",
  },
  {
    question: "Can I sell products on my page?",
    answer: "Yes! Go to 'My Shop' in the sidebar, click 'Add Product', and list your items with a price, description, and purchase link. You can link to Gumroad, Shopify, or any external store for checkout.",
  },
  {
    question: "How does the AI Page Builder work?",
    answer: "The AI Builder takes a short description of your business and generates a complete page design with suggested colors, layout, and content. You can preview, customize, and apply the design to your profile.",
  },
  {
    question: "Can I use my own domain?",
    answer: "Custom domains are available on the Business plan. You can map your own domain (e.g., links.yourbrand.com) to your Share The Link profile.",
  },
  {
    question: "Can I sign in with Google or Apple?",
    answer: "Yes! You can sign up or log in with Google or Apple for instant one-click access. Just click the Google or Apple button on the login or signup page. Your account will be automatically created and linked.",
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel anytime from Settings or the Stripe billing portal. Your subscription will remain active until the end of your current billing period.",
  },
];

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const filteredFaqs = faqItems.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = guideSections.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Help Center</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Everything you need to know about using Share The Link. Search or browse the guides below.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-10 max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-base rounded-xl bg-card border-border"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 text-center">
                <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Getting Started</h3>
                <p className="text-sm text-muted-foreground">New here? Start with the basics</p>
              </CardContent>
            </Card>
            <a href="mailto:support@sharethelink.com">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5 text-center">
                  <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Email Support</h3>
                  <p className="text-sm text-muted-foreground">support@sharethelink.com</p>
                </CardContent>
              </Card>
            </a>
            <Link to="/contact">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5 text-center">
                  <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Contact Us</h3>
                  <p className="text-sm text-muted-foreground">Get in touch with our team</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Feature Guides */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Feature Guides
            </h2>
            <div className="grid gap-3">
              {filteredGuides.map((section) => {
                const isExpanded = expandedGuide === section.id;
                const Icon = section.icon;
                return (
                  <Card key={section.id} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedGuide(isExpanded ? null : section.id)}
                      className="w-full text-left"
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${section.color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{section.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">{section.description}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </CardContent>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border pt-4">
                        <ol className="space-y-2 mb-4">
                          {section.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-sm text-foreground">{step}</span>
                            </li>
                          ))}
                        </ol>
                        <Button variant="outline" size="sm" asChild className="gap-2">
                          <Link to={section.href}>
                            Go to {section.title}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {filteredFaqs.map((faq, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <Card key={index} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : index)}
                      className="w-full text-left"
                    >
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <span className="font-medium text-foreground">{faq.question}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </CardContent>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border pt-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-2">Still need help?</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Our support team is here to help. Reach out and we'll get back to you within 24 hours.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild className="gradient-button text-white hover:opacity-90">
                  <a href="mailto:support@sharethelink.com">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Support
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/contact">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Form
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HelpPage;
