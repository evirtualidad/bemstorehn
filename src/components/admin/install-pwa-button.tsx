
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share } from 'lucide-react';

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

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
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
        <div className="hidden sm:flex items-center gap-2 p-2 rounded-lg bg-secondary text-sm">
            <p className="font-medium">Instalar:</p>
            <Share className="h-4 w-4" />
            <p className="text-muted-foreground mr-1">→</p>
            <p className="font-medium">'Agregar a inicio'</p>
        </div>
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
