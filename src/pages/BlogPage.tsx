import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const blogPosts = [
  {
    title: "10 Tips to Grow Your Audience with Link-in-Bio",
    excerpt: "Learn the best strategies to maximize your link-in-bio page and drive more traffic to your content.",
    date: "Jan 10, 2026",
    readTime: "5 min read",
    category: "Growth",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
  },
  {
    title: "How Creators Are Making Money Online in 2026",
    excerpt: "Discover the latest trends in creator monetization and how you can start earning from your content.",
    date: "Jan 8, 2026",
    readTime: "7 min read",
    category: "Monetization",
    image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&h=400&fit=crop",
  },
  {
    title: "The Ultimate Guide to Personal Branding",
    excerpt: "Build a strong personal brand that resonates with your audience and sets you apart from the competition.",
    date: "Jan 5, 2026",
    readTime: "10 min read",
    category: "Branding",
    image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&h=400&fit=crop",
  },
  {
    title: "New Feature: Advanced Analytics Dashboard",
    excerpt: "We've launched a powerful new analytics dashboard to help you understand your audience better.",
    date: "Jan 2, 2026",
    readTime: "3 min read",
    category: "Product Updates",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
  },
];

const BlogPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Blog
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Tips, insights, and updates to help you grow your online presence.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {blogPosts.map((post) => (
              <article key={post.title} className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    {post.category}
                  </span>
                  <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPage;
