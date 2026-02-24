import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { MapPin, Heart, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import FavoriteButton from '@/components/FavoriteButton';
import type { Partner } from '@/types/database';

const Favorites = () => {
  const { user } = useAuth();

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['favorite-partners', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Get favorite partner IDs first
      const { data: favs, error: favError } = await supabase
        .from('favorites' as any)
        .select('partner_id')
        .eq('user_id', user!.id);
      if (favError) throw favError;
      const ids = (favs as any[]).map((f) => f.partner_id as string);
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from('partners')
        .select('id, name, description, address, category, location, image_url, is_active, daily_capacity_limit, min_plan_level, created_at')
        .in('id', ids);
      if (error) throw error;
      return (data as Partner[]) || [];
    },
  });

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-2xl font-black mb-4">Favoritos</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center">
          <Heart className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-1">Sin favoritos aún</p>
          <p className="text-muted-foreground text-sm">Explora centros aliados y guarda tus preferidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((p) => (
            <Link to={`/app/gym/${p.id}`} key={p.id} className="block">
              <div className="bg-card rounded-xl p-4 shadow-card border flex gap-4 hover:shadow-elevated transition-shadow relative">
                <div className="absolute top-3 right-3 z-10">
                  <FavoriteButton partnerId={p.id} />
                </div>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 pr-8">
                  <h3 className="font-bold truncate">{p.name}</h3>
                  {p.category && <span className="text-xs text-muted-foreground">{p.category}</span>}
                  {p.address && <p className="text-sm text-muted-foreground mt-1 truncate">{p.address}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
