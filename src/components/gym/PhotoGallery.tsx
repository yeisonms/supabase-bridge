import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, X, Camera } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface PhotoGalleryProps {
  photos: string[];
  name: string;
}

const PhotoGallery = ({ photos, name }: PhotoGalleryProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // Hero carousel with autoplay
  const [heroRef, heroApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: true }),
  ]);
  const [heroSelected, setHeroSelected] = useState(0);

  // Modal carousel
  const [modalRef, modalApi] = useEmblaCarousel({ loop: true, startIndex: modalIndex });
  const [modalSelected, setModalSelected] = useState(0);

  // Hero sync
  useEffect(() => {
    if (!heroApi) return;
    const onSelect = () => setHeroSelected(heroApi.selectedScrollSnap());
    heroApi.on('select', onSelect);
    return () => { heroApi.off('select', onSelect); };
  }, [heroApi]);

  // Modal sync
  useEffect(() => {
    if (!modalApi) return;
    const onSelect = () => setModalSelected(modalApi.selectedScrollSnap());
    modalApi.on('select', onSelect);
    return () => { modalApi.off('select', onSelect); };
  }, [modalApi]);

  // When modal opens, scroll to the correct index
  useEffect(() => {
    if (modalOpen && modalApi) {
      modalApi.scrollTo(modalIndex, true);
    }
  }, [modalOpen, modalApi, modalIndex]);

  const openModal = useCallback((index: number) => {
    setModalIndex(index);
    setModalOpen(true);
  }, []);

  if (photos.length === 0) return null;

  return (
    <>
      {/* Hero Carousel */}
      <div className="relative w-full h-72 sm:h-80 md:h-96 cursor-pointer group" onClick={() => openModal(heroSelected)}>
        <div className="overflow-hidden h-full" ref={heroRef}>
          <div className="flex h-full">
            {photos.map((src, i) => (
              <div key={i} className="flex-[0_0_100%] min-w-0 h-full relative">
                <img
                  src={src}
                  alt={`${name} - Foto ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); heroApi?.scrollPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); heroApi?.scrollNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); heroApi?.scrollTo(i); }}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === heroSelected ? 'bg-white scale-125' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        )}

        {/* "Ver fotos" button */}
        <button
          onClick={(e) => { e.stopPropagation(); openModal(0); }}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md text-white text-sm font-medium rounded-full hover:bg-black/70 transition-colors"
        >
          <Camera className="h-4 w-4" />
          Ver {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
        </button>
      </div>

      {/* Fullscreen Gallery Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-none w-screen h-screen p-0 border-none rounded-none bg-black/95 [&>button]:hidden">
          {/* Close button */}
          <button
            onClick={() => setModalOpen(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 text-white/80 text-sm font-medium">
            {modalSelected + 1} / {photos.length}
          </div>

          {/* Main carousel */}
          <div className="flex flex-col h-full justify-center">
            <div className="relative flex-1 flex items-center">
              <div className="overflow-hidden w-full h-full" ref={modalRef}>
                <div className="flex h-full items-center">
                  {photos.map((src, i) => (
                    <div key={i} className="flex-[0_0_100%] min-w-0 h-full flex items-center justify-center p-4 sm:p-8">
                      <img
                        src={src}
                        alt={`${name} - Foto ${i + 1}`}
                        className="max-w-full max-h-full object-contain rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => modalApi?.scrollPrev()}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => modalApi?.scrollNext()}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails strip */}
            {photos.length > 1 && (
              <div className="flex justify-center gap-2 px-4 py-3 overflow-x-auto">
                {photos.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => modalApi?.scrollTo(i)}
                    className={cn(
                      'w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all',
                      i === modalSelected
                        ? 'border-white ring-1 ring-white/40 opacity-100'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    )}
                  >
                    <img src={src} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoGallery;
