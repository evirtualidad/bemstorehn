import { Leaf } from 'lucide-react';

export function Header() {
  return (
    <header className="py-4 px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/40">
      <div className="container mx-auto flex items-center justify-center text-center">
        <div className="flex items-center gap-3">
          <Leaf className="w-8 h-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-headline text-foreground tracking-wide">
            Cosmetica Catalog
          </h1>
        </div>
      </div>
    </header>
  );
}
