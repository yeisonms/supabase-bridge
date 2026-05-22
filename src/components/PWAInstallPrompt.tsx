import React, { useEffect, useState } from "react";
import { X, Download, Share, PlusSquare, Smartphone, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const ios = /iPad|iPhone|iPod/.test(userAgent) || (userAgent.includes("Mac") && navigator.maxTouchPoints > 0);
    setIsIOS(ios);

    // Check if already running in standalone mode (already installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;

    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem("pwa-prompt-dismissed-at");
    const isDismissed = dismissedAt && Date.now() - parseInt(dismissedAt) < 7 * 24 * 60 * 60 * 1000;

    if (isStandalone) {
      console.log("PWA already running in standalone mode.");
      return;
    }

    if (isDismissed) {
      console.log("PWA installation prompt was dismissed recently.");
      return;
    }

    // Android / Chrome handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS handler: since there's no event, we show it based on a timer
    if (ios) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback for Android browsers that don't trigger the event or have already handled it
      alert("Para instalar RedFit, abre el menú de tu navegador (los tres puntos verticales en la esquina superior derecha) y selecciona 'Instalar aplicación' o 'Agregar a la pantalla de inicio'.");
      return;
    }

    // Trigger Android installation dialog
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Clear prompt state
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed-at", Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Floating Action Banner */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-3 text-card-foreground">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-border bg-black flex-shrink-0">
              <img 
                src="/pwa-192.png" 
                alt="RedFit Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if PWA icon is not built yet
                  (e.target as HTMLImageElement).src = "/favicon.svg";
                }}
              />
            </div>
            <div>
              <h4 className="font-semibold text-sm leading-tight text-foreground">Instalar RedFit App</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Acceso rápido y mejor rendimiento.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button size="sm" variant="default" className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-xl h-8 px-3" onClick={handleInstallClick}>
              Instalar
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* iOS Installation Walkthrough Guide */}
      <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
        <DialogContent className="max-w-xs rounded-2xl sm:max-w-md bg-card/95 backdrop-blur-md border-border/60">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border bg-black shadow-lg mb-2">
              <img src="/pwa-192.png" alt="RedFit" className="w-full h-full object-cover" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">Instalar RedFit en tu iPhone</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Sigue estos simples pasos para tener RedFit en tu pantalla de inicio como una aplicación nativa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-3 text-foreground">
            <div className="flex gap-3 items-start p-3 rounded-xl bg-muted/40 border border-border/40">
              <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium flex items-center gap-1">
                  Presiona el botón <span className="font-semibold">Compartir</span> <Share className="h-4 w-4 inline text-blue-500 stroke-[2.5]" />
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ubicado en la barra de herramientas de Safari en la parte inferior (o superior en iPad).
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 rounded-xl bg-muted/40 border border-border/40">
              <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium flex items-center gap-1">
                  Selecciona <span className="font-semibold">Agregar a la pantalla de inicio</span> <PlusSquare className="h-4 w-4 inline text-foreground stroke-[2.5]" />
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Desliza hacia abajo en el menú de compartir hasta encontrar la opción con el signo "+".
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 rounded-xl bg-muted/40 border border-border/40">
              <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium flex items-center gap-1">
                  Presiona <span className="font-semibold text-red-500">Agregar</span> en la esquina superior
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ¡Listo! Se creará la aplicación con el logotipo oficial y se ejecutará de forma independiente en pantalla completa.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-2">
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl" onClick={() => {
              setShowIOSGuide(false);
              setShowPrompt(false);
              localStorage.setItem("pwa-prompt-dismissed-at", Date.now().toString());
            }}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
