import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Locate, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Fix default marker icon
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

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const { toast } = useToast();
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([lat, lng], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChange(pos.lat, pos.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker position when lat/lng change externally
  useEffect(() => {
    if (markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [lat, lng]);

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
        markerRef.current?.setLatLng([newLat, newLng]);
        mapRef.current?.flyTo([newLat, newLng], 15, { duration: 1 });
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

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&accept-language=es&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        onChange(newLat, newLng);
        markerRef.current?.setLatLng([newLat, newLng]);
        mapRef.current?.flyTo([newLat, newLng], 15, { duration: 1 });
        toast({ title: '📍 Dirección encontrada', description: data[0].display_name?.slice(0, 80) });
      } else {
        toast({ title: 'Dirección no encontrada', description: 'Intenta ser más específico.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error de búsqueda', description: 'No se pudo conectar al servicio.', variant: 'destructive' });
    }
    setSearching(false);
  };

  return (
    <div className="space-y-3">
      {/* Address search */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        className="flex gap-2"
      >
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Escribe la dirección y presiona Buscar..."
          className="flex-1"
        />
        <Button type="submit" variant="outline" className="gap-2 shrink-0" disabled={searching}>
          <Search className="h-4 w-4" />
          {searching ? 'Buscando…' : 'Buscar'}
        </Button>
      </form>

      {/* Geolocation */}
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

      <div ref={containerRef} className="rounded-xl overflow-hidden border border-border h-64 z-0" />

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
