'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';

const BurgerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6H20" stroke="black" strokeWidth="2" strokeLinecap="round"/>
        <path d="M4 12H12" stroke="black" strokeWidth="2" strokeLinecap="round"/>
    </svg>
)


export function Header() {
  return (
    <header className="px-4 pt-4 pb-2 bg-background">
      <div className="container mx-auto flex items-center justify-between gap-4 p-0">
        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-2 bg-secondary">
            <BurgerIcon />
            <span className="sr-only">Menu</span>
        </Button>
        
        <Image 
            src="https://placehold.co/48x48.png" 
            alt="User Avatar"
            width={48}
            height={48}
            className="rounded-full"
            data-ai-hint="man avatar"
        />
      </div>
    </header>
  );
}
