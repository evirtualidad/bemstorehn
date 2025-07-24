
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPwaButton() {
  const [installPromptEvent, setInstallPromptEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPromptEvent(null);
  };

  if (isInstalled) {
    return null;
  }

  if (isIOS) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
             <Button variant="outline" className="gap-2">
                <Share />
                <span>Instalar App en iOS</span>
             </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-center">
            <p>Para instalar: toca el ícono de Compartir en Safari y luego 'Agregar a la pantalla de inicio'.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (installPromptEvent) {
    return (
      <Button onClick={install} variant="outline" className="gap-2">
        <Download />
        <span>Instalar App</span>
      </Button>
    );
  }

  return null;
}
