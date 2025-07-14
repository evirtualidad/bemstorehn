
'use client';

import { Header } from '@/components/header';
import { ProductCard } from '@/components/product-card';
import { type Product } from '@/lib/products';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useProductsStore } from '@/hooks/use-products';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export default function Home() {
  const { products } = useProductsStore();

  const productsByCategory = products.reduce((acc, product) => {
    const { category } = product;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const featuredProducts = products.filter((p) => p.featured);

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white bg-gradient-to-t from-primary/30 to-transparent">
          <Image
            src="https://placehold.co/1920x1080.png"
            alt="Cosméticos naturales sobre un fondo de mármol"
            layout="fill"
            objectFit="cover"
            className="z-[-1] brightness-75"
            data-ai-hint="cosmetics flatlay"
          />
          <div className="container mx-auto px-4 z-10 animate-in fade-in-0 slide-in-from-bottom-10 duration-700">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline tracking-tight text-shadow-lg">
              Belleza en su Forma más Pura
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto font-body text-shadow">
              Descubre nuestra colección exclusiva de cosméticos, elaborados con los mejores ingredientes naturales.
            </p>
            <Button size="lg" className="mt-8 font-body text-lg">
              Comprar Todos los Productos
            </Button>
          </div>
        </section>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="py-12 md:py-20">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl md:text-5xl font-headline text-center mb-10 md:mb-14">Productos Destacados</h2>
              <Carousel
                opts={{
                  align: 'start',
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {featuredProducts.map((product) => (
                    <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4">
                        <ProductCard product={product} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
              </Carousel>
            </div>
          </section>
        )}
        
        <Separator className="my-8 bg-border/40" />
        
        {/* All Products by Category */}
        <section className="py-12 md:py-20">
          <h2 className="text-4xl md:text-5xl font-headline text-center mb-10 md:mb-14">Nuestro Catálogo</h2>
          {Object.entries(productsByCategory).map(([category, items]) => (
            <div key={category} className="mb-16">
              <div className="container mx-auto px-4">
                <h3 className="text-3xl md:text-4xl font-headline mb-8 text-primary">{category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
      <footer className="py-10 border-t border-border/40 bg-muted/30">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-muted-foreground px-4">
          <div>
            <h3 className="font-headline text-xl text-foreground mb-3">Cosmetica</h3>
            <p className="font-body text-sm">Belleza en su Forma más Pura.</p>
          </div>
          <div>
            <h4 className="font-headline text-lg text-foreground mb-3">Tienda</h4>
            <ul className="space-y-2 font-body text-sm">
              <li><Link href="#" className="hover:text-primary">Skincare</Link></li>
              <li><Link href="#" className="hover:text-primary">Maquillaje</Link></li>
              <li><Link href="#" className="hover:text-primary">Cuidado del Cabello</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-headline text-lg text-foreground mb-3">Sobre Nosotros</h4>
            <ul className="space-y-2 font-body text-sm">
              <li><Link href="#" className="hover:text-primary">Nuestra Historia</Link></li>
              <li><Link href="#" className="hover:text-primary">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-headline text-lg text-foreground mb-3">Síguenos</h4>
            {/* Social media icons would go here */}
          </div>
        </div>
        <div className="container mx-auto text-center text-muted-foreground mt-8 pt-6 border-t border-border/40">
          <p className="font-body text-sm">&copy; 2024 Cosmetica. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
