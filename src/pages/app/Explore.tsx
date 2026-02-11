import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, List, Map as MapIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import type { Partner } from '@/types/database';

type NearbyPartner = Partner & { distance_km?: number; lat?: number; long?: number };

const MAP_CONTAINER: React.CSSProperties = { width: '100%', height: '100%' };
const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 }; // CDMX fallback

const Explore = () => {
  const [partners, setPartners] = useState<NearbyPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [locationError, setLocationError] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<NearbyPartner | null>(null);
  const navigate = useNavigate();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyCZCXIl1zzKmGt-MXTrdyfUxYBUSfUtecw',
  });

  useEffect(() => {
    const fetchPartners = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            const { data, error } = await supabase.rpc('get_nearby_partners', {
              lat: latitude,
              long: longitude,
              radius_meters: 50000,
            });
            if (error || !data) {
              const { data: fallback } = await supabase
                .from('partners')
                .select('id, name, description, address, category, location, image_url, is_active, daily_capacity_limit, min_plan_level, created_at')
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
                .select('id, name, description, address, category, location, image_url, is_active, daily_capacity_limit, min_plan_level, created_at')
                .eq('is_active', true)
                .limit(20);
            setPartners((data as NearbyPartner[]) || []);
            setLoading(false);
          }
        );
      } else {
        const { data } = await supabase.from('partners').select('id, name, description, address, category, location, image_url, is_active, daily_capacity_limit, min_plan_level, created_at').eq('is_active', true).limit(20);
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

  const mapCenter = userLocation || DEFAULT_CENTER;

  return (
    <div className="px-4 pt-12 pb-4 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="flex items-center justify-between mb-4">
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
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center flex-1 flex flex-col items-center justify-center">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-1">No hay gimnasios cerca</p>
          <p className="text-muted-foreground text-sm">Intenta ampliar el radio de búsqueda</p>
        </div>
      ) : view === 'list' ? (
        <div className="space-y-3 overflow-y-auto flex-1">
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
                  {p.category && <span className="text-xs text-muted-foreground">{p.category}</span>}
                  {p.address && <p className="text-sm text-muted-foreground mt-1 truncate">{p.address}</p>}
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
        <div className="rounded-xl overflow-hidden flex-1">
          {!isLoaded ? (
            <div className="h-full flex items-center justify-center bg-secondary">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER}
              center={mapCenter}
              zoom={13}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
              }}
            >
              {partners.map((p) => {
                const lat = (p as any).lat ?? (p.location as any)?.coordinates?.[1];
                const lng = (p as any).long ?? (p.location as any)?.coordinates?.[0];
                if (lat == null || lng == null) return null;
                return (
                  <Marker
                    key={p.id}
                    position={{ lat, lng }}
                    onClick={() => setSelectedPartner(p)}
                  />
                );
              })}

              {selectedPartner && (() => {
                const lat = (selectedPartner as any).lat ?? (selectedPartner.location as any)?.coordinates?.[1];
                const lng = (selectedPartner as any).long ?? (selectedPartner.location as any)?.coordinates?.[0];
                if (lat == null || lng == null) return null;
                return (
                  <InfoWindow
                    position={{ lat, lng }}
                    onCloseClick={() => setSelectedPartner(null)}
                  >
                    <div className="p-1 min-w-[160px]">
                      <h3 className="font-bold text-sm text-foreground">{selectedPartner.name}</h3>
                      {selectedPartner.distance_km != null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistance(selectedPartner.distance_km)}
                        </p>
                      )}
                      <button
                        onClick={() => navigate(`/app/gym/${selectedPartner.id}`)}
                        className="mt-2 w-full text-xs font-semibold bg-primary text-primary-foreground rounded-md py-1.5 px-3 hover:bg-primary/90 transition-colors"
                      >
                        Ver
                      </button>
                    </div>
                  </InfoWindow>
                );
              })()}
            </GoogleMap>
          )}
        </div>
      )}
    </div>
  );
};

export default Explore;
