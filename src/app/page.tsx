
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
  type CarouselApi,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';
import { useBannersStore, Banner } from '@/hooks/use-banners';
import { useCategoriesStore } from '@/hooks/use-categories';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/product-grid';
import { ProductCard } from '@/components/product-card';
import { Pause, Play, Instagram, Facebook, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// A custom TikTok icon as lucide-react might not have it.
const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 7.4c-1.3-1.4-3.1-2.2-5-2.4v12.2c0 2.3-1.9 4.2-4.2 4.2s-4.2-1.9-4.2-4.2V8.7c-2.3.7-4 2.6-4.6 4.9-.7 3.2 1.2 6.4 4.4 7.1 3.2.7 6.4-1.2 7.1-4.4.1-.5.2-1 .2-1.5V7.4z"></path>
    </svg>
);


function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [current, setCurrent] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const autoplayPlugin = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));

  React.useEffect(() => {
    if (!api) {
      return;
    }

    const onSettle = () => {
      setCurrent(api.selectedScrollSnap());
    };
    
    const onAutoplayPlay = () => setIsPlaying(true);
    const onAutoplayStop = () => setIsPlaying(false);

    api.on('settle', onSettle);
    api.on('autoplay:play', onAutoplayPlay);
    api.on('autoplay:stop', onAutoplayStop);

    // Initial state
    setCurrent(api.selectedScrollSnap());
    if (isPlaying) {
      api.plugins().autoplay?.play();
    }

    return () => {
      api.off('settle', onSettle);
      api.off('autoplay:play', onAutoplayPlay);
      api.off('autoplay:stop', onAutoplayStop);
    };
  }, [api, isPlaying]);

  const togglePlay = React.useCallback(() => {
    const autoplay = api?.plugins().autoplay;
    if (!autoplay) return;

    if (isPlaying) {
      autoplay.stop();
    } else {
      autoplay.play();
    }
    setIsPlaying(!isPlaying);
  }, [api, isPlaying]);
  
  if (banners.length === 0) return null;

  return (
    <section className="relative w-full group/hero">
      <Carousel
        setApi={setApi}
        plugins={[autoplayPlugin.current]}
        className="w-full"
        opts={{ loop: true, duration: 500 }}
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
      </Carousel>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-full max-w-xs mx-auto">
        <div className='relative flex items-center justify-center gap-2 p-2'>
          {banners.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-2.5 rounded-full bg-white/50 transition-all duration-300 cursor-pointer',
                  index === current ? 'w-4 bg-white' : 'w-2.5 hover:bg-white/75'
                )}
                role="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => api?.scrollTo(index)}
              >
                 {index === current && isPlaying && (
                  <div
                    key={current} // Add key to force re-render
                    className="h-full rounded-full bg-primary/80 animate-fill-progress"
                    style={{ animationDuration: '5s' }}
                  />
                )}
              </div>
            )
          )}
        </div>
      </div>
       <Button
        size="icon"
        variant="ghost"
        className="absolute bottom-4 right-4 z-20 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white transition-opacity opacity-0 group-hover/hero:opacity-100"
        onClick={togglePlay}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        <span className="sr-only">{isPlaying ? 'Pause carousel' : 'Play carousel'}</span>
      </Button>
    </section>
  );
}


function FeaturedProductsCarousel({ products }: { products: Product[] }) {
    if (products.length === 0) return null;

    const autoplayPlugin = React.useRef(Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true }));

    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary-light to-background">
            <div className="container mx-auto px-4">
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 md:mb-16 text-primary">Nuestras Mejores Ofertas</h2>
                <Carousel
                    opts={{
                        align: 'start',
                        loop: products.length > 4,
                    }}
                    plugins={[autoplayPlugin.current]}
                    className="w-full"
                >
                    <CarouselContent>
                        {products.map((product) => (
                            <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4">
                                <ProductCard product={product} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}

export default function Home() {
  const { products, isHydrated } = useProductsStore();
  const { banners } = useBannersStore();
  const { categories } = useCategoriesStore();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

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
            <HeroCarousel banners={banners} />
            <FeaturedProductsCarousel products={featuredOfferProducts} />
            <Separator className="my-8 bg-border/40" />
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
            <h3 className="font-bold text-xl text-foreground mb-3">BEM STORE HN</h3>
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
            <div className="flex items-center gap-4">
                <a href="https://instagram.com/bemstorehn" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <Instagram className="h-6 w-6" />
                    <span className="sr-only">Instagram</span>
                </a>
                 <a href="https://facebook.com/bemstorehn" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <Facebook className="h-6 w-6" />
                    <span className="sr-only">Facebook</span>
                </a>
                 <a href="https://tiktok.com/@bemstorehn" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <TikTokIcon className="h-6 w-6" />
                    <span className="sr-only">TikTok</span>
                </a>
            </div>
          </div>
        </div>
        <div className="container mx-auto text-center text-muted-foreground mt-8 pt-6 border-t border-border/40">
          <p className="text-sm">&copy; 2024 BEM STORE HN. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
