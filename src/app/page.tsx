
'use client';

import { Header } from '@/components/header';
import { type Product } from '@/lib/products';
import { Separator } from '@/components/ui/separator';
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
import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';
import { useBannersStore } from '@/hooks/use-banners';
import { useCategoriesStore } from '@/hooks/use-categories';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/product-grid';
import { ProductCard } from '@/components/product-card';

export default function Home() {
  const { products, isHydrated } = useProductsStore();
  const { banners } = useBannersStore();
  const { categories } = useCategoriesStore();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const autoplay = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  const productsByCategory = React.useMemo(() => {
    if (!isHydrated) return {};
    return products.reduce((acc, product) => {
      const { category } = product;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products, isHydrated]);
  
  const featuredOfferProducts = React.useMemo(() => 
    isHydrated ? products.filter((p) => p.featured && p.originalPrice && p.originalPrice > p.price) : [], 
  [products, isHydrated]);
  
  const offerProducts = React.useMemo(() => 
    isHydrated ? products.filter(p => p.originalPrice && p.originalPrice > p.price) : [],
  [products, isHydrated]);

  const filteredProducts = React.useMemo(() => {
    if (!selectedCategory) return [];
    if (selectedCategory === '__offers__') {
        return offerProducts;
    }
    return products.filter(p => p.category === selectedCategory);
  }, [selectedCategory, products, offerProducts]);
  
  
  if (!isHydrated) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header 
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            hasOfferProducts={false}
        />
        <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
        </div>
      </div>
    );
  }

  const CategorySection = ({ categoryName }: { categoryName: string }) => {
    const category = categories.find(c => c.name === categoryName);
    if (!category || !productsByCategory[categoryName]) return null;

    return (
      <div className="mb-16">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-bold mb-8 text-primary">{category.label}</h3>
          <ProductGrid products={productsByCategory[categoryName]} />
        </div>
      </div>
    );
  };
  
  const getCategoryLabel = () => {
    if (selectedCategory === '__offers__') {
        return 'Ofertas';
    }
    return categories.find(c => c.name === selectedCategory)?.label;
  }

  return (
    <div className="bg-background min-h-screen">
      <Header 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        hasOfferProducts={offerProducts.length > 0}
      />
      <main>
        {!selectedCategory ? (
          <>
            {/* Hero Section */}
            {banners.length > 0 && (
                <section className="relative w-full">
                <Carousel
                    plugins={[autoplay.current]}
                    className="w-full"
                    opts={{
                        loop: true,
                    }}
                    onMouseEnter={autoplay.current.stop}
                    onMouseLeave={autoplay.current.reset}
                >
                    <CarouselContent>
                    {banners.map((banner, index) => (
                        <CarouselItem key={banner.id || index}>
                        <div className="relative h-[50vh] w-full flex items-center justify-center text-center text-white">
                            <Image
                            src={banner.image || 'https://placehold.co/1200x600.png'}
                            alt={banner.title}
                            fill
                            className="object-cover brightness-75"
                            data-ai-hint={banner.aiHint}
                            priority={index === 0}
                            />
                            <div className="relative z-10 container mx-auto px-4 animate-in fade-in-0 slide-in-from-bottom-10 duration-700">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-shadow-lg">
                                {banner.title}
                            </h1>
                            <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-shadow">
                                {banner.description}
                            </p>
                            </div>
                        </div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
                    <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
                </Carousel>
                </section>
            )}

            {/* Featured Products Section */}
            {featuredOfferProducts.length > 0 && (
              <section className="py-16 md:py-24 bg-primary-light">
                <div className="container mx-auto px-4">
                  <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 md:mb-16 text-primary">Nuestras Mejores Ofertas</h2>
                  <Carousel
                    opts={{
                      align: 'start',
                      loop: featuredOfferProducts.length > 3,
                    }}
                    className="w-full"
                  >
                    <CarouselContent>
                      {featuredOfferProducts.map((product) => (
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
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-14">Nuestro Catálogo</h2>
              {Object.keys(productsByCategory).map((categoryName) => (
                <CategorySection key={categoryName} categoryName={categoryName} />
              ))}
            </section>
          </>
        ) : (
          <section className="py-12 md:py-20">
            <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 md:mb-14 gap-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center">
                        {getCategoryLabel()}
                    </h2>
                    <Button variant="outline" onClick={() => setSelectedCategory(null)}>Ver Todos los Productos</Button>
                </div>
                <ProductGrid products={filteredProducts} />
            </div>
          </section>
        )}
      </main>
      <footer className="py-10 border-t border-border/40 bg-muted/30">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-muted-foreground px-4">
          <div>
            <h3 className="font-bold text-xl text-foreground mb-3">Cosmetica</h3>
            <p className="text-sm">Belleza en su Forma más Pura.</p>
          </div>
          <div>
            <h4 className="font-bold text-lg text-foreground mb-3">Tienda</h4>
            <ul className="space-y-2 text-sm">
              {categories.map(cat => (
                <li key={cat.id}><Link href="#" className="hover:text-primary">{cat.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg text-foreground mb-3">Sobre Nosotros</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-primary">Nuestra Historia</Link></li>
              <li><Link href="#" className="hover:text-primary">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg text-foreground mb-3">Síguenos</h4>
            {/* Social media icons would go here */}
          </div>
        </div>
        <div className="container mx-auto text-center text-muted-foreground mt-8 pt-6 border-t border-border/40">
          <p className="text-sm">&copy; 2024 Cosmetica. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
