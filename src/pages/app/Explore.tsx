import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, List, Map as MapIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import type { Partner } from '@/types/database';

type NearbyPartner = Partner & { distance_km?: number };

const Explore = () => {
  const [partners, setPartners] = useState<NearbyPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    const fetchPartners = async () => {
      // Try geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            // Try RPC first
            const { data, error } = await supabase.rpc('get_nearby_partners', {
              lat: latitude,
              long: longitude,
              radius: 50,
            });
            if (error || !data) {
              // Fallback to regular query
              const { data: fallback } = await supabase
                .from('partners')
                .select('*')
                .eq('is_active', true)
                .limit(20);
              setPartners((fallback as NearbyPartner[]) || []);
            } else {
              setPartners(data as NearbyPartner[]);
            }
            setLoading(false);
          },
          async () => {
            setLocationError('No pudimos obtener tu ubicación.');
            const { data } = await supabase
              .from('partners')
              .select('*')
              .eq('is_active', true)
              .limit(20);
            setPartners((data as NearbyPartner[]) || []);
            setLoading(false);
          }
        );
      } else {
        const { data } = await supabase.from('partners').select('*').eq('is_active', true).limit(20);
        setPartners((data as NearbyPartner[]) || []);
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  const formatDistance = (km?: number) => {
    if (!km) return null;
    return km < 1 ? `A ${Math.round(km * 1000)}m` : `A ${km.toFixed(1)}km`;
  };

  return (
    <div className="px-4 pt-12 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black">Explorar</h1>
        <div className="flex bg-secondary rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-md transition-colors ${view === 'list' ? 'bg-card shadow-sm' : ''}`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('map')}
            className={`p-2 rounded-md transition-colors ${view === 'map' ? 'bg-card shadow-sm' : ''}`}
          >
            <MapIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {locationError && (
        <p className="text-sm text-muted-foreground bg-secondary rounded-lg p-3 mb-4">{locationError}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-20">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">No hay gimnasios cerca</p>
          <p className="text-muted-foreground text-sm">Intenta ampliar el radio de búsqueda</p>
        </div>
      ) : view === 'list' ? (
        <div className="space-y-3">
          {partners.map((p) => (
            <Link to={`/app/gym/${p.id}`} key={p.id} className="block">
              <div className="bg-card rounded-xl p-4 shadow-card border flex gap-4 hover:shadow-elevated transition-shadow">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold truncate">{p.name}</h3>
                  {p.category && (
                    <span className="text-xs text-muted-foreground">{p.category}</span>
                  )}
                  {p.address && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">{p.address}</p>
                  )}
                  {p.distance_km != null && (
                    <span className="inline-block mt-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {formatDistance(p.distance_km)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-secondary rounded-xl h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <MapIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              Vista de mapa próximamente.
              <br />
              Integra Mapbox o Google Maps aquí.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
