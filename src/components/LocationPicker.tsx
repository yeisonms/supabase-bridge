import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Locate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCZCXIl1zzKmGt-MXTrdyfUxYBUSfUtecw';
const LIBRARIES: ('places')[] = ['places'];

type Props = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
};

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const { toast } = useToast();
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral>({ lat, lng });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // Sync marker when props change externally
  useEffect(() => {
    setMarkerPos({ lat, lng });
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
    }
  }, [lat, lng]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Setup Places Autocomplete once loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment'],
      fields: ['geometry', 'formatted_address', 'name'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const newLat = place.geometry.location.lat();
        const newLng = place.geometry.location.lng();
        setMarkerPos({ lat: newLat, lng: newLng });
        onChange(newLat, newLng);
        mapRef.current?.panTo({ lat: newLat, lng: newLng });
        mapRef.current?.setZoom(17);
        toast({
          title: '📍 Ubicación encontrada',
          description: place.formatted_address || place.name || 'Dirección seleccionada',
        });
      } else {
        toast({ title: 'Sin resultados', description: 'No se encontró la ubicación.', variant: 'destructive' });
      }
    });

    autocompleteRef.current = autocomplete;
  }, [isLoaded, onChange, toast]);

  // Bias autocomplete to current map bounds
  useEffect(() => {
    if (!autocompleteRef.current || !mapRef.current) return;
    const listener = mapRef.current.addListener('bounds_changed', () => {
      const bounds = mapRef.current?.getBounds();
      if (bounds) autocompleteRef.current?.setBounds(bounds);
    });
    return () => google.maps.event.removeListener(listener);
  }, [isLoaded]);

  const handleDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setMarkerPos({ lat: newLat, lng: newLng });
      onChange(newLat, newLng);
    }
  }, [onChange]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Error', description: 'Tu navegador no soporta geolocalización.', variant: 'destructive' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setMarkerPos({ lat: newLat, lng: newLng });
        onChange(newLat, newLng);
        mapRef.current?.panTo({ lat: newLat, lng: newLng });
        mapRef.current?.setZoom(15);
        toast({ title: '📍 Ubicación detectada', description: 'El mapa se centró en tu posición actual.' });
        setLocating(false);
      },
      () => {
        toast({ title: 'Permiso denegado', description: 'No se pudo obtener tu ubicación.', variant: 'destructive' });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
      {/* Places Autocomplete */}
      <Input
        ref={inputRef}
        placeholder="Busca tu gimnasio o dirección..."
        className="w-full"
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
      />

      {/* Geolocation */}
      <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGeolocate} disabled={locating}>
        <Locate className="h-4 w-4" />
        {locating ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}
      </Button>

      {/* Google Map */}
      {isLoaded ? (
        <GoogleMap
          mapContainerClassName="rounded-xl overflow-hidden border border-border h-64"
          center={markerPos}
          zoom={6}
          onLoad={onMapLoad}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
        >
          <Marker position={markerPos} draggable onDragEnd={handleDragEnd} />
        </GoogleMap>
      ) : (
        <div className="h-64 rounded-xl border border-border flex items-center justify-center text-muted-foreground text-sm">
          Cargando mapa…
        </div>
      )}

      {/* Coordinates display */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Latitud</Label>
          <Input value={lat.toFixed(6)} readOnly className="bg-muted text-xs" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Longitud</Label>
          <Input value={lng.toFixed(6)} readOnly className="bg-muted text-xs" />
        </div>
      </div>
    </div>
  );
}
