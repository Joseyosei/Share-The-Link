import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Star, Loader2, Trash2, Edit2, Check, X, MessageSquareQuote } from "lucide-react";

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_company: string | null;
  reviewer_role: string | null;
  rating: number;
  title: string | null;
  content: string;
  is_approved: boolean;
  created_at: string;
}

export default function DashboardReviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    reviewer_name: "",
    reviewer_company: "",
    reviewer_role: "",
    rating: 5,
    title: "",
    content: "",
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reviewer_name || !formData.content) {
      toast({ title: "Error", description: "Name and review content are required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    if (editingId) {
      // Update existing review
      const { error } = await supabase
        .from("reviews")
        .update({
          reviewer_name: formData.reviewer_name,
          reviewer_company: formData.reviewer_company || null,
          reviewer_role: formData.reviewer_role || null,
          rating: formData.rating,
          title: formData.title || null,
          content: formData.content,
          is_approved: false, // Reset approval when edited
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId);

      if (error) {
        toast({ title: "Error", description: "Failed to update review", variant: "destructive" });
      } else {
        toast({ title: "Review updated", description: "Your review has been updated and will be reviewed for approval." });
        setEditingId(null);
        resetForm();
        fetchReviews();
      }
    } else {
      // Create new review
      const { error } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          reviewer_name: formData.reviewer_name,
          reviewer_company: formData.reviewer_company || null,
          reviewer_role: formData.reviewer_role || null,
          rating: formData.rating,
          title: formData.title || null,
          content: formData.content,
        });

      if (error) {
        toast({ title: "Error", description: "Failed to submit review", variant: "destructive" });
      } else {
        toast({ title: "Review submitted", description: "Thank you! Your review will appear on the homepage once approved." });
        resetForm();
        fetchReviews();
      }
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      reviewer_name: "",
      reviewer_company: "",
      reviewer_role: "",
      rating: 5,
      title: "",
      content: "",
    });
  };

  const handleEdit = (review: Review) => {
    setEditingId(review.id);
    setFormData({
      reviewer_name: review.reviewer_name,
      reviewer_company: review.reviewer_company || "",
      reviewer_role: review.reviewer_role || "",
      rating: review.rating,
      title: review.title || "",
      content: review.content,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete review", variant: "destructive" });
    } else {
      toast({ title: "Review deleted" });
      fetchReviews();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <MobileSidebar />

      <main className="flex-1 lg:ml-72 p-4 md:p-6 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reviews</h1>
            <p className="text-muted-foreground mt-1">
              Share your experience with Share The Link. Approved reviews appear on our homepage.
            </p>
          </div>

          {/* Submit/Edit Review Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5" />
                {editingId ? "Edit Your Review" : "Write a Review"}
              </CardTitle>
              <CardDescription>
                Tell others about your experience using Share The Link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reviewer_name">Your Name *</Label>
                    <Input
                      id="reviewer_name"
                      value={formData.reviewer_name}
                      onChange={(e) => setFormData({ ...formData, reviewer_name: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reviewer_company">Company (optional)</Label>
                    <Input
                      id="reviewer_company"
                      value={formData.reviewer_company}
                      onChange={(e) => setFormData({ ...formData, reviewer_company: e.target.value })}
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reviewer_role">Your Role (optional)</Label>
                    <Input
                      id="reviewer_role"
                      value={formData.reviewer_role}
                      onChange={(e) => setFormData({ ...formData, reviewer_role: e.target.value })}
                      placeholder="Marketing Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rating *</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= formData.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Review Title (optional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Great platform for creators!"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Your Review *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Share your experience with Share The Link..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingId ? "Update Review" : "Submit Review"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Your Reviews */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Reviews</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  You haven't submitted any reviews yet. Share your experience above!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              review.is_approved 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}>
                              {review.is_approved ? (
                                <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Approved</span>
                              ) : (
                                <span className="flex items-center gap-1"><X className="w-3 h-3" /> Pending</span>
                              )}
                            </span>
                          </div>
                          
                          {review.title && (
                            <h3 className="font-semibold text-foreground">{review.title}</h3>
                          )}
                          <p className="text-muted-foreground mt-1">{review.content}</p>
                          
                          <div className="mt-3 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{review.reviewer_name}</span>
                            {review.reviewer_role && ` - ${review.reviewer_role}`}
                            {review.reviewer_company && ` at ${review.reviewer_company}`}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(review)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(review.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
