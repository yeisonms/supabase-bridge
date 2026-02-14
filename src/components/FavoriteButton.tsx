import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  partnerId: string;
  className?: string;
  size?: number;
}

const FavoriteButton = ({ partnerId, className, size = 20 }: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(partnerId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(partnerId);
      }}
      className={cn(
        'p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95',
        active ? 'text-red-500' : 'text-muted-foreground hover:text-red-400',
        className
      )}
      aria-label={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <Heart
        size={size}
        className={cn('transition-all duration-200', active && 'fill-red-500')}
      />
    </button>
  );
};

export default FavoriteButton;
