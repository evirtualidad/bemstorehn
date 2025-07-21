
'use client';

import * as React from 'react';
import Image from 'next/image';
import { type Product, type Category } from '@/lib/types';
import { ProductCard } from './product-card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useBannersStore } from '@/hooks/use-banners';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

const FilterIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 6L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M4 6L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 18L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 18L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="6" r="2" transform="rotate(90 12 6)" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="18" r="2" transform="rotate(90 12 18)" stroke="currentColor" strokeWidth="2"/>
    </svg>
);


interface HomePageContentProps {
  products: Product[];
  categories: Category[];
}

export function HomePageContent({ 
    products, 
    categories 
}: HomePageContentProps) {
    const [selectedCategory, setSelectedCategory] = React.useState('all');
    const [searchQuery, setSearchQuery] = React.useState('');
    const { banners } = useBannersStore();
    const autoplayPlugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    );

    const filteredProducts = React.useMemo(() => {
        let prods = products;

        if (selectedCategory !== 'all') {
            prods = prods.filter(p => p.category === selectedCategory);
        }

        if (searchQuery) {
            prods = prods.filter((product) =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        return prods;
    }, [products, selectedCategory, searchQuery]);

    return (
        <main className="px-4 pt-4 pb-8 space-y-8">
            <div className="flex items-center gap-2 fade-in" style={{ animationDelay: '100ms' }}>
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search..." 
                        className="bg-secondary rounded-full h-14 pl-12 text-base border-none" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button size="icon" className="w-14 h-14 rounded-full bg-primary text-primary-foreground shrink-0">
                    <FilterIcon />
                </Button>
            </div>
            
            <Carousel
              opts={{ loop: true }}
              plugins={[autoplayPlugin.current]}
              className="w-full fade-in"
              style={{ animationDelay: '200ms' }}
            >
              <CarouselContent>
                {banners.map((banner) => (
                  <CarouselItem key={banner.id}>
                    <div className="relative w-full h-52 md:h-64 rounded-3xl overflow-hidden">
                      <Image
                        src={banner.image}
                        alt={banner.title}
                        fill
                        className="object-cover"
                        data-ai-hint={banner.aiHint || 'fashion banner'}
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4">
                        <h2 className="text-2xl md:text-4xl font-extrabold text-white">{banner.title}</h2>
                        <p className="text-sm md:text-lg text-white/90 mt-2 max-w-xl">{banner.description}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <div className="space-y-4 fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Categories</h2>
                    <Link href="#" className="text-sm font-semibold text-muted-foreground">See all</Link>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                     <Button 
                        onClick={() => setSelectedCategory('all')} 
                        variant={selectedCategory === 'all' ? 'default' : 'secondary'}
                        className={cn(
                            'rounded-full px-5 h-11 whitespace-nowrap text-base font-bold',
                            selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                        )}
                    >
                        All
                    </Button>
                    {categories.map((cat) => (
                        <Button 
                            key={cat.id} 
                            onClick={() => setSelectedCategory(cat.name)}
                            variant={selectedCategory === cat.name ? 'default' : 'secondary'}
                            className={cn(
                                'rounded-full px-5 h-11 whitespace-nowrap text-base font-bold',
                                selectedCategory === cat.name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                            )}
                        >
                            {cat.label}
                        </Button>
                    ))}
                </div>
            </div>
            
            <div className="space-y-4 fade-in" style={{ animationDelay: '400ms' }}>
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">New Catalogs</h2>
                    <Link href="#" className="text-sm font-semibold text-muted-foreground">See all</Link>
                 </div>
                 {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>No se encontraron productos que coincidan con tu búsqueda.</p>
                    </div>
                 )}
            </div>
        </main>
    );
}
