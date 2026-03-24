import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  reviewer_name: string;
  company: string | null;
  role: string | null;
  rating: number;
  title: string | null;
  content: string;
  created_at: string;
}

interface TestimonialsWidgetProps {
  username: string;
  textColor?: string;
}

export const TestimonialsWidget = ({ username, textColor = "text-white" }: TestimonialsWidgetProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase.rpc("get_public_reviews", {
          lookup_username: username,
        });
        if (!error && data) {
          setReviews(data as Review[]);
        }
      } catch {
        // Silently fail if RPC doesn't exist yet
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [username]);

  if (loading || reviews.length === 0) return null;

  const review = reviews[current];

  return (
    <div className="w-full max-w-xs mx-auto mt-4">
      <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 relative">
        <Quote className={`w-5 h-5 ${textColor} opacity-30 mb-2`} />

        {/* Stars */}
        <div className="flex gap-0.5 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3.5 h-3.5 ${star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`}
            />
          ))}
        </div>

        {/* Content */}
        {review.title && (
          <p className={`text-sm font-semibold ${textColor} mb-1`}>{review.title}</p>
        )}
        <p className={`text-xs ${textColor} opacity-80 leading-relaxed line-clamp-4`}>
          {review.content}
        </p>

        {/* Reviewer */}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <span className={`text-xs font-bold ${textColor}`}>
              {review.reviewer_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className={`text-xs font-medium ${textColor}`}>{review.reviewer_name}</p>
            {(review.role || review.company) && (
              <p className={`text-[10px] ${textColor} opacity-60`}>
                {[review.role, review.company].filter(Boolean).join(" at ")}
              </p>
            )}
          </div>
        </div>

        {/* Navigation */}
        {reviews.length > 1 && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
            <button
              onClick={() => setCurrent((c) => (c === 0 ? reviews.length - 1 : c - 1))}
              className={`p-1 rounded-lg hover:bg-white/10 ${textColor} opacity-60 hover:opacity-100 transition`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1">
              {reviews.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === current ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrent((c) => (c === reviews.length - 1 ? 0 : c + 1))}
              className={`p-1 rounded-lg hover:bg-white/10 ${textColor} opacity-60 hover:opacity-100 transition`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
