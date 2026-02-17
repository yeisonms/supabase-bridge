import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Locate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Fix default marker icon issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type Props = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
};

function DraggableMarker({ lat, lng, onChange }: Props) {
  const markerRef = useRef<L.Marker>(null);

  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      position={[lat, lng]}
      draggable
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker) {
            const pos = marker.getLatLng();
            onChange(pos.lat, pos.lng);
          }
        },
      }}
    />
  );
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const { toast } = useToast();
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

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
        onChange(newLat, newLng);
        setFlyTarget({ lat: newLat, lng: newLng });
        toast({ title: '📍 Ubicación detectada', description: 'El mapa se centró en tu posición actual.' });
        setLocating(false);
      },
      () => {
        toast({ title: 'Permiso denegado', description: 'No se pudo obtener tu ubicación.', variant: 'destructive' });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleGeolocate}
        disabled={locating}
      >
        <Locate className="h-4 w-4" />
        {locating ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}
      </Button>

      <div className="rounded-xl overflow-hidden border border-border h-64">
        <MapContainer
          center={[lat, lng]}
          zoom={6}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker lat={lat} lng={lng} onChange={onChange} />
          {flyTarget && <RecenterMap lat={flyTarget.lat} lng={flyTarget.lng} />}
        </MapContainer>
      </div>

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
