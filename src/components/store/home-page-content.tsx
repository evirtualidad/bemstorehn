
'use client';

import * as React from 'react';
import Image from 'next/image';
import { type Product, type Category } from '@/lib/types';
import { ProductGridHomepage } from './product-grid-homepage';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useBannersStore } from '@/hooks/use-banners';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

    const selectedCategoryLabel = React.useMemo(() => {
        if (selectedCategory === 'all') {
            return 'Categorías';
        }
        const category = categories.find(c => c.name === selectedCategory);
        return category ? category.label : 'Categorías';
    }, [selectedCategory, categories]);

    return (
        <main className="px-4 pt-4 pb-8 space-y-8">
            <Carousel
              opts={{ loop: true }}
              plugins={[autoplayPlugin.current]}
              className="w-full fade-in"
              style={{ animationDelay: '100ms' }}
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
            
            <div className="flex items-center gap-2 fade-in" style={{ animationDelay: '200ms' }}>
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search..." 
                        className="bg-secondary rounded-full h-14 pl-12 text-base border-none" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="w-auto h-14 rounded-full bg-primary text-primary-foreground shrink-0 px-6 text-base">
                            {selectedCategoryLabel}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Filtrar por Categoría</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                            <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                            {categories.map((cat) => (
                                <DropdownMenuRadioItem key={cat.id} value={cat.name}>{cat.label}</DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <div className="space-y-4 fade-in" style={{ animationDelay: '300ms' }}>
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">New Catalogs</h2>
                    <Link href="#" className="text-sm font-semibold text-muted-foreground">See all</Link>
                 </div>
                 {filteredProducts.length > 0 ? (
                    <ProductGridHomepage products={filteredProducts} />
                 ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>No se encontraron productos que coincidan con tu búsqueda.</p>
                    </div>
                 )}
            </div>
        </main>
    );
}
