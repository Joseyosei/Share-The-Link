import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCarousel } from "@/components/ui/carousel";
import { useState, useEffect, useCallback } from "react";

export const SwipeNavArrows = () => {
  const { api, scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    setTotal(api.scrollSnapList().length);
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  return (
    <>
      {/* Left Arrow */}
      {canScrollPrev && (
        <button
          onClick={scrollPrev}
          className="fixed left-4 sm:left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/25 items-center justify-center text-white/80 hover:bg-white/25 hover:text-white hover:scale-110 transition-all shadow-lg"
          aria-label="Previous section"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Right Arrow */}
      {canScrollNext && (
        <button
          onClick={scrollNext}
          className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/25 items-center justify-center text-white/80 hover:bg-white/25 hover:text-white hover:scale-110 transition-all shadow-lg"
          aria-label="Next section"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Dot indicators */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 h-2.5 gradient-button"
                : "w-2.5 h-2.5 bg-white/25 hover:bg-white/40"
            }`}
            aria-label={`Go to section ${i + 1}`}
          />
        ))}
      </div>

      {/* Mobile swipe hint on first card */}
      {current === 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 md:hidden animate-pulse">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <ChevronLeft className="w-4 h-4" />
            <span>Swipe to explore</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}
    </>
  );
};
