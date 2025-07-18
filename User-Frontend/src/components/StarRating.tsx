
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
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    console.log('StarRating props - rating:', rating, 'hoveredIndex:', hoveredIndex);
  }, [rating, hoveredIndex]);

  const handleClick = (index: number) => {
    if (!readOnly) {
      onRatingChange(index + 1);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (!readOnly) {
      setHoveredIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoveredIndex(null);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: maxStars }).map((_, index) => {
        // Fix fill/stroke logic to handle rating as 1-based
        const fillColor =
          index < (hoveredIndex !== null ? hoveredIndex + 1 : rating)
            ? "#FFD700"
            : "none";
        const strokeColor =
          index < (hoveredIndex !== null ? hoveredIndex + 1 : rating)
            ? "#FFD700"
            : "#CCCCCC";

        return (
          <button
            key={index}
            type="button"
            title={`Set rating to ${index + 1} star${index === 0 ? '' : 's'}`}
            aria-label={`Set rating to ${index + 1} star${index === 0 ? '' : 's'}`}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
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
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="2"
                className="h-6 w-6"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
