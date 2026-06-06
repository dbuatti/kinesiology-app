
import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
  size?: number;
}

const StarRating = ({ rating, onRatingChange, disabled, size = 16 }: StarRatingProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onRatingChange(star === rating ? 0 : star);
          }}
          className={cn(
            "transition-all duration-200 hover:scale-110",
            disabled ? "cursor-default" : "cursor-pointer",
            star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-800"
          )}
        >
          <Star size={size} className={cn(star <= rating && "drop-shadow-[0_0_3px_rgba(251,191,36,0.4)]")} />
        </button>
      ))}
    </div>
  );
};

export default StarRating;