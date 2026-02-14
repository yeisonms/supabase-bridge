import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoGalleryProps {
  photos: string[];
  name: string;
  planCard?: React.ReactNode;
}

const PhotoGallery = ({ photos, name, planCard }: PhotoGalleryProps) => {
  const [galleryOpen, setGalleryOpen] = useState(false);

  if (photos.length === 0) return null;

  // Inline gallery view (scrollable large photos with thumbnails)
  if (galleryOpen) {
    return (
      <div className="w-full">
        {/* Close button */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setGalleryOpen(false)}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <X className="h-4 w-4" />
            Cerrar
          </button>
        </div>

        {/* Thumbnails strip */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {photos.map((src, i) => (
            <button
              key={i}
              onClick={() => {
                document.getElementById(`gallery-photo-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 border-border hover:border-primary transition-colors"
            >
              <img src={src} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Large photos stacked */}
        <div className="space-y-6">
          {photos.map((src, i) => (
            <div key={i} id={`gallery-photo-${i}`} className="w-full flex justify-center">
              <img
                src={src}
                alt={`${name} - Foto ${i + 1}`}
                className="w-full max-w-2xl rounded-xl object-cover"
                loading={i < 2 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid view (Wellhub style)
  const mainPhoto = photos[0];
  const sidePhotos = photos.slice(1, 3);
  const hasMorePhotos = photos.length > 3;

  return (
    <div className="w-full">
      {/* Photo grid: plan card + photos */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_0.8fr] gap-2 h-auto md:h-80">
        {/* Plan card slot (left) */}
        {planCard && (
          <div className="hidden md:block rounded-xl overflow-hidden">
            {planCard}
          </div>
        )}

        {/* Main large photo (center) */}
        <div
          className={cn(
            'relative rounded-xl overflow-hidden cursor-pointer min-h-[200px]',
            !planCard && 'md:col-span-2'
          )}
          onClick={() => setGalleryOpen(true)}
        >
          <img
            src={mainPhoto}
            alt={`${name} - Foto principal`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Side photos (right) */}
        <div className="hidden md:grid grid-rows-2 gap-2 rounded-xl overflow-hidden">
          {sidePhotos.map((src, i) => (
            <div
              key={i}
              className={cn(
                'relative overflow-hidden cursor-pointer',
                i === 0 && 'rounded-tr-xl',
                i === sidePhotos.length - 1 && 'rounded-br-xl'
              )}
              onClick={() => setGalleryOpen(true)}
            >
              <img
                src={src}
                alt={`${name} - Foto ${i + 2}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {/* "Más información" button on the last side photo */}
              {i === sidePhotos.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setGalleryOpen(true); }}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium rounded-full shadow-md hover:bg-card transition-colors border"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Más información
                </button>
              )}
            </div>
          ))}
          {/* If only 1 side photo, fill the second slot */}
          {sidePhotos.length === 1 && (
            <div
              className="relative overflow-hidden rounded-br-xl cursor-pointer bg-secondary flex items-center justify-center"
              onClick={() => setGalleryOpen(true)}
            >
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium rounded-full shadow-md border">
                <Eye className="h-3.5 w-3.5" />
                Más información
              </button>
            </div>
          )}
          {sidePhotos.length === 0 && (
            <div
              className="relative overflow-hidden rounded-r-xl cursor-pointer bg-secondary flex items-center justify-center row-span-2"
              onClick={() => setGalleryOpen(true)}
            >
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium rounded-full shadow-md border">
                <Eye className="h-3.5 w-3.5" />
                Ver fotos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: "Más información" button below */}
      <div className="md:hidden mt-2 flex justify-end">
        <button
          onClick={() => setGalleryOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card text-foreground text-xs font-medium rounded-full shadow-sm border hover:bg-secondary transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
        </button>
      </div>
    </div>
  );
};

export default PhotoGallery;
