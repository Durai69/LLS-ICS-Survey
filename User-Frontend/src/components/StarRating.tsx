
import React from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  readOnly?: boolean;
  maxStars?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readOnly = false,
  maxStars = 4,
}) => {
  const handleClick = (index: number) => {
    if (!readOnly) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: maxStars }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(index)}
          disabled={readOnly}
          className={cn(
            "text-2xl transition-colors focus:outline-none",
            readOnly ? "cursor-default" : "cursor-pointer hover:text-yellow-400"
          )}
        >
          <span
            className={cn(
              "inline-block transform transition-transform",
              !readOnly && "hover:scale-110"
            )}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={index < rating ? "#9b87f5" : "none"}
              stroke={index < rating ? "#9b87f5" : "#CCCCCC"}
              strokeWidth="2"
              className="h-6 w-6"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
        </button>
      ))}
    </div>
  );
};

export default StarRating;
