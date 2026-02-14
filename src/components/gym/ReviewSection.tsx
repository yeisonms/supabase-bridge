import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Star, MessageSquare, Loader2, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import StarRating from './StarRating';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profiles: { first_name: string | null; last_name: string | null } | null;
}

interface ReviewSectionProps {
  partnerId: string;
  partnerRating: number;
  partnerReviewCount: number;
}

const ReviewSection = ({ partnerId, partnerRating, partnerReviewCount }: ReviewSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');

  // Fetch reviews
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews' as any)
        .select('id, rating, comment, created_at, user_id, profiles:user_id(first_name, last_name)')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) as Review[];
    },
  });

  // Check if user can review
  const { data: canReview = false } = useQuery({
    queryKey: ['can-review', partnerId, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('can_user_review', { p_partner_id: partnerId });
      if (error) return false;
      return data as boolean;
    },
  });

  // Submit review
  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No autenticado');
      if (newRating === 0) throw new Error('Selecciona una calificación');
      const { error } = await (supabase.from('reviews' as any) as any).insert({
        user_id: user.id,
        partner_id: partnerId,
        rating: newRating,
        comment: newComment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('¡Reseña publicada!');
      setShowModal(false);
      setNewRating(0);
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['can-review', partnerId] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'No se pudo publicar la reseña');
    },
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getUserName = (review: Review) => {
    const p = review.profiles;
    if (p?.first_name) return `${p.first_name} ${p.last_name || ''}`.trim();
    return 'Usuario';
  };

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Reseñas</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-xl font-black text-foreground">
                {partnerRating > 0 ? partnerRating.toFixed(1) : '—'}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({partnerReviewCount} {partnerReviewCount === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>
        </div>

        {user && (
          canReview ? (
            <Button size="sm" variant="outline" onClick={() => setShowModal(true)} className="rounded-full">
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Escribir Reseña
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button size="sm" variant="outline" disabled className="rounded-full opacity-50">
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Escribir Reseña
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Debes visitar este gimnasio para opinar</p>
              </TooltipContent>
            </Tooltip>
          )
        )}
      </div>

      {/* Reviews list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 bg-secondary/30 rounded-xl">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aún no hay reseñas. ¡Sé el primero!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <UserCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{getUserName(review)}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
                  </div>
                  <div className="mt-0.5">
                    <StarRating value={review.rating} readonly size={14} />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escribir Reseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Tu calificación</p>
              <StarRating value={newRating} onChange={setNewRating} size={32} />
            </div>
            <div>
              <Textarea
                placeholder="¿Qué te pareció el entrenamiento?"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <Button
              onClick={() => submitReview()}
              disabled={isPending || newRating === 0}
              className="w-full rounded-full"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Publicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewSection;
