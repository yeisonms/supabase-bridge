import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useCallback } from 'react';

const FAVORITES_KEY = 'user-favorites';

export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [] } = useQuery({
    queryKey: [FAVORITES_KEY, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites' as any)
        .select('partner_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data as any[]).map((f) => f.partner_id as string);
    },
  });

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const { mutate: toggleFavorite } = useMutation({
    mutationFn: async (partnerId: string) => {
      if (!user) throw new Error('No autenticado');
      const removing = favorites.includes(partnerId);
      if (removing) {
        const { error } = await (supabase.from('favorites' as any) as any)
          .delete()
          .eq('partner_id', partnerId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('favorites' as any) as any)
          .insert({ partner_id: partnerId, user_id: user.id });
        if (error) throw error;
      }
      return { partnerId, removing };
    },
    onMutate: async (partnerId: string) => {
      await queryClient.cancelQueries({ queryKey: [FAVORITES_KEY, user?.id] });
      const previous = queryClient.getQueryData<string[]>([FAVORITES_KEY, user?.id]);
      queryClient.setQueryData<string[]>([FAVORITES_KEY, user?.id], (old = []) =>
        old.includes(partnerId) ? old.filter((id) => id !== partnerId) : [...old, partnerId]
      );
      return { previous };
    },
    onError: (_err, _partnerId, context) => {
      queryClient.setQueryData([FAVORITES_KEY, user?.id], context?.previous);
      toast.error('No se pudo actualizar favoritos');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [FAVORITES_KEY, user?.id] });
    },
  });

  return { favorites, isFavorite, toggleFavorite };
};
