import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  count: number;
  size?: 'sm' | 'md';
}

export function RatingStars({ rating, count, size = 'md' }: RatingStarsProps) {
  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className={`${textSize} text-gray-500 ml-1`}>
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
}
