"use client";

import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductivityRatingProps {
  onRating: (rating: number) => void;
  onSkip: () => void;
  isOpen: boolean;
}

export const ProductivityRating = memo(function ProductivityRating({ onRating, onSkip, isOpen }: ProductivityRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  if (!isOpen) return null;

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
    onRating(selectedRating);
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">How was your focus session?</CardTitle>
          <p className="text-sm text-muted-foreground">
            Rate your productivity to track your progress
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingClick(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-colors"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    (hoveredRating >= star || rating >= star)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground hover:text-yellow-400"
                  )}
                />
              </button>
            ))}
          </div>

          {/* Rating Labels */}
          <div className="text-center text-sm text-muted-foreground">
            {rating === 0 && hoveredRating === 0 && "Click a star to rate"}
            {rating === 1 && "Poor - Very distracted"}
            {rating === 2 && "Fair - Somewhat distracted"}
            {rating === 3 && "Good - Moderately focused"}
            {rating === 4 && "Great - Very focused"}
            {rating === 5 && "Excellent - Completely focused"}
            {hoveredRating > 0 && rating === 0 && (
              <>
                {hoveredRating === 1 && "Poor - Very distracted"}
                {hoveredRating === 2 && "Fair - Somewhat distracted"}
                {hoveredRating === 3 && "Good - Moderately focused"}
                {hoveredRating === 4 && "Great - Very focused"}
                {hoveredRating === 5 && "Excellent - Completely focused"}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip
            </Button>
            {rating > 0 && (
              <Button
                onClick={() => onRating(rating)}
                className="flex-1"
              >
                Save Rating
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
