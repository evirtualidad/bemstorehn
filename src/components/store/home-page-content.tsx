
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { ProductCard } from './product-card';
import { type Product, type Category, type Banner } from '@/lib/types';
import Autoplay from 'embla-carousel-autoplay';
import { Card, CardContent } from '../ui/card';

interface HomePageContentProps {
  banners: Banner[];
  products: Product[];
  featuredProducts: Product[];
  categories: Category[];
}

export function HomePageContent({ 
    banners,
    products, 
    featuredProducts, 
    categories 
}: HomePageContentProps) {
  
  const autoplayPlugin = React.useRef(
      Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const productsByCategory = React.useMemo(() => {
    return products.reduce((acc, product) => {
      const { category } = product;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products]);

  return (
    <main>
        {/* Hero Carousel */}
        <section className="w-full">
             <Carousel
                opts={{ align: 'start', loop: true }}
                plugins={[autoplayPlugin.current]}
                className="w-full"
            >
                <CarouselContent>
                    {banners.map((banner) => (
                        <CarouselItem key={banner.id}>
                            <div className="relative w-full h-[60vh] sm:h-[70vh]">
                                <Image
                                    src={banner.image}
                                    alt={banner.title}
                                    fill
                                    className="object-cover brightness-75"
                                    data-ai-hint={banner.aiHint}
                                    priority={banners.indexOf(banner) === 0}
                                />
                                <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center text-center h-full text-white">
                                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
                                      {banner.title}
                                    </h1>
                                    <p className="mt-4 text-lg sm:text-xl max-w-2xl mx-auto">
                                      {banner.description}
                                    </p>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="py-12 md:py-16">
            <div className="container mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Productos Destacados</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {featuredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories Section */}
        {categories.map((category) => {
            const categoryProducts = productsByCategory[category.name];
            if (!categoryProducts || categoryProducts.length === 0) return null;

            return (
              <section key={category.id} className="py-12 md:py-16 bg-secondary/30">
                <div className="container mx-auto">
                  <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{category.label}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </section>
            )
        })}
    </main>
  );
}
