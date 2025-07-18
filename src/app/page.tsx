
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
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';
import { useBannersStore, Banner } from '@/hooks/use-banners';
import { useCategoriesStore } from '@/hooks/use-categories';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Pause, Play, Instagram, Facebook, ShoppingCart } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { useCurrencyStore } from '@/hooks/use-currency';
import { ProductGridHomepage } from '@/components/product-grid-homepage';

// A custom TikTok icon as lucide-react might not have it.
const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="currentColor" {...props}>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.05-4.86-.95-6.69-2.8-1.95-1.98-2.65-4.81-1.76-7.12 1.16-2.95 4.09-4.96 7.08-5.34.07-1.54.03-3.08.02-4.61.11-1.2.6-2.39 1.31-3.42 1.31-1.92 3.58-3.17 5.91-3.21z"/>
    </svg>
);


function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);

  React.useEffect(() => {
    if (!isPlaying || banners.length === 0) return;

    const timer = setTimeout(() => {
      setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearTimeout(timer);
  }, [current, isPlaying, banners.length]);

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrent(slideIndex);
  };
  
  if (banners.length === 0) return null;

  return (
    <section className="relative w-full group/hero h-[50vh] sm:h-[60vh] lg:h-[70vh]">
      <div className="w-full h-full">
        <div className="fade-carousel-content h-full">
          {banners.map((banner, index) => (
            <div
              key={banner.id || index}
              className="fade-carousel-item w-full h-full"
              data-active={index === current}
            >
              <div className="relative h-full w-full flex items-center justify-center text-center text-white">
                <Image
                  src={banner.image || 'https://placehold.co/1200x600.png'}
                  alt={banner.title}
                  fill
                  className="object-cover brightness-75"
                  data-ai-hint={banner.aiHint}
                  priority={index === 0}
                />
                <div className="relative z-10 container mx-auto px-4 animate-in fade-in-0 slide-in-from-bottom-10 duration-700">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-shadow-lg">
                    {banner.title}
                  </h1>
                  <p className="mt-4 text-sm sm:text-base max-w-2xl mx-auto text-shadow">
                    {banner.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                onClick={() => goToSlide(index)}
              >
                 {index === current && isPlaying && (
                  <div
                    key={`${current}-${isPlaying}`}
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

    const autoplayPlugin = React.useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
    );

    return (
        <section className="py-12 md:py-20 bg-gradient-to-b from-primary-light to-background">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-12 text-primary">Nuestras Mejores Ofertas</h2>
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
                            <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                                <ProductGridHomepage.Card product={product} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}

function StoreMobileCartButton() {
    const { total, toggleCart, items } = useCart(state => ({ 
        total: state.total, 
        toggleCart: state.toggleCart,
        items: state.items
    }));
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const { currency } = useCurrencyStore();
  
    return (
        <Button
            size="lg"
            className="relative h-20 w-20 rounded-2xl shadow-lg flex flex-col items-center justify-center p-2 gap-1 bg-primary text-primary-foreground hover:bg-primary/90 border-4 border-background"
            onClick={toggleCart}
        >
            <ShoppingCart className="h-6 w-6" />
            <span className="text-sm font-bold">{formatCurrency(total, currency.code)}</span>
            {itemCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-7 w-7 flex items-center justify-center border-4 border-background">
                    {itemCount}
                </div>
            )}
        </Button>
    );
}

export default function Home() {
  const { products, fetchProducts, isLoading: isLoadingProducts } = useProductsStore();
  const { banners, fetchBanners, isLoading: isLoadingBanners } = useBannersStore();
  const { categories, fetchCategories, isLoading: isLoadingCategories } = useCategoriesStore();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    fetchProducts();
    fetchBanners();
    fetchCategories();
  }, [fetchProducts, fetchBanners, fetchCategories]);

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
  
  const featuredOfferProducts = React.useMemo(() => 
    products.filter((p) => p.featured && p.originalPrice && p.originalPrice > p.price), 
  [products]);
  
  const offerProducts = React.useMemo(() => 
    products.filter(p => p.originalPrice && p.originalPrice > p.price),
  [products]);

  const filteredProducts = React.useMemo(() => {
    if (!selectedCategory) return [];
    if (selectedCategory === '__offers__') {
        return offerProducts;
    }
    return products.filter(p => p.category === selectedCategory);
  }, [selectedCategory, products, offerProducts]);

  const isLoading = isLoadingProducts || isLoadingBanners || isLoadingCategories;

  if (isLoading) {
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
      <div className="mb-12">
        <div className="container mx-auto px-4">
          <h3 className="text-xl md:text-2xl font-bold mb-6 text-primary">{category.label}</h3>
          <ProductGridHomepage products={productsByCategory[categoryName]} />
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
            <section className="py-10 md:py-16">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Nuestro Catálogo</h2>
              {Object.keys(productsByCategory).map((categoryName) => (
                <CategorySection key={categoryName} categoryName={categoryName} />
              ))}
            </section>
          </>
        ) : (
          <section className="py-10 md:py-16">
            <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 md:mb-12 gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-center">
                        {getCategoryLabel()}
                    </h2>
                    <Button variant="outline" onClick={() => setSelectedCategory(null)}>Ver Todos los Productos</Button>
                </div>
                <ProductGridHomepage products={filteredProducts} />
            </div>
          </section>
        )}
      </main>

      <div className="md:hidden fixed bottom-4 right-4 z-20">
            <StoreMobileCartButton />
      </div>

      <footer className="py-10 border-t border-border/40 bg-muted/30">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-muted-foreground px-4">
          <div>
            <h3 className="font-bold text-lg text-foreground mb-3">BEM STORE HN</h3>
            <p className="text-sm">Belleza en su Forma más Pura.</p>
          </div>
          <div>
            <h4 className="font-bold text-md text-foreground mb-3">Tienda</h4>
            <ul className="space-y-2 text-sm">
              {categories.map(cat => (
                <li key={cat.id}><Link href="#" className="hover:text-primary">{cat.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-md text-foreground mb-3">Sobre Nosotros</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-primary">Nuestra Historia</Link></li>
              <li><Link href="#" className="hover:text-primary">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-md text-foreground mb-3">Síguenos</h4>
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
