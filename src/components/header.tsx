
'use client';

import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

const BurgerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M4 12H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
)

export function Header() {
  return (
    <header className="px-4 pt-6 pb-2 bg-background">
      <div className="container mx-auto flex items-center justify-between gap-4 p-0">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full">
            <BurgerIcon />
            <span className="sr-only">Menu</span>
        </Button>
        
        <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5"/>
            <span className="font-bold">Paris</span>
        </div>
      </div>
    </header>
  );
}
