
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Download, Share } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePathname } from 'next/navigation';

export function InstallPwaButton() {
  const { canInstall, install, isIOS, isInstalled } = usePwaInstall();
  const pathname = usePathname();

  // Only show the button within the admin panel
  if (!pathname.startsWith('/admin')) {
    return null;
  }

  if (isInstalled) {
    return null; // Don't show the button if the app is already installed
  }

  if (isIOS) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full">
              <Share />
              <span className="sr-only">Instalar App</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Para instalar: toca Compartir y luego 'Agregar a la pantalla de inicio'</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (canInstall) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={install} className="h-11 w-11 rounded-full">
              <Download />
              <span className="sr-only">Instalar App</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Instalar App</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
