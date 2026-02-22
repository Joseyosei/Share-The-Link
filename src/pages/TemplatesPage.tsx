import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Eye, Music, Camera, Church, Dumbbell, ShoppingBag, Laptop, Utensils, Palette, Mic, GraduationCap, Heart, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Template {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  description: string;
  bg: string;
  cardBg: string;
  accent: string;
  textColor: string;
  links: string[];
  avatar: string;
  displayName: string;
  bio: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "creator",
    name: "Creator",
    category: "Content",
    icon: Mic,
    description: "For YouTubers, podcasters, and content creators",
    bg: "bg-gradient-to-br from-red-600 to-pink-500",
    cardBg: "bg-white",
    accent: "text-red-600",
    textColor: "text-white",
    links: ["Latest Video", "Podcast", "Newsletter", "Merch Store"],
    avatar: "MC",
    displayName: "Max Creative",
    bio: "Creating content that inspires and entertains",
  },
  {
    id: "musician",
    name: "Musician",
    category: "Music",
    icon: Music,
    description: "For artists, DJs, and music producers",
    bg: "bg-gradient-to-br from-purple-900 to-violet-700",
    cardBg: "bg-white/10 backdrop-blur-sm border border-white/20",
    accent: "text-violet-400",
    textColor: "text-white",
    links: ["New Album", "Tour Dates", "Spotify", "Merch"],
    avatar: "DJ",
    displayName: "DJ Pulse",
    bio: "Making beats that move your soul",
  },
  {
    id: "photographer",
    name: "Photographer",
    category: "Creative",
    icon: Camera,
    description: "For photographers and visual artists",
    bg: "bg-gradient-to-br from-gray-900 to-gray-800",
    cardBg: "bg-white",
    accent: "text-amber-500",
    textColor: "text-white",
    links: ["Portfolio", "Book a Session", "Prints Shop", "Instagram"],
    avatar: "SA",
    displayName: "Sarah Arts",
    bio: "Capturing moments that last forever",
  },
  {
    id: "faith",
    name: "Faith",
    category: "Ministry",
    icon: Church,
    description: "For churches, pastors, and ministries",
    bg: "bg-gradient-to-br from-indigo-800 to-purple-900",
    cardBg: "bg-white/15 backdrop-blur-sm border border-white/20",
    accent: "text-amber-400",
    textColor: "text-white",
    links: ["Watch Sermons", "Prayer Requests", "Give / Donate", "Join Community"],
    avatar: "PJ",
    displayName: "Pastor James",
    bio: "Spreading faith, hope, and love",
  },
  {
    id: "fitness",
    name: "Fitness",
    category: "Health",
    icon: Dumbbell,
    description: "For coaches, trainers, and wellness brands",
    bg: "bg-gradient-to-br from-emerald-600 to-green-500",
    cardBg: "bg-white",
    accent: "text-emerald-600",
    textColor: "text-white",
    links: ["Free Consultation", "Programs", "Testimonials", "Instagram"],
    avatar: "FC",
    displayName: "FitCoach Pro",
    bio: "Helping you build a stronger, healthier you",
  },
  {
    id: "ecommerce",
    name: "Shop",
    category: "Business",
    icon: ShoppingBag,
    description: "For online stores and product brands",
    bg: "bg-gradient-to-br from-amber-500 to-orange-500",
    cardBg: "bg-white",
    accent: "text-amber-600",
    textColor: "text-white",
    links: ["Shop All", "New Arrivals", "Sale", "Shipping Info"],
    avatar: "LG",
    displayName: "Luxe Goods",
    bio: "Curated products made with love",
  },
  {
    id: "developer",
    name: "Developer",
    category: "Tech",
    icon: Laptop,
    description: "For developers, startups, and SaaS founders",
    bg: "bg-gradient-to-br from-slate-900 to-blue-900",
    cardBg: "bg-white/10 backdrop-blur-sm border border-white/20",
    accent: "text-cyan-400",
    textColor: "text-white",
    links: ["Portfolio", "GitHub", "Blog", "Hire Me"],
    avatar: "DV",
    displayName: "Dev Studio",
    bio: "Building the future with code",
  },
  {
    id: "restaurant",
    name: "Restaurant",
    category: "Food",
    icon: Utensils,
    description: "For restaurants, cafes, and food brands",
    bg: "bg-gradient-to-br from-red-700 to-orange-600",
    cardBg: "bg-white",
    accent: "text-red-600",
    textColor: "text-white",
    links: ["View Menu", "Order Online", "Reservations", "Follow Us"],
    avatar: "BC",
    displayName: "Bistro & Co",
    bio: "Serving delicious food with love",
  },
  {
    id: "artist",
    name: "Artist",
    category: "Creative",
    icon: Palette,
    description: "For painters, illustrators, and designers",
    bg: "bg-gradient-to-br from-rose-400 to-pink-600",
    cardBg: "bg-white/15 backdrop-blur-sm border border-white/20",
    accent: "text-rose-300",
    textColor: "text-white",
    links: ["Gallery", "Commissions", "Shop Prints", "Instagram"],
    avatar: "AS",
    displayName: "Art Studio",
    bio: "Art that tells stories and sparks emotion",
  },
  {
    id: "education",
    name: "Educator",
    category: "Education",
    icon: GraduationCap,
    description: "For tutors, course creators, and coaches",
    bg: "bg-gradient-to-br from-violet-600 to-purple-500",
    cardBg: "bg-white",
    accent: "text-violet-600",
    textColor: "text-white",
    links: ["Browse Courses", "Free Resources", "Reviews", "Contact"],
    avatar: "ED",
    displayName: "EduPro Academy",
    bio: "Empowering learners to reach their potential",
  },
  {
    id: "nonprofit",
    name: "Nonprofit",
    category: "Cause",
    icon: Heart,
    description: "For charities, NGOs, and community orgs",
    bg: "bg-gradient-to-br from-teal-600 to-emerald-500",
    cardBg: "bg-white",
    accent: "text-teal-600",
    textColor: "text-white",
    links: ["Donate Now", "Volunteer", "Our Impact", "Contact"],
    avatar: "HF",
    displayName: "Hope Foundation",
    bio: "Making a difference in our community",
  },
  {
    id: "travel",
    name: "Travel",
    category: "Lifestyle",
    icon: MapPin,
    description: "For travel bloggers, agencies, and guides",
    bg: "bg-gradient-to-br from-sky-500 to-cyan-400",
    cardBg: "bg-white/15 backdrop-blur-sm border border-white/20",
    accent: "text-sky-300",
    textColor: "text-white",
    links: ["Travel Guides", "Book a Trip", "Gallery", "Follow"],
    avatar: "WE",
    displayName: "Wanderlust Exp",
    bio: "Exploring the world one adventure at a time",
  },
];

const CATEGORIES = ["All", "Content", "Music", "Creative", "Ministry", "Health", "Business", "Tech", "Food", "Education", "Cause", "Lifestyle"];

function TemplateCard({ template, onPreview }: { template: Template; onPreview: (t: Template) => void }) {
  return (
    <div className="group relative">
      {/* Phone frame */}
      <div className={`rounded-3xl overflow-hidden shadow-xl ${template.bg} p-6 aspect-[9/16] flex flex-col items-center justify-center relative transition-transform duration-300 group-hover:scale-[1.02]`}>
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 border-2 border-white/30">
          <span className={`text-sm font-bold ${template.textColor}`}>{template.avatar}</span>
        </div>
        <h3 className={`text-sm font-bold ${template.textColor} mb-0.5`}>{template.displayName}</h3>
        <p className={`text-xs ${template.textColor} opacity-70 mb-4 text-center px-4`}>{template.bio}</p>
        {/* Mini links */}
        <div className="space-y-2 w-full px-4">
          {template.links.map((link) => (
            <div key={link} className={`${template.cardBg} rounded-xl py-2.5 px-4 text-center`}>
              <span className={`text-xs font-medium ${template.cardBg.includes("white/") ? template.textColor : "text-gray-800"}`}>{link}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Overlay on hover */}
      <div className="absolute inset-0 rounded-3xl bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex flex-col items-center gap-3">
          <Button asChild size="sm" className="rounded-full bg-white text-gray-900 hover:bg-white/90 font-semibold px-6">
            <Link to={`/signup?template=${template.id}`}>
              Use Template
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(template); }}
            className="flex items-center gap-1 text-white/80 text-xs hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>
      </div>
      {/* Label */}
      <div className="mt-3 text-center">
        <h4 className="font-semibold text-foreground text-sm">{template.name}</h4>
        <p className="text-xs text-muted-foreground">{template.category}</p>
      </div>
    </div>
  );
}

const TemplatesPage = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filtered = activeCategory === "All"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Templates
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Start with a beautiful template
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Choose from professionally designed templates for every industry. Customize colors, fonts, and layout to match your brand.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-foreground text-background shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((template) => (
              <TemplateCard key={template.id} template={template} onPreview={setPreviewTemplate} />
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">
              {"Can't"} find what you need? Our AI Builder creates a custom page in seconds.
            </p>
            <Button asChild size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 font-semibold">
              <Link to="/signup">
                Build Your Own
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-none">
          {previewTemplate && (
            <div className="relative">
              {/* Phone mockup */}
              <div className="mx-auto w-[320px] rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden">
                <div className="relative w-full aspect-[9/19]">
                  <div className={`absolute inset-0 ${previewTemplate.bg} flex flex-col items-center pt-12 px-6 overflow-y-auto`}>
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border-2 border-white/30">
                      <span className={`text-lg font-bold ${previewTemplate.textColor}`}>{previewTemplate.avatar}</span>
                    </div>
                    <h2 className={`text-lg font-bold ${previewTemplate.textColor} mb-1`}>{previewTemplate.displayName}</h2>
                    <p className={`text-sm ${previewTemplate.textColor} opacity-70 mb-6 text-center`}>{previewTemplate.bio}</p>
                    {/* Links */}
                    <div className="space-y-3 w-full">
                      {previewTemplate.links.map((link) => (
                        <div key={link} className={`${previewTemplate.cardBg} rounded-xl py-3.5 px-5 text-center`}>
                          <span className={`text-sm font-medium ${previewTemplate.cardBg.includes("white/") ? previewTemplate.textColor : "text-gray-800"}`}>{link}</span>
                        </div>
                      ))}
                    </div>
                    <p className={`text-xs ${previewTemplate.textColor} opacity-40 mt-8 mb-4`}>Powered by Share The Link</p>
                  </div>
                </div>
              </div>

              {/* Actions below */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                  className="rounded-full bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4 mr-1" />
                  Close
                </Button>
                <Button asChild size="sm" className="rounded-full bg-white text-gray-900 hover:bg-white/90 font-semibold px-6">
                  <Link to={`/signup?template=${previewTemplate.id}`}>
                    Use This Template
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default TemplatesPage;
