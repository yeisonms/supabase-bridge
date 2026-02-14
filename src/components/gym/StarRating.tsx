import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
}

const StarRating = ({ value, onChange, readonly = false, size = 20 }: StarRatingProps) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'
          )}
        >
          <Star
            size={size}
            className={cn(
              'transition-colors',
              (hover || value) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
