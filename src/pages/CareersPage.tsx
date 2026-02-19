import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MapPin, Clock, ArrowRight, ChevronDown, ChevronUp, CheckCircle, Users, Zap, Heart, Globe, BookOpen, Gift, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobOpening {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  about: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  salary: string;
}

const openings: JobOpening[] = [
  {
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build beautiful, performant user interfaces for millions of creators.",
    about:
      "We're looking for a Senior Frontend Engineer to help build and scale the Share The Link platform. You'll work on our React-based dashboard, public profile pages, live streaming interface, and AI-powered page builder. You'll collaborate closely with design and product to ship features that empower creators worldwide.",
    responsibilities: [
      "Build and maintain our React/TypeScript frontend with Vite and Tailwind CSS",
      "Develop interactive features like the AI Page Builder, live streaming UI, and media player",
      "Optimize performance for fast page loads and smooth animations across devices",
      "Collaborate with designers to translate Figma mockups into pixel-perfect, accessible components",
      "Write clean, well-tested code with proper error handling and edge case coverage",
      "Mentor junior engineers and contribute to engineering best practices",
      "Participate in code reviews, architecture discussions, and sprint planning",
    ],
    requirements: [
      "5+ years of professional frontend development experience",
      "Expert knowledge of React, TypeScript, and modern CSS (Tailwind preferred)",
      "Experience with real-time features (WebSockets, WebRTC, or similar)",
      "Strong understanding of web performance optimization techniques",
      "Familiarity with Supabase, Firebase, or similar BaaS platforms",
      "Experience with state management patterns and data fetching libraries",
      "Excellent communication skills and ability to work asynchronously",
    ],
    niceToHave: [
      "Experience with live streaming or video processing",
      "Familiarity with Stripe integration and payment flows",
      "Open source contributions or personal projects you're proud of",
      "Experience with AI/ML integrations in frontend applications",
    ],
    salary: "\u00a360,000 - \u00a390,000/year + equity",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description: "Shape the future of how creators share their content online.",
    about:
      "As our Product Designer, you'll own the end-to-end design process for Share The Link. From user research and wireframing to high-fidelity prototypes and design systems, you'll craft intuitive experiences that help creators build their online presence. You'll work closely with engineering to ensure designs are implemented faithfully.",
    responsibilities: [
      "Design intuitive user flows for profile creation, link management, and live streaming",
      "Create and maintain our design system with reusable components and patterns",
      "Conduct user research, usability testing, and competitive analysis",
      "Design responsive layouts that work beautifully on mobile and desktop",
      "Create interactive prototypes to communicate design intent to stakeholders",
      "Collaborate with engineers to ensure pixel-perfect implementation",
      "Define and track design metrics to measure the impact of your work",
    ],
    requirements: [
      "4+ years of product design experience at a SaaS or consumer tech company",
      "Strong portfolio demonstrating end-to-end product design work",
      "Expert proficiency in Figma with experience building design systems",
      "Solid understanding of responsive web design and accessibility standards",
      "Experience with user research methodologies and usability testing",
      "Ability to translate complex features into simple, intuitive interfaces",
      "Strong written and verbal communication skills",
    ],
    niceToHave: [
      "Experience designing for creator economy or social media platforms",
      "Basic understanding of HTML/CSS and frontend development constraints",
      "Experience with motion design and micro-interactions",
      "Familiarity with analytics tools and data-driven design decisions",
    ],
    salary: "\u00a355,000 - \u00a380,000/year + equity",
  },
  {
    title: "Growth Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    description: "Drive user acquisition and engagement through creative marketing strategies.",
    about:
      "We're looking for a Growth Marketing Manager to help Share The Link reach millions of creators. You'll own our growth strategy across organic and paid channels, develop content marketing initiatives, and build partnerships with creators and influencers. This role is perfect for a data-driven marketer who thrives in a fast-paced startup environment.",
    responsibilities: [
      "Develop and execute growth strategies across SEO, content, social media, and paid acquisition",
      "Build and manage creator partnerships, affiliate programs, and influencer collaborations",
      "Create compelling content (blog posts, case studies, tutorials) that drives organic traffic",
      "Analyse growth metrics, run A/B tests, and optimise conversion funnels",
      "Manage paid advertising campaigns across Google, Meta, TikTok, and Twitter/X",
      "Develop email marketing campaigns for onboarding, engagement, and re-activation",
      "Collaborate with product to identify growth levers and viral features",
    ],
    requirements: [
      "4+ years of growth or digital marketing experience, preferably at a B2C SaaS company",
      "Proven track record of driving user acquisition and revenue growth",
      "Experience with SEO, content marketing, and social media strategy",
      "Strong analytical skills with proficiency in Google Analytics, Mixpanel, or similar",
      "Experience managing paid advertising budgets and optimising ROAS",
      "Excellent writing skills for creating engaging marketing content",
      "Self-starter mentality with ability to prioritise in a fast-moving environment",
    ],
    niceToHave: [
      "Experience marketing to creators, influencers, or small businesses",
      "Familiarity with the link-in-bio and creator tools landscape",
      "Experience with product-led growth strategies",
      "Video content creation skills for social media marketing",
    ],
    salary: "\u00a350,000 - \u00a375,000/year + equity",
  },
  {
    title: "Customer Success Lead",
    department: "Support",
    location: "Remote",
    type: "Full-time",
    description: "Help our users succeed and build lasting relationships with creators.",
    about:
      "As our Customer Success Lead, you'll be the voice of our users. You'll build and scale our support operations, create self-serve resources, and work directly with creators to ensure they get maximum value from Share The Link. You'll also provide critical feedback to product and engineering teams to improve the platform.",
    responsibilities: [
      "Build and lead our customer success function from the ground up",
      "Respond to user inquiries via email, chat, and social media with empathy and speed",
      "Create and maintain help documentation, video tutorials, and onboarding guides",
      "Identify common user pain points and advocate for product improvements",
      "Develop onboarding workflows that help new users see value quickly",
      "Monitor customer health metrics and proactively reach out to at-risk accounts",
      "Build processes and playbooks for scalable, world-class customer support",
    ],
    requirements: [
      "3+ years of customer success, support, or account management experience",
      "Experience at a SaaS or consumer tech company, ideally during a growth phase",
      "Excellent written and verbal communication with a warm, empathetic tone",
      "Experience creating help documentation and knowledge base content",
      "Strong problem-solving skills and ability to troubleshoot technical issues",
      "Proficiency with support tools (Intercom, Zendesk, HelpScout, or similar)",
      "Data-driven approach to tracking and improving customer satisfaction",
    ],
    niceToHave: [
      "Experience supporting creator or influencer platforms",
      "Basic understanding of web technologies (HTML, APIs, DNS)",
      "Experience building and managing a support team",
      "Multilingual skills (especially Spanish, Portuguese, or French)",
    ],
    salary: "\u00a340,000 - \u00a360,000/year + equity",
  },
];

const benefits = [
  { icon: Zap, text: "Competitive salary & equity" },
  { icon: Globe, text: "Remote-first culture" },
  { icon: Heart, text: "Unlimited PTO" },
  { icon: CheckCircle, text: "Health, dental & vision" },
  { icon: BookOpen, text: "Learning & development budget" },
  { icon: Home, text: "Home office setup allowance" },
  { icon: Users, text: "Annual team retreats" },
  { icon: Gift, text: "Parental leave" },
];

const departmentColors: Record<string, string> = {
  Engineering: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Design: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Marketing: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Support: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

const CareersPage = () => {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const toggleJob = (title: string) => {
    setExpandedJob(expandedJob === title ? null : title);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 text-balance">
            Join Our Team
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto text-pretty">
            Help us empower creators and entrepreneurs around the world. We're building the next generation of creator tools.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
            Why Work With Us
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            We believe happy teams build great products. Here's how we take care of our people.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit) => (
              <div key={benefit.text} className="bg-card rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-3">
                <benefit.icon className="w-6 h-6 text-primary" />
                <p className="text-foreground font-medium">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
            Open Positions
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Click on any role to read the full job description and learn more about the position.
          </p>
          <div className="max-w-3xl mx-auto space-y-4">
            {openings.map((job) => {
              const isExpanded = expandedJob === job.title;
              return (
                <div
                  key={job.title}
                  className="bg-card rounded-2xl shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Job Summary (always visible) */}
                  <button
                    onClick={() => toggleJob(job.title)}
                    className="w-full p-6 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${departmentColors[job.department] || "bg-primary/10 text-primary"}`}>
                          {job.department}
                        </span>
                        <h3 className="text-xl font-bold text-foreground mb-2">{job.title}</h3>
                        <p className="text-muted-foreground mb-3">{job.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground hidden md:block">
                          {isExpanded ? "Collapse" : "Read more"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Job Description */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-border animate-in slide-in-from-top-2 duration-300">
                      {/* About */}
                      <div className="mt-6 mb-6">
                        <h4 className="text-lg font-semibold text-foreground mb-3">About the Role</h4>
                        <p className="text-muted-foreground leading-relaxed">{job.about}</p>
                      </div>

                      {/* Salary */}
                      <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-sm text-muted-foreground">Compensation</p>
                        <p className="text-lg font-bold text-foreground">{job.salary}</p>
                      </div>

                      {/* Responsibilities */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-foreground mb-3">What You'll Do</h4>
                        <ul className="space-y-2">
                          {job.responsibilities.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Requirements */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-foreground mb-3">What We're Looking For</h4>
                        <ul className="space-y-2">
                          {job.requirements.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Nice to Have */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-foreground mb-3">Nice to Have</h4>
                        <ul className="space-y-2">
                          {job.niceToHave.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-2 flex-shrink-0" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Apply Button */}
                      <div className="pt-4 border-t border-border">
                        <Button className="gradient-button text-primary-foreground hover:opacity-90 w-full md:w-auto px-8 py-5">
                          Apply for {job.title}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CareersPage;
